import { Controller, Sse } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('/sse')
  async handleUserNotificationSession() {
    const id = 5; // get user Id, and i saw i can maybe somewhere store Subject() instances
    return this.notificationsService.handleNotification(5);
  }
}
