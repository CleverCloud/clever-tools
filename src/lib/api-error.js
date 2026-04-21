export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {string|null} code
   * @param {number} status
   * @param {string} body
   */
  constructor(message, code, status, body) {
    super(message);
    this.code = code;
    this.status = status;
    this.body = body;
  }
}
