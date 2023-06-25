import { Body, Controller, ParseFilePipe, Post, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { JwtGuard } from "@/modules/auth/guards/auth.guard";
import { fileMaxSizeInKb, maxFilesCount } from "@/modules/media/constants";
import { StorageService } from "@/modules/media/services/storage.service";
import { MediaValidator } from "@/modules/media/validators/media.validator";
import { IJwtPayload } from "@/modules/auth/interfaces/jwt.interface";
import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { UploadMediaDto } from "../dto/uploadMedia.dto";

@UseGuards(JwtGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly storageService: StorageService) {}

  @Post('')
  @UseInterceptors(FilesInterceptor('files[]', maxFilesCount, { limits: { files: maxFilesCount } }))
  async uploadMedia(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MediaValidator({ maxSize: fileMaxSizeInKb })
        ]
      })
    ) files: Array<Express.Multer.File>, 
  @AuthUser() user: IJwtPayload, 
  @Body() body: UploadMediaDto): Promise<void> {
    await this.storageService.uploadFileToS3Bucket(files, user.id, body.targetId, body.media_type, body.target_type);
  }
}

