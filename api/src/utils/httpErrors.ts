import type { AxiosError } from "axios";

export class ExternalServiceError extends Error {
    readonly code: string;
    readonly upstreamStatus: number;

    constructor(code: string, upstreamStatus = 502) {
        super(code);
        this.name = "ExternalServiceError";
        this.code = code;
        this.upstreamStatus = upstreamStatus;
    }
}

export const getUpstreamStatus = (error: unknown) => {
    const status = (error as AxiosError | undefined)?.response?.status;
    return typeof status === "number" && status >= 400 && status <= 599 ? status : 502;
};

export const publicErrorDetails = (error: unknown) => {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
        };
    }

    return { name: "UnknownError", message: "Unknown error" };
};
