import { Router } from "express";
import { getConversationController } from "~/controllers/conversation.controllers";
import { serveImageController, serveVideoController, serveVideoStreamController, serveM3u8Controller, serveSegmentController } from "~/controllers/medias.controllers";
import { paginationValidator } from "~/middlewares/tweets.middlewares";
import { accessTokenValidator, getConversationValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { wrapRequestHandler } from "~/utils/handlers";

const conversationRouter = Router()

conversationRouter.get(
  "/receivers/:receiver_id",
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  getConversationValidator,
  wrapRequestHandler(getConversationController)
)

export default conversationRouter