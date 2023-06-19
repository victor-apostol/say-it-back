import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { IJwtPayload } from "src/modules/auth/interfaces/jwt.interface";
import { User } from "src/modules/users/entities/user.entity";

export const AuthUser = createParamDecorator((data: any, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  return request?.user as IJwtPayload;
});