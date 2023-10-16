export class BaseError extends Error {
  status: number;
  message: string;
  path: string | undefined;
  error: string;

  constructor(error: string, status?: number, message?: string) {
    super();
    this.status = status || 500;
    this.message = message || 'Internal Server Error';
    this.error = error;
    Object.setPrototypeOf(this, BaseError.prototype);
  }
}
