import { IsEnum, IsNumber, Min } from "class-validator";
import { LikeableTargets } from "@/modules/likes/constants";

export class CreateLikeDto {  
  @IsNumber()
  @Min(0)
  targetId: number;

  @IsEnum(LikeableTargets)
  likeable_target: keyof typeof LikeableTargets;
}