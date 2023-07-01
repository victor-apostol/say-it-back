import { IsEnum, IsNumber, Min } from "class-validator";

export class CreateLikeDto {  
  @IsNumber()
  @Min(0)
  tweetId: number;
}