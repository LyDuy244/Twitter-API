import { ObjectId } from "mongodb";

interface ConversationType {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId,
  message: string
  created_at?: Date
  updated_at?: Date
}

export default class Conversation {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  message: string
  created_at?: Date
  updated_at?: Date

  constructor({ _id, sender_id, receiver_id, message, created_at, updated_at }: ConversationType) {
    const date = new Date()
    this._id = _id || new ObjectId()
    this.sender_id = sender_id
    this.receiver_id = receiver_id
    this.message = message
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}