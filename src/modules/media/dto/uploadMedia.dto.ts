import { IsEnum, IsNumberString} from "class-validator";
import { MediaTypes } from "../constants";

export class UploadMediaDto {
  @IsNumberString()
  tweetId: number;
  
  @IsEnum(MediaTypes)
  media_type: MediaTypes;
}