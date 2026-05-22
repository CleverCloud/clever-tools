import path from 'node:path';
import type { TestEvent } from 'node:test/reporters';
import { styleText } from 'node:util';

const green = (s: string) => styleText('green', s, { validateStream: false });
const red = (s: string) => styleText('red', s, { validateStream: false });
const yellow = (s: string) => styleText('yellow', s, { validateStream: false });
const dim = (s: string) => styleText('dim', s, { validateStream: false });

interface Failure {
  name: string;
  file: string;
  line: number | undefined;
  column: number | undefined;
  error: unknown;
}

export default async function* reporter(source: AsyncGenerator<TestEvent, void>) {
  const failures: Failure[] = [];
  let pass = 0;
  let fail = 0;
  let skip = 0;
  let cancelled = 0;
  const startedAt = Date.now();
  const cwd = process.cwd();

  for await (const event of source) {
    if (event.type !== 'test:pass' && event.type !== 'test:fail') continue;
    if (event.data.details?.type === 'suite') continue;

    const { name, file, line, column, details } = event.data;
    const skipped = event.data.skip || event.data.todo;
    const ms = Math.round(details?.duration_ms ?? 0);
    const rel = file ? dim(path.relative(cwd, file)) + ' ' : '';

    if (skipped) {
      skip++;
      yield `${yellow('-')} ${rel}${name} ${dim('(skipped)')}\n`;
    } else if (event.type === 'test:pass') {
      pass++;
      yield `${green('✓')} ${rel}${name} ${dim(`(${ms}ms)`)}\n`;
    } else {
      const error = event.data.details?.error;
      const errAny = error as any;
      const isCancelled = errAny?.failureType === 'cancelledByParent' || errAny?.cause?.code === 'ERR_TEST_CANCELLED';
      if (isCancelled) {
        cancelled++;
        yield `${yellow('!')} ${rel}${name} ${dim('(cancelled)')}\n`;
      } else {
        fail++;
        failures.push({ name, file: file ? path.relative(cwd, file) : '', line, column, error });
        yield `${red('✗')} ${rel}${name} ${dim(`(${ms}ms)`)}\n`;
      }
    }
  }

  const totalSec = ((Date.now() - startedAt) / 1000).toFixed(2);
  const total = pass + fail + skip + cancelled;

  yield `\n${dim('─'.repeat(40))}\n`;
  yield `Total: ${total}  ${green(`pass: ${pass}`)}  ${red(`fail: ${fail}`)}  ${yellow(`skip: ${skip}`)}  ${yellow(`cancelled: ${cancelled}`)}  ${dim(`(${totalSec}s)`)}\n`;

  if (failures.length > 0) {
    yield `\n${red('Failures:')}\n`;
    for (const f of failures) {
      const err = f.error as any;
      yield `\n${red(`✗ ${f.name}`)}\n`;
      yield `  ${dim(`at ${f.file}:${f.line}:${f.column}`)}\n`;
      const stack: string = err?.cause?.stack ?? err?.stack ?? String(f.error);
      yield stack
        .split('\n')
        .map((l: string) => `  ${l}`)
        .join('\n') + '\n';
    }
  }
}
