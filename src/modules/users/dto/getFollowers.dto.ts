import { IsString, MaxLength } from "class-validator";

export class GetFollowersDto {
  @IsString()
  @MaxLength(16)
  targetUsername: string;
}