import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    if (dbClient.isAlive() && redisClient.isAlive()) {
      res.status(200);
      res.json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
    }
  }

  static async getStats(req, res) {
    const usenum = await dbClient.nbUsers();
    const filenum = await dbClient.nbFiles();

    res.status(200);
    res.json({ usenum, filenum });
  }
}

export default AppController;
