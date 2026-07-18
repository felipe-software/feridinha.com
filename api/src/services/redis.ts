import { RedisClient } from "bun";
import env from "@/config/env";

export const redisClient = new RedisClient(env.REDIS_URL);
