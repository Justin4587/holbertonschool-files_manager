import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    try {
      const umail = req.body.email;
      if (!umail) return res.status(400).json({ error: 'Missing email' });

      const upass = req.body.password;
      if (!upass) return res.status(400).json({ error: 'Missing password' });

      const checkemail = await dbClient.db.collection('users').find({ email: umail });
      if (!checkemail) return res.status(400).json({ error: 'Already exist' });

      const uPassHash = sha1(upass);
      const uID = await dbClient.db.collection('users').insertOne({ email: umail, password: uPassHash });

      return res.status(201).json({ id: uID.insertedId, email: umail });
    } catch (err) {
      console.log(err);
    }
    return null;
  }
}

export default UsersController;
