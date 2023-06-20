import { IsString, Length } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @Length(1, 1001)
  text_body: string;
}