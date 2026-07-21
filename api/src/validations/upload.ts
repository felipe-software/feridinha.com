import z from "zod";

export const uploadLinkSchema = z.object({
    link: z.string().trim().min(1).max(500).url(),
});

export const uploadValidations = { uploadLinkSchema };
