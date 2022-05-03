import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { createHash } = require('crypto');

class UsersController {
  static async postNew(req, res) {
    try {
      const umail = req.body.email;
      if (!umail) return res.status(400).json({ error: 'Missing email' });

      const upass = req.body.password;
      if (!upass) return res.status(400).json({ error: 'Missing password' });

      const checkemail = await dbClient.db.collection('users').findOne({ email: umail });
      if (checkemail) return res.status(400).json({ error: 'Already exist' });

      const uPassHash = createHash('sha1');
      uPassHash.update(upass);

      const uID = await dbClient.db.collection('users').insertOne({ email: umail, password: uPassHash.digest('hex') });

      return res.status(201).json({ id: uID.insertedId, email: umail });
    } catch (err) {
      console.log(err);
    }
    return null;
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const key1 = 'auth_';
    const key = key1 + token;
    const uID = await redisClient.get(key);
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(uID) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    return res.json({ id: uID, email: user.email });
  }
}

export default UsersController;
