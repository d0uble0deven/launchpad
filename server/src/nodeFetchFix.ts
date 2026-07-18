/**
 * Node 26.0.0 workaround — built-in fetch() hangs on empty-body POSTs.
 *
 * Node's built-in fetch (undici, as of Node 26.0.0) never resolves for a POST
 * whose body is an empty string. @slack/web-api@8 sends exactly that for every
 * call that carries its token in the Authorization header (auth.test,
 * apps.connections.open, chat.postMessage, …). The visible symptom: Socket Mode
 * can't complete apps.connections.open, so the WebSocket never opens and every
 * slash command fails in Slack with "the app did not respond".
 *
 * Fix: coerce an empty-string body to `undefined`, which is semantically
 * identical for these requests (no form fields) and lets the request complete.
 * Only zero-length string bodies are touched; any request carrying data passes
 * through untouched. Remove this once Node/undici ships a fix.
 *
 * Must be imported before anything that issues a fetch (i.e. first in index.ts).
 */
const nativeFetch = globalThis.fetch;

if (typeof nativeFetch === 'function') {
  globalThis.fetch = function patchedFetch(
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ) {
    if (init && typeof init.body === 'string' && init.body.length === 0) {
      init = { ...init, body: undefined };
    }
    return nativeFetch(input, init);
  } as typeof globalThis.fetch;
}

export {};
