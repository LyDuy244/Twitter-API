import { Router } from "express";
import { bookmarkTweetController, unBookmarkTweetController } from "~/controllers/bookmark.controllers";
import { createTweetController } from "~/controllers/tweets.controllers";
import { createTweetValidator, tweetIdValidator } from "~/middlewares/tweets.middlewares";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { wrapRequestHandler } from "~/utils/handlers";

const bookMarksRouter = Router()

/**
 * Description: Bookmark tweet
 * Path: "/"
 * Method: POST
 * Header: {Authorization: Bearer <AccessToken>}
 * Body: {tweet_id: string}
 */

bookMarksRouter.post("/", accessTokenValidator, verifiedUserValidator, tweetIdValidator, wrapRequestHandler(bookmarkTweetController))

/**
 * Description: Un Bookmark tweet
 * Path: "/:tweet_id"
 * Method: DELETE
 * Header: {Authorization: Bearer <AccessToken>}
 */

bookMarksRouter.delete("/tweets/:tweet_id", accessTokenValidator, verifiedUserValidator, tweetIdValidator, wrapRequestHandler(unBookmarkTweetController))

export default bookMarksRouter