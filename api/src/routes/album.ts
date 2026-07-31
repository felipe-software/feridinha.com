import albumController from "@/controllers/album";
import middlewares from "@/middlewares";
import { Router } from "express";
import { z } from "zod";
import asyncHandler from "@/utils/asyncHandler";
import rateLimit from "@/middlewares/rate-limit";

const route = Router();

route.get("/list-my", middlewares.auth({ strict: true }), asyncHandler(albumController.listMyAlbums));

route.get(
    "/:id",
    rateLimit.album,
    middlewares.auth({ strict: false }),
    middlewares.zod(z.object({ id: z.string() }), "params"),
    asyncHandler(albumController.getAlbum),
);
route.patch(
    "/:id",
    middlewares.auth({ strict: true }),
    middlewares.zod(z.object({ id: z.string() }), "params"),
    middlewares.zod(albumController.updateAlbumMetadataSchema, "body"),
    asyncHandler(albumController.updateAlbumMetadata),
);
route.post(
    "/update-my/:id",
    middlewares.auth({ strict: true }),
    middlewares.zod(z.object({ id: z.string() }), "params"),
    middlewares.zod(z.object({ itemsToPush: z.array(z.string()) }), "body"),
    asyncHandler(albumController.updateMyAlbum)
);

route.post(
    "/create",
    middlewares.auth({ strict: true }),
    middlewares.zod(albumController.createAlbumSchema, "body"),
    asyncHandler(albumController.createAlbum)
);

export default route;
