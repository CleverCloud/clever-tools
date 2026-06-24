export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {string|null} code
   * @param {string} body
   * @param {Response} response
   */
  constructor(message, code, body, response) {
    super(message);
    this.code = code;
    this.status = response.status;
    this.body = body;
    this.url = response.url;
    this.headers = response.headers;
  }
}
