import { BadRequestException, Injectable, OnModuleDestroy } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Subject } from "rxjs";
import { DataSource, Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { Notification } from "@/modules/notifications/notification.entity";
import { FriendshipActions } from "../interfaces/friendship.interface";
import { messageUnableToUpdateProfile, messageUserNotFound } from "@/utils/global.constants";
import { UpdateProfileDto } from "../dto/updateProfile.dto";
import { FollowNotificationEvent } from "@/modules/notifications/types/notification_events.types";
import { NotificationTypes } from "@/modules/notifications/types/notification.types";
import { StorageService } from "@/modules/media/services/storage.service";
import { IUpdateProfileResponse } from "../interfaces/updateProfileResponse.interface";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UsersService implements OnModuleDestroy {
  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  @InjectRepository(Notification)
  private readonly notificationRepository: Repository<Notification>;
  
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource, 
    private readonly storageService: StorageService,
    private readonly cfgService: ConfigService
  ) {}

  private readonly friendshipAction$ = new Subject<FollowNotificationEvent>();
  private readonly defaultBackgroundFilename = this.cfgService.get("DEFAULT_BACKGROUND_IMAGE");
  private readonly defaultBackgroundPath = `https://${this.cfgService.get("AWS_S3_BUCKET")}.s3.amazonaws.com/${this.defaultBackgroundFilename}`;

  async findUser(id: number): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }
 
  async friendshipAction(authUser: User, targetUserId: number, action: string) {
    if (authUser.id === targetUserId) throw new BadRequestException("You can't follow you're self");

    const targetUser = await this.userRepository.findOne({ 
      where: {
        id: targetUserId 
      }, 
      relations: ['followed']
    });
    if (!targetUser) throw new BadRequestException(messageUserNotFound);  

    const friendship = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('friendships', 'friendship', 'user.id = friendship.followed_id') 
      .where('friendship.following_id = :userId AND friendship.followed_id = :targetUserId', { 
        userId: authUser.id, targetUserId: targetUserId
      })
      .getOne();

    if (action == FriendshipActions.CREATE) {
      if (friendship) throw new BadRequestException("You are already following this user");

      const userWithRelations = await this.userRepository.findOne({ 
        where: { 
          id: authUser.id
        }, 
        relations: ['following']
      });

      if (!userWithRelations) throw new BadRequestException(messageUserNotFound);
      
      userWithRelations.following.push(targetUser);
      targetUser.followed.push(userWithRelations);

      await this.userRepository.save(userWithRelations);

      const eventPayload = { 
        event: NotificationTypes.FOLLOW, 
        authUserId: authUser.id, 
        eventTargetUserId: targetUser.id 
      }

      const newNotification = this.notificationRepository.create({
        type: NotificationTypes.FOLLOW,
        action_user: { id: authUser.id },
        target_user: { id: targetUser.id }
      })

      this.eventEmitter.emit('new.notification', { 
        eventPayload, 
        subject$: this.friendshipAction$,
        repository: this.notificationRepository,
        entity: newNotification
      });
    } else if (action == FriendshipActions.DESTROY) {
      if (!friendship) throw new BadRequestException("You are not yet following this user");

      targetUser.followed = targetUser.followed.filter(user => {
        return user.id !== authUser.id
      });

      await this.userRepository.save(targetUser);
    }
  }

  async getUserProfileInfo(
    targetUserId: number, 
    authUser: User
  ): Promise<{user: User, followingsCount: number, followersCount: number, amIfollowing?: boolean }> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.followed", "followed")
      .leftJoinAndSelect("user.following", "following")
      .where("user.id = :userId", { userId: targetUserId })
      .select(["user","following.id","followed.id"])
      .getOne();

    if (!user) throw new BadRequestException(messageUserNotFound);

    const returnObject = {
      user,
      followingsCount: user.following.length, 
      followersCount: user.followed.length,
    };
    
    const amIfollowing = user.followed.some(follower => follower.id === authUser.id);

    return targetUserId !== authUser.id 
      ? {...returnObject, amIfollowing: amIfollowing} 
      : returnObject; 
  }
  
  getFriendshipActionsObservable() {
    return this.friendshipAction$.asObservable();
  }

  onModuleDestroy() {
    this.friendshipAction$.complete();
  }

  async followsRecomandation(user: User): Promise<Array<User>> {
    const authUser = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.following", "following")
      .where("user.id = :userId", { userId: user.id })
      .select(["user.id","following.id"])
      .getOne();

    if (!authUser) throw new BadRequestException(messageUserNotFound);

    const userWithFollowingsOfFollowings = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.following", "following")
      .leftJoinAndSelect("following.following", "followingsOfFollowings")
      .where("user.id = :userId", { userId: user.id })
      .andWhere('followingsOfFollowings.id NOT IN (:...followedIds)', { 
        followedIds: [...authUser.following.map((followingUser) => followingUser.id), authUser.id]
      })
      // .orderBy('RANDOM()')
      .getOne()

    const flattenedUsers = userWithFollowingsOfFollowings
      ? Array.from(new Set(userWithFollowingsOfFollowings.following.flatMap((followedUser) => followedUser.following)))
      : await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect("user.following", "following")
        .leftJoinAndSelect('user.followed', 'followed')
        .where('following.id NOT IN (:...followedIds)', { 
          followedIds: [...authUser.following.map((followingUser) => followingUser.id), authUser.id]
        })
        .select('user')
        .orderBy('COUNT(followed.id)', 'DESC')
        .groupBy('user.id')
        .limit(3)
        .getMany();

    return flattenedUsers;
  }

  async updateProfile(
    authUser: User, 
    body: UpdateProfileDto,
    files: { newAvatar?: Express.Multer.File, newBackground?: Express.Multer.File } = {}
  ): Promise<IUpdateProfileResponse> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const { defaultBackground, ...restBody } = body;

    try {
      if (files.newAvatar) {
        const uploadFileInfo = this.storageService.getUploadFileInfo(files.newAvatar[0]);
        
        await this.storageService.uploadFileToS3Bucket(files.newAvatar[0], uploadFileInfo.filename);

        restBody["avatar"] = uploadFileInfo.filename;
      } else if (files.newBackground) {
        const uploadFileInfo = this.storageService.getUploadFileInfo(files.newBackground[0]);

        await this.storageService.uploadFileToS3Bucket(files.newBackground[0], uploadFileInfo.filename);

        restBody["background"] = uploadFileInfo.filename;
      } else if (body.defaultBackground && authUser.background !== this.defaultBackgroundPath) {
        restBody["background"] = this.defaultBackgroundFilename;
      }

      if (Object.keys(restBody).length > 0) {
        const result = await queryRunner.manager.update(User, { id: authUser.id }, {
          ...restBody
        });

        if (result.affected === 0) throw new BadRequestException(messageUnableToUpdateProfile);
      }

      await queryRunner.commitTransaction(); 
      
      return {
        name: body.name || authUser.name,
        bio: body.bio || authUser.bio,
      }
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err?.message);
    } finally {
      await queryRunner.release();
    }
  }
}

