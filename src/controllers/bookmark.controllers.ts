import { BookmarkReqBody, UnBookmarkTweetReqBody } from "~/models/requests/bookmarks.request"
import { ParamsDictionary } from "express-serve-static-core"
import { NextFunction, Request, Response } from "express"
import { TokenPayload } from "~/models/requests/users.request"
import bookmarkService from "~/services/bookmark.services"
import { TWEETS_MESSAGES } from "~/constants/messages"

export const bookmarkTweetController = async (req: Request<ParamsDictionary, any, BookmarkReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await bookmarkService.bookmarkTweet(req.body.tweet_id, user_id)
  return res.json({
    message: TWEETS_MESSAGES.BOOKMARK_TWEET_SUCCESSFULLY,
    result
  })
}

export const unBookmarkTweetController = async (req: Request<UnBookmarkTweetReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  await bookmarkService.unBookmarkTweet(req.params.tweet_id, user_id)
  return res.json({
    message: TWEETS_MESSAGES.UNBOOKMARK_TWEET_SUCCESSFULLY,
  })
}