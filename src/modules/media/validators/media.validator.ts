import { FileValidator } from "@nestjs/common";
import { ValidationOptions } from "../types/validators.types";

export class MediaValidator extends FileValidator<ValidationOptions> {
  private errorMessage = "Error while trying to upload the file";

  constructor(protected readonly validationOptions: ValidationOptions) {
    super(validationOptions);
  }

  public async isValid(file: Express.Multer.File): Promise<boolean> {
    const filenameSplit = file.originalname.split('.');

    if (filenameSplit.length !== 2) {
      this.errorMessage = `Invalid file, [too many extensions], please choose another file`;

      return false;
    } 

    for (const fileTypeSettings of this.validationOptions.whitelist) {
      if (!fileTypeSettings.allowedExtensions.includes(filenameSplit[1]) && file.size >= fileTypeSettings.mimeTypeMaxAllowedSizeBytes){
        this.errorMessage = 
          `file type it must be of types [${fileTypeSettings.allowedExtensions.join(',')}] and size lower than ${fileTypeSettings.mimeTypeMaxAllowedSizeBytes}b`;

        return false; 
      }  
    }

    return true;
  }

  public buildErrorMessage(): string {
    return this.errorMessage;
  }
}