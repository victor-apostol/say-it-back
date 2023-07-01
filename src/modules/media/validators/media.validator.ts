import { FileValidator } from "@nestjs/common";
import { fileMaxSizeInKb } from "../constants";

type ValidationOptions = {
  maxSize: number;
}

export class MediaValidator extends FileValidator<ValidationOptions> {
  private errorMessage = "Error while trying to upload the file";
  private readonly extensionsWhitelist = ['jpg', 'jpeg', 'mp3', 'mp4', 'png', 'svg'];

  constructor(protected readonly validationOptions: ValidationOptions) {
    super(validationOptions);
  }

  public async isValid(file: Express.Multer.File): Promise<boolean> {
    if (file.size > this.validationOptions.maxSize) {
      this.errorMessage = `File size is too big must be at max ${fileMaxSizeInKb} KB`;

      return false;
    }

    const filenameSplit = file.originalname.split('.');

    if (filenameSplit.length !== 2 || !this.extensionsWhitelist.includes(filenameSplit[1])) {
      this.errorMessage = `Invalid file type it must be of type png, jpg/jpeg, mp3/mp4, svg`;

      return false;
    }
    
    return true;
  }

  public buildErrorMessage(): string {
    return this.errorMessage;
  }
}