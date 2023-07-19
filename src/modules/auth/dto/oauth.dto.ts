import { IsEmail, IsString, MaxLength } from "class-validator";

export class oAuthDto {
  @IsEmail()
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