import { z } from "zod";
export declare const BreathingPatternSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    inhale: z.ZodNumber;
    hold: z.ZodNumber;
    exhale: z.ZodNumber;
    holdAfterExhale: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string | null;
    name: string;
    inhale: number;
    hold: number;
    exhale: number;
    holdAfterExhale: number;
    createdAt: string | Date;
    description?: string | null | undefined;
}, {
    id: string;
    userId: string | null;
    name: string;
    inhale: number;
    hold: number;
    exhale: number;
    createdAt: string | Date;
    description?: string | null | undefined;
    holdAfterExhale?: number | undefined;
}>;
export type BreathingPattern = z.infer<typeof BreathingPatternSchema>;
export declare const CreatePatternSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    userId: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    inhale: z.ZodNumber;
    hold: z.ZodNumber;
    exhale: z.ZodNumber;
    holdAfterExhale: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "id" | "userId" | "createdAt">, "strip", z.ZodTypeAny, {
    name: string;
    inhale: number;
    hold: number;
    exhale: number;
    holdAfterExhale: number;
    description?: string | null | undefined;
}, {
    name: string;
    inhale: number;
    hold: number;
    exhale: number;
    description?: string | null | undefined;
    holdAfterExhale?: number | undefined;
}>;
export type CreatePatternInput = z.infer<typeof CreatePatternSchema>;
export declare const BreathSessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    patternId: z.ZodString;
    duration: z.ZodNumber;
    completedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    pattern: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        inhale: z.ZodNumber;
        hold: z.ZodNumber;
        exhale: z.ZodNumber;
        holdAfterExhale: z.ZodDefault<z.ZodNumber>;
        createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        userId: string | null;
        name: string;
        inhale: number;
        hold: number;
        exhale: number;
        holdAfterExhale: number;
        createdAt: string | Date;
        description?: string | null | undefined;
    }, {
        id: string;
        userId: string | null;
        name: string;
        inhale: number;
        hold: number;
        exhale: number;
        createdAt: string | Date;
        description?: string | null | undefined;
        holdAfterExhale?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    patternId: string;
    duration: number;
    completedAt: string | Date;
    pattern?: {
        id: string;
        userId: string | null;
        name: string;
        inhale: number;
        hold: number;
        exhale: number;
        holdAfterExhale: number;
        createdAt: string | Date;
        description?: string | null | undefined;
    } | undefined;
}, {
    id: string;
    userId: string;
    patternId: string;
    duration: number;
    completedAt: string | Date;
    pattern?: {
        id: string;
        userId: string | null;
        name: string;
        inhale: number;
        hold: number;
        exhale: number;
        createdAt: string | Date;
        description?: string | null | undefined;
        holdAfterExhale?: number | undefined;
    } | undefined;
}>;
export type BreathSession = z.infer<typeof BreathSessionSchema>;
export declare const CreateSessionSchema: z.ZodObject<{
    patternId: z.ZodString;
    duration: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    patternId: string;
    duration: number;
}, {
    patternId: string;
    duration: number;
}>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export declare const SessionStatsSchema: z.ZodObject<{
    date: z.ZodString;
    totalDuration: z.ZodNumber;
    sessionCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    totalDuration: number;
    sessionCount: number;
}, {
    date: string;
    totalDuration: number;
    sessionCount: number;
}>;
export type SessionStats = z.infer<typeof SessionStatsSchema>;
export declare const StatsRangeSchema: z.ZodEnum<["week", "month", "all"]>;
export type StatsRange = z.infer<typeof StatsRangeSchema>;
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
}, {
    name: string;
    email: string;
    password: string;
}>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    image: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string | null;
    email: string;
    image?: string | null | undefined;
}, {
    id: string;
    name: string | null;
    email: string;
    image?: string | null | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
//# sourceMappingURL=index.d.ts.map