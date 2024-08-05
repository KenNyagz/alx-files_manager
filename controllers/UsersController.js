import crypto from 'crypto';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({error: 'Missing email'});
    }

    if (!password) {
      return res.status(400).json({error: 'Missing password'});
    }

    const db = dbClient
    const usersCollection = db.collection('user');
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({error: "Already exist"});
    }

    const sha1Pssword = crypto.creatHash('sha1').update(password).digest('hex');

    const newUser = { email, password: sha1Password};
    const result = await usersCollection.insertOne(newUser);

    const userId = result.insertedId;
    return res.status(201).json({ id: userId, email });
  }
}

export default UsersController;
