import { Router } from "express";
import { serveImageController, serveVideoController, serveVideoStreamController, serveM3u8Controller, serveSegmentController } from "~/controllers/medias.controllers";
import { wrapRequestHandler } from "~/utils/handlers";

const staticRouter = Router()

staticRouter.get("/image/:name", wrapRequestHandler(serveImageController))
staticRouter.get("/video-stream/:name", wrapRequestHandler(serveVideoStreamController))
staticRouter.get("/video-hls/:id/master.m3u8", wrapRequestHandler(serveM3u8Controller))
staticRouter.get("/video-hls/:id/:v/:segment", wrapRequestHandler(serveSegmentController))

export default staticRouter