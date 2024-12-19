import { JwtPayload } from "jsonwebtoken";
import { TokenType, UserVerifyStatus } from "~/constants/enum";
import { ParamsDictionary } from 'express-serve-static-core'
export interface RegisterReqBody {
  name: string,
  email: string,
  password: string,
  confirm_password: string,
  date_of_birth: string
}


export interface TokenPayload extends JwtPayload {
  user_id: string,
  token_type: TokenType,
  verify: UserVerifyStatus,
  exp: number,
  iat: number
}

export interface LogoutReqBody {
  refresh_token: string
}
export interface RefreshTokenReqBody {
  refresh_token: string
}
export interface LoginReqBody {
  email: string,
  password: string,
}
export interface VerifyEmailReqBody {
  email_verify_token: string
}
export interface ForgotPasswordReqBody {
  email: string
}
export interface VerifyForgotPasswordReqBody {
  forgot_password_token: string
}
export interface ResetPasswordReqBody {
  password: string,
  confirm_password: string,
  forgot_password_token: string
}
export interface UpdateMeReqBody {
  username?: string,
  date_of_birth?: string,
  bio?: string,
  location?: string,
  avatar?: string,
  cover_photo?: string
}
export interface FollowReqBody {
  followed_user_id: string
}
export interface UnFollowReqParams extends ParamsDictionary {
  user_id: string
}
export interface ProfileReqParams extends ParamsDictionary {
  username: string
}
export interface ChangePasswordReqBody {
  password: string,
  old_password: string,
  confirm_password: string
}