export const tweetsPath='tweets';
export const TWEET_PAGINATION_TAKE = 10;
export const NOTIFICATIONS_PAGINATION_TAKE = 15;
export const TWEET_LIKES_PAGINATION_TAKE = 25;
export const TWEET_REPLIES_USERS_PAGINATION_TAKE = 25;

export const tweetPropertiesSelect = {
  select: { 
    likes: {
      id: true,
      user: {
        id: true,
        username: true
      }
    },
    bookmarks: {
      id: true,
      user: {
        id: true,
        username: true
      }
    }
  },
}