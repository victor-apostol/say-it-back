import { Transform } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class TweetPaginationDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  offset?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  take?: number;
}