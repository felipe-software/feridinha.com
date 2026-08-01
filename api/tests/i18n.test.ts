import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import i18next, { i18nMiddleware } from "@/i18n";
import { resources } from "@/i18n/resources";
import express from "express";
import type { AddressInfo } from "node:net";

const app = express();
app.use(i18nMiddleware);
app.get("/", (req, res) => res.json({ message: req.t("common.routeNotFound") }));
let server: ReturnType<typeof app.listen>;
let baseUrl: string;

beforeAll(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => server.close());

const paths = (value: unknown, prefix = ""): string[] => {
    if (!value || typeof value !== "object") return [prefix];
    return Object.entries(value).flatMap(([key, child]) => paths(child, prefix ? `${prefix}.${key}` : key));
};

describe("API i18n", () => {
    test.each([
        ["en", "Route not found"],
        ["en-US", "Route not found"],
        ["en-GB", "Route not found"],
        ["es", "Ruta no encontrada"],
        ["es-ES", "Ruta no encontrada"],
        ["es-MX", "Ruta no encontrada"],
        ["pt", "Rota não encontrada"],
        ["pt-BR", "Rota não encontrada"],
        ["fr", "Rota não encontrada"],
    ])("negocia %s", (locale, expected) => {
        expect(i18next.t("common.routeNotFound", { lng: locale })).toBe(expected);
    });

    test("catálogos possuem os mesmos caminhos", () => {
        expect(paths(resources.en.translation).sort()).toEqual(paths(resources["pt-BR"].translation).sort());
        expect(paths(resources.es.translation).sort()).toEqual(paths(resources["pt-BR"].translation).sort());
    });

    test("x-locale tem precedência sobre Accept-Language", async () => {
        const response = await fetch(baseUrl, {
            headers: { "x-locale": "en-US", "accept-language": "pt-BR" },
        });
        expect(((await response.json()) as { message: string }).message).toBe("Route not found");
    });

    test("x-locale e Accept-Language negociam espanhol", async () => {
        const explicit = await fetch(baseUrl, {
            headers: { "x-locale": "es", "accept-language": "en-US" },
        });
        expect(((await explicit.json()) as { message: string }).message).toBe("Ruta no encontrada");

        const regional = await fetch(baseUrl, { headers: { "accept-language": "es-MX" } });
        expect(((await regional.json()) as { message: string }).message).toBe("Ruta no encontrada");
    });

    test("Accept-Language é usado sem x-locale e locale desconhecido cai em pt-BR", async () => {
        const english = await fetch(baseUrl, { headers: { "accept-language": "en-GB" } });
        expect(((await english.json()) as { message: string }).message).toBe("Route not found");

        const unknown = await fetch(baseUrl, { headers: { "accept-language": "fr-FR" } });
        expect(((await unknown.json()) as { message: string }).message).toBe("Rota não encontrada");
    });
});
