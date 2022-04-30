import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const DB = process.env.DB_DATABASE || 'files_manager';
    const url1st = 'mongodb://';
    const col = ':';
    const url = url1st + host + col + port;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect((error, client) => {
      if (!error) {
        this.db = client.db(DB);
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
      } else {
        console.log(error);
      }
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const num = await this.users.countDocuments({});
    return num;
  }

  async nbFiles() {
    return this.files.countDocuments({});
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
