import { IsEmail, IsString, MaxLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  @MaxLength(128)
  email: string;

  @IsString()
  @MaxLength(128)
  password: string;
}