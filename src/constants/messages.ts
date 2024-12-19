export const USERS_MESSAGES = {
  VALIDATION_ERROR: "Validation Error",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  EMAIL_IS_REQUIRED: "Email is required",
  EMAIL_IS_INVALID: "Email is invalid",
  EMAIL_OR_PASSWORD_INCORRECT: "Email or Password in correct",
  NAME_IS_REQUIRED: "Name is required",
  NAME_MUST_BE_A_STRING: " Name must be a string",
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: " Name length must be from 1 to 100",
  USERNAME_MUST_BE_A_STRING: "Username must be a strin",
  PASSWORD_IS_REQUIRED: "Password is required",
  PASSWORD_MUST_BE_A_STRING: "Password must be a string",
  PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: "Password length must be from 6 to 50",
  PASSWORD_MUST_BE_STRONG: "Password must be at least 6 character long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, anh 1 symbol",
  CONFIRM_PASSWORD_IS_REQUIRED: "Confirm password is required",
  CONFIRM_PASSWORD_MUST_BE_A_STRING: "Confirm password must be a string",
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: "Confirm password length must be from 6 to 50",
  CONFIRM_PASSWORD_MUST_BE_STRONG: "Confirm password must be at least 6 character long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, anh 1 symbol",
  CONFIRM_PASSWORD_NOT_MATCH: "Password Confirmation does not match Password",
  DATE_OF_BIRTH_MUST_BE_ISO8601: "Date of birth must be ISO8601",
  LOGIN_SUCCESS: "Login Success",
  REGISTER_SUCCESS: "Register Success",
  ACCESS_TOKEN_IS_REQUIRED: "Access Token is required",
  REFRESH_TOKEN_IS_REQUIRED: "Refresh Token is required",
  REFRESH_TOKEN_IS_INVALID: "Refresh Token is invalid",
  ACCESS_TOKEN_IS_INVALID: "Access Token is invalid",
  USED_REFRESH_TOKEN_OR_NOT_EXISTS: "Used refresh token or not exists",
  LOGOUT_SUCCESS: "Logout Success",
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: "Email verify token is required",
  USER_NOT_FOUND: "User not found",
  EMAIL_ALREADY_VERIFY_BEFORE: "Email already verified before",
  EMAIL_VERIFY_SUCCESS: "Email verify success",
  RESEND_VERIFY_EMAIL_SUCCESS: "Resend verify email success",
  CHECK_EMAIL_TO_RESET_PASSWORD: "Check email to reset password",
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: "Forgot password token is required",
  VERIFY_FORGOT_PASSWORD_SUCCESS: "Verify forgot password success",
  FORGOT_PASSWORD_TOKEN_IS_INVALID: "Forgot password token is invalid",
  RESET_PASSWORD_SUCCESS: "Reset password success",
  GET_ME_SUCCESS: "Get my profile success",
  GET_PROFILE_SUCCESS: "Get profile user success",
  USER_NOT_VERIFIED: "User not verified",
  BIO_MUST_BE_STRING: "Bio must be a string",
  BIO_LENGTH_MUST_BE_FROM_1_TO_200: "Bio length must be from 1 to 200",
  LOCATION_MUST_BE_STRING: "Location must be a string",
  LOCATION_LENGTH_MUST_BE_FROM_1_TO_200: "Location length must be from 1 to 200",
  IMAGE_URL_MUST_BE_STRING: "Image url must be a string",
  IMAGE_URL_LENGTH_MUST_BE_FROM_1_TO_400: "Image url length must be from 1 to 400",
  UPDATE_ME_SUCCESS: "Update me successfully",
  FOLLOW_SUCCESS: "Follow successfully",
  INVALID_USER_ID: "Invalid user id",
  FOLLOWED: "Followed",
  ALREADY_UNFOLLOWED: "Already unfollowed",
  UNFOLLOW_SUCCESS: "Unfollow success",
  USERNAME_IS_INVALID: "Username must be 4-15 characters long and contain only letters, numbers, and underscores, not only numbers",
  USERNAME_EXISTED: "Username existed",
  OLD_PASSWORD_NOT_MATCH: "Old password not match",
  CHANGE_PASSWORD_SUCCESS: "Change password success",
  EMAIL_NOT_VERIFIED: "Email not verified",
  UPLOAD_SUCCESS: "Upload successfully",
  REFRESH_TOKEN_SUCCESS: "Refresh token success",
  GET_VIDEO_STATUS_SUCCESS: "Get video status success"
} as const

export const TWEETS_MESSAGES = {
  INVALID_TYPE: "Type is invalid",
  INVALID_AUDIENCE: "Audience is invalid",
  PARENT_ID_MUST_BE_A_VALID_TWEET_ID: "Parent id must be a valid tweet id",
  PARENT_ID_MUST_BE_NULL: "Parent id must be null",
  CONTENT_MUST_BE_A_NONE_EMPTY_STRING: "Content must be a none empty string",
  CONTENT_MUST_BE_A_EMPTY_STRING: "Content must be a empty string",
  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING: "Hashtags must be an array of string",
  MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID: "Mentions must be an array of user id",
  MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT: "Medias must be an array of Media Object",
  BOOKMARK_TWEET_SUCCESSFULLY: "Bookmark Tweet successfully",
  UNBOOKMARK_TWEET_SUCCESSFULLY: "UnBookmark Tweet successfully",
  LIKE_TWEET_SUCCESSFULLY: "Like Tweet successfully",
  UNLIKE_TWEET_SUCCESSFULLY: "UnLike Tweet successfully",
  CREATE_TWEET_SUCCESSFULLY: "Create Tweet successfully",
  INVALID_TWEET_ID: "Invalid tweet id",
  TWEET_NOT_FOUND: "Tweet not found",
  TWEET_IS_NOT_PUBLIC:"Tweet is not public"
}
