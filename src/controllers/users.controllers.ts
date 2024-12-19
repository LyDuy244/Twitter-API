import { NextFunction, Request, Response } from "express";
import User from "~/models/schemas/User.schema";
import databaseService from "~/services/database.services";
import userServices from "~/services/users.services";
import { ParamsDictionary } from "express-serve-static-core"
import { ChangePasswordReqBody, FollowReqBody, ForgotPasswordReqBody, LoginReqBody, LogoutReqBody, ProfileReqParams, RefreshTokenReqBody, RegisterReqBody, ResetPasswordReqBody, TokenPayload, UnFollowReqParams, UpdateMeReqBody, VerifyEmailReqBody, VerifyForgotPasswordReqBody } from "~/models/requests/users.request";
import { ObjectId } from "mongodb";
import { USERS_MESSAGES } from "~/constants/messages";
import HTTP_STATUS from "~/constants/httpStatus";
import { UserVerifyStatus } from "~/constants/enum";
import { envConfig } from "~/constants/config";
export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response, next: NextFunction) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userServices.login({ user_id: user_id.toString(), verify: user.verify })
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}
export const oauthController = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.query
  const result = await userServices.oauth(code as string)
  const urlRedirect = `${envConfig.clientRedirectCallback}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&newUser=${result.newUser}`
  return res.redirect(urlRedirect)
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response, next: NextFunction) => {
  const result = await userServices.register(req.body)
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response, next: NextFunction) => {
  const { refresh_token } = req.body
  const result = await userServices.logout(refresh_token)
  return res.json(result)
}

export const refreshTokenController = async (req: Request<ParamsDictionary, any, RefreshTokenReqBody>, res: Response, next: NextFunction) => {
  const { refresh_token } = req.body
  const { user_id, verify, exp } = req.decode_refresh_token as TokenPayload

  const result = await userServices.refreshToken({ user_id, verify, refresh_token, exp })
  return res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}

export const verifyEmailController = async (req: Request<ParamsDictionary, any, VerifyEmailReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  // Nểu không tìm thấy user
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  // Đã verify email rồi thì sẽ không báo lỗi
  // mà trả về status OK với message đã verify trước đó rồi
  if (user.email_verify_token === "") {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFY_BEFORE
    })
  }

  const result = await userServices.verifyEmail(user_id)

  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const resendVerifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFY_BEFORE
    })
  }

  const result = await userServices.resendVerifyEmail(user_id, user.email)
  return res.json(result)
}

export const forgotPasswordController = async (req: Request<ParamsDictionary, any, ForgotPasswordReqBody>, res: Response, next: NextFunction) => {
  const { _id, verify, email } = req.user as User

  const result = await userServices.forgotPassword({ user_id: (_id as ObjectId).toString(), verify, email })
  return res.json(result)
}

export const verifyForgotPasswordTokenController = async (req: Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>, res: Response, next: NextFunction) => {
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}


export const resetPasswordController = async (req: Request<ParamsDictionary, any, ResetPasswordReqBody>, res: Response, next: NextFunction) => {

  const { user_id } = req.decode_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await userServices.resetPassword(user_id, password)

  return res.json(result)
}


export const getMeController = async (req: Request, res: Response, next: NextFunction) => {

  const { user_id } = req.decode_authorization as TokenPayload
  const user = await userServices.getMe(user_id)

  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  })
}
export const getProfileController = async (req: Request<ProfileReqParams>, res: Response, next: NextFunction) => {
  const { username } = req.params
  const user = await userServices.getProfile(username)

  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  })
}


export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const body = req.body
  const user = await userServices.updateMe(user_id, body)

  console.log(body)
  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result: user
  })
}


export const followController = async (req: Request<ParamsDictionary, any, FollowReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { followed_user_id } = req.body



  const result = await userServices.follow(user_id, followed_user_id)

  return res.json(result)
}


export const unFollowController = async (req: Request<UnFollowReqParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { user_id: followed_user_id } = req.params

  const result = await userServices.unfollow(user_id, followed_user_id)

  return res.json(result)
}

export const changePasswordController = async (req: Request<ParamsDictionary, any, ChangePasswordReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { password } = req.body

  const result = await userServices.changePassword(user_id, password)

  return res.json(result)
}


