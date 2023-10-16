export declare class BaseError extends Error {
    status: number;
    message: string;
    path: string | undefined;
    error: string;
    constructor(error: string, status?: number, message?: string);
}
