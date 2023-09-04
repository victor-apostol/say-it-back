import { IsEnum, IsNumberString} from "class-validator";
import { MEDIA_TYPES } from "../constants";

export class UploadMediaDto {
  @IsNumberString()
  tweetId: number;
  
  @IsEnum(MEDIA_TYPES)
  media_type: MEDIA_TYPES;
}