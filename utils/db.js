import { MongoClient }  from 'mongodb'
//import dotenv from 'dotenv';

class DBClient {
  constructor() {
    const host = process.env.DB_Host || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(url, { userNewUrlParser: true, userUnifiedTopology: true });
    this.dbName = database;
    this.client.connect()
      .then(() => {
        this.is
      });
  }

  async isAlive() {
    try {
      await this.client.connect();
      return true;
    } catch (error) {
      return false
    }
   }

  async nbUsers() {
    const db = this.client.db(this.dbName);
    const userCollection = db.collection('users');
    return await usersCollection.countDocuments();
  }

  async nbFiles() {
    const db = this.client.db();
    const filesCollection = db.collection('files');
    const count = await filesCollection.countDocuments();
    return count;
  }
}

const dbClient = new DBClient();
export default dbClient;
