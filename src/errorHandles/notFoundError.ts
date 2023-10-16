import { BaseError } from './baseError';

export class NotFoundError extends BaseError {
  constructor(message: string) {
    const status = 404;
    const error = 'Not Found';
    super(error, status, message);
    // known error with TS, in order for typeof to work we have to set prototype to be 'this'
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
