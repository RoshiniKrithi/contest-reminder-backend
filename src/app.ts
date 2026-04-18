import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { log } from "./log.js";

const app = express();

// Trust proxy is required for secure cookies on Render/Vercel
app.set("trust proxy", 1);

// Initialize CORS before any other middleware
const ALLOWED_ORIGINS = [
    "https://contest-remainder-cnk7.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5005",
    "http://127.0.0.1:5005",
    process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Broaden allowed origins for easier development
        if (!origin || process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }
        
        const sanitizedOrigin = origin.replace(/\/$/, "");
        
        // Check if origin is in the allowed list
        const isExplicitlyAllowed = ALLOWED_ORIGINS.some(allowed => 
            allowed && allowed.replace(/\/$/, "") === sanitizedOrigin
        );

        // Check if it's a Vercel preview URL
        const isVercelPreview = sanitizedOrigin.endsWith(".vercel.app") && 
                               sanitizedOrigin.includes("contest-remainder");
                               
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(sanitizedOrigin);

        if (isExplicitlyAllowed || isVercelPreview || isLocalhost) {
            callback(null, true);
        } else {
            console.error(`[CORS REJECTED] Origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin"],
    credentials: true,
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// Handle preflight for all endpoints
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Root check endpoint
app.get("/", (req, res) => {
    res.send("Backend running 🚀");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});


app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }
            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }
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
        
        // Detailed error logging
        console.error(`🔴 [FATAL ERROR] ${status} - ${message}`);
        if (err.stack) console.error(err.stack);

        import('./log.js').then(({ log }) => {
            log(`[ERROR HANDLER] Status: ${status}, Message: ${message}, Stack: ${err.stack}`, 'error-handler');
        });

        res.status(status).json({ message });
    });

    return httpServer;
}

export { app };

