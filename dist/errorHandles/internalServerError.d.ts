import { BaseError } from './baseError';
declare class InternalServerError extends BaseError {
    constructor(message: string);
}
export default InternalServerError;
