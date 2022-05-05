import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import dbClient from '../utils/db';
import userIdEmail from '../utils/userUtils';

class FilesController {
  static async postUpload(req, res) {
    const userId = await userIdEmail(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name,
      type,
      data,
      isPublic = false,
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type) return res.status(400).json({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    let { parentId = 0 } = req.body;
    try { parentId = req.body.parentId || 0; } catch (err) { console.log(err.message); }

    if (parentId !== 0) {
      parentId = new ObjectId(parentId);
      const fileCheck = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      if (!fileCheck) return res.status(400).json({ error: 'Parent not found' });
      if (fileCheck && fileCheck.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    let tempFile;
    if (type === 'folder') {
      tempFile = await dbClient.db.collection('files').insertOne({
        userId: new ObjectId(userId._id),
        name,
        type,
        isPublic,
        parentId,
      });
    } else {
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(filePath)) fs.mkdirSync(filePath);
      const uId = uuid();
      const slash = '/';
      const localPath = filePath + slash + uId;
      const buffData = Buffer.from(data, 'base64').toString();

      await fs.promises.writeFile(localPath, buffData, { flag: 'w+' });

      tempFile = await dbClient.db.collection('files').insertOne({
        userId: new ObjectId(userId._id),
        name,
        type,
        isPublic,
        parentId,
        localPath,
      });
    }
    return res.status(201).json({
      id: tempFile.insertedId, userId: userId._id, name, type, isPublic, parentId,
    });
  }
}

export default FilesController;
