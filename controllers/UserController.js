import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class UserController {
  static async getMe(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const tokenKey = `auth_${token}`;

    const userId = await redisClient.get(tokenKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = dbClient.client.db(dbClient.dbName);
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: dbClient.client.ObjectId(userId) });

    if(!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ id: user._id, email: user.email });
  }
}

export default  UserController;
