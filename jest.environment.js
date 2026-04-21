// Custom jsdom environment that restores Node 20's native fetch globals,
// which jest-environment-jsdom clears. Required for MSW v2 (msw/node).
import { TestEnvironment } from 'jest-environment-jsdom';

class FetchAwareEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();

    // Node 20 has native fetch. Restore what jsdom removed.
    if (typeof this.global.fetch === 'undefined') {
      this.global.fetch = fetch;
      this.global.Request = Request;
      this.global.Response = Response;
      this.global.Headers = Headers;
    }
    if (typeof this.global.ReadableStream === 'undefined') {
      this.global.ReadableStream = ReadableStream;
      this.global.WritableStream = WritableStream;
      this.global.TransformStream = TransformStream;
    }
    if (typeof this.global.TextDecoder === 'undefined') {
      this.global.TextDecoder = TextDecoder;
      this.global.TextEncoder = TextEncoder;
    }
    if (typeof this.global.BroadcastChannel === 'undefined') {
      this.global.BroadcastChannel = BroadcastChannel;
    }
  }
}

export default FetchAwareEnvironment;
