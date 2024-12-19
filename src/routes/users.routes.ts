import { Router } from "express"
import { verifyEmailController, loginController, logoutController, registerController, resendVerifyEmailController, forgotPasswordController, verifyForgotPasswordTokenController, resetPasswordController, getMeController, updateMeController, followController, unFollowController, changePasswordController, oauthController, refreshTokenController, getProfileController } from "~/controllers/users.controllers";
import { filterMiddleware } from "~/middlewares/common.midlewares";
import { accessTokenValidator, changePasswordValidator, emailVerifyTokenValidator, followValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, unfollowValidator, updateMeValidator, verifiedUserValidator, verifyForgotPasswordTokenValidator } from "~/middlewares/users.middlewares";
import { UpdateMeReqBody } from "~/models/requests/users.request";
import { wrapRequestHandler } from "~/utils/handlers";
const usersRouter = Router()
/**
 * Description: Login a user
 * Path: "/login"
 * Method: POST
 * Body: {email: string, password: string}
 */

usersRouter.post("/login", loginValidator, wrapRequestHandler(loginController))
/**
 * Description: Login with Google
 * Path: "/oauth/google"
 * Method: POST
 */

usersRouter.get("/oauth/google", wrapRequestHandler(oauthController))

/**
 * Description: Register a user
 * Path: "/register"
 * Method: POST
 * Body: {email: string, password: string, username: string, confirm_password: string, date_of_birth: string}
 */


usersRouter.post("/register", registerValidator, wrapRequestHandler(registerController))
/**
 * Description: Logout a user
 * Path: "/logout"
 * Method: POST
 * Header: {Authorization: Bearer <AccessToken>}
 * Body: {refresh_token: string}
 */

usersRouter.post("/logout", accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
/**
 * Description: refresh token
 * Path: "/refresh-token"
 * Method: POST
 * Body: {refresh_token: string}
 */

usersRouter.post("/refresh-token", refreshTokenValidator, wrapRequestHandler(refreshTokenController))
/**
 * Description: Verify email when user client click on the link in email
 * Path: "/verify-email"
 * Method: POST
 * Body: {email_verify_token: string}
 */

usersRouter.post("/verify-email", emailVerifyTokenValidator, wrapRequestHandler(verifyEmailController))
/**
 * Description: Resent verify email
 * Path: "/resend-verify-email"
 * Method: POST
 * Header: {
 *  Authorization: Bearer <access_token>
 * }
 * Body: {}
 */

usersRouter.post("/resend-verify-email", accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))
/**
 * Description: Submit email to reset password, send email to user
 * Path: "/forgot-password"
 * Method: POST
 * Body: {
 * email: string
 * }
 */

usersRouter.post("/forgot-password", forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))
/**
 * Description: Verify link in email to reset password
 * Path: "/verify-forgot-password"
 * Method: POST
 * Body: {
 * forgot-password-token: string
 * }
 */

usersRouter.post("/verify-forgot-password", verifyForgotPasswordTokenValidator, wrapRequestHandler(verifyForgotPasswordTokenController))
/**
 * Description: Reset password
 * Path: "/reset-password"
 * Method: POST
 * Body: {
 * forgot-password-token: string,
 * password: string,
 * confirm_password: string
 * }
 */

usersRouter.post("/reset-password", resetPasswordValidator, wrapRequestHandler(resetPasswordController))
/**
 * Description: Get my profile
 * Path: "/me"
 * Method: POST
 * Header: {
 *  Authorization: Bearer <access_token>
 * }
 */

usersRouter.get("/me", accessTokenValidator, wrapRequestHandler(getMeController))
/**
 * Description: Update my profile
 * Path: "/me"
 * Method: PATCH
 * Header: {
 *  Authorization: Bearer <access_token>
 * }
 * Body: User Schema
 */

usersRouter.patch("/me", accessTokenValidator, verifiedUserValidator, updateMeValidator, filterMiddleware<UpdateMeReqBody>(["avatar", "bio", "cover_photo", "date_of_birth", "location", "username"]), wrapRequestHandler(updateMeController))
/**
 * Description: Get profile by username
 * Path: "/:username"
 * Method: GET
 */

usersRouter.get("/:username", wrapRequestHandler(getProfileController))
/**
 * Description: Follow someone
 * Path: "/follow"
 * Method: POST
 * Header: {
 *  Authorization: Bearer <access_token>
 * }
 * Body: {
 * followed_user_id: string
 * }
 */

usersRouter.post("/follow", accessTokenValidator, verifiedUserValidator, followValidator, wrapRequestHandler(followController))
/**
 * Description: Un follow someone
 * Path: "/follow/user_id"
 * Method: DELETE
 * Header: {
 *  Authorization: Bearer <access_token>
 * }
 */

usersRouter.delete("/follow/:user_id", accessTokenValidator, verifiedUserValidator, unfollowValidator, wrapRequestHandler(unFollowController))
/**
 * Description: Change Password
 * Path: "/change-password"
 * Method: PUT
 * Header: {
 *  Authorization: Bearer <access_token>
 * }
 * Body: {
 * old_password: string
 * password: string,
 * confirm_password: string
 * }
 */

usersRouter.put("/change-password", accessTokenValidator, verifiedUserValidator, changePasswordValidator, wrapRequestHandler(changePasswordController))


export default usersRouter;