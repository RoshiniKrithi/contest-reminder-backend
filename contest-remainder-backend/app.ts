import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { log } from "./log";

const app = express();

// Trust proxy — required for secure cookies behind Render's reverse proxy
app.set("trust proxy", 1);

const ALLOWED_ORIGINS = [
    "https://contest-remainder-cnk7.vercel.app",
    "http://localhost:5173",
    "http://localhost:5005",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const sanitized = origin.replace(/\/$/, "");
        const allowed =
            ALLOWED_ORIGINS.some(o => o.replace(/\/$/, "") === sanitized) ||
            (sanitized.endsWith(".vercel.app") && sanitized.includes("contest-remainder"));
        if (allowed || process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }
        console.warn(`[CORS BLOCKED] ${origin}`);
        callback(new Error(`Origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    credentials: true,
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => res.send("Backend running 🚀"));
app.get("/api/health", (_req, res) => res.json({ status: "ok", message: "Server is running" }));

app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
            log(logLine);
        }
    });

    next();
});

export async function initializeApp() {
    const httpServer = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
    });

    return httpServer;
}

export { app };
