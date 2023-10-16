import { BaseError } from './baseError';

export class TooManyRequests extends BaseError {
  constructor(message: string) {
    const status = 429;
    const error = 'Too Many Request';
    super(error, status, message);
    // known error with TS, in order for typeof to work we have to set prototype to be 'this'
    Object.setPrototypeOf(this, TooManyRequests.prototype);
  }
}
