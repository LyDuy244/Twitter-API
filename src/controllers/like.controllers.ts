import { ParamsDictionary } from "express-serve-static-core"
import { NextFunction, Request, Response } from "express"
import { TokenPayload } from "~/models/requests/users.request"
import { TWEETS_MESSAGES } from "~/constants/messages"
import { LikeReqBody, UnLikeTweetReqBody } from "~/models/requests/likes.request"
import likeService from "~/services/like.services"

export const likeTweetController = async (req: Request<ParamsDictionary, any, LikeReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await likeService.likeTweet(req.body.tweet_id, user_id)
  return res.json({
    message: TWEETS_MESSAGES.LIKE_TWEET_SUCCESSFULLY,
    result
  })
}

export const unLikeTweetController = async (req: Request<UnLikeTweetReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  await likeService.unLikeTweet(req.params.tweet_id, user_id)
  return res.json({
    message: TWEETS_MESSAGES.UNLIKE_TWEET_SUCCESSFULLY,
  })
}