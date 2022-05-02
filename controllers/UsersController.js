import dbClient from '../utils/db';

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
}

export default UsersController;
