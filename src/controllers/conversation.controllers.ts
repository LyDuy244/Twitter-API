import { NextFunction, Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { GetConversationParams } from "~/models/requests/conversations.request"
import { TokenPayload } from "~/models/requests/users.request"
import { conversationService } from "~/services/conversation.services"


export const getConversationController = async (req: Request<GetConversationParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { receiver_id } = req.params
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const { conversations, total } = await conversationService.getConversations(
    {
      sender_id: user_id,
      receiver_id: receiver_id,
      limit,
      page
    }
  )
  return res.json({
    message: "Get conversations successfully",
    result: {
      conversations,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}
