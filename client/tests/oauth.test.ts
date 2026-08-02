import { describe, expect, test } from "bun:test"
import {
    getOAuthFragmentValue,
    getOAuthLoginUrl,
    OAUTH_PROVIDERS,
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
})
