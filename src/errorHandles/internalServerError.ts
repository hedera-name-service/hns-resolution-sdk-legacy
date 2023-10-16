import { BaseError } from './baseError';

class InternalServerError extends BaseError {
  constructor(message: string) {
    const status = 500;
    const error = 'Internal Server Error';
    super(error, status, message);
    // known error with TS, in order for typeof to work we have to set prototype to be 'this'
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export default InternalServerError;
