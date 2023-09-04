import { BadRequestException, Injectable, UnsupportedMediaTypeException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MediaService } from "./media.service";
import { MEDIA_TYPES_SIZES, MEDIA_TYPES, imageExtensionsWhitelist, videoExtensionsWhitelist } from "../constants";
import { UploadFileInfo } from "../types/validators.types";

@Injectable()
export class StorageService {
  constructor(
    private readonly configService: ConfigService, 
    private readonly mediaService: MediaService
  ) {}

  private readonly S3client = new S3Client({
    region: this.configService.get<string>("AWS_S3_REGION"),
    credentials: {
      secretAccessKey: this.configService.getOrThrow<string>("AWS_SECRET_ACCESS_KEY"),
      accessKeyId: this.configService.getOrThrow<string>("AWS_ACCESS_KEY"),
    },  
    maxAttempts: this.configService.getOrThrow<number>("AWS_RETRY_TIMES")
  });

  private readonly S3BucketName = this.configService.get<string>("AWS_S3_BUCKET");

  getUploadFileInfo(file: Express.Multer.File): UploadFileInfo {
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
    
    const placeholder = filename.split('.');
    const fileExtension = placeholder[placeholder.length - 1];

    let mediaType: MEDIA_TYPES;
    
    if (imageExtensionsWhitelist.includes(fileExtension)) mediaType = MEDIA_TYPES.IMAGE;
    else if (videoExtensionsWhitelist.includes(fileExtension)) mediaType = MEDIA_TYPES.VIDEO;
    else mediaType = MEDIA_TYPES.AUDIO; // when i ll have audio support gotta check for it

    return {
      fileLocation,
      filename,
      fileExtension,
      mediaType
    }
  }

  async uploadFileToS3Bucket(file: Express.Multer.File, uploadFileInfo: UploadFileInfo, fileType: MEDIA_TYPES_SIZES) {
    const compressedBuffer = uploadFileInfo.mediaType === MEDIA_TYPES.IMAGE 
      ? await this.mediaService.compressImage(file.buffer, uploadFileInfo.fileExtension, fileType)
      : await this.mediaService.compressVideo({ buffer: file.buffer });

    const S3Response = await this.S3client.send(
      new PutObjectCommand({
        Bucket: this.S3BucketName,
        Key: uploadFileInfo.filename,
        Body: compressedBuffer
      })
    );

    if (S3Response.$metadata.httpStatusCode !== 200) throw new UnsupportedMediaTypeException();
  }

  validateNumberOfDifferentMediaTypes(files: Array<Express.Multer.File>) {
    let numberOfVideoFiles = 0;
    let numberOfImageFiles = 0;

    for (const uploadedFile of files) {
      const placeholder = uploadedFile.mimetype.split('/');

      if (imageExtensionsWhitelist.includes(placeholder[placeholder.length - 1])) numberOfImageFiles += 1;
      else if (videoExtensionsWhitelist.includes(placeholder[placeholder.length - 1])) numberOfVideoFiles += 1;
    }
    
    if (numberOfVideoFiles > 1 && files.length > 1) {
      throw new BadRequestException("only 1 video or 4 photos for upload")
    }
  }
}