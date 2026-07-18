import z from "zod";

const httpsUrl = z
    .string()
    .url()
    .refine((url) => url.startsWith("https://"), {
        message: "URL must use HTTPS",
    });

export const instagramParsedSchema = z.object({
    contentUrl: httpsUrl,
    contentType: z.enum(["VIDEO", "IMAGE"]),
    title: z.string().optional(),
    description: z.string().optional(),
});

export const tiktokParsedSchema = z.object({
    contentUrl: httpsUrl,
    contentType: z.enum(["VIDEO", "IMAGE"]),
    title: z.string().optional(),
    description: z.string().optional(),
});

export const redditParsedSchema = z.object({
    contentUrl: httpsUrl,
    contentType: z.enum(["VIDEO", "IMAGE"]),
    title: z.string().optional(),
    description: z.string().optional(),
});
export const twitterParsedSchema = z.object({
    contentUrl: httpsUrl,
    contentType: z.enum(["VIDEO", "IMAGE"]),
    title: z.string().optional(),
    description: z.string().optional(),
});

export type TwitterParsed = z.infer<typeof twitterParsedSchema>;
export type InstagramParsed = z.infer<typeof instagramParsedSchema>;
export type TiktokParsed = z.infer<typeof tiktokParsedSchema>;
export type RedditParsed = z.infer<typeof redditParsedSchema>;
