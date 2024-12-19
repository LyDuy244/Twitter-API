import { S3 } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { config } from "dotenv"
import { Response } from "express"
import fs from "fs"
import path from "path"
import { envConfig } from "~/constants/config"
import HTTP_STATUS from "~/constants/httpStatus"
config()
const s3 = new S3({
  region: envConfig.awsRegion,
  credentials: {
    secretAccessKey: envConfig.awsSecretAccessKey,
    accessKeyId: envConfig.awsAccessKeyId
  }
})
// s3.listBuckets({}).then((data) => { console.log(data) })

const uploadFileToS3 = ({
  fileName,
  filePath,
  contentType
}: {
  fileName: string,
  filePath: string,
  contentType: string
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: { Bucket: envConfig.s3BucketName, Key: fileName, Body: fs.readFileSync(filePath), ContentType: contentType },
    queueSize: 4,
    partSize: 1024 * 1024 * 5,
    leavePartsOnError: false,
  });

  return parallelUploads3.done()
}
export default uploadFileToS3

export const senFileFormS3 = async (res: Response, filePath: string) => {
  try {
    const data = await s3.getObject({
      Bucket: envConfig.s3BucketName,
      Key: filePath
    })
      ; (data.Body as any).pipe(res)
  } catch (error) {
    res.status(HTTP_STATUS.NOT_FOUND).send("Not found")
  }
}

// parallelUploads3.on("httpUploadProgress", (progress) => {
//   console.log(progress);
// });

// parallelUploads3.done().then(res => console.log(res));





