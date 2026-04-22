import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth.js";
import patterns from "./routes/patterns.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "DELETE"],
    credentials: true,
  })
);

// Mount Better Auth at /api/auth/*
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/patterns", patterns);

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT ?? 3001);
console.log(`API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
