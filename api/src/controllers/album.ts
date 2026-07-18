import database from "@/services/database";
import { tryP } from "@/utils/promises";
import uploadUtils from "@/utils/upload";
import { RequestHandler } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createAlbumSchema = z.object({
    files: z.array(z.string()).min(1).max(25),
});

const createAlbum: RequestHandler = async (req, res) => {
    const body = req.body as z.infer<typeof createAlbumSchema>;
    const user = req.session!.user!;

    const ownedUploads = await database.upload.findMany({ where: { name: { in: body.files }, userId: user.id } });

    if (ownedUploads.length !== body.files.length) {
        return res.status(403).error(req.t("album.forbiddenFilesOwner"));
    }

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

    return res.success(req.t("album.created"), album);
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

    return res.success(req.t("album.found"), { ...album, views: undefined });
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
    return res.success(req.t("album.updated"), album);
};

const listMyAlbums: RequestHandler = async (req, res) => {
    const albums = await database.album.findMany({
        where: { userId: req.session.user!.id },
        include: { uploads: true },
    });
    res.success(req.t("album.listFound"), albums);
};

const albumController = { createAlbum, getAlbum, listMyAlbums, createAlbumSchema, updateMyAlbum };

export default albumController;
