import { IsNumberString, IsOptional, isNumberString } from "class-validator";

export class TweetPaginationDto {
  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  count?: number;
}