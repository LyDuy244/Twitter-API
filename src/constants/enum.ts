export enum UserVerifyStatus {
  // chưa xác thực email
  Unverified,
  // đã xác thực email
  Verified,
  // đã bị khóa
  Banned
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum MediaType {
  Image,
  Video,
  HLS
}

export enum MediaTypeQuery {
  Image = "image",
  Video = "video",
}

export enum EncodingStatus {
  Pending, // Dang cho o hang doi
  Processing, // Dang encode
  Success, // Encode thanh cong
  Failed // Chua duoc encode
}

export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}

export enum TweetAudience {
  EveryOne,
  TwitterCircle,
}

export enum PeopleFollow {
  Anyone = "0",
  Following = "1"
}