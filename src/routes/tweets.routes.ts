import { Router } from "express";
import { createTweetController, getNewFeedsController, getTweetChildrenController, getTweetController } from "~/controllers/tweets.controllers";
import { audienceValidator, createTweetValidator, getTweetChildrenValidator, paginationValidator, tweetIdValidator } from "~/middlewares/tweets.middlewares";
import { accessTokenValidator, isUserLoginValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { wrapRequestHandler } from "~/utils/handlers";

const tweetsRouter = Router()

/**
 * Description: Create tweet 
 * Path: "/"
 * Method: POST
 * Header: {Authorization: Bearer <AccessToken>}
 * Body: TweetReqBody
 */

tweetsRouter.post("/", accessTokenValidator, verifiedUserValidator, createTweetValidator, wrapRequestHandler(createTweetController))

/**
 * Description: Get Tweet detail
 * Path: "/:tweet_id"
 * Method: GET
 * Header: {Authorization: Bearer <AccessToken>}
 */

tweetsRouter.get("/:tweet_id", tweetIdValidator, isUserLoginValidator(accessTokenValidator), isUserLoginValidator(verifiedUserValidator), audienceValidator, wrapRequestHandler(getTweetController))
/**
 * Description: Get Tweet Children
 * Path: "/:tweet_id/children"
 * Method: GET
 * Header: {Authorization: Bearer <AccessToken>}
 * Query: {limit: number, page: number, tweet_type: TweetType}
 */

tweetsRouter.get(
  "/:tweet_id/children",
  tweetIdValidator,
  paginationValidator,
  getTweetChildrenValidator,
  isUserLoginValidator(accessTokenValidator),
  isUserLoginValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)
/**
 * Description: Get New Feeds 
 * Path: "/new-feeds"
 * Method: GET
 * Header: {Authorization: Bearer <AccessToken>}
 * Query: {limit: number, page: number}
 */

tweetsRouter.get(
  "/",
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedsController)
)


export default tweetsRouter