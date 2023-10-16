"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
const baseError_1 = require("./baseError");
class NotFoundError extends baseError_1.BaseError {
    constructor(message) {
        const status = 404;
        const error = 'Not Found';
        super(error, status, message);
        // known error with TS, in order for typeof to work we have to set prototype to be 'this'
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
