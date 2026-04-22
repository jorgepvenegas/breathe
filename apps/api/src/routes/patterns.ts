import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreatePatternSchema } from "@breath/types";
import { prisma } from "../lib/prisma.js";
import { auth } from "../lib/auth.js";

const patterns = new Hono();

// GET /patterns — list all (built-ins + user's custom)
patterns.get("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const userId = session?.user?.id;

  const patternsList = await prisma.breathingPattern.findMany({
    where: {
      OR: [{ userId: null }, { userId: userId ?? "" }],
    },
    orderBy: [{ userId: "asc" }, { createdAt: "asc" }],
  });

  return c.json(patternsList);
});

// POST /patterns — create custom pattern (protected)
patterns.post("/", zValidator("json", CreatePatternSchema), async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");
  const pattern = await prisma.breathingPattern.create({
    data: { ...data, userId: session.user.id },
  });

  return c.json(pattern, 201);
});

// DELETE /patterns/:id — delete user's custom pattern (protected)
patterns.delete("/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const existing = await prisma.breathingPattern.findUnique({ where: { id } });

  if (!existing) {
    return c.json({ error: "Pattern not found" }, 404);
  }

  if (existing.userId !== session.user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await prisma.breathingPattern.delete({ where: { id } });
  return c.json({ success: true });
});

export default patterns;
