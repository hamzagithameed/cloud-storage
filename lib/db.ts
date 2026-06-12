import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env file");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache;
}

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  // Check if mongoose is already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const cache = global.mongooseCache;

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      family: 4, // Force IPv4 - fixes DNS SRV resolution issues on Vercel
    };

    // Add directConnection for local development if needed
    if (process.env.NODE_ENV === 'development') {
      console.log("[DB] Connecting to MongoDB in development mode...");
    }

    cache.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((m) => {
        console.log("[DB] MongoDB connected successfully");
        return m;
      })
      .catch((err) => {
        cache.promise = null; // reset so next request retries
        console.error("[DB] MongoDB connection failed:", err.message);
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
