import { MediaTypeQuery, PeopleFollow } from "~/constants/enum";
import { Pagination } from "~/models/requests/tweets.request";
import { Query } from "express-serve-static-core"

export interface SearchQuery extends Pagination, Query {
  content: string,
  media_type?: MediaTypeQuery,
  people_follow?: PeopleFollow
}