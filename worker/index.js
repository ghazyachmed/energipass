// Cloudflare Worker entry point. The Workers runtime treats every named export of
// this module as an entrypoint, so the logic lives in handler.js and only the
// default handler is exported here.
import { handleRequest } from './handler.js';

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
