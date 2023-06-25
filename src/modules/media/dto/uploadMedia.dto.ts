import { IsEnum, IsNumberString} from "class-validator";
import { MediaTypes } from "../constants";
import { TargetsTypes } from "@/utils/global.constants";

export class UploadMediaDto {
  @IsNumberString()
  targetId: number;
  
  @IsEnum(MediaTypes)
  media_type: MediaTypes;

  @IsEnum(TargetsTypes)
  target_type: TargetsTypes;
}