import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../users/entities/user.entity";
import { NotificationTypes } from "./notification.types";

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  text: string;

  @Column({ type: 'enum', enum: NotificationTypes })
  type: NotificationTypes;

  @Column({ type: 'date', default: () => 'CURRENT_TIMESTAMP' })
  created_at: string;

  @ManyToOne(() => User)
  user: User;
}