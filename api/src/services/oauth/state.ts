import { redisClient } from "@/services/redis";
import { OAuthProvider } from "@prisma/client";
import { randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";

const OAUTH_STATE_TTL_SECONDS = 10 * 60;
const LINK_TICKET_TTL_SECONDS = 2 * 60;

const oauthStateSchema = z.object({
    provider: z.nativeEnum(OAuthProvider),
    intent: z.enum(["login", "link"]),
    expectedUserId: z.string().optional(),
});

const linkInitSchema = z.object({
    provider: z.nativeEnum(OAuthProvider),
    expectedUserId: z.string().min(1),
});

const linkCompletionSchema = linkInitSchema.extend({
    providerAccountId: z.string().min(1),
    providerDisplayName: z.string().trim().min(1).max(256),
    providerProfileImage: z.string().trim().min(1).max(2048),
});

const mergeConfirmationSchema = linkCompletionSchema.extend({
    sourceUserId: z.string().min(1),
});

export type OAuthStateData = z.infer<typeof oauthStateSchema>;
export type LinkInitData = z.infer<typeof linkInitSchema>;
export type LinkCompletionData = z.infer<typeof linkCompletionSchema>;
export type MergeConfirmationData = z.infer<typeof mergeConfirmationSchema>;

type TicketNamespace = "state" | "link-init" | "link-complete" | "merge-confirm";

const createToken = () => randomBytes(32).toString("base64url");
const keyFor = (namespace: TicketNamespace, token: string) => `oauth:${namespace}:${token}`;

const create = async <T>(namespace: TicketNamespace, data: T, ttlSeconds: number) => {
    const token = createToken();
    await redisClient.set(keyFor(namespace, token), JSON.stringify(data), "EX", ttlSeconds);
    return token;
};

const consume = async <T>(namespace: TicketNamespace, token: string, schema: z.ZodType<T>): Promise<T | null> => {
    const raw = (await redisClient.send("GETDEL", [keyFor(namespace, token)])) as string | null;
    if (!raw) return null;

    try {
        return schema.parse(JSON.parse(raw));
    } catch {
        return null;
    }
};

export const createOAuthState = () => createToken();

export const oauthStatesMatch = (expected: string | undefined, received: unknown) => {
    if (!expected || typeof received !== "string") return false;
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
};

export const oauthStateStore = {
    create: (data: OAuthStateData) => create("state", data, OAUTH_STATE_TTL_SECONDS),
    consume: (token: string) => consume("state", token, oauthStateSchema),
};

export const linkInitStore = {
    create: (data: LinkInitData) => create("link-init", data, LINK_TICKET_TTL_SECONDS),
    consume: (token: string) => consume("link-init", token, linkInitSchema),
};

export const linkCompletionStore = {
    create: (data: LinkCompletionData) => create("link-complete", data, LINK_TICKET_TTL_SECONDS),
    consume: (token: string) => consume("link-complete", token, linkCompletionSchema),
};

export const mergeConfirmationStore = {
    create: (data: MergeConfirmationData) => create("merge-confirm", data, LINK_TICKET_TTL_SECONDS),
    consume: (token: string) => consume("merge-confirm", token, mergeConfirmationSchema),
};

export const oauthStateMaxAgeMs = OAUTH_STATE_TTL_SECONDS * 1000;
