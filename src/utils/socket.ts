import { verifyAccessToken } from "~/utils/common"
import { TokenPayload } from "~/models/requests/users.request"
import { UserVerifyStatus } from "~/constants/enum"
import { ErrorWithStatus } from "~/models/Errors"
import { USERS_MESSAGES } from "~/constants/messages"
import HTTP_STATUS from "~/constants/httpStatus"
import { Server } from "socket.io";
import Conversation from "~/models/schemas/Conversation.schema"
import { ObjectId } from "mongodb"
import databaseService from "~/services/database.services"
import { Server as ServerHttp } from "http"

const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:4000"
    }
  });

  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}

  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth
    const access_token = (Authorization || "").split(" ")[1]
    try {
      const decode_authorization = await verifyAccessToken(access_token)
      const { verify } = decode_authorization as TokenPayload

      if (verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_VERIFIED,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
      // Truyền decode_authorization  vào socket để sử dụng ở các middleware khác
      socket.handshake.auth.decode_authorization = decode_authorization
      socket.handshake.auth.access_token = access_token
      next()
    } catch (error) {
      next({
        message: "Unauthorized",
        name: "UnauthorizedError",
        data: error
      })
    }
    socket.on("connect_error", (err) => {
      console.log(`connect_err due to ${err.message}`)
    })
  })

  io.on("connection", (socket) => {
    console.log(`user ${socket.id} connected`)
    const { user_id } = socket.handshake.auth.decode_authorization as TokenPayload
    users[user_id] = {
      socket_id: socket.id
    }

    socket.use(async (packet, next) => {
      const { access_token } = socket.handshake.auth
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error("Unauthorized"))
      }
    })

    socket.on("error", (err) => {
      if (err && err.message === 'Unauthorized') {
        socket.disconnect()
      }
    })

    console.log(users);
    socket.on("disconnect", () => {
      delete users[user_id]
      console.log(`user ${socket.id} disconnected`)
    })

    socket.on("send_message", async (data) => {
      const { receiver_id, sender_id, message } = data.payload
      const conversation = new Conversation({
        sender_id: new ObjectId(sender_id),
        receiver_id: new ObjectId(receiver_id),
        message: message
      })
      const result = await databaseService.conversations.insertOne(conversation)

      conversation._id = result.insertedId
      const receiver_socket_id = users[receiver_id]?.socket_id
      if (receiver_socket_id) {
        socket.to(receiver_socket_id).emit("receive_message", {
          payload: conversation,
        })
      }
    })

  });
}

export default initSocket