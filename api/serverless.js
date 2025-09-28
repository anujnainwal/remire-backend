"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const app_1 = __importDefault(require("../src/app"));
const connectToDB_1 = require("../src/config/connectToDB");
// Global variable to track database connection
let isConnected = false;
// Export the Express app as a Vercel serverless function
async function handler(req, res) {
    try {
        // Connect to database if not already connected
        if (!isConnected) {
            await (0, connectToDB_1.connectToDB)();
            isConnected = true;
            console.log('✅ Database connected successfully in serverless function');
        }
        // Set CORS headers for Vercel
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        // Pass the request to Express app
        return (0, app_1.default)(req, res);
    }
    catch (error) {
        console.error('❌ Serverless function error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to process request',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
