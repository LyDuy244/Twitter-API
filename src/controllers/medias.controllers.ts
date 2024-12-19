import { NextFunction, Request, Response } from "express";
import path from "path";
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from "~/constants/dir";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/messages";
import mediaService from "~/services/medias.services";
import { handleUploadImage } from "~/utils/file";
import fs from 'fs';
import mime from 'mime';
import { senFileFormS3 } from "~/utils/s3";
export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const images = await mediaService.uploadImage(req)
  res.status(200).json({
    result: images,
    message: USERS_MESSAGES.UPLOAD_SUCCESS
  })
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const images = await mediaService.uploadVideo(req)
  res.status(200).json({
    result: images,
    message: USERS_MESSAGES.UPLOAD_SUCCESS
  })
}
export const uploadVideoHLSController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.uploadVideoHLS(req)
  res.status(200).json({
    result: url,
    message: USERS_MESSAGES.UPLOAD_SUCCESS
  })
}

export const videoStatusController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const result = await mediaService.getVideoStatus(id as string)
  res.status(200).json({
    result: result,
    message: USERS_MESSAGES.GET_VIDEO_STATUS_SUCCESS
  })
}

export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      res.status((err as any).status).send("Not found")
    }
  });
}

// stream video
export const serveVideoStreamController = (req: Request, res: Response, next: NextFunction) => {
  const range = req.headers.range
  if (!range) {
    res.status(HTTP_STATUS.BAD_REQUEST).send("Requires Range header")
    return;
  }
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)

  // 1MB = 10^6 bytes (Tinh theo he thap phan, day la thu chung ta hay thay tren may tinh dien thoai)
  // Con neu tinh theo he nhi phan thi 1MB = 2^20 bytes (1024 * 1024)

  // Dung luong video (bytes)
  const videoSize = fs.statSync(videoPath).size

  // Dung luong video cho moi phan doan stream
  const chunkSize = 10 ** 6; // 1MB
  // Lay gia tri byte bat dau tu header Range(vd: bytes =1048576-)
  const start = Number(range.replace(/\D/g, ''))
  // Lay gia tri byte ket thuc, vuot qua dung luong video thi lay video size
  const end = Math.min(start + chunkSize, videoSize - 1);
  // Dung luong thuc te cho moi doan video stream
  // Thuong day se la chunksize, ngoai tru doan cuoi cung
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || "video/*"
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": 'bytes',
    "Content-Length": contentLength,
    "Content-Type": contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStreams = fs.createReadStream(videoPath, { start, end })
  videoStreams.pipe(res)
}

export const serveVideoController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, name), (err) => {
    if (err) {
      res.status((err as any).status).send("Not found")
    }
  });
}
export const serveM3u8Controller = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  senFileFormS3(res, `videos-hls/${id}/master.m3u8`)

  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (err) => {
  //   if (err) {
  //     res.status((err as any).status).send("Not found")
  //   }
  // });
}

export const serveSegmentController = (req: Request, res: Response, next: NextFunction) => {
  const { id, v, segment } = req.params;
  // senFileFormS3(res, `videos-hls/${id}/master.m3u8`)
  // segment: 0.ts, 1.ts
  // console.log(segment)
  senFileFormS3(res, `videos-hls/${id}/${v}/${segment}`)

  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment), (err) => {
  //   console.log(err)
  //   if (err) {
  //     res.status((err as any).status).send("Not found")
  //   }
  // });
}