"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const baseError_1 = require("./baseError");
class InternalServerError extends baseError_1.BaseError {
    constructor(message) {
        const status = 500;
        const error = 'Internal Server Error';
        super(error, status, message);
        // known error with TS, in order for typeof to work we have to set prototype to be 'this'
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}
exports.default = InternalServerError;
