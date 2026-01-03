const allowedWhiteLists = [
  "http://localhost:5000",
  "http://localhost:9002",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://127.0.0.1:9002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8080",
  "https://remiwire.vercel.app",
  "https://remire-frontend.vercel.app",
  "http://178.16.138.214:8100",
  "https://api.remiwire.com",
  "https://remiwire.com"
];

export const corsOption = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    console.log("CORS Origin:", origin);
    if (!origin || allowedWhiteLists.includes(origin)) {
      console.log("CORS: Origin allowed");
      callback(null, true);
    } else {
      console.log("CORS: Origin blocked:", origin);
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "x-razorpay-signature",
  ],
  exposedHeaders: ["Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};
