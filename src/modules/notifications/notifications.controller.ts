import { Controller, Get, Query, Sse, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { User } from "../users/entities/user.entity";
import { SseGuard } from "../auth/guards/sse.guard";
import { JwtGuard } from "../auth/guards/auth.guard";
import { Notification } from "./notification.entity";
import { PaginationDto } from "@/utils/global/pagination.dto";

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtGuard)
  @Get("")
  async getNotifications(
    @AuthUser() authUser: User, 
    @Query() query: PaginationDto 
  ): Promise<{ notifications: Array<Notification>, hasMore: boolean }> {
    return this.notificationsService.userNotifications(authUser, query.offset, query.take);
  }

  @UseGuards(SseGuard)
  @Sse('sse')
  async handleUserNotificationSession(@AuthUser() user: User) {
    return this.notificationsService.getSseObservable(user.id);
  }
}
