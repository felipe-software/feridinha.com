import { Request, Response } from "express";
import { ZodTypeAny } from "zod";

export const validateSchema =
    (schema: ZodTypeAny, validationKey: "body" | "params" | "query" = "body") =>
    (req: Request, res: Response, next: () => void) => {
        try {
            req[validationKey] = schema.parse(req[validationKey]);
            next();
        } catch (validationError: any) {
            res.status(422).send({
                success: false,
                error: "Validation failed",
                details: validationError.errors,
            });
        }
    };
