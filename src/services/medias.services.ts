import { Request } from "express";
import { getFiles, getNameFromFullname, handleUploadImage as handleUploadImage, handleUploadVideo } from "~/utils/file";
import sharp from "sharp";
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from "~/constants/dir";
import path from "path";
import fsPromise from 'fs/promises'
import { isProduction } from "~/utils/config";
import { EncodingStatus, MediaType } from "~/constants/enum";
import { Media } from "~/models/Other";
import { encodeHLSWithMultipleVideoStreams } from "~/utils/video";
import databaseService from "~/services/database.services";
import VideoStatus from "~/models/schemas/VideoStatus.schema";
import uploadFileToS3 from "~/utils/s3";
import mime from "mime"
import { rimrafSync } from "rimraf"
import { envConfig } from "~/constants/config";

class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }

  async enqueue(item: string) {
    this.items.push(item)
    const idName = getNameFromFullname(item.split('\\').pop() as string)

    await databaseService.videoStatus.insertOne(new VideoStatus({ name: idName, status: EncodingStatus.Pending }))

    this.processEncode()
  }

  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]

      const idName = getNameFromFullname(videoPath.split('\\').pop() as string)
      await databaseService.videoStatus.updateOne({ name: idName }, { $set: { status: EncodingStatus.Processing }, $currentDate: { updatedAt: true } })

      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift()

        // upload to S3
        const files = getFiles(path.resolve(UPLOAD_VIDEO_DIR, idName))
        await Promise.all(
          files.map(filepath => {
            const fileName = "videos-hls/" + filepath.replace(path.resolve(UPLOAD_VIDEO_DIR) + "\\", "");
            return uploadFileToS3({
              filePath: filepath,
              fileName,
              contentType: mime.getType(filepath) as string
            })
          })
        )

        rimrafSync(path.resolve(UPLOAD_VIDEO_DIR, idName))

        await databaseService.videoStatus.updateOne({ name: idName }, { $set: { status: EncodingStatus.Success }, $currentDate: { updatedAt: true } })
      } catch (error) {
        console.log(`Encode video ${videoPath} error`)
        console.log(error)

        await databaseService.videoStatus.updateOne({ name: idName }, { $set: { status: EncodingStatus.Failed }, $currentDate: { updatedAt: true } }).catch((err) => { console.log("Update video status error ", error) })
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log("Encode video queue is  empty")
    }
  }
}

const queue = new Queue();

class MediaService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req);
    const result: Media[] = await Promise.all(files.map(async (file) => {
      const newName = getNameFromFullname(file.newFilename)
      const newFullFileName = `${newName}.jpg`
      const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFileName)
      await sharp(file.filepath).jpeg().toFile(newPath)

      const s3Result = await uploadFileToS3({ fileName: 'images/' + newFullFileName, filePath: newPath, contentType: mime.getType(newPath) as string })

      await Promise.all([
        fsPromise.unlink(file.filepath),
        fsPromise.unlink(newPath)
      ])

      return {
        url: s3Result.Location as string,
        type: MediaType.Image
      }
    }))

    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req);

    const result: Media[] = await Promise.all(
      files.map(async file => {
        const { newFilename, filepath } = file

        const s3Result = await uploadFileToS3({
          fileName: 'videos/' + newFilename,
          filePath: filepath,
          contentType: mime.getType(filepath) as string
        })

        fsPromise.unlink(filepath)

        return {
          url: s3Result.Location as string,
          type: MediaType.Video
        }
      })
    )

    return result
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req);

    const result: Media[] = await Promise.all(files.map(async (file) => {
      const { newFilename, filepath } = file
      const newName = getNameFromFullname(newFilename)
      queue.enqueue(filepath)
      return {
        url: isProduction ? `${envConfig.host}/static/video-hls/${newName}/master.m3u8` : `http://localhost:${envConfig.port}/static/video-hls/${newName}/master.m3u8`,
        type: MediaType.HLS
      }
    }))

    return result
  }

  async getVideoStatus(id: string) {
    const data = databaseService.videoStatus.findOne({ name: id })
    return data
  }
}

// Tạo object từ class MediaService
const mediaService = new MediaService();
export default mediaService