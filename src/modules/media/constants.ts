export enum MEDIA_TYPES {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio'
}

export enum MEDIA_TYPES_SIZES {
  AVATAR = 110,
  BACKGROUND = 1080,
  MEDIA = 1080
}

export const maxFilesCount = 4;
export const imageMaxSizeInBytes = 5242880;
export const videoMaxSizeInBytes =  31457280;
export const messageServicesSideError = "Services side error, could'not upload the files";

export const extensionsWhitelist = ['jpg', 'jpeg', 'mp3', 'mp4', 'png', 'svg'];
export const imageExtensionsWhitelist = ['jpg', 'jpeg', 'png', 'svg'];
export const videoExtensionsWhitelist = ['mp3', 'mp4'];