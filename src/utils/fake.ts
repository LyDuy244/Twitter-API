import { ObjectId } from "mongodb"
import { RegisterReqBody } from "~/models/requests/users.request"
import { faker } from '@faker-js/faker';
import { TweetReqBody } from "~/models/requests/tweets.request";
import { TweetAudience, TweetType, UserVerifyStatus } from "~/constants/enum";
import databaseService from "~/services/database.services";
import User from "~/models/schemas/User.schema";
import { hashPassword } from "~/utils/crypto";
import Follower from "~/models/schemas/Follower.schema";
import tweetService from "~/services/tweets.services";
// Mật khẩu cho các fake user
const PASSWORD = "duy123!"
// ID của tài khoản của mình dùng để follow người khác
const MYID = new ObjectId("674eb3626bbc5c5e1e9ef63e")
// Số lượng user được tạo, mỗi user sẽ mặc định tweet 2 cái
const USER_COUNT = 50

const createRandomUser = () => {
  const user: RegisterReqBody = {
    name: faker.internet.displayName(),
    email: faker.internet.email(),
    password: PASSWORD,
    confirm_password: PASSWORD,
    date_of_birth: faker.date.past().toISOString()
  }

  return user;
}

const createRandomTweet = () => {
  const tweet: TweetReqBody = {
    type: TweetType.Tweet,
    audience: TweetAudience.EveryOne,
    content: faker.lorem.paragraph({ min: 10, max: 50 }),
    medias: [],
    hashtags: [],
    mentions: [],
    parent_id: null
  }
  return tweet
}

const users: RegisterReqBody[] = faker.helpers.multiple(createRandomUser, {
  count: USER_COUNT
})

const insertMultipleUsers = async (users: RegisterReqBody[]) => {
  console.log("Creating user...")
  const result = await Promise.all(
    users.map(async (user) => {
      const user_id = new ObjectId();;
      await databaseService.users.insertOne(
        new User({
          ...user,
          _id: user_id,
          username: `user${user_id.toString()}`,
          password: hashPassword(user.password),
          date_of_birth: new Date(user.date_of_birth),
          verify: UserVerifyStatus.Verified
        })
      )
      return user_id
    })
  )
  console.log(`Created ${result.length} users`)
  return result
}
const FollowMultipleUsers = async (user_id: ObjectId, followed_user_ids: ObjectId[]) => {
  console.log("Start following...")
  const result = await Promise.all(
    followed_user_ids.map(async (followed_user_id) => {
      await databaseService.followers.insertOne(
        new Follower({
          user_id,
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
    })
  )
  console.log(`Followed ${result.length} users`)
}
const InsertMultipleTweets = async (ids: ObjectId[]) => {
  console.log("Creating Tweet...")
  let count = 0
  const result = await Promise.all(
    ids.map(async (id, index) => {
      await Promise.all(
        [
          tweetService.createTweet(createRandomTweet(), id.toString()),
          tweetService.createTweet(createRandomTweet(), id.toString())
        ]
      )
      count += 2
    })
  )
  return result;
}

insertMultipleUsers(users).then((ids) => {
  FollowMultipleUsers(new ObjectId(MYID), ids)
  InsertMultipleTweets(ids)
})