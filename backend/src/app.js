// backend/src/app.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import router from "./routes/auth.route.js";
import orderRouter from "./routes/order.route.js";
import riderRouter from "./routes/rider.route.js";
import webhookRouter from "./routes/webhook.route.js";
import adminRouter from "./routes/admin.route.js";
import staffRouter from "./routes/staff.route.js";
import fcmRouter from "./routes/fcm.route.js";
import chatRouter from "./routes/chat.route.js";
import taskRouter from "./routes/task.route.js";
import notificationRouter from "./routes/notification.route.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { env } from "./config/env.js";

const app = express();
app.set("etag", false);

const isProd = env.NODE_ENV === "production";
const defaultOrigins = (env.CLIENT_URLS || env.CLIENT_URL || '');
const configuredOrigins = (env.CLIENT_URLS || env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins;
const allowNoOrigin = env.ALLOW_NO_ORIGIN === "true" || !isProd;

app.use(
  express.json({
    verify: (req, res, buf, encoding) => {
      req.rawBody = buf.toString(encoding || "utf8");
    },
  })
);

app.use(cookieParser());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return allowNoOrigin ? cb(null, true) : cb(new Error("CORS: Origin not allowed"));
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Accept",
      "X-Requested-With",
    ],
  })
);

app.use(helmet());

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api/v1/auth", router);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/riders", riderRouter);
app.use("/api/v1/webhooks", webhookRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/staff", staffRouter);
app.use("/api/v1/fcm", fcmRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/notifications", notificationRouter);

app.use(errorHandler);

export default app;
