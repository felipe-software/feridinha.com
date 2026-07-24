import { afterEach, describe, expect, test } from "bun:test";
import { getOAuthProvider } from "@/services/oauth";
import { ExternalServiceError } from "@/utils/httpErrors";
import axios, { AxiosHeaders, type AxiosAdapter, type AxiosResponse } from "axios";

const originalAdapter = axios.defaults.adapter;

const response = (config: Parameters<AxiosAdapter>[0], data: unknown, status = 200): AxiosResponse => ({
    data,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new AxiosHeaders(),
    config,
});

afterEach(() => {
    axios.defaults.adapter = originalAdapter;
});

describe("Google OAuth adapter", () => {
    const google = getOAuthProvider("google");

    test("monta autorização com state e escopos mínimos", () => {
        const url = new URL(google.getAuthorizationUrl("google-state"));
        expect(url.origin).toBe("https://accounts.google.com");
        expect(url.searchParams.get("state")).toBe("google-state");
        expect(url.searchParams.get("scope")).toBe("openid profile");
        expect(url.searchParams.get("response_type")).toBe("code");
        expect(url.searchParams.has("email")).toBe(false);
    });

    test("troca code e mapeia sub, nome e foto", async () => {
        axios.defaults.adapter = (async (config) => {
            if (config.url?.includes("/token")) {
                expect(config.method).toBe("post");
                expect(config.data).toContain("code=google-code");
                expect(config.data).not.toContain("email");
                return response(config, { access_token: "google-access" });
            }
            expect(config.url).toBe("https://openidconnect.googleapis.com/v1/userinfo");
            expect(config.headers.get("Authorization")).toBe("Bearer google-access");
            return response(config, {
                sub: "google-sub",
                name: "Google Name",
                picture: "https://example.com/google.png",
            });
        }) satisfies AxiosAdapter;

        expect(await google.exchangeCode("google-code")).toEqual({ accessToken: "google-access" });
        expect(await google.fetchProfile("google-access")).toEqual({
            providerAccountId: "google-sub",
            displayName: "Google Name",
            profileImage: "https://example.com/google.png",
            color: "#ffffff",
        });
    });

    test("sanitiza falhas externas", async () => {
        axios.defaults.adapter = (async () => {
            throw Object.assign(new Error("client_secret=sentinel access_token=sentinel"), {
                response: { status: 401 },
            });
        }) satisfies AxiosAdapter;

        const error = await google.exchangeCode("bad").catch((caught) => caught);
        expect(error).toBeInstanceOf(ExternalServiceError);
        expect(error).toMatchObject({ code: "google_auth_failed", upstreamStatus: 401 });
        expect(JSON.stringify(error)).not.toContain("client_secret");
        expect(JSON.stringify(error)).not.toContain("access_token");
    });
});

describe("Discord OAuth adapter", () => {
    const discord = getOAuthProvider("discord");

    test("monta autorização apenas com identify", () => {
        const url = new URL(discord.getAuthorizationUrl("discord-state"));
        expect(url.origin).toBe("https://discord.com");
        expect(url.searchParams.get("state")).toBe("discord-state");
        expect(url.searchParams.get("scope")).toBe("identify");
        expect(url.searchParams.get("response_type")).toBe("code");
    });

    test("troca code e mapeia perfil e cor", async () => {
        axios.defaults.adapter = (async (config) => {
            if (config.url?.includes("/oauth2/token")) {
                expect(config.method).toBe("post");
                expect(config.data).toContain("code=discord-code");
                return response(config, { access_token: "discord-access" });
            }
            expect(config.url).toBe("https://discord.com/api/v10/users/@me");
            expect(config.headers.get("Authorization")).toBe("Bearer discord-access");
            return response(config, {
                id: "123456789",
                username: "username",
                global_name: "Display Name",
                avatar: "avatar-hash",
                accent_color: 0x123abc,
            });
        }) satisfies AxiosAdapter;

        expect(await discord.exchangeCode("discord-code")).toEqual({ accessToken: "discord-access" });
        expect(await discord.fetchProfile("discord-access")).toEqual({
            providerAccountId: "123456789",
            displayName: "Display Name",
            profileImage: "https://cdn.discordapp.com/avatars/123456789/avatar-hash.png?size=256",
            color: "#123abc",
        });
    });

    test("usa fallbacks sem avatar, nome global ou cor", async () => {
        axios.defaults.adapter = (async (config) =>
            response(config, {
                id: "987654321",
                username: "fallback-user",
                global_name: null,
                avatar: null,
                accent_color: null,
            })) satisfies AxiosAdapter;

        expect(await discord.fetchProfile("discord-access")).toMatchObject({
            providerAccountId: "987654321",
            displayName: "fallback-user",
            profileImage: expect.stringContaining("/icon.png"),
            color: "#ffffff",
        });
    });
});
