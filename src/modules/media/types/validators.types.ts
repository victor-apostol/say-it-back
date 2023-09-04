import { MEDIA_TYPES } from "../constants";

export type ValidationOptions = {
  whitelist: Array<{
    allowedExtensions: Array<string>;
    mimeTypeMaxAllowedSizeBytes: number;
  }>
}

export type UploadFileInfo = { 
  filename: string; 
  fileLocation: string; 
  fileExtension: string;
  mediaType: MEDIA_TYPES; 
}