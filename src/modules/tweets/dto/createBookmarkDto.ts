import { IsNumber, Min } from "class-validator";

export class CreateBookmarkDto {
  @IsNumber()
  @Min(0)
  tweetId: number; 
}