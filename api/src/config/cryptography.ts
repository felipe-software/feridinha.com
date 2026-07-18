import env from "@/config/env";
import crypto from "crypto";

const decryptLegacyDeletionCode = async (encryptedString: string) => {
    try {
        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(env.ENCRYPTION_KEY),
            { name: "AES-CBC" },
            false,
            ["decrypt"]
        );

        const encryptedData = new Uint8Array(Buffer.from(encryptedString, "base64url"));
        const iv = new Uint8Array(Buffer.from(env.ENCRYPTION_IV!, "utf-8"));

        const decryptedData = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, encryptedData);

        return new TextDecoder().decode(decryptedData);
    } catch (err) {
        return false;
    }
};

const encryptLegacyDeletionCode = async (decryptedString: string) => {
    try {
        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(env.ENCRYPTION_KEY),
            { name: "AES-CBC" },
            false,
            ["encrypt"]
        );

        const iv = new Uint8Array(Buffer.from(env.ENCRYPTION_IV!, "utf-8"));
        const encryptedData = await crypto.subtle.encrypt(
            { name: "AES-CBC", iv },
            key,
            new TextEncoder().encode(decryptedString)
        );

        return Buffer.from(encryptedData).toString("base64url");
    } catch (err) {
        return false;
    }
};

const cryptography = { decryptLegacyDeletionCode, encryptLegacyDeletionCode };

export default cryptography;
