import { IsNumberString, IsOptional, IsString } from "class-validator";

export class CreateTweetDto {
  @IsString()
  text_body: string; 

  @IsOptional()
  @IsNumberString()
  parent_id: string | null;
}