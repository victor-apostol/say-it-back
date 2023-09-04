import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  @MaxLength(128)
  email: string;

  @IsString()
  @MaxLength(128)
  password: string;
}