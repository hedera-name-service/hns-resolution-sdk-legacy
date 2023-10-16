"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TooManyRequests = void 0;
const baseError_1 = require("./baseError");
class TooManyRequests extends baseError_1.BaseError {
    constructor(message) {
        const status = 429;
        const error = 'Too Many Request';
        super(error, status, message);
        // known error with TS, in order for typeof to work we have to set prototype to be 'this'
        Object.setPrototypeOf(this, TooManyRequests.prototype);
    }
}
exports.TooManyRequests = TooManyRequests;
