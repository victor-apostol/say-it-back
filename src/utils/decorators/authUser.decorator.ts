import { User } from "@/modules/users/entities/user.entity";
import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { IJwtPayload } from "src/modules/auth/interfaces/jwt.interface";

export const AuthUser = createParamDecorator((data: any, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  return request?.user as User;
});