import { afterEach, describe, expect, test } from "bun:test";
import twitch, { twitchCallbackSchema } from "@/services/twitch";
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

describe("Twitch service", () => {
    test("monta redirect OAuth com state", () => {
        const url = new URL(twitch.getRedirectUrl("random-state"));
        expect(url.origin).toBe("https://id.twitch.tv");
        expect(url.searchParams.get("state")).toBe("random-state");
        expect(url.searchParams.get("response_type")).toBe("code");
    });

    test("valida query estrita do callback", () => {
        expect(twitchCallbackSchema.parse({ code: "code", scope: "", state: "state" })).toEqual({
            code: "code",
            scope: "",
            state: "state",
        });
        expect(() => twitchCallbackSchema.parse({ code: "code", scope: "", state: "state", secret: "no" })).toThrow();
    });

    test("troca code por credenciais sem expor os segredos", async () => {
        axios.defaults.adapter = (async (config) => {
            expect(config.url).toBe("https://id.twitch.tv/oauth2/token");
            expect(config.method).toBe("post");
            expect(config.data).toContain('"code":"callback-code"');
            return response(config, {
                access_token: "access",
                refresh_token: "refresh",
                expires_in: 3600,
                token_type: "bearer",
            });
        }) satisfies AxiosAdapter;
        expect(await twitch.fetchAuthDataFromCallback("callback-code")).toMatchObject({ access_token: "access" });
    });

    test("valida token e busca usuário/cor", async () => {
        axios.defaults.adapter = (async (config) => {
            if (config.url?.includes("oauth2/validate")) {
                expect(config.headers.get("Authorization")).toBe("Bearer access");
                return response(config, { user_id: "twitch-id", login: "login" });
            }
            if (config.url?.includes("chat/color")) {
                return response(config, { data: [{ user_id: "twitch-id", user_login: "login", user_name: "Login" }] });
            }
            return response(config, { data: [{ id: "twitch-id", login: "login", profile_image_url: "avatar" }] });
        }) satisfies AxiosAdapter;

        expect(await twitch.fetchTokenData("access")).toMatchObject({ user_id: "twitch-id" });
        expect(await twitch.fetchUserColor("twitch-id")).toMatchObject({ user_name: "Login" });
        expect(await twitch.fetchUserData("login")).toMatchObject({ profile_image_url: "avatar" });
    });

    test.each([
        ["auth", () => twitch.fetchAuthDataFromCallback("bad"), 401, "twitch_auth_failed"],
        ["token", () => twitch.fetchTokenData("bad"), 403, "twitch_token_validation_failed"],
        ["user", () => twitch.fetchUserData("bad"), 404, "twitch_user_fetch_failed"],
        ["color", () => twitch.fetchUserColor("bad"), 429, "twitch_color_fetch_failed"],
    ] as const)("sanitiza falha de %s", async (_operation, request, status, code) => {
        axios.defaults.adapter = (async () => {
            throw Object.assign(new Error("sentinel client_secret Authorization"), { response: { status } });
        }) satisfies AxiosAdapter;
        const error = await request().catch((caught) => caught);
        expect(error).toBeInstanceOf(ExternalServiceError);
        expect(error).toMatchObject({ code, upstreamStatus: status });
        expect(JSON.stringify(error)).not.toContain("client_secret");
        expect(JSON.stringify(error)).not.toContain("Authorization");
    });

    test("escolhe display name legível", () => {
        expect(twitch.getReadableDisplayName("mylogin", "MyLogin")).toBe("MyLogin");
        expect(twitch.getReadableDisplayName("ascii_login", "Nome Unicode")).toBe("ascii_login");
    });
});
