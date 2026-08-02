import database from "@/services/database";
import { sleep, tryP } from "@/utils/promises";
import uploadUtils from "@/utils/upload";
import { RequestHandler } from "express";
import { z } from "zod";
import { Prisma, Upload } from "@prisma/client";

const UPLOAD_POLL_TIMEOUT_MS = 30_000;
const UPLOAD_POLL_INTERVAL_MS = 250;

type UploadOwnershipResult =
    | { status: "owned"; uploads: Upload[] }
    | { status: "forbidden" | "timeout" };

export const waitForOwnedUploads = async (
    files: string[],
    userId: string,
    options: { timeoutMs?: number; pollIntervalMs?: number } = {},
): Promise<UploadOwnershipResult> => {
    const uniqueFiles = [...new Set(files)];
    if (uniqueFiles.length !== files.length) return { status: "forbidden" };

    const timeoutMs = options.timeoutMs ?? UPLOAD_POLL_TIMEOUT_MS;
    const pollIntervalMs = options.pollIntervalMs ?? UPLOAD_POLL_INTERVAL_MS;
    const deadline = Date.now() + timeoutMs;

    while (true) {
        const uploads = await database.upload.findMany({ where: { name: { in: uniqueFiles } } });

        if (uploads.some((upload) => upload.userId !== userId)) {
            return { status: "forbidden" };
        }

        if (uploads.length === uniqueFiles.length) {
            return { status: "owned", uploads };
        }

        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) return { status: "timeout" };

        await sleep(Math.min(pollIntervalMs, remainingMs));
    }
};

const createAlbumSchema = z.object({
    files: z.array(z.string()).min(1).max(25),
});

const updateAlbumMetadataSchema = z
    .object({
        title: z.string().trim().max(120).optional(),
        uploads: z
            .array(
                z.object({
                    name: z.string().min(1),
                    description: z.string().trim().max(500).nullable(),
                }),
            )
            .optional(),
    })
    .refine((body) => body.title !== undefined || body.uploads !== undefined, {
        message: "At least one album field must be provided",
    })
    .refine(
        (body) => !body.uploads || new Set(body.uploads.map((upload) => upload.name)).size === body.uploads.length,
        { message: "Upload names must be unique" },
    );

const publicAlbum = <T extends { name: string }>(album: T, canEdit: boolean) => ({
    ...album,
    title: album.name,
    canEdit,
});

const createAlbum: RequestHandler = async (req, res) => {
    const body = req.body as z.infer<typeof createAlbumSchema>;
    const user = req.session!.user!;

    const ownership = await waitForOwnedUploads(body.files, user.id);

    if (ownership.status !== "owned") {
        return res.status(403).error(req.t("album.forbiddenFilesOwner"));
    }

    const ownedUploads = ownership.uploads;

    const albumId = await uploadUtils.generateAlbumName();

    const album = await database.album.create({
        data: {
            id: albumId,
            name: "",
            userId: user.id,
            uploads: {
                connect: ownedUploads.map((upload) => ({ name: upload.name })),
            },
        },
        include: {
            uploads: {
                select: {
                    name: true
                }
            }
        }
    });

    return res.success(req.t("album.created"), publicAlbum(album, true));
};

const getAlbum: RequestHandler = async (req, res) => {
    const albumId = req.params.id as string;

    let album;
    try {
        album = await database.album.update({
            where: { id: albumId },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
            include: {
                uploads: {
                    omit: {
                        userId: true,
                        albumId: true,
                        deleteCode: true,
                        deleteCodeVersion: true,
                        deletedAt: true,
                        accessDates: true,
                        userAgent: true,
                    },
                },
                user: { select: { name: true, color: true } },
            },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).error(req.t("album.notFound"));
        }
        throw error;
    }

    return res.success(req.t("album.found"), {
        ...publicAlbum(album, req.session.user?.id === album.userId),
        views: undefined,
        userId: undefined,
    });
};

const updateAlbumMetadata: RequestHandler = async (req, res) => {
    const albumId = req.params.id as string;
    const user = req.session.user!;
    const body = req.body as z.infer<typeof updateAlbumMetadataSchema>;

    const targetAlbum = await database.album.findUnique({
        where: { id: albumId, userId: user.id },
        select: { id: true },
    });

    if (!targetAlbum) return res.status(404).error(req.t("album.notFound"));

    const uploadNames = body.uploads?.map((upload) => upload.name) ?? [];
    if (uploadNames.length > 0) {
        const ownedAlbumUploads = await database.upload.count({
            where: { name: { in: uploadNames }, albumId, userId: user.id },
        });

        if (ownedAlbumUploads !== uploadNames.length) {
            return res.status(403).error(req.t("album.forbiddenMetadataUpdate"));
        }
    }

    const album = await database.$transaction(async (tx) => {
        if (body.title !== undefined) {
            await tx.album.update({
                where: { id: albumId },
                data: { name: body.title },
            });
        }

        for (const upload of body.uploads ?? []) {
            await tx.upload.update({
                where: { name: upload.name },
                data: { description: upload.description || null },
            });
        }

        return tx.album.findUniqueOrThrow({
            where: { id: albumId },
            include: {
                uploads: {
                    omit: {
                        userId: true,
                        albumId: true,
                        deleteCode: true,
                        deleteCodeVersion: true,
                        deletedAt: true,
                        accessDates: true,
                        userAgent: true,
                    },
                },
                user: { select: { name: true, color: true } },
            },
        });
    });

    return res.success(req.t("album.metadataUpdated"), publicAlbum(album, true));
};

const updateMyAlbum: RequestHandler = async (req, res) => {
    const albumId = req.params.id as string;
    const user = req.session!.user!;

    const [error, targetAlbum] = await tryP(
        database.album.findUnique({
            where: { id: albumId, userId: user.id },
            include: {
                uploads: {
                    omit: {
                        userId: true,
                        albumId: true,
                        deleteCode: true,
                        deleteCodeVersion: true,
                        deletedAt: true,
                        accessDates: true,
                    },
                },
                // user: { select: { name: true, color: true } },
            },
        })
    );

    if (error) return res.status(500).error(req.t("album.fetchError"));
    if (!targetAlbum) return res.status(404).error(req.t("album.notFound"));

    const itemsToPush = req.body.itemsToPush as string[];

    const ownedUploads = await database.upload.findMany({
        where: { name: { in: itemsToPush }, userId: user.id },
    });

    if (ownedUploads.length !== itemsToPush.length) {
        return res.status(403).error(req.t("album.forbiddenAllFilesOwner"));
    }

    const album = await database.album.update({
        where: { id: albumId },
        data: {
            uploads: {
                connect: itemsToPush.map((name) => ({ name }))
            }
        },
        include: {
            uploads: {
                omit: {
                    userId: true,
                    albumId: true,
                    deleteCode: true,
                    deleteCodeVersion: true,
                    deletedAt: true,
                    accessDates: true,
                },
            },
            // user: { select: { name: true, color: true } },
        },
    });

    if (!album) return res.error(req.t("album.notFound"));
    return res.success(req.t("album.updated"), publicAlbum(album, true));
};

const listMyAlbums: RequestHandler = async (req, res) => {
    const albums = await database.album.findMany({
        where: { userId: req.session.user!.id },
        include: { uploads: true },
    });
    res.success(
        req.t("album.listFound"),
        albums.map((album) => publicAlbum(album, true)),
    );
};

const albumController = {
    createAlbum,
    getAlbum,
    listMyAlbums,
    createAlbumSchema,
    updateAlbumMetadataSchema,
    updateAlbumMetadata,
    updateMyAlbum,
};

export default albumController;
