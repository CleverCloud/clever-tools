import { TextDecoder } from 'util';
import { URL } from 'url';

class Request {
  constructor (input, options) {
    if (typeof input === 'string') {
      this.url = input;
    }
    if (options != null) {
      this._body = options.body;
      // this.bodyUsed = options.bodyUsed;
      this.cache = options.cache;
      this.credentials = options.credentials;
      // this.destination = options.destination;
      this.headers = options.headers;
      this.integrity = options.integrity;
      this.method = options.method;
      this.mode = options.mode;
      this.priority = options.priority;
      this.redirect = options.redirect;
      this.referrer = options.referrer;
      this.referrerPolicy = options.referrerPolicy;
      this.signal = options.signal;
    }
  }

  // TODO async
  text () {
    return new TextDecoder().decode(this._body);
  }
};

class Response {
  constructor (body = '', options = {}) {
    this.body = body;
    this.status = options.status ?? '200';
    this.statusText = options.statusText ?? 'OK';
    this.headers = options.headers ?? {};
  }

  static json (object) {
    const body = JSON.stringify(object);
    return new Response(body, {
      headers: {
        'content-type': 'application:json',
      },
    });
  }
};

globalThis.URL = URL;
globalThis.Request = Request;
globalThis.Response = Response;
