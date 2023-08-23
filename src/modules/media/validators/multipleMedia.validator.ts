import { FileValidator } from "@nestjs/common";
import { ValidationOptions } from "../types/validators.types";

export class MultipleMediaValidator extends FileValidator<ValidationOptions> {
  private errorMessage = "Error while trying to upload the file";
  private readonly extensionsWhitelist = ['jpg', 'jpeg', 'mp3', 'mp4', 'png', 'svg'];
  private readonly imageExtensionsWhitelist = ['jpg', 'jpeg', 'png', 'svg'];
  private readonly videoExtensionsWhitelist = ['mp3', 'mp4'];

  constructor(protected readonly validationOptions: ValidationOptions) {
    super(validationOptions);
  }

  public async isValid(files: { [k: string]: Array<Express.Multer.File> }): Promise<boolean> {
    for (const key of Object.keys(files)) {
      const file = files[key][0];
      const filenameSplit = file.originalname.split('.');
    
      if (filenameSplit.length !== 2 || !this.extensionsWhitelist.includes(filenameSplit[1])) {
        this.errorMessage = `Invalid file type it must be of types ${this.extensionsWhitelist.join(',')}`;

        return false; 
      } else if (!this.imageExtensionsWhitelist.includes(filenameSplit[1]) && file.size >= this.validationOptions.imageMaxSize) {
        this.errorMessage = `file type it must be of types ${this.imageExtensionsWhitelist.join(',')} and size lower than ${this.validationOptions.imageMaxSize}`;

        return false; 
      } else if (!this.videoExtensionsWhitelist.includes(filenameSplit[1]) && file.size >= this.validationOptions.videoMaxSize){
        this.errorMessage = `file type it must be of types ${this.videoExtensionsWhitelist.join(',')} and size lower than ${this.validationOptions.videoMaxSize}`;

        return false; 
      }  
    }

    return true;
  }

  public buildErrorMessage(): string {
    return this.errorMessage;
  }
}