import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class StorageService {
  constructor(private readonly configService: ConfigService) {}

  private readonly S3client = new S3Client({
    region: this.configService.get<string>("AWS_S3_REGION"),
    credentials: {
      secretAccessKey: this.configService.getOrThrow<string>("AWS_SECRET_ACCESS_KEY"),
      accessKeyId: this.configService.getOrThrow<string>("AWS_ACCESS_KEY"),
    }
  });

  async uploadFileToS3Bucket(files: Array<Express.Multer.File>): Promise<void> {
    try {
      const dateFormat = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).replace(/[^\w]+/g, '-');

      files.forEach(async (file) => {
        const parsedFilename = `${dateFormat}_${file.originalname}`;
 
        const response = await this.S3client.send(
          new PutObjectCommand({
            Bucket: this.configService.get<string>("AWS_S3_BUCKET"),
            Key: parsedFilename,
            Body: file.buffer
          })
        );

        console.log(response)
      });
    } catch(err) {
      throw new InternalServerErrorException();
    }
  }
}