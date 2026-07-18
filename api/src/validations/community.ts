import z from "zod";

export const createCommunitySchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
});

export const moderatorIdSchema = z.object({
    id: z.string().uuid(),
});

export const findUserQuerySchema = z.object({
    q: z.string().min(3).max(200),
    communityId: z.string().min(1).max(100).optional().default("geral"),
});

export const communityParamsSchema = z.object({
    id: z.string().min(1).max(100),
});

export const communityValidations = {
    createCommunitySchema,
    moderatorIdSchema,
    findUserQuerySchema,
    communityParamsSchema,
};
