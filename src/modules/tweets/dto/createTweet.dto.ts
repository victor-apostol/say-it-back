import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTweetDto {
  @IsString()
  text_body: string; // files ???

  @IsOptional()
  @IsNumber()
  parent_id?: number;
}