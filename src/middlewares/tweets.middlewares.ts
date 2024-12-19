import { NextFunction, Request, Response } from "express";
import { checkSchema } from "express-validator";
import { isEmpty } from "lodash";
import { ObjectId } from "mongodb";
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from "~/constants/enum";
import HTTP_STATUS from "~/constants/httpStatus";
import { TWEETS_MESSAGES, USERS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/Errors";
import { TokenPayload } from "~/models/requests/users.request";
import Tweet from "~/models/schemas/Tweet.schema";
import databaseService from "~/services/database.services";
import { numberEnumToArray } from "~/utils/common";
import { wrapRequestHandler } from "~/utils/handlers";
import { validate } from "~/utils/validation";

const tweetTypes = numberEnumToArray(TweetType)
const audienceTypes = numberEnumToArray(TweetAudience)
const mediaType = numberEnumToArray(MediaType)

export const createTweetValidator = validate(checkSchema({
  type: {
    isIn: {
      options: [tweetTypes],
      errorMessage: TWEETS_MESSAGES.INVALID_TYPE
    }
  },
  audience: {
    isIn: {
      options: [audienceTypes],
      errorMessage: TWEETS_MESSAGES.INVALID_AUDIENCE
    }
  },
  parent_id: {
    custom: {
      options: (value, { req }) => {
        const type = req.body.type as TweetType
        // Nếu type là retweet, comment, quotetweet thì parent_id phải là tweet_id của tweet cha
        if ([TweetType.Comment, TweetType.QuoteTweet, TweetType.Retweet].includes(type) && !ObjectId.isValid(value)) {
          throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
        }
        // Nếu type là tweet  thì parent_id phải null
        if (type === TweetType.Tweet && value !== null) {
          throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_NULL)
        }
        return true
      }
    }
  },
  content: {
    isString: true,
    custom: {
      options: (value, { req }) => {
        const type = req.body.type as TweetType
        const mentions = req.body as string[]
        const hashtags = req.body as string[]
        // Nếu type là tweet, comment, quotetweet và không có mentions và hashtags thì content phải là string và không rỗng thì content phải là tweet_id của tweet cha
        if (
          [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
          isEmpty(mentions) &&
          isEmpty(hashtags) &&
          value === ""
        ) {
          throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_A_NONE_EMPTY_STRING)
        }
        // Nếu type là retweet  thì content phải ''
        if (type === TweetType.Retweet && value !== "") {
          throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_A_EMPTY_STRING)
        }
        return true
      }
    }
  },
  hashtags: {
    isArray: true,
    custom: {
      options: (value, { req }) => {
        // Yêu cầu mỗi phần tử trong array phải là string
        if (!value.every((item: any) => typeof item === "string")) {
          throw new Error(TWEETS_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING)
        }
        return true

      }
    }
  },
  mentions: {
    isArray: true,
    custom: {
      options: (value, { req }) => {
        // Yêu cầu mỗi phần tử trong array phải là user_id
        if (!value.every((item: any) => ObjectId.isValid(item))) {
          throw new Error(TWEETS_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID)
        }
        return true

      }
    }
  },
  medias: {
    isArray: true,
    custom: {
      options: (value, { req }) => {
        // Yêu cầu mỗi phần tử trong array phải là Media Object
        if (!value.every((item: any) => {
          return typeof item.url === 'string' || mediaType.includes(item.type)
        })) {
          throw new Error(TWEETS_MESSAGES.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
        }
        return true

      }
    }
  }
}, ['body']))

export const tweetIdValidator = validate(checkSchema({
  tweet_id: {
    custom: {
      options: async (value: string, { req }) => {
        if (!ObjectId.isValid(value)) {
          throw new ErrorWithStatus({ status: HTTP_STATUS.BAD_REQUEST, message: TWEETS_MESSAGES.INVALID_TWEET_ID })
        }
        const tweet = (await databaseService.tweets.aggregate<Tweet>(
          [
            {
              '$match': {
                '_id': new ObjectId(value)
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
            }
          ]
        ).toArray())[0]

        if (!tweet) {
          throw new ErrorWithStatus({ status: HTTP_STATUS.NOT_FOUND, message: TWEETS_MESSAGES.TWEET_NOT_FOUND })
        }
        (req as Request).tweet = tweet
        return true
      }
    }
  }
}, ["params", "body"]))

// Muốn sử dụng async await trong handler express thì phải dùng try catch
// Nểu không dùng try catch thì phải dùng wrapRequestHandler
export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // Kiem tra nguoi xem da dang nhap hay chua
    if (!req.decode_authorization) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
      })
    }
    // Kiem tra tai khoan tac gia co on khong (bi xoa hay bi khoa chua)
    const author = await databaseService.users.findOne({ _id: new ObjectId(tweet.user_id) })
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }

    const { user_id } = req.decode_authorization as TokenPayload
    // Kiểm tra người xem tweet  có nằm trong tweeter circle của tác giả hay không
    const isInTweeterCircle = author.tweeter_circle.some((user_circle_id) => user_circle_id.equals(user_id))
    // Nếu bạn không phải là tác giả và không nằm trong tweeter circle  thì báo lỗi
    console.log(!author._id.equals(user_id), !isInTweeterCircle)
    if (!author._id.equals(user_id) && !isInTweeterCircle) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: TWEETS_MESSAGES.TWEET_IS_NOT_PUBLIC
      })
    }
  }
  next()
})

export const getTweetChildrenValidator = validate(checkSchema({
  page: {
    isNumeric: true,
    custom: {
      options: async (value, { req }) => {
        const num = Number(value)
        if (num < 1) {
          throw new Error("page >= 1")
        }
        return true
      }
    }
  },
}, ["query"]))

export const paginationValidator = validate(checkSchema({
  limit: {
    isNumeric: true,
    custom: {
      options: async (value, { req }) => {
        const num = Number(value)
        if (num > 100 || num < 1) {
          throw new Error("1 <= limit <= 100")
        }
        return true
      }
    }
  },
  page: {
    isNumeric: true,
    custom: {
      options: async (value, { req }) => {
        const num = Number(value)
        if (num < 1) {
          throw new Error("page >= 1")
        }
        return true
      }
    }
  },
}, ["query"]))