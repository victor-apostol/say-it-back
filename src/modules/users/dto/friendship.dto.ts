import { IsEnum, IsNumber, Min } from "class-validator";
import { FriendshipActions } from "../interfaces/friendship.interface";

export class FriendshipDto {
  @IsNumber()
  @Min(0)
  targetUserId: number;
}

export class ActionsDto {
  @IsEnum(FriendshipActions)
  action: FriendshipActions;
}
