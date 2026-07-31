import { describe, expect, test } from "bun:test"
import {
    getOAuthFragmentValue,
    getOAuthLoginUrl,
    OAUTH_PROVIDERS,
    resolveOAuthLinkCompletion,
    stripOAuthFragmentFromUrl,
} from "@/lib/oauth"

describe("OAuth client helpers", () => {
    test("keeps the supported providers in the intended order", () => {
        expect(OAUTH_PROVIDERS).toEqual(["twitch", "google", "discord"])
    })

    test("builds provider login URLs without duplicate slashes", () => {
        expect(getOAuthLoginUrl("https://api.example.com/", "google")).toBe(
            "https://api.example.com/login/google/redirect",
        )
    })

    test("reads encoded completion tickets without exposing other fragments", () => {
        expect(getOAuthFragmentValue("#oauth-link=a%2Fb%2Bc", "oauth-link")).toBe(
            "a/b+c",
        )
        expect(getOAuthFragmentValue("#oauth-error=denied", "oauth-link")).toBeNull()
        expect(getOAuthFragmentValue("#oauth-link=%E0%A4%A", "oauth-link")).toBeNull()
    })

    test("removes OAuth fragments from telemetry URLs", () => {
        expect(
            stripOAuthFragmentFromUrl(
                "https://feridinha.com/dashboard#oauth-link=secret",
            ),
        ).toBe("https://feridinha.com/dashboard")
        expect(
            stripOAuthFragmentFromUrl("https://feridinha.com/#oauth-error=denied"),
        ).toBe("https://feridinha.com/")
        expect(
            stripOAuthFragmentFromUrl("https://feridinha.com/faq#uploads"),
        ).toBe("https://feridinha.com/faq#uploads")
    })

    test("keeps a regular link completion out of the merge flow", async () => {
        let mergeCalls = 0
        const result = await resolveOAuthLinkCompletion(
            { kind: "linked", provider: "google", linkedAt: new Date().toISOString() },
            () => true,
            async () => {
                mergeCalls += 1
                return { success: true }
            },
        )

        expect(result).toEqual({ kind: "linked" })
        expect(mergeCalls).toBe(0)
    })

    test("does not submit the merge when confirmation is cancelled", async () => {
        let mergeCalls = 0
        const result = await resolveOAuthLinkCompletion(
            { kind: "merge_required", provider: "discord", ticket: "memory-only-ticket" },
            () => false,
            async () => {
                mergeCalls += 1
                return { success: true }
            },
        )

        expect(result).toEqual({ kind: "cancelled" })
        expect(mergeCalls).toBe(0)
    })

    test("submits only the short-lived ticket after confirmation", async () => {
        const receivedTickets: string[] = []
        const result = await resolveOAuthLinkCompletion(
            { kind: "merge_required", provider: "google", ticket: "memory-only-ticket" },
            (provider) => provider === "google",
            async (ticket) => {
                receivedTickets.push(ticket)
                return { success: true }
            },
        )

        expect(result).toEqual({ kind: "merged" })
        expect(receivedTickets).toEqual(["memory-only-ticket"])
    })
})
