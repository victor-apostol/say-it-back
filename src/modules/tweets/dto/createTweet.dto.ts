import { IsOptional, IsString } from "class-validator";

export class CreateTweetDto {
  @IsString()
  text_body: string;

  @IsOptional()
  @IsString()
  media?: string;
}