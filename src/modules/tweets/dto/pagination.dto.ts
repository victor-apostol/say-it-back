import { Transform } from "class-transformer";
import { IsNumber, IsNumberString, IsOptional } from "class-validator";

export class TweetPaginationDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  offset?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  count?: number;
}