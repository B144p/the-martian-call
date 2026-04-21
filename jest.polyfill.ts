// jsdom does not expose Node's encoding, streams, or fetch globals.
// MSW v2 needs all of these before any test modules load.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TextDecoder: NodeTextDecoder, TextEncoder: NodeTextEncoder } = require('util');
globalThis.TextDecoder = NodeTextDecoder;
globalThis.TextEncoder = NodeTextEncoder;

if (typeof globalThis.ReadableStream === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
  globalThis.ReadableStream = ReadableStream;
  globalThis.WritableStream = WritableStream;
  globalThis.TransformStream = TransformStream;
}

if (typeof globalThis.MessagePort === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MessageChannel, MessagePort } = require('worker_threads');
  globalThis.MessageChannel = MessageChannel;
  globalThis.MessagePort = MessagePort;
}

if (typeof globalThis.Response === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const undici = require('undici');
  globalThis.Response = undici.Response;
  globalThis.Request = undici.Request;
  globalThis.Headers = undici.Headers;
  globalThis.fetch = undici.fetch;
}
