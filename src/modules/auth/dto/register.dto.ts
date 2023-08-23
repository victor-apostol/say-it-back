import { IsEmail, IsString, Length, MaxLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @MaxLength(32)
  name: string;

  @IsString()
  @MaxLength(32)
  username: string;

  @IsEmail()
  @MaxLength(128)
  email: string;

  @IsString()
  @Length(8, 128)
  password: string;
}