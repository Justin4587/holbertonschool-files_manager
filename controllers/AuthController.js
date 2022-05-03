import { v4 as uuid } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authHead = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString('utf-8');
    const [email, pass] = authHead.split(':');

    if (!email || !pass) return res.status(401).json({ error: 'Unauthorized' });

    console.log(email, pass);
    const password = sha1(pass);
    console.log(email, pass);

    const userCheck = await dbClient.db.collection('users').findOne({ email, password });
    if (!userCheck) return res.status(401).json({ error: 'Unauthorized' });

    const token = uuid();
    const key1 = 'auth_';
    const key = key1 + token;

    try {
      await redisClient.set(key, userCheck._id.toString(), 86400);
    } catch (error) {
      return res.status(401).json({ error });
    }

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const key1 = 'auth_';
    const key = key1 + token;
    const userCheck = await redisClient.get(key);
    if (!userCheck) return res.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(key);
    return res.status(204).send();
  }
}

export default AuthController;
