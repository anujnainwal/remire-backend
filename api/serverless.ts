import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';
import { connectToDB } from '../src/config/connectToDB';

// Global variable to track database connection
let isConnected = false;

// Export the Express app as a Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Connect to database if not already connected
    if (!isConnected) {
      await connectToDB();
      isConnected = true;
      console.log('✅ Database connected successfully in serverless function');
    }

    // Get the origin from the request
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:9002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:9002',
      'https://remiwire.vercel.app',
      'https://remire-frontend.vercel.app'
    ];

    // Debug logging
    console.log('🌐 CORS Debug:', {
      origin,
      method: req.method,
      url: req.url,
      isAllowed: origin && allowedOrigins.includes(origin)
    });

    // Set CORS headers for Vercel with specific origin
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Only set origin if it's in the allowed list
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      console.log('✅ CORS: Origin allowed:', origin);
    } else {
      // Fallback to a default allowed origin for development
      res.setHeader('Access-Control-Allow-Origin', 'https://remire-frontend.vercel.app');
      console.log('⚠️ CORS: Using fallback origin, requested origin:', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Pass the request to Express app
    return app(req, res);
  } catch (error) {
    console.error('❌ Serverless function error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
