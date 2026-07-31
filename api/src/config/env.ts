import path from "path";
import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string(),
    TWITCH_CLIENT_ID: z.string(),
    TWITCH_SECRET: z.string(),
    TMI_ACCESS_TOKEN: z.string(),
    TMI_CLIENT_ID: z.string(),
    TWITCH_REDIRECT_URL: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REDIRECT_URL: z.string().url(),
    DISCORD_CLIENT_ID: z.string(),
    DISCORD_CLIENT_SECRET: z.string(),
    DISCORD_REDIRECT_URL: z.string().url(),
    CLIENT_URL: z.string(),
    JWT_SECRET: z.string(),
    IMAGE_PREFIX_URL: z.string().endsWith("/"),
    NODE_ENV: z.enum(["development", "production", "test"]),
    LOG_LEVEL: z.enum(["error", "info"]).optional().default("info"),

    S3_REGION: z.string(),
    S3_ENDPOINT: z.string(),
    S3_ACCESS_KEY_ID: z.string(),
    S3_SECRET_ACCESS_KEY: z.string(),
    S3_BUCKET: z.string(),
    S3_RESULT_URL: z.string(),

    CLOUDFLARE_PURGE_CACHE_TOKEN: z.string().optional(),
    CLOUDFLARE_PURGE_ZONE_ID: z.string().optional(),

    DELETE_REPLACER_PATH: z.string().default(path.join(process.cwd(), "assets", "deleted.png")),
    UPLOAD_PATH: z.string().default(path.join(process.cwd(), "uploads")),

    ENCRYPTION_KEY: z.string().length(32),
    ENCRYPTION_IV: z.string().length(16),
    PORT: z.coerce.number().optional().default(3000),

    MONGODB_OLD_URL: z.string().optional(),
    COOKIE_DOMAIN: z.string().optional().default("localhost"),

    LOKI_URL: z.string().optional(),
    LOKI_USER: z.string().optional(),
    LOKI_PASSWORD: z.string().optional(),

    PROXY_TRUST: z.coerce.number().optional().default(0),
    REDIS_URL: z.string().url().default("redis://localhost:6379/0"),

    MURAL_VXREDDIT_URL: z.string().default("https://vxreddit.com"),

    POSTHOG_KEY: z.string(),
    POSTHOG_HOST: z.string(),

    IS_MURAL_AVAILABLE: z
        .string()
        .optional()
        .default("true")
        .transform((v) => v !== "false"),
});

let env: z.infer<typeof envSchema>;

try {
    env = envSchema.parse(process.env);
} catch (err) {
    console.error(err);
    console.error("\n\n\nThere is an error with your .env config");
    console.error("Look at the file @/api/src/config/env.ts to understand the variables");
    console.error("There's also a doc explaning each variable here: @/README.md\n\n\n");
    process.exit(1);
}

env.DELETE_REPLACER_PATH = path.join(process.cwd(), "assets", "deleted.png");

export const myEnv = env!;
export default env!;
