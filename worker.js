import Bull from 'bull';
import fs from 'fs';
import path from 'path';
import imageThumbNail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job, done) => {
  const { userId, fileId } = job.data;

  if (!fileId) {  throw new Error('Missing fileId'); }
  if (!userId) { throw new Error('Missing UserId'); }

  const db = dbClient.client.db(dbClient.dbName);
  const filesCollection = db.collection('files');

  const fileDocument = await filesCollection.findOne({ _id: dbClient.client.ObjectId(fileId), userId });
  if (!fileDocument) { throw new Error("File not found"); }
  if (fileDocument.type !== 'image' ) { throw new Error('Not an image file'); }

  const sizes = [500, 250, 100];
  const { localPath } = fileDocument;

  try {
    for (const size of sizes) {
      const options = { width: size };      
      const thumbnail = await imageThumbnail(localPath, options);
      const thumbnailPath = `${local_path}_${size}`;
      await fs.promises.writeFile(thumbnailPath, thumbnail);
    }
  } catch (err) {
    console.error('Error generating thumbnails:', err);
    throw err;
  }
  done();
});
