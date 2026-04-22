import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateSessionSchema, StatsRangeSchema } from "@breath/types";
import { prisma } from "../lib/prisma.js";
import { auth } from "../lib/auth.js";

const sessions = new Hono();

// POST /sessions — record a completed session (protected)
sessions.post("/", zValidator("json", CreateSessionSchema), async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");
  const breathSession = await prisma.breathSession.create({
    data: { ...data, userId: session.user.id },
    include: { pattern: true },
  });

  return c.json(breathSession, 201);
});

// GET /sessions — list user's sessions (protected)
sessions.get("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const breathSessions = await prisma.breathSession.findMany({
    where: { userId: session.user.id },
    include: { pattern: true },
    orderBy: { completedAt: "desc" },
  });

  return c.json(breathSessions);
});

// GET /sessions/stats — daily aggregates (protected)
sessions.get("/stats", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const rangeParam = c.req.query("range") ?? "week";
  const range = StatsRangeSchema.safeParse(rangeParam);
  if (!range.success) {
    return c.json({ error: "Invalid range. Use 'week', 'month', or 'all'." }, 400);
  }

  const now = new Date();
  let startDate: Date;

  switch (range.data) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      startDate = new Date(0);
      break;
  }

  const sessionsData = await prisma.breathSession.findMany({
    where: {
      userId: session.user.id,
      completedAt: { gte: startDate },
    },
    orderBy: { completedAt: "asc" },
  });

  // Group by date (YYYY-MM-DD)
  const grouped = new Map<string, { totalDuration: number; sessionCount: number }>();

  for (const s of sessionsData) {
    const dateKey = s.completedAt.toISOString().split("T")[0];
    const existing = grouped.get(dateKey) ?? { totalDuration: 0, sessionCount: 0 };
    existing.totalDuration += s.duration;
    existing.sessionCount += 1;
    grouped.set(dateKey, existing);
  }

  const stats = Array.from(grouped.entries()).map(([date, data]) => ({
    date,
    totalDuration: data.totalDuration,
    sessionCount: data.sessionCount,
  }));

  return c.json(stats);
});

export default sessions;
