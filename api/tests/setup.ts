import "@/config/env"
import app from "@/app";
import { afterAll, beforeAll } from "bun:test";
import { AddressInfo } from "node:net";

export let baseURL = "";
let server: ReturnType<typeof app.listen>;

export let deleteLinks: string[] = [];

beforeAll(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.on("listening", () => resolve()));

    const { port } = server.address() as AddressInfo;
    baseURL = `http://127.0.0.1:${port}`;
    console.log("[setup] server ready at", baseURL);
});

afterAll(async () => {
    console.log("[setup] tests ended");
    console.log(`[setup] created ${deleteLinks.length} uploads`)
});
