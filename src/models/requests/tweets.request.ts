import { TweetAudience, TweetType } from "~/constants/enum";
import { Media } from "~/models/Other";
import { ParamsDictionary, Query } from "express-serve-static-core"

export interface TweetReqBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string
  hashtags: string[]
  mentions: string[]
  medias: Media[]
}
export interface TweetParam extends ParamsDictionary {
  tweet_id: string
}

export interface Pagination {
  limit: string,
  page: string,
}

export interface TweetQuery extends Pagination, Query {
  tweet_type: string
}