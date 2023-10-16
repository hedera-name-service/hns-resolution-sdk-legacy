"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseError = void 0;
class BaseError extends Error {
    constructor(error, status, message) {
        super();
        this.generateErrorResponse = () => ({
            status: this.status,
            message: this.message,
            path: this.path || 'path-not-found',
            error: this.error,
        });
        this.status = status || 500;
        this.message = message || 'Internal Server Error';
        this.error = error;
        Object.setPrototypeOf(this, BaseError.prototype);
    }
}
exports.BaseError = BaseError;
