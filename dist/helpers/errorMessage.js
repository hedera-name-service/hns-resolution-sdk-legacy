"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
// eslint-disable-next-line max-classes-per-file
class BaseError extends Error {
    constructor(error, status, message, timestamp) {
        super();
        this.generateErrorResponse = () => ({
            status: this.status,
            message: this.message,
            timestamp: this.timestamp,
            path: this.path || 'path-not-found',
            error: this.error,
        });
        this.status = status || 500;
        this.message = message || 'Internal Server Error';
        this.timestamp = timestamp || new Date().toISOString();
        this.error = error;
        Object.setPrototypeOf(this, BaseError.prototype);
    }
}
class NotFoundError extends BaseError {
    constructor(message) {
        const status = 404;
        const error = 'Not Found';
        super(error, status, message);
        // known error with TS, in order for typeof to work we have to set prototype to be 'this'
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
