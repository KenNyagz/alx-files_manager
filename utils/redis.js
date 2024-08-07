import redis from 'redis';

class RedisClient {
  constructor () {
    this.client = redis.createClient({
      host: 'localhost',
      port: 6379
    });

    this.client.on('error', (err) => console.error(err));
  }

  isAlive () {
    return this.client.connected;
  }

  async get (key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (error, value) => {
        if (error) { reject(error); } else { resolve(value); }
      });
    });
  }

  async set (key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, duration, value, (error, result) => {
        if (error) { reject(error); } else { resolve(result); }
      });
    });
  }

  async del (key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (error, result) => {
        if (error) { reject(error); } else { resolve(result); }
      });
    });
  }
}

const redisClient = new RedisClient();
export default redisClient;
