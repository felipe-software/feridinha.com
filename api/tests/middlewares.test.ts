import { afterEach, describe, expect, test } from "bun:test";
import communityMiddleware from "@/middlewares/mural/community";
import muralAuthMiddleware from "@/middlewares/mural/muralAuth";
import database from "@/services/database";

const originalPostFind = database.muralPost.findUnique;
const originalCommunityFind = database.muralCommunity.findUnique;

afterEach(() => {
    database.muralPost.findUnique = originalPostFind;
    database.muralCommunity.findUnique = originalCommunityFind;
});

const response = () => {
    const result = {
        statusCode: 200,
        errorCode: "",
        status(code: number) {
            result.statusCode = code;
            return result;
        },
        error(_message: string) {
            result.errorCode = _message;
            return result;
        },
    };
    return result;
};

const runAsyncMiddleware = async (middleware: ReturnType<typeof communityMiddleware>, req: object) => {
    const res = response();
    let nextCalls = 0;
    let thrown: unknown;
    middleware(
        req as never,
        res as never,
        ((error?: unknown) => {
            nextCalls += 1;
            thrown = error;
        }) as never,
    );
    await Bun.sleep(1);
    if (thrown) throw thrown;
    return { res, nextCalls, req };
};

describe("community middleware", () => {
    test("segue sem consulta quando identificador está ausente", async () => {
        expect((await runAsyncMiddleware(communityMiddleware({ source: "params" }), { params: {}, t: String })).nextCalls).toBe(1);
        expect((await runAsyncMiddleware(communityMiddleware({ source: "fromPost" }), { params: {}, t: String })).nextCalls).toBe(1);
    });

    test("allowMissing segue, enquanto modo estrito retorna 404", async () => {
        database.muralCommunity.findUnique = (async () => null) as never;
        const allowed = await runAsyncMiddleware(
            communityMiddleware({ source: "params", allowMissing: true }),
            { params: { communityId: "missing" }, t: (key: string) => key },
        );
        expect(allowed.nextCalls).toBe(1);

        const strict = await runAsyncMiddleware(communityMiddleware({ source: "params" }), {
            params: { communityId: "missing" },
            t: (key: string) => key,
        });
        expect(strict.res.statusCode).toBe(404);
        expect(strict.nextCalls).toBe(0);
    });

    test("carrega post e comunidade a partir do post", async () => {
        const post = { id: "post", community: { id: "community" } };
        database.muralPost.findUnique = (async () => post) as never;
        const req = { params: { id: "post" }, t: (key: string) => key };
        const result = await runAsyncMiddleware(communityMiddleware({ source: "fromPost" }), req);
        expect(result.nextCalls).toBe(1);
        expect((req as any).muralPost).toBe(post);
        expect((req as any).muralCommunity).toBe(post.community);
    });
});

describe("mural authorization middleware", () => {
    const run = (req: object, onlyWhen?: (req: any) => boolean) => {
        const res = response();
        let nextCalls = 0;
        muralAuthMiddleware({ onlyWhen })(req as never, res as never, (() => nextCalls++) as never);
        return { res, nextCalls };
    };

    test("pula autorização quando predicate é falso", () => {
        expect(run({}, () => false).nextCalls).toBe(1);
    });

    test("rejeita ausência de usuário e de comunidade", () => {
        expect(run({ session: {}, t: (key: string) => key }).res.statusCode).toBe(401);
        expect(run({ session: { user: { id: "u" } }, t: (key: string) => key }).res.statusCode).toBe(500);
    });

    test("aceita criador ou moderador e rejeita demais", () => {
        expect(
            run({
                session: { user: { id: "owner" } },
                muralCommunity: { createdById: "owner", moderators: [] },
                t: (key: string) => key,
            }).nextCalls,
        ).toBe(1);
        expect(
            run({
                session: { user: { id: "mod" } },
                muralCommunity: { createdById: null, moderators: [{ id: "mod" }] },
                t: (key: string) => key,
            }).nextCalls,
        ).toBe(1);
        expect(
            run({
                session: { user: { id: "other" } },
                muralCommunity: { createdById: null, moderators: [] },
                t: (key: string) => key,
            }).res.statusCode,
        ).toBe(403);
    });
});
