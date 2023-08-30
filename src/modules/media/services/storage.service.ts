import { Injectable, InternalServerErrorException, UnsupportedMediaTypeException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

@Injectable()
export class StorageService {
  constructor(private readonly configService: ConfigService) {}

  private readonly S3client = new S3Client({
    region: this.configService.get<string>("AWS_S3_REGION"),
    credentials: {
      secretAccessKey: this.configService.getOrThrow<string>("AWS_SECRET_ACCESS_KEY"),
      accessKeyId: this.configService.getOrThrow<string>("AWS_ACCESS_KEY"),
    },  
    maxAttempts: this.configService.getOrThrow<number>("AWS_RETRY_TIMES")
  });

  private readonly S3BucketName = this.configService.get<string>("AWS_S3_BUCKET");

  getUploadFileInfo(file: Express.Multer.File): { filename: string, fileLocation: string } {
    const dateFormat = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(/[^\w]+/g, '-');

    const filename = `${dateFormat}_${file.originalname}`.replace(/\s/g, "");
    const fileLocation = `https://${this.S3BucketName}.s3.amazonaws.com/${filename}`;
    
    return {
      fileLocation,
      filename
    }
  }

  async uploadFileToS3Bucket(file: Express.Multer.File, parsedFilename: string) {
    const S3Response = await this.S3client.send(
      new PutObjectCommand({
        Bucket: this.S3BucketName,
        Key: parsedFilename,
        Body: file.buffer
      })
    );
      console.log('s3Respionse:', S3Response)
    if (S3Response.$metadata.httpStatusCode !== 200) throw new UnsupportedMediaTypeException();
  }
}