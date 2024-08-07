import fs from 'fs';
import path from 'path';
import { uuidv4 } from 'uuid';
import mime from 'mime-types';
import redis from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const tokenKey = `auth_${token}`;

    // Retrieve user ID from redis
    const userId = await redisClient.get(tokenKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: "Missing data" });
    }

    const db = dbClient.client.db(dbClient.dbName);
    const filesCollection = db.collection('files');

    // Validate parentID
    if (parentId !== 0) {
      const parentFile = await filesCollection.findOne({ _id: dbClient.client.ObjectId(parentId) });

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const newFile = {
      userId: userId,
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : dbClient.client.ObjectId(parentId),
    };

    // if type is a folder, add to DB
    if (type === 'folder') {
      const result = await filesCollection.insertOne(newFile);
      return res.status(201).json({ id: result.insertedId, ...newFile });
    }

    // Otherwise store the file locally
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fileUuid = uuidv4();
    const localPath =  path.join(floderPath, fileUuid);

    // Ensure path exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Decode the Base64 data and write to file
    const fileData = Buffer.from(data, 'base64');
    fs.writeFileSync(localPath, fileData);

    newFile.localPath = localPath;

    // Add to DB
    const result = await filesCollection.insertOne(newFile);
    return res.status(201).json({ id: result.insertedId, ...newFile });
  }


  static async getShow(req,res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = AuthHeader.split(' ')[1];
    const tokenKey = `auth_${token}`;

    const userId = await redisClient.get(tokeKey); //Get Id from redis

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const db = dbClient.client.db(dbClient.dbName);
    const filesCollection = db.collection('files');

    const file = await filesCollection.findOne({ _id: dbClient.client.ObjectId(id), userId });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(file);
  }


  static async getIndex(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeaer.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const tokenKey = `auth_${token}`;

    const userId = await redisClient.get(tokenKey);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = 0, page = 0 } = req.query;
    const db = dbClient.client.db(dbClient.dbName);
    const filesCollection = db.collection('files');

    // Set up pagination
    const pageSize = 20;
    const skip = parseInt(page) * pageSize;

    // Retrieve file documents
    const files = await filesCollection.find({
      userId,
      parentId: parentId === '0' ? 0 : dbClient.client.ObjectId(parentId),
    }).skip(skip).limit(pageSize).toArray();

    return res.status(200).json(files);
  }


  static async putPublish(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorzed" });
    }

    const token = authHeader.split(' ')[1];
    const tokenKey = `auth_${token}`;
    const user_d = await redisClient.get(tokenKey);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const db = dbClient.client.db(dbClient.dbName);
    const filesCollection = db.collection('files');

    const file = await filesCollection.findOne({ _id: dbClient.client.ObjectId(id), userId });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await filesCollection.updateOne({ _id: dbClient.client.ObjectId(id) }, {$set: { isPublic: true}});
    const updatedFile = await filesCollection.findOne({ _id: dbClient.client.ObjectId(id), userId });
    return res.status(200).json(updatedFile);
  }


  static async putUnpublish(req, res) {
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

    const { id } = req.params;
    const db = dbClient.client.db(dbClient.dbName);
    const filesCollection = db.collection('files');

    const file = await filesCollection.findOne({ _id: dbClient.client.ObjectId(id), userId });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await filesCollection.updateOne({ _id: dbClient.client.ObjectId(id) }, { $set: { isPublic: false } });

    const updatedFile = await filesCollection.findOne({ _id: dbClient.client.ObjectId(id), userId });

    return res.status(200).json(updatedFile);

  }
}

export default FilesController;
