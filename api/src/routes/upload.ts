import uploadController from "@/controllers/upload";
import middlewares from "@/middlewares";
import { validateSchema } from "@/middlewares/zod";
import { Router } from "express";
import { z } from "zod";
import asyncHandler from "@/utils/asyncHandler";
import { uploadValidations } from "@/validations/upload";

const route = Router();

route.use(middlewares.rateLimit.upload);
route.post("/", middlewares.auth({ strict: false }), asyncHandler(uploadController.handleUpload));
route.post(
    "/link",
    middlewares.auth({ strict: false }),
    validateSchema(uploadValidations.uploadLinkSchema, "body"),
    asyncHandler(uploadController.handleLinkUpload),
);

const deleteSchema = z.object({
    encryptedFilename: z.string().min(1).max(128),
});

route.delete(
    "/:encryptedFilename",
    validateSchema(deleteSchema, "params"),
    middlewares.auth({ strict: false }),
    asyncHandler(uploadController.deleteUpload)
);

export default route;
