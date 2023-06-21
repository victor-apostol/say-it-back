// import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, Repository } from "typeorm";
// import { Like } from "@/modules/likes/entities/like.entity";
// import { Tweet } from "@/modules/tweets/entities/tweet.entity";

// @EventSubscriber()
// export class LikeEventSubscriber implements EntitySubscriberInterface<Like> {
//   listenTo(): string | Function {
//     return Like;
//   }

//   async afterInsert(event: InsertEvent<Like>) {
//     console.log("EVENT", event)
//     const tweetRepository = event.manager.getRepository(Tweet);
//     const tweet = event.entity.tweet;

//     await this.updateTweetLikeCount(tweetRepository, tweet);
//   }

//   async afterRemove(event: RemoveEvent<Like>) {
//     const tweetRepository = event.manager.getRepository(Tweet);
//     const tweet = event?.entity.tweet;

//     await this.updateTweetLikeCount(tweetRepository, tweet);
//   }

//   private async updateTweetLikeCount(tweetRepository: Repository<Tweet>, tweet: Tweet) {
//     tweet.like_count += 1;
  
//     await tweetRepository.save(tweet);
//   }
// }
