import z from "zod";

export const createPostSchema = z.object({
    link: z.string().min(1).max(500).url(),
    communityId: z.string().min(1).max(100).optional().default("geral"),

    title: z.string().optional(),
    description: z.string().optional()
});

export const listPostsQuerySchema = z.object({
    communityId: z.string().min(1).max(100).default("geral"),
    after: z.string().uuid().optional(),
    limit: z.coerce.number().min(20).max(100).default(20),
    sortBy: z.enum(["recent", "upvotes"]).optional().default("recent"),
    approvalStatus: z.enum(["approved", "pending", "all", "rejected"]).optional().default("approved"),
    username: z.string().max(200).optional(),
});

export const approvePostParamsSchema = z.object({
    id: z.string().uuid(),
});

export const approvePostSchema = z.object({
    approved: z.boolean(),
    reason: z.string().min(1).max(500).optional(),
}).refine((data) => data.approved || (data.reason != null && data.reason.length > 0), {
    message: "Motivo é obrigatório ao rejeitar",
    path: ["reason"],
});

export const votePostParamsSchema = z.object({
    id: z.string().uuid(),
    vote: z.enum(["up", "down"]),
});

export const muralValidations = {
    votePostParamsSchema,
    createPostSchema,
    listPostsQuerySchema,
    approvePostParamsSchema,
    approvePostSchema,
};