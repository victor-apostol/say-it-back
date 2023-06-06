import { IsEmail, IsString, Length, MaxLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @MaxLength(32)
  first_name: string;

  @IsString()
  @MaxLength(32)
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 128)
  password: string;
}