import { IsString } from "class-validator";

export class CreateTweetDto {
  @IsString()
  text_body: string; // files ???
}