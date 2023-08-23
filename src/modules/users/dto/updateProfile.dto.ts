import { IsBooleanString, IsOptional, IsString, Length } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(1, 120)
  bio: string;

  @IsOptional()
  @IsString()
  @Length(3, 32)
  name: string;

  @IsBooleanString()
  defaultBackground: boolean;
}