const allowedWhiteLists = [
  "http://localhost:5000",
  "http://localhost:9002",
  "http://localhost:3000",
  "http://localhost:8080",
];

export const corsOption = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (!origin || allowedWhiteLists.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};
