import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import mime from 'mime-types';
import Bull from 'bull';

import dbClient from '../utils/db';
import userIdEmail from '../utils/userUtils';

const fileQueue = new Bull('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const userId = await userIdEmail(req);
    if (!userId || userId === null) return res.status(401).json({ error: 'Unauthorized' });

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
    if (tempFile.type === 'image') fileQueue.add({ userId: tempFile.userId, fileId: tempFile._id });
    return res.status(201).json({
      id: tempFile.insertedId, userId: userId._id, name, type, isPublic, parentId,
    });
  }

  static async getShow(req, res) {
    const user = await userIdEmail(req);
    console.log(user);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: user._id });
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    const user = await userIdEmail(req);
    const { parentId = 0, page = 0 } = req.query;
    let pages;
    if (parentId !== 0) {
      const objId = ObjectId(parentId);
      pages = await dbClient.db.collection('files').aggregate([
        { $match: { parentId: objId } },
        { $skip: page * 20 },
        { $limit: 20 },
      ]).toArray();
    } else {
      const objId = ObjectId(user._id);
      pages = await dbClient.db.collection('files').aggregate([
        { $match: { userId: objId } },
        { $skip: page * 20 },
        { $limit: 20 },
      ]).toArray();
    }

    const ret = pages.map((page) => ({
      id: page._id,
      userId: page.userId,
      name: page.name,
      type: page.type,
      isPublic: page.isPublic,
      parentId: page.parentId,
    }));
    return res.json(ret);
  }

  static async putPublish(req, res) {
    const userId = await userIdEmail(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: userId._id });
    if (!file) return res.status(404).json({ error: 'Not found' });

    file.isPublic = true;

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const userId = await userIdEmail(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: userId._id });
    if (!file) return res.status(404).json({ error: 'Not found' });

    file.isPublic = false;

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getFile(req, res) {
    const userId = await userIdEmail(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { size } = req.query;
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: userId._id });
    if (!file) return res.status(404).json({ error: 'Not found' });
    if (!file.isPublic && !file.userId) return res.status(404).json({ error: 'Not found' });
    if (file.type === 'folder') return res.status(400).json({ error: "A folder doesn't have content" });
    const uScore = '_';
    if (size) file.localPath = file.localPath + uScore + size;
    if (!fs.existsSync(file.localPath)) return res.status(404).json({ error: 'Not found' });

    const mimeType = mime.contentType(file.name);

    res.setHeader('content-type', mimeType);
    const data = fs.readFileSync(file.localPath, 'utf-8');
    return res.send(data);
  }
}

export default FilesController;
