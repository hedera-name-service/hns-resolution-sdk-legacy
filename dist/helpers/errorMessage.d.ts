declare class BaseError extends Error {
    status: number;
    message: string;
    timestamp: string;
    path: string | undefined;
    error: string;
    constructor(error: string, status?: number, message?: string, timestamp?: string);
    generateErrorResponse: () => {
        status: number;
        message: string;
        timestamp: string;
        path: string;
        error: string;
    };
}
export declare class NotFoundError extends BaseError {
    constructor(message: string);
}
export {};
