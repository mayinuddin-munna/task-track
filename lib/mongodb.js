const globalForMongo = globalThis;

export async function getMongoDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  const { MongoClient } = await import("mongodb");

  if (!globalForMongo.__taskTrackMongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo.__taskTrackMongoClientPromise = client.connect();
  }

  try {
    const connectedClient = await globalForMongo.__taskTrackMongoClientPromise;

    return connectedClient.db();
  } catch (error) {
    globalForMongo.__taskTrackMongoClientPromise = null;
    throw error;
  }
}
