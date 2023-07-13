export const tweetsPath='tweets';
export const TWEET_PAGINATION_TAKE = 10;

export const tweetPropertiesSelect = {
  select: { 
    likes: {
      id: true,
      user: {
        id: true,
      }
    }
  },
}