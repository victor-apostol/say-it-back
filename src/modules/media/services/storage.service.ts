import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";
import { DataSource, QueryRunner } from "typeorm";
import { MediaService } from "./media.service";
import { MediaTypes, messageServicesSideError } from "../constants";
import { Media } from "../entities/media.entitiy";

@Injectable()
export class StorageService {
  constructor(
    private readonly configService: ConfigService, 
    private readonly mediaService: MediaService,
  ) {}

  private readonly S3client = new S3Client({
    region: this.configService.get<string>("AWS_S3_REGION"),
    credentials: {
      secretAccessKey: this.configService.getOrThrow<string>("AWS_SECRET_ACCESS_KEY"),
      accessKeyId: this.configService.getOrThrow<string>("AWS_ACCESS_KEY"),
    },  
    maxAttempts: this.configService.getOrThrow<number>("AWS_RETRY_TIMES")
  });

  private readonly S3Bucket = this.configService.get<string>("AWS_S3_BUCKET");

  async uploadFilesToS3Bucket(
    files: Array<Express.Multer.File>, 
    userId: number, 
    tweetId: number, 
    mediaType: MediaTypes,
    queryRunner: QueryRunner
  ): Promise<Array<Media>> {
    try {
      const mediaPlaceholder = [] as Array<Media>;
      const dateFormat = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).replace(/[^\w]+/g, '-');

      await Promise.all(
        files.map(async (file) => {
          const parsedFilename = `${dateFormat}_${file.originalname}`.replace(/\s/g, "");
          const fileLocation = `https://${this.S3Bucket}.s3.amazonaws.com/${parsedFilename}`;
          
          const mediaEntity = await this.mediaService.saveFilePath(fileLocation, userId, tweetId, mediaType, queryRunner);
          mediaPlaceholder.push(mediaEntity);
          
          const S3Response = await this.S3client.send(
            new PutObjectCommand({
              Bucket: this.S3Bucket,
              Key: parsedFilename,
              Body: file.buffer
            })
          );
    
          if (S3Response.$metadata.httpStatusCode !== 200) throw new Error();
        })
      );

      return mediaPlaceholder;
    } catch(err) {
      throw new InternalServerErrorException(messageServicesSideError);
    }
  }
}