import type { RequestHandler } from "express";

const asyncHandler = (handler: RequestHandler): RequestHandler => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

export default asyncHandler;
