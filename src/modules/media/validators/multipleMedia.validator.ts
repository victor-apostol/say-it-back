import { FileValidator } from "@nestjs/common";
import { ValidationOptions } from "../types/validators.types";

export class MultipleMediaValidator extends FileValidator<ValidationOptions> {
  private errorMessage = "Error while trying to upload the file";

  constructor(protected readonly validationOptions: ValidationOptions) {
    super(validationOptions);
  }

  public async isValid(files: { [k: string]: Array<Express.Multer.File> }): Promise<boolean> {
    for (const key of Object.keys(files)) {
      const file = files[key][0];
      const filenameSplit = file.originalname.split('.');
    
      if (filenameSplit.length !== 2) {
        this.errorMessage = 'Invalid file, [too many extensions], please choose another file';

        return false; 
      } 
    
      for (const fileTypeSettings of this.validationOptions.whitelist) {
        if (!fileTypeSettings.allowedExtensions.includes(filenameSplit[1]) && file.size >= fileTypeSettings.mimeTypeMaxAllowedSizeBytes){
          this.errorMessage = 
            `file type it must be of types [${fileTypeSettings.allowedExtensions.join(',')}] and size lower than ${fileTypeSettings.mimeTypeMaxAllowedSizeBytes}b`;
  
          return false; 
        }  
      }
    }

    return true;
  }

  public buildErrorMessage(): string {
    return this.errorMessage;
  }
}