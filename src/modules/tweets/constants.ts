export const tweetsPath='tweets';
export const TWEET_PAGINATION_TAKE = 10;

export const tweetPropertiesSelect = {
  select: { 
    user: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      avatar: true,
    },
    likes: {
      id: true,
      user: {
        id: true,
      }
    }
  },
}