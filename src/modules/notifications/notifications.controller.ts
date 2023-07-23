import { Controller, Sse, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { AuthUser } from "@/utils/decorators/authUser.decorator";
import { User } from "../users/entities/user.entity";
import { SseGuard } from "../auth/guards/sse.guard";

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(SseGuard)
  @Sse('sse')
  async handleUserNotificationSession(@AuthUser() user: User) {
    return this.notificationsService.getSseObservable(user.id);
  }
}

// return getSseObservable.pipe(
//   finalize(() => { console.log("CLOSED"); return this.notificationsService.removeConnection(user.id) })// Use finalize to remove the user ID from the connectionsPool when the observable completes
// );