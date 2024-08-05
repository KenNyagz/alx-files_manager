import express from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import redisClient  from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({error: 'Unaothorized'});
    }
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const sha1Password = crypto.createHash('sha1').update(password).digest('hex')

    const db = dbClient.client.db(dbClient.dbName);
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email, password: sha1Password });

    if (!user) {
      return res.status(401).json({error: 'Unauthorized'});
    }
    const token = uuidv4();
    const tokenKey = `auth_${token}`;

    await redisClient.set(tokenKey, user._id.toString(), 86400);
    return res.status(200).json({ token });
  }


  static async getDisconnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const tokenKey = `auth_${token}`;

    await redisClient.del(tokenKey);
    return res.status(204).send();
  }
}

export default AuthController;
