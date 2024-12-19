import { Router } from "express";
import { searchController } from "~/controllers/search.controllers";
import { searchValidator } from "~/middlewares/search.middlewares";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { wrapRequestHandler } from "~/utils/handlers";

const searchRouter = Router()

/**
 * Description: Search tweet
 * Path: "/new-feeds"
 * Method: GET
 * Header: {Authorization: Bearer <AccessToken>}
 * Query: {limit: number, page: number}
 */

searchRouter.get("/", accessTokenValidator, verifiedUserValidator, searchValidator, wrapRequestHandler(searchController))

export default searchRouter