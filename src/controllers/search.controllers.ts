import { NextFunction, Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { PeopleFollow } from "~/constants/enum"
import { SearchQuery } from "~/models/requests/search.request"
import { TokenPayload } from "~/models/requests/users.request"
import searchService from "~/services/search.services"

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response, next: NextFunction) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const { total, tweets } = await searchService.search({
    limit,
    page,
    content: req.query.content,
    user_id: req.decode_authorization?.user_id as string,
    media_type: req.query.media_type,
    people_follow: req.query.people_follow
  })

  res.json({
    message: "Get new feeds successfully",
    result: {
      tweets,
      total_page: Math.ceil(total / limit),
      limit,
      page,
    },
  })
}