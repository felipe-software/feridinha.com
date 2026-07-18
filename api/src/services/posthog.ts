import env from "@/config/env";
import { PostHog } from "posthog-node";

const posthogClient = new PostHog(env.POSTHOG_KEY, {
    host: env.POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
});

function capture(distinctId: string, event: string, properties?: Record<string, unknown>) {
    if (env.NODE_ENV === "test") return;
    posthogClient.capture({ distinctId, event, properties });
}

export const posthog = { capture, client: posthogClient };
export default posthog;
