import { User } from "@/modules/users/entities/user.entity";
import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const AuthUser = createParamDecorator((data: any, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  return request?.user as User;
});