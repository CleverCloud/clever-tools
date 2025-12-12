import type { Stub } from 'hanbi';
import type { CcStream } from '../../../../src/lib/stream/cc-stream.js';
import type { CcStreamCloseReason } from '../../../../src/lib/stream/cc-stream.types.js';

export interface Stubs {
  request: Stub<() => void>;
  open: Stub<() => void>;
  error: Stub<(err: any) => void>;
  event: Stub<(data: ?) => void>;
  success: Stub<(reason: CcStreamCloseReason) => void>;
  failure: Stub<(err: any) => void>;
}

export interface SpiedStream {
  stream: CcStream;
  start: () => Promise<CcStreamCloseReason>;
  close: (reason: CcStreamCloseReason) => void;
  verifyCounts: (expectedCounts: Counts, maxWait?: number) => Promise<void>;
  stubs: Stubs;
}

type Counts = Partial<Record<keyof Stubs, number>>;
