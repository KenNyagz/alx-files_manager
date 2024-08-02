import redis from 'redis';
import { promisify } from 'utils';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => console.error(err));

    this.getASync = promisify(this.client).bind(this.client);
    this.setAsync = promisify(this.client).bind(this.client);
    this.delAsync = promisify(this.client).bind(this.client);
  }

  function isAlive() {
    this.client.connected;
  }

  async get(key) {
    try {
      return await this.getASync(key);
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await setAsync(key, value, 'EX', duration);
    } catch (err) {
      console.error(err);
    }
  }

  async del(key) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.error(err);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
