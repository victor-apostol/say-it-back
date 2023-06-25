import { IsEnum, IsNumber, Min } from "class-validator";
import { TargetsTypes } from "@/utils/global.constants";

export class CreateLikeDto {  
  @IsNumber()
  @Min(0)
  targetId: number;

  @IsEnum(TargetsTypes)
  target: TargetsTypes;
}