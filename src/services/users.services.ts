import { ObjectId } from "mongodb";
import { TokenType, UserVerifyStatus } from "~/constants/enum";
import { RegisterReqBody, UpdateMeReqBody } from "~/models/requests/users.request";
import RefreshToken from "~/models/schemas/RefreshToken.schema";
import User from "~/models/schemas/User.schema";
import databaseService from "~/services/database.services";
import { hashPassword } from "~/utils/crypto";
import { signToken, verifyToken } from "~/utils/jwt";
import { USERS_MESSAGES } from "~/constants/messages";
import Follower from "~/models/schemas/Follower.schema";
import axios from "axios";
import { ErrorWithStatus } from "~/models/Errors";
import { HttpStatusCode } from "axios";
import HTTP_STATUS from "~/constants/httpStatus";
import { sendForgotPasswordEmail, sendVerifyRegisterEmail } from "~/utils/email";
import { envConfig } from "~/constants/config";
class UserServices {
  private signAccessToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.AccessToken
      },
      privateKey: envConfig.jwtSecretAccessToken,
      options: {
        expiresIn: envConfig.accessTokenExpiresIn
      }
    })
  }
  private signRefreshToken({ user_id, verify, exp }: { user_id: string, verify: UserVerifyStatus, exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          verify,
          token_type: TokenType.RefreshToken,
          exp
        },
        privateKey: envConfig.jwtSecretRefreshToken,
      })
    }
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.RefreshToken
      },
      privateKey: envConfig.jwtSecretRefreshToken,
      options: {
        expiresIn: envConfig.refreshTokenExpiresIn
      }
    })
  }
  private signEmailVerifyToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: envConfig.jwtSecretEmailVerifyToken,
      options: {
        expiresIn: envConfig.emailVerifyTokenExpiresIn
      }
    })
  }
  private signForgotPasswordToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        verify,
        token_type: TokenType.ForgotPasswordToken
      },
      privateKey: envConfig.jwtSecretForgotPasswordToken,
      options: {
        expiresIn: envConfig.forgotPasswordTokenExpiresIn
      }
    })
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })]);
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({ token: refresh_token, secretOrPublicKey: envConfig.jwtSecretRefreshToken })
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId;
    const email_verify_token = await this.signEmailVerifyToken({ user_id: user_id.toString(), verify: UserVerifyStatus.Unverified })
    await databaseService.users.insertOne(
      new User(
        {
          ...payload,
          _id: user_id,
          date_of_birth: new Date(payload.date_of_birth),
          password: hashPassword(payload.password),
          email_verify_token
        }
      )
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id: user_id.toString(), verify: UserVerifyStatus.Unverified })

    const { exp, iat } = await this.decodeRefreshToken(refresh_token);

    await databaseService.refreshToken.insertOne(new RefreshToken({ user_id: user_id, token: refresh_token, iat, exp }))
    // console.log("email_verify_token: ", email_verify_token)

    // Flow verify email
    // 1. Server send email to user
    // 2. User click link in email
    // 3. Client send request to server with email_verify_token
    // 4. Server verify email_verify_token
    // 5. Client receive access_token and refresh_token
    await sendVerifyRegisterEmail(
      payload.email,
      email_verify_token
    )


    return { access_token, refresh_token }
  }

  async refreshToken({ user_id, verify, refresh_token, exp }: { user_id: string, verify: UserVerifyStatus, refresh_token: string, exp: number }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refreshToken.deleteOne({ token: refresh_token })
    ])

    const decodeRefreshToken = await this.decodeRefreshToken(new_refresh_token);

    await databaseService.refreshToken.insertOne(new RefreshToken({ token: new_refresh_token, user_id: new ObjectId(user_id), exp: decodeRefreshToken.exp, iat: decodeRefreshToken.iat }))

    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }

  async checkEmailExits(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user);
  }

  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: envConfig.googleClientId,
      client_secret: envConfig.googleClientSecret,
      redirect_uri: envConfig.redirectUri,
      grant_type: "authorization_code"
    }

    const { data } = await axios.post("https://oauth2.googleapis.com/token", body, { headers: { "Content-Type": "application/x-www-form-urlencoded" } })

    return data as {
      access_token: string,
      id_token: string
    }
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get("https://www.googleapis.com/oauth2/v1/userinfo", {
      params: {
        access_token,
        alt: "json",
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string,
      email: string,
      verified_email: string,
      name: string,
      given_name: string,
      family_name: string,
      picture: string,
    };
  }

  async oauth(code: string) {
    const { id_token, access_token } = await this.getOAuthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        status: HttpStatusCode.BadRequest,
        message: USERS_MESSAGES.EMAIL_NOT_VERIFIED
      })
    }
    // Kiem tra email da duoc dang ky hay chua
    const user = await databaseService.users.findOne({ email: userInfo.email })
    // Nếu tồn tại cho login vào không thì tạo mới
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id: user._id.toString(), verify: UserVerifyStatus.Verified })

      const { iat, exp } = await this.decodeRefreshToken(refresh_token);


      await databaseService.refreshToken.insertOne(new RefreshToken({ user_id: user._id, token: refresh_token, iat, exp }))

      return {
        access_token,
        refresh_token,
        newUser: false
      }
    } else {
      const password = Math.random().toString(36).substring(2, 15)
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password
      })
      return {
        ...data,
        newUser: true
      }
    }
  }

  async login({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify })

    const { iat, exp } = await this.decodeRefreshToken(refresh_token);

    await databaseService.refreshToken.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp }))
    return { access_token, refresh_token }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshToken.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        [{
          $set: {
            email_verify_token: "",
            verify: UserVerifyStatus.Verified,
            updated_at: '$$NOW'
          },
          // $currentDate: {
          //   updated_at: true
          // }
        }]
      )
    ])

    const [access_token, refresh_token] = token

    const { iat, exp } = await this.decodeRefreshToken(refresh_token);

    await databaseService.refreshToken.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp }))
    return {
      access_token, refresh_token
    }
  }

  async resendVerifyEmail(user_id: string, email: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id: user_id, verify: UserVerifyStatus.Unverified });
    // Gửi email
    await sendVerifyRegisterEmail(
      email,
      email_verify_token
    )
    console.log("Gửi email ")
    // Cập nhật lại giá trị verify token trong user
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token,
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }
  async forgotPassword({ user_id, verify, email }: { user_id: string, verify: UserVerifyStatus, email: string }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne({
      _id: new ObjectId(user_id)
    }, {
      $set: {
        forgot_password_token
      },
      $currentDate: {
        updated_at: true
      }
    })

    // Gửi email kèm đường link đến email người dùng: https://twitter.com/forgot-password-token?token=token
    console.log("forgot-password-token", forgot_password_token)
    await sendForgotPasswordEmail(
      email,
      forgot_password_token
    )

    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword(user_id: string, password: string) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [{
      $set: {
        forgot_password_token: "",
        password: hashPassword(password),
        updated_at: "$$NOW"
      }
    }])

    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) }, {
      projection: {
        password: 0,
        email_verify_token: 0,
        forgot_password_token: 0
      }
    })
    return user
  }
  async getProfile(username: string) {
    const user = await databaseService.users.findOne({ username }, {
      projection: {
        password: 0,
        email_verify_token: 0,
        forgot_password_token: 0,
        verify: 0,
        created_at: 0,
        updated_at: 0
      }
    })
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth?: Date }),
        },
        $currentDate: {
          updated_at: true
        }
      }, {
      returnDocument: "after",
      projection: {
        password: 0,
        email_verify_token: 0,
        forgot_password_token: 0
      }
    })

    return user

  }

  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower === null) {
      await databaseService.followers.insertOne(new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      }))
      return {
        message: USERS_MESSAGES.FOLLOW_SUCCESS
      }
    }
    return {
      message: USERS_MESSAGES.FOLLOWED
    }

  }

  async unfollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower === null) {
      return {
        message: USERS_MESSAGES.ALREADY_UNFOLLOWED
      }
    }

    // Truong hop co follow => tien hanh xoa doc
    await databaseService.followers.deleteOne({ _id: new ObjectId(follower._id) })

    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS
    }

  }
  async changePassword(user_id: string, new_password: string) {
    // Truong hop co follow => tien hanh xoa doc
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, {
      $set: {
        password: hashPassword(new_password)
      }, $currentDate: { updated_at: true }
    })

    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }

  }
}

const userServices = new UserServices();
export default userServices;