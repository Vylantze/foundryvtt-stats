const env = { ...process.env };

class Environment {
  public static STATS_URL = env.REACT_APP_STATS_URL ?? 'https://vylantze-foundry-bucket.s3.ap-southeast-1.amazonaws.com/data/stats.json'
}

export default Environment
