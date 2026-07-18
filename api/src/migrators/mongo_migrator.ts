import { MongoClient } from "mongodb";
import database from "../services/database";
import cryptography from "../config/cryptography";
import env from "../config/env";
import achievements from "../handlers/achievements";
import mimetype from "mime-types";
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = env.MONGODB_OLD_URL!;
console.log({ url });
const client = new MongoClient(url);

// Database Name
const dbName = "upload";

export interface ObjectId {
    $oid: string;
}

export interface DateObject {
    $date: string;
}

export interface Achievement {
    name: string;
    description: string;
    badge: string;
    _id: ObjectId;
}

export interface Upload {
    name: string;
    size: number;
    source: string;
    domain: string;
    _id: ObjectId;
    created_at: DateObject;
}

export interface Stats {
    created_at: DateObject;
    total_uploads: number;
}

export interface UserProfile {
    _id: ObjectId;
    id: string;
    __v: number;
    achievements: Achievement[];
    api_keys: any[];
    image: string;
    name: string;
    role: string;
    stats: Stats;
    token_hash: string;
    uploads: Upload[];
}

async function main() {
    // Use connect method to connect to the server
    await client.connect();
    const currentUsers = await database.user.findMany();
    console.log(currentUsers.length, "Total atual");

    //   await Bun.sleep(15_000);
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    const collection = db.collection("users");

    // the following code examples can be pasted here...

    const data = await collection.find({}).sort({ _id: 1 }).toArray();
    const users = data as any as UserProfile[];
    //   console.log(users);

    for (const oldUser of users) {
        const getUpload = async (targetUpload: UserProfile["uploads"][0]) => ({
            name: targetUpload.name,
            size: targetUpload.size,
            mimeType: mimetype.lookup(targetUpload.name) || "migrated",
            userAgent: "migrated",
            deleteCode: (await cryptography.encryptLegacyDeletionCode(targetUpload.name)) || "migrated_error",
            deleteCodeVersion: "LEGACY",
            createdAt: (targetUpload.created_at as any as Date).toISOString(),
        });

        const uploads = await Promise.all(oldUser.uploads.map(getUpload));
        const names = uploads.map((u) => u.name);

        const newUser = await database.user.upsert({
            where: { twitchId: oldUser.id },
            update: {},
            create: {
                name: oldUser.name,
                profileImage: oldUser.image,
                twitchId: oldUser.id,
                uploadCount: oldUser.stats.total_uploads,
                createdAt: (oldUser.stats.created_at as any as Date).toISOString(),
                uploads: {
                    //   create: uploads,
                },
            },
        });

        let index = 0;

        for (const upload of uploads) {
            const newUpload = await database.upload.upsert({
                where: { name: upload.name },
                update: {},
                create: {
                    name: upload.name,
                    size: upload.size,
                    mimeType: upload.mimeType,
                    userAgent: upload.userAgent,
                    deleteCode: upload.deleteCode,
                    deleteCodeVersion: upload.deleteCodeVersion as any,
                    createdAt: upload.createdAt,
                    userId: newUser.id,
                },
            });

            console.log(`[${index}/${uploads.length}]`, newUpload.name, oldUser.name, oldUser.id);
            index += 1;
        }

        const lastUpload = uploads.at(-1);

        if (lastUpload) {
            const targetUser = await database.user.findUnique({
                where: { id: newUser.id },
                include: { achievements: true },
            });
            if (targetUser) {
                await achievements.handleUpdate(
                    targetUser,
                    { context: "login" }
                    // { uploads: { connect: [{ name: lastUpload.name }] } }
                );
                const biggestUpload = uploads.toSorted((a, b) => b.size - a.size).at(-1)!;
                await achievements.handleUpdate(
                    targetUser,
                    { context: "upload", uploadSize: biggestUpload.size }
                    // { uploads: { connect: [{ name: lastUpload.name }] } }
                );
                console.log("Atualizado OK achievements");
            }
        }

        console.log(oldUser.name, "Criado");
    }

    console.log("Migação finalizada capitão");
    client.close();
}

await main();

const addMimetype = async () => {
    const uploads = await database.upload.findMany();
    let index = 0;
    for (const upload of uploads) {
        const newMimeType = mimetype.lookup(upload.name);
        if (newMimeType) {
            await database.upload.update({
                where: { name: upload.name },
                data: { mimeType: newMimeType },
            });
        }
        index += 1;
        console.log(index, upload.name)
    }

    console.log("Mimetypes adicionadas");
};

// addMimetype()