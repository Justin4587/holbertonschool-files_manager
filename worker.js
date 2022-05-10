import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import Bull from 'bull';
import { ObjectId } from 'mongodb';

import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');
const userQueue = new Bull('userQueue');

const createImageThumbnail = async (path, options) => {
  try {
    const thumbnail = await imageThumbnail(path, options);
    const underScore = '_';
    const imagePath = path + underScore + options.width;
    await fs.writeFileSync(imagePath, thumbnail);
  } catch (Err) {
    console.log(Err.message);
  }
};

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;
  if (!fileId) throw Error('Missing fileId');
  if (!userId) throw Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });
  if (!file) throw Error('File not found');

  createImageThumbnail(file.localPath, { width: 500 });
  createImageThumbnail(file.localPath, { width: 250 });
  createImageThumbnail(file.localPath, { width: 100 });
});

userQueue.process(async (job) => {
  const { userId, email } = job.data;
  if (!email) throw Error('Missing email');
  if (!userId) throw Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({ userId: ObjectId(userId) });
  if (!file) throw Error('User not found');
  const wel = 'Welcome ';
  console.log(wel + email);
});
