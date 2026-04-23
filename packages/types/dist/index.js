"use strict";
exports.__esModule = true;
exports.UserSchema = exports.LoginSchema = exports.RegisterSchema = exports.StatsRangeSchema = exports.SessionStatsSchema = exports.CreateSessionSchema = exports.BreathSessionSchema = exports.CreatePatternSchema = exports.BreathingPatternSchema = void 0;
var zod_1 = require("zod");
// --- BreathingPattern ---
exports.BreathingPatternSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string().nullable(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).nullable().optional(),
    inhale: zod_1.z.number().int().min(1).max(15),
    hold: zod_1.z.number().int().min(0).max(15),
    exhale: zod_1.z.number().int().min(1).max(15),
    holdAfterExhale: zod_1.z.number().int().min(0).max(15)["default"](0),
    createdAt: zod_1.z.string().datetime().or(zod_1.z.date())
});
exports.CreatePatternSchema = exports.BreathingPatternSchema.omit({
    id: true,
    userId: true,
    createdAt: true
});
// --- BreathSession ---
exports.BreathSessionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    patternId: zod_1.z.string(),
    duration: zod_1.z.number().int().min(0),
    completedAt: zod_1.z.string().datetime().or(zod_1.z.date()),
    pattern: exports.BreathingPatternSchema.optional()
});
exports.CreateSessionSchema = zod_1.z.object({
    patternId: zod_1.z.string(),
    duration: zod_1.z.number().int().min(0)
});
// --- Stats ---
exports.SessionStatsSchema = zod_1.z.object({
    date: zod_1.z.string(),
    totalDuration: zod_1.z.number().int(),
    sessionCount: zod_1.z.number().int()
});
exports.StatsRangeSchema = zod_1.z["enum"](["week", "month", "all"]);
// --- Auth ---
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(1).max(100)
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    name: zod_1.z.string().nullable(),
    image: zod_1.z.string().nullable().optional()
});
