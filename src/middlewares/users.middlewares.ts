import { Request, Response, NextFunction } from "express"
import { checkSchema, ParamSchema } from "express-validator";
import { JsonWebTokenError } from "jsonwebtoken";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/Errors";
import databaseService from "~/services/database.services";
import userServices from "~/services/users.services";
import { hashPassword } from "~/utils/crypto";
import { verifyToken } from "~/utils/jwt";
import { validate } from "~/utils/validation";
import { capitalize } from "lodash";
import { ObjectId } from "mongodb";
import { TokenPayload } from "~/models/requests/users.request";
import { UserVerifyStatus } from "~/constants/enum";
import { REGEX_USER_NAME } from "~/constants/regex";
import { verifyAccessToken } from "~/utils/common";
import { envConfig } from "~/constants/config";

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
  }
}
const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password)
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_NOT_MATCH)
      return true;
    }
  }
}
const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED
        })
      }
      try {
        const decode_forgot_password_token = await verifyToken({ token: value, secretOrPublicKey: envConfig.jwtSecretForgotPasswordToken })

        const { user_id } = decode_forgot_password_token
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

        if (user === null) {
          throw new ErrorWithStatus({ message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID, status: HTTP_STATUS.UNAUTHORIZED })
        }

        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({ message: USERS_MESSAGES.USER_NOT_FOUND, status: HTTP_STATUS.UNAUTHORIZED })
        }

        req.decode_forgot_password_token = decode_forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({ message: capitalize(error.message), status: HTTP_STATUS.UNAUTHORIZED })
        }
        throw error
      }
      return true
    }
  }
}

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  },
  trim: true
}
const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH_MUST_BE_FROM_1_TO_400
  }
}
const userIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: USERS_MESSAGES.INVALID_USER_ID
        })
      }
      const followed_user = await databaseService.users.findOne({ _id: new ObjectId(value) })
      if (followed_user === null) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: USERS_MESSAGES.USER_NOT_FOUND
        })
      }
      return true
    }
  }
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
  }
}
export const loginValidator = validate(checkSchema({
  email: {
    notEmpty: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
    },
    isEmail: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        const user = await databaseService.users.findOne({ email: value, password: hashPassword(req.body.password) });
        if (user === null) {
          throw USERS_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT
        }
        req.user = user
        return true
      }
    }
  },
  password: passwordSchema,
}, ['body']))

export const registerValidator = validate(checkSchema({
  name: nameSchema,
  email: {
    notEmpty: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
    },
    isEmail: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
    },
    trim: true,
    custom: {
      options: async (value) => {
        const isExitsEmail = await userServices.checkEmailExits(value)
        if (isExitsEmail) {
          throw USERS_MESSAGES.EMAIL_ALREADY_EXISTS
        }
        return true
      }
    }
  },
  password: passwordSchema,
  confirm_password: confirmPasswordSchema,
  date_of_birth: dateOfBirthSchema

}, ['body']))

export const accessTokenValidator = validate(checkSchema({
  Authorization: {
    trim: true,
    custom: {
      options: async (value: string, { req }) => {
        const access_token = (value || "").split(" ")[1]
        return await verifyAccessToken(access_token, req as Request)
      }
    }
  }
}, ['headers']))

export const refreshTokenValidator = validate(checkSchema({
  refresh_token: {
    trim: true,
    custom: {
      options: async (value: string, { req }) => {
        if (!value) {
          throw new ErrorWithStatus({
            status: HTTP_STATUS.UNAUTHORIZED,
            message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
          })
        }
        try {
          const [decode_refresh_token, refresh_token] = await Promise.all([
            verifyToken({ token: value, secretOrPublicKey: envConfig.jwtSecretRefreshToken }),
            databaseService.refreshToken.findOne({ token: value })
          ])
          if (refresh_token === null) {
            throw new ErrorWithStatus({ message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXISTS, status: HTTP_STATUS.UNAUTHORIZED })

          }
          (req as Request).decode_refresh_token = decode_refresh_token
        } catch (error) {
          if (error instanceof JsonWebTokenError) {
            throw new ErrorWithStatus({ message: capitalize(error.message), status: HTTP_STATUS.UNAUTHORIZED })
          }
          throw error
        }
        return true
      }
    }
  }
}, ["body"]))

export const emailVerifyTokenValidator = validate(checkSchema({
  email_verify_token: {
    trim: true,
    custom: {
      options: async (value: string, { req }) => {
        if (!value) {
          throw new ErrorWithStatus({
            status: HTTP_STATUS.UNAUTHORIZED,
            message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED
          })
        }
        try {
          const decode_email_verify_token = await verifyToken({ token: value, secretOrPublicKey: envConfig.jwtSecretEmailVerifyToken })
            ; (req as Request).decode_email_verify_token = decode_email_verify_token
        } catch (error) {
          if (error instanceof JsonWebTokenError) {
            throw new ErrorWithStatus({ message: capitalize(error.message), status: HTTP_STATUS.UNAUTHORIZED })
          }
        }
        return true
      }
    }
  }
}, ["body"]))

export const forgotPasswordValidator = validate(checkSchema({
  email: {
    notEmpty: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
    },
    isEmail: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        const user = await databaseService.users.findOne({ email: value });
        if (user === null) {
          throw USERS_MESSAGES.USER_NOT_FOUND
        }
        req.user = user
        return true
      }
    }
  },
}, ['body']))

export const verifyForgotPasswordTokenValidator = validate(checkSchema({
  forgot_password_token: forgotPasswordTokenSchema,
}, ['body']))

export const resetPasswordValidator = validate(checkSchema({
  password: passwordSchema,
  confirm_password: confirmPasswordSchema,
  forgot_password_token: forgotPasswordTokenSchema,
}, ['body']))

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decode_authorization as TokenPayload

  if (verify !== UserVerifyStatus.Verified) {
    return next(new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_VERIFIED,
      status: HTTP_STATUS.FORBIDDEN
    }))
  }

  next()
}

export const updateMeValidator = validate(checkSchema({
  name: {
    ...nameSchema,
    optional: true,
    notEmpty: undefined
  },

  username: {
    optional: true,
    isString: {
      errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        if (!REGEX_USER_NAME.test(value)) {
          throw new Error(
            USERS_MESSAGES.USERNAME_IS_INVALID
          )
        }
        const user = await databaseService.users.findOne({ username: value })
        // Neu ton tai khong cho phep update
        if (user) {
          throw new Error(
            USERS_MESSAGES.USERNAME_EXISTED
          )
        }
        return true
      }
    }
  },
  date_of_birth: {
    ...dateOfBirthSchema,
    optional: true
  },
  bio: {
    optional: true,
    isString: {
      errorMessage: USERS_MESSAGES.BIO_MUST_BE_STRING
    },
    trim: true,
    isLength: {
      options: {
        min: 1,
        max: 200
      },
      errorMessage: USERS_MESSAGES.BIO_LENGTH_MUST_BE_FROM_1_TO_200
    },
  },
  location: {
    optional: true,
    isString: {
      errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_STRING
    },
    trim: true,

    isLength: {
      options: {
        min: 1,
        max: 200
      },
      errorMessage: USERS_MESSAGES.LOCATION_LENGTH_MUST_BE_FROM_1_TO_200
    },
  },
  avatar: imageSchema,
  cover_photo: imageSchema
}, ['body']))

export const followValidator = validate(checkSchema({
  followed_user_id: userIdSchema
}, ['body']))

export const unfollowValidator = validate(checkSchema({
  user_id: userIdSchema
}, ["params"]))


export const changePasswordValidator = validate(checkSchema({
  old_password: {
    ...passwordSchema,
    custom: {
      options: async (value: string, { req }) => {
        const { user_id } = (req as Request).decode_authorization as TokenPayload
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
        if (!user) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.NOT_FOUND
          })
        }
        const { password } = user
        const isMatch = hashPassword(value) === password
        if (!isMatch) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.OLD_PASSWORD_NOT_MATCH,
            status: HTTP_STATUS.NOT_FOUND
          })
        }
      }
    }
  },
  password: passwordSchema,
  confirm_password: confirmPasswordSchema
}, ["body"]))

export const isUserLoginValidator = (middlewares: (req: Request, res: Response, next: NextFunction) => void) => {
  // req.header vs req.headers
  // req.header(<header-key>) // Khong phan biet hoa thuong
  // req.headers.<header-key> // Dua vao req.header tao ra va chi match voi 1 loai hoa hoac thuong
  // console.log(req.header("authorization")) // req.header("authorization") = req.header("Authorization")
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middlewares(req, res, next)
    }
    next()
  }
}

export const getConversationValidator = validate(checkSchema({
  receiver_id: userIdSchema
}, ['params']))