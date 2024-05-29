import { WasiResponse } from 'wasi_http';
import handler from 'cc:main-handler';

// TODO async
function trigger_http (rawRequest) {

  // TODO await
  // TODO make sure request object has the right form
  const request = new Request(rawRequest.uri, {
    body: rawRequest.body,
    headers: rawRequest.headers,
  });
  const response = handler.fetch(request);

  // TODO maybe stringify body
  return new WasiResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

globalThis.trigger_http = trigger_http;
