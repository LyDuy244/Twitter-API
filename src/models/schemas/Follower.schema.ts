import { ObjectId } from "mongodb";
type FollowerType = {
  _id?: ObjectId
  followed_user_id: ObjectId
  user_id: ObjectId,
  created_at?: Date
}
export default class Follower {
  _id?: ObjectId
  followed_user_id: ObjectId
  user_id: ObjectId
  created_at?: Date

  constructor({ _id, followed_user_id, created_at, user_id }: FollowerType) {
    this._id = _id
    this.followed_user_id = followed_user_id
    this.created_at = created_at || new Date()
    this.user_id = user_id
  }
}

