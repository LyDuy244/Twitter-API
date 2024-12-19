import { ObjectId } from "mongodb";
import Bookmark from "~/models/schemas/Bookmark.schema";
import databaseService from "~/services/database.services";

class BookmarkService {
  async bookmarkTweet(tweet_id: string, user_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert:
          new Bookmark(
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

  async unBookmarkTweet(tweet_id: string, user_id: string) {
    const result = await databaseService.bookmarks.findOneAndDelete(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      }
    )
    return result
  }
}

// Tạo object từ class MediaService
const bookmarkService = new BookmarkService();
export default bookmarkService