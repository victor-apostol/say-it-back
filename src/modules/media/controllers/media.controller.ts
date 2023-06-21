import { BadRequestException, Controller, ParseFilePipe, Post, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { JwtGuard } from "@/modules/auth/guards/auth.guard";
import { fileMaxSizeInKb, maxFilesCount } from "@/modules/media/constants";
import { StorageService } from "@/modules/media/services/storage.service";
import { MediaValidator } from "@/modules/media/validators/media.validator";

@UseGuards(JwtGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly storageService: StorageService) {}

  @Post('')
  @UseInterceptors(FilesInterceptor('files', maxFilesCount))
  async uploadMedia(@UploadedFiles(
    new ParseFilePipe({
      validators: [
        new MediaValidator({ maxSize: fileMaxSizeInKb })
      ]
    })
  ) files: Array<Express.Multer.File>): Promise<void> {
    await this.storageService.uploadFileToS3Bucket(files);
  }
}