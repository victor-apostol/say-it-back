import { defaultUserAvatarPath } from "@/utils/global.constants";
import { Exclude } from "class-transformer";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 32 })
  first_name: string;

  @Column({ type: 'varchar', length: 32 })
  last_name: string;

  @Column({ type: 'varchar', length: 128, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 128, default: defaultUserAvatarPath})
  avatar: string; 
  
  @Exclude()
  @Column({ type: 'varchar', length: 128})
  password: string;
  
  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}