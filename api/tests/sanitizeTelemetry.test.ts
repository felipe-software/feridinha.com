import { describe, expect, test } from "bun:test";
import {
    redactSensitiveTelemetry,
    stripLoginQuery,
} from "@/utils/sanitizeTelemetry";

describe("OAuth telemetry sanitization", () => {
    test("removes login query strings while preserving unrelated URLs", () => {
        expect(
            stripLoginQuery(
                "https://api.example.com/login/google/callback?code=secret&state=state",
            ),
        ).toBe("https://api.example.com/login/google/callback");
        expect(stripLoginQuery("/login/discord/link/redirect?ticket=secret")).toBe(
            "/login/discord/link/redirect",
        );
        expect(stripLoginQuery("https://api.example.com/album/one?view=grid")).toBe(
            "https://api.example.com/album/one?view=grid",
        );
    });

    test("redacts OAuth secrets recursively without removing diagnostic result fields", () => {
        const event = {
            request: {
                data: {
                    ticket: "completion-ticket",
                    nested: {
                        access_token: "external-token",
                        provider: "google",
                    },
                },
            },
            result: { provider: "google", status: 200 },
        };

        redactSensitiveTelemetry(event);

        expect(event.request.data.ticket).toBe("[REDACTED]");
        expect(event.request.data.nested.access_token).toBe("[REDACTED]");
        expect(event.request.data.nested.provider).toBe("google");
        expect(event.result).toEqual({ provider: "google", status: 200 });
    });
});
