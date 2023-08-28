import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString, Length } from "class-validator";

export class SearchUsersDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  size?: number;

  @IsString()
  @Length(1, 32)
  query: string;
}