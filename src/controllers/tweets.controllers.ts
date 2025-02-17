import { NextFunction, Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { TweetType } from "~/constants/enum"
import { TWEETS_MESSAGES } from "~/constants/messages"
import { Pagination, TweetParam, TweetQuery, TweetReqBody } from "~/models/requests/tweets.request"
import { TokenPayload } from "~/models/requests/users.request"
import tweetService from "~/services/tweets.services"

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await tweetService.createTweet(req.body, user_id)
  return res.json({
    message: TWEETS_MESSAGES.CREATE_TWEET_SUCCESSFULLY,
    result
  })
}
export const getTweetController = async (req: Request<TweetParam>, res: Response, next: NextFunction) => {
  // Thực hiện query database ở đây là chúng ta thực hiện query lần 2

  const result = await tweetService.increaseView(req.params.tweet_id, req.decode_authorization?.user_id)
  const tweet = { ...req.tweet, ...result }
  return res.json({
    message: "Get tweet successfully",
    result: tweet
  })
}
export const getTweetChildrenController = async (req: Request<TweetParam, any, any, TweetQuery>, res: Response, next: NextFunction) => {
  const tweet_type = Number(req.query.tweet_type) as TweetType
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const { user_id } = req.decode_authorization as TokenPayload
  const { tweets, total } = await tweetService.getTweetChildren(
    {
      tweet_id: req.params.tweet_id,
      tweet_type,
      limit,
      page,
      user_id
    }
  )
  return res.json({
    message: "Get tweet children successfully",
    result: {
      tweets,
      tweet_type,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    },

  })
}

export const getNewFeedsController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const { total, tweets } = await tweetService.getNewFeeds({ user_id, limit, page })
  return res.json({
    message: "Get new feeds successfully",
    result: {
      tweets,
      total_page: Math.ceil(total / limit),
      limit,
      page,
    },
  })
}