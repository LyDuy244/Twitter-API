
import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb';
import User from '~/models/schemas/User.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import { config } from "dotenv"
import Follower from '~/models/schemas/Follower.schema';
import VideoStatus from '~/models/schemas/VideoStatus.schema';
import Tweet from '~/models/schemas/Tweet.schema';
import Hashtag from '~/models/schemas/Hashtag.schema';
import Bookmark from '~/models/schemas/Bookmark.schema';
import Like from '~/models/schemas/Like.schema';
import Conversation from '~/models/schemas/Conversation.schema';
config();
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter.ae61n.mongodb.net/?retryWrites=true&w=majority&appName=Twitter`;

class DatabaseService {
  private client: MongoClient;
  private db: Db
  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(process.env.DB_NAME)
  }
  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async indexUsers() {
    const exists = await this.users.indexExists(["email_1_password_1", "username_1", "email_1"])
    if (!exists) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
    }
  }
  async indexRefreshTokens() {
    const exists = await this.refreshToken.indexExists(["exp_1", "token_1"])
    if (!exists) {
      this.refreshToken.createIndex({ token: 1 })
      this.refreshToken.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
    }
  }
  async indexVideoStatus() {
    const exists = await this.videoStatus.indexExists(["name_1"])
    if (!exists) {
      this.videoStatus.createIndex({ name: 1 })
    }
  }
  async indexFollowers() {
    const exists = await this.followers.indexExists(["followed_user_id_1_user_id_1"])
    if (!exists) {
      this.followers.createIndex({ followed_user_id: 1, user_id: 1 })
    }
  }
  async indexTweets() {
    const exists = await this.tweets.indexExists(["content_text"])
    if (!exists) {
      this.tweets.createIndex({ content: "text" }, { default_language: "none" })
    }
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_COLLECTION_USERS as string);
  }

  get refreshToken(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_COLLECTION_REFRESHTOKENS as string);
  }
  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_COLLECTION_FOLLOWERS as string);
  }
  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(process.env.DB_COLLECTION_VIDEO_STATUS as string);
  }
  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_COLLECTION_TWEETS as string);
  }
  get hashtags(): Collection<Hashtag> {
    return this.db.collection(process.env.DB_COLLECTION_HASHTAGS as string);
  }
  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(process.env.DB_COLLECTION_BOOKMARKS as string);
  }
  get likes(): Collection<Like> {
    return this.db.collection(process.env.DB_COLLECTION_LIKES as string);
  }
  get conversations(): Collection<Conversation> {
    return this.db.collection(process.env.DB_COLLECTION_CONVERSATIONS as string);
  }


}

// Tạo object từ class DatabaseService
const databaseService = new DatabaseService();
export default databaseService;