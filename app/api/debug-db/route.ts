import { NextRequest } from "next/server";
import { successResponse } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  const mongoUri = process.env.MONGODB_URI;
  
  // Mask the password for security
  const maskedUri = mongoUri ? mongoUri.replace(/:([^:@]*?)@/, ':***@') : 'NOT_SET';
  
  return successResponse({
    mongodbUri: maskedUri,
    hasMongoUri: !!mongoUri,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
}