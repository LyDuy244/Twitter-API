import { Request } from "express";
import { TokenPayload } from "~/models/requests/users.request";
import Tweet from "~/models/schemas/Tweet.schema";
import User from "~/models/schemas/User.schema";
declare module 'express' {
  interface Request {
    user?: User
    decode_authorization?: TokenPayload
    decode_refresh_token?: TokenPayload
    decode_email_verify_token?: TokenPayload
    decode_forgot_password_token?: TokenPayload,
    tweet?: Tweet
  }
}