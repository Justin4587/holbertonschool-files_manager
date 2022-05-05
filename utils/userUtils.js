import { ObjectId } from 'mongodb';
import dbClient from './db';
import redisClient from './redis';

async function userIdEmail(req, res) {
  try {
    const token = req.headers['x-token'];
    if (!token) return null;
    const key1 = 'auth_';
    const key = key1 + token;
    const uID = await redisClient.get(key);
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(uID) });
    if (!user) return res.status(401).json({ error: '1Unauthorized' });

    return user;
  } catch (error) {
    return { error: error.message };
  }
}

export default userIdEmail;