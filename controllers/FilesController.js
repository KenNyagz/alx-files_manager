import fs from 'fs';
import path from 'path';
import { uuidv4 } from 'uuid';
import mime from 'mime-types';
import imageThumbnail from 'image-thumbnail';
import Bull from 'bull';
import redis from '../utils/redis';
import dbClient from '../utils/db';

const sizes = [500 ,250, 100];

class FilesController {
  static async postUpload(req, res) {
    /*const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const tokenKey = `auth_${token}`;

    // Retrieve user ID from redis
    const userId = await redisClient.get(tokenKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }*/

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

    /*const db = dbClient.client.db(dbClient.dbName);
    const filesCollection = db.collection('files');*/

    // Validate parentID
    /*if (parentId !== 0) {
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
    };*/

    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let filePath = null;
    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manger';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const fileUuid = uuidv4();
      filePath = path.join(folderPath, fileUuid);

      const decodedData = Buffer.from(data, 'base64');
      await fs.promises.writeFile(filePath, decodedData);
    }

    const db = dbClient.client.db(dbClient.dbName);
    const filesCollection = db.collection('files');

    /*if (type === 'folder') {              // if type is a folder, add to DB
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
    return res.status(201).json({ id: result.insertedId, ...newFile });*/
    const fileDocument = {
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath: filePath || null,
    };

    const result = await filesCollection.insertOne(fileDocument);
    const fileId = result.insertedId.toString();

    if (type === 'image') {
      fileQueue.add({ userId, fileId });
    }

    res.status(201).json({
      id: fileId,
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath: filePath || null,
    });
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


  static async getFile(req, res) {
    const authHeader = req.headers.authorization;
    const { id } = req.params;
    const { size } = req.query;

    const db = dbClient.client.db(dbClient.dbName);
    const filesCollection = db.collection('files');

    const user = await authentication(req, res);
    if (!user) return;

    const file = await filesCollection.findOne({ _id: dbClient.client.ObjectId(id) });
    if (!file) { return res.status(404).json({ error: 'Not found' });

    if (!file.isPublic && file.userId !== user.id) {
      return  res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    let filePath = file.localPath;
    if (size & sizes.includes(Number(size))) {
      filePath = `${filePath}_${size}`;
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    const fileStream = fs.createReadStream(file.localPath);
    fileStream.pipe(res);

    /*if (authHeader || authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const tokenKey = `auth_${token}`;
      const userId = await redisClient.get(tokenKey);

      if (!userId) {
        return res.status(404).json({ error: 'Not found' });
      }
      const file = await filesCollection.findOne({ _id: dbClient.client.ObjectId(id) });

      if (!file) {
        return res.status(404).json({ error: 'Not Found' });
      }

      // Check file ownership or visibility
      if(!file.isPublic && file.userId !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Handle folder type
      getFileData    if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      // File handling
      if (!file.localPath || !fs.existsSync(file.localPath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Set the MIME type and return file content
      const mimeType = mime.lookup(file.name) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      const fileStream = fs.createReadStream(file.localPath);
      fileStream.pipe(res);

    } else {
      // if no Authorization header, handle as if file is public
      const file = await fileCollection.findOne({ _id: dbClient.client.ObjectId(id) });

      if (!file || !file.isPublic) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      if (!file.localPath || !fs.existsSync(file.localPath)) {
        return res.status(404).json({ error : 'Not found' });
      }

      const mimeType = mime.lookup(file.name) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      const fileStream = fs.createReadStream(file.localPath);
      fileStream.pipe(res);
    }*/
  }
}

export default FilesController;
