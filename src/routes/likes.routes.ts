import { Router } from "express";
import { likeTweetController, unLikeTweetController } from "~/controllers/like.controllers";
import { tweetIdValidator } from "~/middlewares/tweets.middlewares";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { wrapRequestHandler } from "~/utils/handlers";

const likesRouter = Router()

/**
 * Description: Like tweet
 * Path: "/"
 * Method: POST
 * Header: {Authorization: Bearer <AccessToken>}
 * Body: {tweet_id: string}
 */

likesRouter.post("/", accessTokenValidator, verifiedUserValidator, tweetIdValidator, wrapRequestHandler(likeTweetController))

/**
 * Description: Un Like tweet
 * Path: "/:tweet_id"
 * Method: DELETE
 * Header: {Authorization: Bearer <AccessToken>}
 */

likesRouter.delete("/tweets/:tweet_id", accessTokenValidator, verifiedUserValidator, tweetIdValidator, wrapRequestHandler(unLikeTweetController))

export default likesRouter