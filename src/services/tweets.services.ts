import { ObjectId, WithId } from "mongodb";
import { TweetType } from "~/constants/enum";
import { TweetReqBody } from "~/models/requests/tweets.request";
import Hashtag from "~/models/schemas/Hashtag.schema";
import Tweet from "~/models/schemas/Tweet.schema";
import databaseService from "~/services/database.services";

class TweetService {
  async checkAndCreateHashtags(hashtags: string[]) {
    const hashtagDocument = await Promise.all(hashtags.map((hashtag: string) => {
      // Tim hashtag trong database neu co thi lay con khong thi tao moi
      return databaseService.hashtags.findOneAndUpdate(
        { name: hashtag },
        { $setOnInsert: new Hashtag({ name: hashtag }) },
        {
          upsert: true,
          returnDocument: "after",
        })
    }))
    return hashtagDocument.map(item => (item as WithId<Hashtag>)._id)
  }
  async createTweet(body: TweetReqBody, user_id: string) {
    const hashtags = await this.checkAndCreateHashtags(body.hashtags)

    const result = await databaseService.tweets.insertOne(new Tweet({
      audience: body.audience,
      content: body.content,
      hashtags: hashtags, // cho nay chua lam
      mentions: body.mentions,
      medias: body.medias,
      parent_id: body.parent_id,
      type: body.type,
      user_id: new ObjectId(user_id)
    }))

    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })

    return tweet
  }

  async increaseView(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }

    const result = await databaseService.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: "after",
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    )

    return result as WithId<{ guest_views: number, user_views: number, updated_at: Date }>;
  }

  async getTweetChildren(
    { tweet_id, tweet_type, limit, page, user_id }: { tweet_id: string, tweet_type: TweetType, limit: number, page: number, user_id: string }
  ) {

    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const tweets = await databaseService.tweets.aggregate<Tweet>([
      {
        '$match': {
          'parent_id': new ObjectId(tweet_id),
          'type': tweet_type
        }
      }, {
        '$lookup': {
          'from': 'hashtags',
          'localField': 'hashtags',
          'foreignField': '_id',
          'as': 'hashtags'
        }
      }, {
        '$lookup': {
          'from': 'users',
          'localField': 'mentions',
          'foreignField': '_id',
          'as': 'mentions'
        }
      }, {
        '$addFields': {
          'mentions': {
            '$map': {
              'input': '$mentions',
              'as': 'mention',
              'in': {
                '_id': '$$mention._id',
                'name': '$$mention.name',
                'username': '$$mention.username',
                'email': '$$mention.email'
              }
            }
          }
        }
      }, {
        '$lookup': {
          'from': 'likes',
          'localField': '_id',
          'foreignField': 'tweet_id',
          'as': 'likes'
        }
      }, {
        '$lookup': {
          'from': 'bookmarks',
          'localField': '_id',
          'foreignField': 'tweet_id',
          'as': 'bookmarks'
        }
      }, {
        '$lookup': {
          'from': 'tweets',
          'localField': '_id',
          'foreignField': 'parent_id',
          'as': 'tweet_children'
        }
      }, {
        '$addFields': {
          'likes': {
            '$size': '$likes'
          },
          'bookmarks': {
            '$size': '$bookmarks'
          },
          'retweet_count': {
            '$size': {
              '$filter': {
                'input': '$tweet_children',
                'as': 'item',
                'cond': {
                  '$eq': [
                    '$$item.type', TweetType.Retweet
                  ]
                }
              }
            }
          },
          'comment_count': {
            '$size': {
              '$filter': {
                'input': '$tweet_children',
                'as': 'item',
                'cond': {
                  '$eq': [
                    '$$item.type', TweetType.Comment
                  ]
                }
              }
            }
          },
          'quote_count': {
            '$size': {
              '$filter': {
                'input': '$tweet_children',
                'as': 'item',
                'cond': {
                  '$eq': [
                    '$$item.type', TweetType.QuoteTweet
                  ]
                }
              }
            }
          },
        }
      }, {
        '$project': {
          'tweet_children': 0
        }
      }, {
        '$skip': (page - 1) * limit // Công thức phân trang
      }, {
        '$limit': limit
      }
    ]).toArray()

    const ids = tweets.map(tweet => tweet._id) as ObjectId[]
    const date = new Date();

    const [_, total] = await Promise.all([
      databaseService.tweets.updateMany(
        {
          _id: {
            $in: ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      ),
      databaseService.tweets.countDocuments({
        'parent_id': new ObjectId(tweet_id),
        'type': tweet_type
      })
    ])

    tweets.forEach(tweet => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })


    return {
      tweets, total
    }
  }

  async getNewFeeds({ limit, page, user_id }: { limit: number, page: number, user_id: string }) {
    const user_id_obj = new ObjectId(user_id)
    const followed_user_ids = await databaseService.followers.find({ user_id: user_id_obj },
      {
        projection: { followed_user_id: 1, _id: 0 }
      }
    ).toArray()

    const ids = followed_user_ids.map(item => item.followed_user_id)
    // Mong muon luon tra ve tweet cua minh
    ids.push(user_id_obj)

    const [tweets, total] = await Promise.all([
      databaseService.tweets.aggregate<Tweet>(
        [
          {
            '$match': {
              'user_id': {
                '$in': ids
              }
            }
          }, {
            '$lookup': {
              'from': 'users',
              'localField': 'user_id',
              'foreignField': '_id',
              'as': 'user'
            }
          }, {
            '$unwind': {
              'path': '$user'
            }
          }, {
            '$match': {
              '$or': [
                {
                  'audience': 0
                }, 
                {
                  '$and': [
                    {
                      'audience': 1
                    }, {
                      'user.tweeter_circle': {
                        '$in': [
                          user_id_obj
                        ]
                      }
                    }
                  ]
                },
                {
                  '$and': [
                    {
                      'audience': 1
                    }, {
                      'user_id': user_id_obj
                    }
                  ]
                }
              ]
            }
          }
          , {
            '$skip': (page - 1) * limit
          }, {
            '$limit': limit
          },
          {
            '$lookup': {
              'from': 'hashtags',
              'localField': 'hashtags',
              'foreignField': '_id',
              'as': 'hashtags'
            }
          }, {
            '$lookup': {
              'from': 'users',
              'localField': 'mentions',
              'foreignField': '_id',
              'as': 'mentions'
            }
          }, {
            '$addFields': {
              'mentions': {
                '$map': {
                  'input': '$mentions',
                  'as': 'mention',
                  'in': {
                    '_id': '$$mention._id',
                    'name': '$$mention.name',
                    'username': '$$mention.username',
                    'email': '$$mention.email'
                  }
                }
              }
            }
          }, {
            '$lookup': {
              'from': 'likes',
              'localField': '_id',
              'foreignField': 'tweet_id',
              'as': 'likes'
            }
          }, {
            '$lookup': {
              'from': 'bookmarks',
              'localField': '_id',
              'foreignField': 'tweet_id',
              'as': 'bookmarks'
            }
          }, {
            '$lookup': {
              'from': 'tweets',
              'localField': '_id',
              'foreignField': 'parent_id',
              'as': 'tweet_children'
            }
          }, {
            '$addFields': {
              'likes': {
                '$size': '$likes'
              },
              'bookmarks': {
                '$size': '$bookmarks'
              },
              'retweet_count': {
                '$size': {
                  '$filter': {
                    'input': '$tweet_children',
                    'as': 'item',
                    'cond': {
                      '$eq': [
                        '$$item.type', TweetType.Retweet
                      ]
                    }
                  }
                }
              },
              'comment_count': {
                '$size': {
                  '$filter': {
                    'input': '$tweet_children',
                    'as': 'item',
                    'cond': {
                      '$eq': [
                        '$$item.type', TweetType.Comment
                      ]
                    }
                  }
                }
              },
              'quote_count': {
                '$size': {
                  '$filter': {
                    'input': '$tweet_children',
                    'as': 'item',
                    'cond': {
                      '$eq': [
                        '$$item.type', TweetType.QuoteTweet
                      ]
                    }
                  }
                }
              }
            }
          }, {
            '$project': {
              'tweet_children': 0,
              'user': {
                'password': 0,
                'email_verify_token': 0,
                'forgot_password_token': 0,
                'tweeter_circle': 0,
                'date_of_birth': 0
              }
            }
          }
        ]
      ).toArray(),
      databaseService.tweets.aggregate([
        {
          '$match': {
            'user_id': {
              '$in': ids
            }
          }
        }, {
          '$lookup': {
            'from': 'users',
            'localField': 'user_id',
            'foreignField': '_id',
            'as': 'user'
          }
        }, {
          '$unwind': {
            'path': '$user'
          }
        }, {
          '$match': {
            '$or': [
              {
                'audience': 0
              }, {
                '$and': [
                  {
                    'audience': 1
                  }, {
                    'user.tweeter_circle': {
                      '$in': [
                        user_id_obj
                      ]
                    }
                  }
                ]
              }
            ]
          }
        }, {
          "$count": "total"
        }
      ]).toArray()
    ])

    const tweet_ids = tweets.map(tweet => tweet._id as ObjectId)
    const date = new Date();

    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweet_ids
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: date
        }
      }
    )

    tweets.forEach(tweet => {
      tweet.updated_at = date
      tweet.user_views += 1
    })

    return {
      tweets,
      total: total[0]?.total || 0
    }
  }

}

// Tạo object từ class MediaService
const tweetService = new TweetService();
export default tweetService