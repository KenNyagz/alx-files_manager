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
}

export default FilesController;
