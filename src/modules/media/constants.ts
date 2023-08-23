export enum MediaTypes {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio'
}

export const maxFilesCount = 4;
export const imageMaxSizeInKb = 500000;
export const videoMaxSizeInKb = 3000000;
export const messageServicesSideError = "Services side error, could'not upload the files"