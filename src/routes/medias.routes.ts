import { Router } from "express";
import { uploadImageController, uploadVideoController, uploadVideoHLSController, videoStatusController } from "~/controllers/medias.controllers";
import { accessTokenValidator, emailVerifyTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { wrapRequestHandler } from "~/utils/handlers";

const mediaRouter = Router();

mediaRouter.post('/upload-image', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(uploadImageController))
mediaRouter.post('/upload-video', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(uploadVideoController))
mediaRouter.post('/upload-video-hls', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(uploadVideoHLSController))
mediaRouter.get('/video-status/:id', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(videoStatusController))

export default mediaRouter