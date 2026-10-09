import  dotenv  from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';
dotenv.config();
const uri = process.env.CONNECTION_STRING;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    throw err;
  }
} 
// run().catch(console.dir);

export const connectDB = async () => {
  try {
    await run();
  } catch (err) {
    console.error('Unable to connect to MongoDB:', err);
    process.exit(1);
  }
};

export const getMongoCollection = (collectionName) => {
  return client.db(process.env.DB_NAME).collection(collectionName);
}
