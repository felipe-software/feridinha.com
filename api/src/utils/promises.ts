//@ts-nocheck

export type TryPResponse<T> = Promise<[Error, null] | [null, T]>;

export const tryP = async <T>(promise: Promise<T>): Promise<[Error, null] | [null, T]> => {
    try {
        const result = await promise;
        return [null, result];
    } catch (error: any) {
        return [error, null];
    }
};



export type ErrorName = "session_not_found" | "session_expired";

export class ApiError extends Error {
    name: ErrorName;
    message: string;
    cause?: any;
    code?: string;

    constructor({ name, message, cause, code }: { name: ErrorName; message: string; cause?: any; code?: string }) {
        super();
        this.name = name;
        this.message = message;
        this.cause = cause;
        this.code = code;
    }
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
