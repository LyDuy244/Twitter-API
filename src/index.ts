import express from "express"
import { defaultErrorHandler } from "~/middlewares/error.middlewares."
import mediaRouter from "~/routes/medias.routes"
import usersRouter from "~/routes/users.routes"
import databaseService from "~/services/database.services"
import { initFolder } from "~/utils/file"
import { UPLOAD_VIDEO_DIR } from "~/constants/dir"
import staticRouter from "~/routes/static.routes"
import cors, { CorsOptions } from "cors"
import tweetsRouter from "~/routes/tweets.routes"
import bookMarksRouter from "~/routes/bookmarks.routes"
import likesRouter from "~/routes/likes.routes"
import searchRouter from "~/routes/search.routes"
// import "~/utils/fake"
// import "~/utils/s3"
import { rateLimit } from 'express-rate-limit'
import helmet from "helmet";
import { createServer } from "http";
import conversationRouter from "~/routes/conversations.routes"
import initSocket from "~/utils/socket"

// import YAML from "yaml"
// import fs from "fs"
// import path from "path"
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from "swagger-jsdoc"
import { envConfig, isProduction } from "~/constants/config"

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'X clone Twitter API',
      version: '1.0.0',
    },
  },
  apis: ['./openapi/*.yaml'], // files containing annotations as above
};
const openapiSpecification = swaggerJSDoc(options);

// const file = fs.readFileSync(path.resolve("twitter-swagger.yaml"), "utf8")
// const swaggerDocument = YAML.parse(file)

const app = express()
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Redis, Memcached, etc. See below.
})

const port = envConfig.port

const httpServer = createServer(app);

// Tạo folder upload
initFolder();

app.use(limiter)

app.use(helmet());

const corsOptions: CorsOptions = {
  origin: isProduction ? envConfig.clientUrl : '*'
}
app.use(cors(corsOptions))

// Biến đổi các json thành object
app.use(express.json())
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexVideoStatus()
  databaseService.indexFollowers()
  databaseService.indexTweets()
})


app.use("/users", usersRouter)
app.use("/tweets", tweetsRouter)
app.use("/medias", mediaRouter)
app.use("/bookmarks", bookMarksRouter)
app.use("/likes", likesRouter)
app.use("/static", staticRouter)
app.use("/search", searchRouter)
app.use("/conversations", conversationRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

app.use(defaultErrorHandler)


initSocket(httpServer)

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


// const mgclient = new MongoClient(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter.ae61n.mongodb.net/?retryWrites=true&w=majority`)

// const db = mgclient.db('earth')
// const users = db.collection('users')
// const userData = []
// function getRandomNumber() {
//   return Math.floor(Math.random() * 100) + 1
// }

// for (let i = 0; i < 1000; i++) {
//   userData.push({
//     name: "user " + i,
//     age: getRandomNumber(),
//     sex: i % 2 === 0 ? 'male' : 'female'
//   })
// }

// users.insertMany(userData)