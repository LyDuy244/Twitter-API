import { ObjectId } from "mongodb";
import Like from "~/models/schemas/Like.schema";
import databaseService from "~/services/database.services";

class LikeService {
  async likeTweet(tweet_id: string, user_id: string) {
    const result = await databaseService.likes.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert:
          new Like(
            {
              tweet_id: new ObjectId(tweet_id),
              user_id: new ObjectId(user_id)
            }
          )
      },
      {
        upsert: true,
        returnDocument: "after"
      }
    )
    return result
  }

  async unLikeTweet(tweet_id: string, user_id: string) {
    const result = await databaseService.likes.findOneAndDelete(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      }
    )
    return result
  }
}

// Tạo object từ class MediaService
const likeService = new LikeService();
export default likeService