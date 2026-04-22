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
export const CreatePatternSchema = BreathingPatternSchema.omit({
    id: true,
    userId: true,
    createdAt: true,
});
// --- BreathSession ---
export const BreathSessionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    patternId: z.string(),
    duration: z.number().int().min(0),
    completedAt: z.string().datetime().or(z.date()),
    pattern: BreathingPatternSchema.optional(),
});
export const CreateSessionSchema = z.object({
    patternId: z.string(),
    duration: z.number().int().min(0),
});
// --- Stats ---
export const SessionStatsSchema = z.object({
    date: z.string(), // YYYY-MM-DD
    totalDuration: z.number().int(),
    sessionCount: z.number().int(),
});
export const StatsRangeSchema = z.enum(["week", "month", "all"]);
// --- Auth ---
export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(100),
});
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
export const UserSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable().optional(),
});
//# sourceMappingURL=index.js.map