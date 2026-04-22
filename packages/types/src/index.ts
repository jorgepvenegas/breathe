import { z } from "zod";

// --- BreathingPattern ---

export const BreathingPatternSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  inhale: z.number().int().min(1).max(15),
  hold: z.number().int().min(0).max(15),
  exhale: z.number().int().min(1).max(15),
  holdAfterExhale: z.number().int().min(0).max(15).default(0),
  createdAt: z.string().datetime().or(z.date()),
});

export type BreathingPattern = z.infer<typeof BreathingPatternSchema>;

export const CreatePatternSchema = BreathingPatternSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type CreatePatternInput = z.infer<typeof CreatePatternSchema>;

// --- BreathSession ---

export const BreathSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  patternId: z.string(),
  duration: z.number().int().min(0),
  completedAt: z.string().datetime().or(z.date()),
  pattern: BreathingPatternSchema.optional(),
});

export type BreathSession = z.infer<typeof BreathSessionSchema>;

export const CreateSessionSchema = z.object({
  patternId: z.string(),
  duration: z.number().int().min(0),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

// --- Stats ---

export const SessionStatsSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  totalDuration: z.number().int(),
  sessionCount: z.number().int(),
});

export type SessionStats = z.infer<typeof SessionStatsSchema>;

export const StatsRangeSchema = z.enum(["week", "month", "all"]);
export type StatsRange = z.infer<typeof StatsRangeSchema>;

// --- Auth ---

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;
