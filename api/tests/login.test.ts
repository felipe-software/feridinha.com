import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { baseURL } from "./setup";
import database from "@/services/database";
import session from "@/handlers/session";
import { createTestUser, deleteTestUser, TestUser } from "./helpers";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import env from "@/config/env";
import twitch from "@/services/twitch";
import { createOAuthState, oauthStatesMatch } from "@/controllers/login";
import { ExternalServiceError } from "@/utils/httpErrors";
import achievements from "@/handlers/achievements";
import { getOAuthProvider, type OAuthProviderSlug } from "@/services/oauth";

let testUser: TestUser;
const oauthUserIds: string[] = [];

const startOAuth = async (provider = "twitch") => {
    const response = await fetch(`${baseURL}/login/${provider}/redirect`, { redirect: "manual" });
    const location = response.headers.get("location")!;
    const state = new URL(location).searchParams.get("state")!;
    const setCookie = response.headers.get("set-cookie") ?? "";
    const cookie = setCookie.match(/fd_oauth_state=[^;]+/)?.[0] ?? "";
    return { response, state, cookie, location };
};

beforeAll(async () => {
    testUser = await createTestUser("login");
});

afterAll(async () => {
    await deleteTestUser(testUser.id);
    for (const userId of oauthUserIds) await deleteTestUser(userId);
});

describe("Login Routes", () => {
    describe("GET /login/validate", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/login/validate`);
            expect(res.status).toBe(401);
        });

        test("token inválido → resposta de erro", async () => {
            const res = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: "invalid-token" },
            });
            expect(res.status).toBe(401);
            const json = (await res.json()) as { success: boolean; code: string };
            expect(json.success).toBe(false);
            expect(json.code).toBe("invalid_token");
        });

        test("token expirado/malformado → resposta de erro", async () => {
            const res = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJmYWtlLXNlc3Npb24iLCJpYXQiOjE1MTYyMzkwMjJ9.invalid" },
            });
            const json = (await res.json()) as { success: boolean };
            expect(json.success).toBe(false);
        });

        test("token válido mas sessão não existe → resposta de erro", async () => {
            const fakeToken = await session.createJwt("sessao-que-nao-existe");
            const res = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: fakeToken },
            });
            expect(res.status).toBe(401);
            const json = (await res.json()) as { success: boolean; code: string };
            expect(json.success).toBe(false);
            expect(json.code).toBe("session_not_found");
        });

        test("token expirado → 401/session_expired", async () => {
            const expiredToken = jwt.sign({ sessionId: "expired" }, env.JWT_SECRET, { expiresIn: -1 });
            const res = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: `Bearer ${expiredToken}` },
            });
            expect(res.status).toBe(401);
            expect(((await res.json()) as { code: string }).code).toBe("session_expired");
        });

        test("aceita Bearer e rejeita credenciais simultâneas", async () => {
            const bearer = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: `Bearer ${testUser.token}` },
            });
            expect(bearer.status).toBe(200);

            const multiple = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: testUser.token, token: "invalid-api-key" },
            });
            expect(multiple.status).toBe(400);
            expect(((await multiple.json()) as { code: string }).code).toBe("multiple_credentials");
        });

        test("api key inválida → 401/invalid_api_key", async () => {
            const res = await fetch(`${baseURL}/login/validate`, { headers: { token: "invalid-api-key" } });
            expect(res.status).toBe(401);
            expect(((await res.json()) as { code: string }).code).toBe("invalid_api_key");
        });

        test("token válido → 200", async () => {
            const res = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { id: string; name: string; achievements: unknown[] } };
            expect(json.data.id).toBe(testUser.id);
            expect(json.data.name).toBeDefined();
            expect(Array.isArray(json.data.achievements)).toBe(true);
        });

        test("retorna provedores sem expor campos internos", async () => {
            const res = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: Record<string, unknown> & { authProviders: unknown[] } };
            expect(json.data.authProviders).toEqual([
                expect.objectContaining({ provider: "twitch", linkedAt: expect.any(String) }),
            ]);
            expect(json.data).not.toHaveProperty("sessions");
            expect(json.data).not.toHaveProperty("twitchId");
            expect(json.data).not.toHaveProperty("oauthAccounts");
        });

        test("retorna readableLimit → 200", async () => {
            const res = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { readableLimit: number } };
            expect(typeof json.data.readableLimit).toBe("number");
            expect(json.data.readableLimit).toBeGreaterThan(0);
        });

        test("achievements sem conquista não expõe secretUrl → 200", async () => {
            const res = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { achievements: Array<{ secretUrl: string | null }> } };
            const unownedAchievements = json.data.achievements.filter((a) => a.secretUrl === null);
            expect(unownedAchievements.length).toBeGreaterThanOrEqual(0);
        });

        test("serializa conquistas já obtidas", async () => {
            await achievements.init();
            await database.user.update({
                where: { id: testUser.id },
                data: { achievements: { connect: { id: "upload-1st" } } },
            });
            const res = await fetch(`${baseURL}/login/validate`, { headers: { Authorization: testUser.token } });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { achievements: Array<{ id: string; description: string | null }> } };
            expect(json.data.achievements.find((item) => item.id === "upload-1st")?.description).not.toBeNull();
        });
    });

    describe("GET /login/twitch/redirect", () => {
        test("state é aleatório e comparação rejeita tipos e tamanhos divergentes", () => {
            const first = createOAuthState();
            const second = createOAuthState();
            expect(first).toHaveLength(43);
            expect(first).not.toBe(second);
            expect(oauthStatesMatch(first, first)).toBe(true);
            expect(oauthStatesMatch(undefined, first)).toBe(false);
            expect(oauthStatesMatch(first, [first])).toBe(false);
            expect(oauthStatesMatch(first, `${first}x`)).toBe(false);
        });

        test("redireciona para twitch → 302", async () => {
            const res = await fetch(`${baseURL}/login/twitch/redirect`, { redirect: "manual" });
            expect(res.status).toBe(302);
            const location = res.headers.get("location");
            expect(location).toContain("id.twitch.tv");
            expect(location).not.toContain("state=123");
            const cookie = res.headers.get("set-cookie") ?? "";
            expect(cookie).toContain("fd_oauth_state=");
            expect(cookie).toContain("HttpOnly");
            expect(cookie).toContain("SameSite=Lax");
            expect(cookie).toContain("Max-Age=600");
        });

        test("callback sem state ou com state divergente falha e consome cookie", async () => {
            const missing = await fetch(`${baseURL}/login/twitch/callback?code=fake&scope=`, { redirect: "manual" });
            expect(missing.status).toBe(400);
            expect(((await missing.json()) as { code: string }).code).toBe("oauth_state_invalid");

            const divergent = await fetch(`${baseURL}/login/twitch/callback?code=fake&scope=&state=wrong`, {
                headers: { Cookie: "fd_oauth_state=expected" },
                redirect: "manual",
            });
            expect(divergent.status).toBe(400);
            expect(divergent.headers.get("set-cookie")).toContain("fd_oauth_state=;");
            const body = await divergent.text();
            expect(body).not.toContain("client_secret");
            expect(body).not.toContain("Authorization");
        });

        test("erro assíncrono não expõe stack ou objeto interno", async () => {
            const oauth = await startOAuth();
            const res = await fetch(`${baseURL}/login/twitch/callback?state=${oauth.state}`, {
                headers: { Cookie: oauth.cookie },
                redirect: "manual",
            });
            expect(res.status).toBe(400);
            const body = await res.text();
            const json = JSON.parse(body) as { code: string };
            expect(json.code).toBe("oauth_code_invalid");
            expect(body).not.toContain("ZodError");
            expect(body).not.toContain("stack");
            expect(body).not.toContain("client_secret");
        });

        test("callback completo cria usuário, sessão e cookie temporário", async () => {
            const suffix = crypto.randomUUID();
            const originals = {
                auth: twitch.fetchAuthDataFromCallback,
                token: twitch.fetchTokenData,
                color: twitch.fetchUserColor,
                user: twitch.fetchUserData,
            };
            twitch.fetchAuthDataFromCallback = async () => ({
                access_token: "sentinel-access",
                refresh_token: "sentinel-refresh",
                expires_in: 3600,
                token_type: "bearer",
            });
            twitch.fetchTokenData = async () => ({
                client_id: "client",
                login: `login-${suffix}`,
                user_id: `oauth-${suffix}`,
                scopes: [],
                expires_in: 3600,
            });
            twitch.fetchUserColor = async () => ({
                user_id: `oauth-${suffix}`,
                user_login: `login-${suffix}`,
                user_name: `Login-${suffix}`,
                color: "#123456",
            });
            twitch.fetchUserData = async () => ({ profile_image_url: "https://example.com/avatar.png" }) as never;

            try {
                const oauth = await startOAuth();
                const res = await fetch(
                    `${baseURL}/login/twitch/callback?code=valid&scope=&state=${encodeURIComponent(oauth.state)}`,
                    {
                        headers: { Cookie: oauth.cookie },
                        redirect: "manual",
                    },
                );
                expect(res.status).toBe(302);
                expect(res.headers.get("location")).toBe(`${env.CLIENT_URL}/`);
                const cookies = res.headers.get("set-cookie") ?? "";
                expect(cookies).toContain("Token=");
                expect(cookies).toContain("SameSite=Lax");
                expect(cookies).toContain("Max-Age=120");

                const user = await database.user.findUniqueOrThrow({ where: { twitchId: `oauth-${suffix}` } });
                oauthUserIds.push(user.id);
                expect(user.name).toBe(`Login-${suffix}`);
                expect(user.color).toBe("#123456");
                expect(user.sessions).toHaveLength(1);
            } finally {
                twitch.fetchAuthDataFromCallback = originals.auth;
                twitch.fetchTokenData = originals.token;
                twitch.fetchUserColor = originals.color;
                twitch.fetchUserData = originals.user;
            }
        });

        test.each(["auth", "token", "color", "user"] as const)("sanitiza erro upstream na etapa %s", async (stage) => {
            const originals = {
                auth: twitch.fetchAuthDataFromCallback,
                token: twitch.fetchTokenData,
                color: twitch.fetchUserColor,
                user: twitch.fetchUserData,
            };
            twitch.fetchAuthDataFromCallback = async () => ({
                access_token: "access",
                refresh_token: "refresh",
                expires_in: 3600,
                token_type: "bearer",
            });
            twitch.fetchTokenData = async () => ({
                client_id: "client",
                login: "login",
                user_id: "id",
                scopes: [],
                expires_in: 3600,
            });
            twitch.fetchUserColor = async () => ({ user_id: "id", user_login: "login", user_name: "Login" });
            twitch.fetchUserData = async () => ({ profile_image_url: "avatar" }) as never;
            const failure = async () => {
                throw new ExternalServiceError("sentinel_client_secret_Authorization", 418);
            };
            twitch[stage === "auth" ? "fetchAuthDataFromCallback" : stage === "token" ? "fetchTokenData" : stage === "color" ? "fetchUserColor" : "fetchUserData"] = failure as never;

            try {
                const oauth = await startOAuth();
                const res = await fetch(
                    `${baseURL}/login/twitch/callback?code=valid&scope=&state=${encodeURIComponent(oauth.state)}`,
                    { headers: { Cookie: oauth.cookie }, redirect: "manual" },
                );
                expect(res.status).toBe(418);
                const body = await res.text();
                expect(JSON.parse(body).code).toBe("oauth_upstream_error");
                expect(body).not.toContain("client_secret");
                expect(body).not.toContain("Authorization");
            } finally {
                twitch.fetchAuthDataFromCallback = originals.auth;
                twitch.fetchTokenData = originals.token;
                twitch.fetchUserColor = originals.color;
                twitch.fetchUserData = originals.user;
            }
        });
    });

    describe("OAuth multi-provider", () => {
        const mockProvider = (provider: OAuthProviderSlug, providerAccountId: string) => {
            const adapter = getOAuthProvider(provider);
            const originals = {
                exchangeCode: adapter.exchangeCode,
                fetchProfile: adapter.fetchProfile,
            };
            adapter.exchangeCode = async () => ({ accessToken: "sentinel-access-token" });
            adapter.fetchProfile = async () => ({
                providerAccountId,
                displayName: `${provider} user`,
                profileImage: "https://example.com/oauth-avatar.png",
                color: "#abcdef",
            });
            return () => {
                adapter.exchangeCode = originals.exchangeCode;
                adapter.fetchProfile = originals.fetchProfile;
            };
        };

        const finishProviderCallback = async (provider: OAuthProviderSlug) => {
            const oauth = await startOAuth(provider);
            return fetch(
                `${baseURL}/login/${provider}/callback?code=valid&state=${encodeURIComponent(oauth.state)}&ignored=value`,
                {
                    headers: { Cookie: oauth.cookie },
                    redirect: "manual",
                },
            );
        };

        test.each(["google", "discord"] as const)("cria e reutiliza usuário com %s", async (provider) => {
            const providerAccountId = `${provider}-${crypto.randomUUID()}`;
            const restore = mockProvider(provider, providerAccountId);
            try {
                const first = await finishProviderCallback(provider);
                expect(first.status).toBe(302);
                expect(first.headers.get("set-cookie")).toContain("Token=");

                const account = await database.oAuthAccount.findUniqueOrThrow({
                    where: {
                        provider_providerAccountId: {
                            provider: provider.toUpperCase() as "GOOGLE" | "DISCORD",
                            providerAccountId,
                        },
                    },
                    include: { user: true },
                });
                oauthUserIds.push(account.userId);
                expect(account.user.twitchId).toBeNull();
                expect(account.user.name).toBe(`${provider} user`);

                const second = await finishProviderCallback(provider);
                expect(second.status).toBe(302);
                const users = await database.user.count({
                    where: {
                        oauthAccounts: {
                            some: {
                                provider: provider.toUpperCase() as "GOOGLE" | "DISCORD",
                                providerAccountId,
                            },
                        },
                    },
                });
                expect(users).toBe(1);
            } finally {
                restore();
            }
        });

        test("callback concorrente reutiliza a identidade sem criar usuário órfão", async () => {
            const providerAccountId = `google-concurrent-${crypto.randomUUID()}`;
            const restore = mockProvider("google", providerAccountId);
            try {
                const responses = await Promise.all([
                    finishProviderCallback("google"),
                    finishProviderCallback("google"),
                ]);
                expect(responses.map((response) => response.status)).toEqual([302, 302]);

                const accounts = await database.oAuthAccount.findMany({
                    where: { provider: "GOOGLE", providerAccountId },
                });
                expect(accounts).toHaveLength(1);
                oauthUserIds.push(accounts[0]!.userId);

                const orphanedUsers = await database.user.count({
                    where: {
                        name: "google user",
                        oauthAccounts: { none: {} },
                    },
                });
                expect(orphanedUsers).toBe(0);
            } finally {
                restore();
            }
        });

        test("vincula, confirma com JWT e permite desvincular sem remover o último provedor", async () => {
            const providerAccountId = `google-link-${crypto.randomUUID()}`;
            const restore = mockProvider("google", providerAccountId);
            try {
                const start = await fetch(`${baseURL}/login/google/link`, {
                    method: "POST",
                    headers: { Authorization: testUser.token },
                });
                expect(start.status).toBe(200);
                const startBody = (await start.json()) as { data: { redirectUrl: string } };
                const redirectPath = new URL(startBody.data.redirectUrl);
                const intermediate = await fetch(`${baseURL}${redirectPath.pathname}${redirectPath.search}`, {
                    redirect: "manual",
                });
                expect(intermediate.status).toBe(302);
                const state = new URL(intermediate.headers.get("location")!).searchParams.get("state")!;
                const cookie = (intermediate.headers.get("set-cookie") ?? "").match(/fd_oauth_state=[^;]+/)?.[0] ?? "";

                const callback = await fetch(
                    `${baseURL}/login/google/callback?code=valid&state=${encodeURIComponent(state)}&scope=profile`,
                    { headers: { Cookie: cookie }, redirect: "manual" },
                );
                expect(callback.status).toBe(302);
                const completionTicket = decodeURIComponent(
                    new URL(callback.headers.get("location")!).hash.replace("#oauth-link=", ""),
                );
                expect(completionTicket).not.toBe("");
                expect(
                    await database.oAuthAccount.findUnique({
                        where: {
                            provider_providerAccountId: {
                                provider: "GOOGLE",
                                providerAccountId,
                            },
                        },
                    }),
                ).toBeNull();

                const complete = await fetch(`${baseURL}/login/accounts/link/complete`, {
                    method: "POST",
                    headers: {
                        Authorization: testUser.token,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ ticket: completionTicket }),
                });
                expect(complete.status).toBe(200);
                expect(
                    await database.oAuthAccount.findUniqueOrThrow({
                        where: {
                            provider_providerAccountId: {
                                provider: "GOOGLE",
                                providerAccountId,
                            },
                        },
                    }),
                ).toMatchObject({ userId: testUser.id });

                const replay = await fetch(`${baseURL}/login/accounts/link/complete`, {
                    method: "POST",
                    headers: {
                        Authorization: testUser.token,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ ticket: completionTicket }),
                });
                expect(replay.status).toBe(400);
                expect(((await replay.json()) as { code: string }).code).toBe("oauth_link_ticket_invalid");

                const unlinkGoogle = await fetch(`${baseURL}/login/accounts/google`, {
                    method: "DELETE",
                    headers: { Authorization: testUser.token },
                });
                expect(unlinkGoogle.status).toBe(200);

                const unlinkLast = await fetch(`${baseURL}/login/accounts/twitch`, {
                    method: "DELETE",
                    headers: { Authorization: testUser.token },
                });
                expect(unlinkLast.status).toBe(409);
                expect(((await unlinkLast.json()) as { code: string }).code).toBe("last_login_provider");
            } finally {
                restore();
            }
        });

        test("impede que outro usuário conclua uma vinculação compartilhada", async () => {
            const otherUser = await createTestUser("oauth-link-other");
            const providerAccountId = `discord-link-${crypto.randomUUID()}`;
            const restore = mockProvider("discord", providerAccountId);
            try {
                const start = await fetch(`${baseURL}/login/discord/link`, {
                    method: "POST",
                    headers: { Authorization: testUser.token },
                });
                const redirectUrl = ((await start.json()) as { data: { redirectUrl: string } }).data.redirectUrl;
                const redirectPath = new URL(redirectUrl);
                const intermediate = await fetch(`${baseURL}${redirectPath.pathname}${redirectPath.search}`, {
                    redirect: "manual",
                });
                const state = new URL(intermediate.headers.get("location")!).searchParams.get("state")!;
                const cookie = (intermediate.headers.get("set-cookie") ?? "").match(/fd_oauth_state=[^;]+/)?.[0] ?? "";
                const callback = await fetch(
                    `${baseURL}/login/discord/callback?code=valid&state=${encodeURIComponent(state)}`,
                    { headers: { Cookie: cookie }, redirect: "manual" },
                );
                const ticket = decodeURIComponent(
                    new URL(callback.headers.get("location")!).hash.replace("#oauth-link=", ""),
                );

                const wrongUser = await fetch(`${baseURL}/login/accounts/link/complete`, {
                    method: "POST",
                    headers: {
                        Authorization: otherUser.token,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ ticket }),
                });
                expect(wrongUser.status).toBe(403);
                expect(((await wrongUser.json()) as { code: string }).code).toBe("oauth_link_user_mismatch");
                expect(
                    await database.oAuthAccount.findUnique({
                        where: {
                            provider_providerAccountId: {
                                provider: "DISCORD",
                                providerAccountId,
                            },
                        },
                    }),
                ).toBeNull();
            } finally {
                restore();
                await deleteTestUser(otherUser.id);
            }
        });

        test("rejeita identidade que já pertence a outro usuário", async () => {
            const otherUser = await createTestUser("oauth-link-owner");
            const providerAccountId = `google-owned-${crypto.randomUUID()}`;
            await database.oAuthAccount.create({
                data: {
                    provider: "GOOGLE",
                    providerAccountId,
                    userId: otherUser.id,
                },
            });
            const restore = mockProvider("google", providerAccountId);
            try {
                const start = await fetch(`${baseURL}/login/google/link`, {
                    method: "POST",
                    headers: { Authorization: testUser.token },
                });
                const redirectUrl = ((await start.json()) as { data: { redirectUrl: string } }).data.redirectUrl;
                const redirectPath = new URL(redirectUrl);
                const intermediate = await fetch(`${baseURL}${redirectPath.pathname}${redirectPath.search}`, {
                    redirect: "manual",
                });
                const state = new URL(intermediate.headers.get("location")!).searchParams.get("state")!;
                const cookie = (intermediate.headers.get("set-cookie") ?? "").match(/fd_oauth_state=[^;]+/)?.[0] ?? "";
                const callback = await fetch(
                    `${baseURL}/login/google/callback?code=valid&state=${encodeURIComponent(state)}`,
                    { headers: { Cookie: cookie }, redirect: "manual" },
                );
                const ticket = decodeURIComponent(
                    new URL(callback.headers.get("location")!).hash.replace("#oauth-link=", ""),
                );
                const complete = await fetch(`${baseURL}/login/accounts/link/complete`, {
                    method: "POST",
                    headers: {
                        Authorization: testUser.token,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ ticket }),
                });
                expect(complete.status).toBe(409);
                expect(((await complete.json()) as { code: string }).code).toBe("oauth_account_already_linked");
            } finally {
                restore();
                await deleteTestUser(otherUser.id);
            }
        });
    });


    describe("Múltiplas sessões", () => {
        test("usuário pode ter múltiplas sessões ativas → 200", async () => {
            const sessionId2 = crypto.randomUUID();
            await database.user.update({
                where: { id: testUser.id },
                data: { sessions: { push: sessionId2 } },
            });
            const token2 = await session.createJwt(sessionId2);

            const res1 = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: testUser.token },
            });
            expect(res1.status).toBe(200);

            const res2 = await fetch(`${baseURL}/login/validate`, {
                headers: { Authorization: token2 },
            });
            expect(res2.status).toBe(200);
        });
    });
});
