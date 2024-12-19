import { ObjectId } from "mongodb";
import { TweetAudience, TweetType } from "~/constants/enum";
import { Media } from "~/models/Other";

interface TweetConstructor {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType,
  audience: TweetAudience
  content: string
  parent_id: null | string
  hashtags: ObjectId[]
  mentions: string[]
  medias: Media[]
  guest_views?: number
  user_views?: number
  created_at?: Date
  updated_at?: Date
}

export default class Tweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | ObjectId
  hashtags: ObjectId[]
  mentions: ObjectId[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date

  constructor({ _id, audience, content, created_at, guest_views, hashtags, medias, mentions, parent_id, type, updated_at, user_id, user_views }: TweetConstructor) {
    this._id = _id
    const now = new Date()
    this.user_id = user_id
    this.audience = audience
    this.content = content
    this.type = type
    this.parent_id = parent_id ? new ObjectId(parent_id) : null
    this.hashtags = hashtags
    this.mentions = mentions.map(item => new ObjectId(item))
    this.medias = medias
    this.guest_views = guest_views || 0
    this.user_views = user_views || 0
    this.updated_at = updated_at || now
    this.created_at = created_at || now
  }
}