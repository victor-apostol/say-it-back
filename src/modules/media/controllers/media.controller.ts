import { Controller, UseGuards } from "@nestjs/common";
import { JwtGuard } from "@/modules/auth/guards/auth.guard";

@UseGuards(JwtGuard)
@Controller('media')
export class MediaController {}

