import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength } from "class-validator";

export class oAuthDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  @MaxLength(128)
  email: string;

  @IsString()
  @MaxLength(29)
  first_name: string;

  @IsString()
  @MaxLength(29)
  last_name: string;

  @IsString()
  @MaxLength(201)
  avatar: string;
}