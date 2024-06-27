import require$$0$1 from 'punycode';
import require$$0 from 'util';

const webidl2jsWrapper$1 = { exports: {} };

const urlStateMachine = { exports: {} };

// Note that we take code points as JS numbers, not JS strings.

function isASCIIDigit (c) {
  return c >= 0x30 && c <= 0x39;
}

function isASCIIAlpha (c) {
  return (c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A);
}

function isASCIIAlphanumeric (c) {
  return isASCIIAlpha(c) || isASCIIDigit(c);
}

function isASCIIHex$1 (c) {
  return isASCIIDigit(c) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);
}

const infra = {
  isASCIIDigit: isASCIIDigit,
  isASCIIAlpha: isASCIIAlpha,
  isASCIIAlphanumeric: isASCIIAlphanumeric,
  isASCIIHex: isASCIIHex$1,
};

const ref$3 = require$$0;
const TextEncoder = ref$3.TextEncoder;
const TextDecoder = ref$3.TextDecoder;
const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8', { ignoreBOM: true });

function utf8Encode$2 (string) {
  return utf8Encoder.encode(string);
}

function utf8DecodeWithoutBOM$1 (bytes) {
  return utf8Decoder.decode(bytes);
}

const encoding = {
  utf8Encode: utf8Encode$2,
  utf8DecodeWithoutBOM: utf8DecodeWithoutBOM$1,
};

const ref$2 = infra;
const isASCIIHex = ref$2.isASCIIHex;
const ref$1$1 = encoding;
const utf8Encode$1 = ref$1$1.utf8Encode;

function p$1 (char) {
  return char.codePointAt(0);
}

// https://url.spec.whatwg.org/#percent-encode
function percentEncode (c) {
  let hex = c.toString(16).toUpperCase();
  if (hex.length === 1) {
    hex = '0' + hex;
  }

  return ('%' + hex);
}

// https://url.spec.whatwg.org/#percent-decode
function percentDecodeBytes$1 (input) {
  const output = new Uint8Array(input.byteLength);
  let outputIndex = 0;
  for (let i = 0; i < input.byteLength; ++i) {
    const byte = input[i];
    if (byte !== 0x25) {
      output[outputIndex++] = byte;
    }
    else if (byte === 0x25 && (!isASCIIHex(input[i + 1]) || !isASCIIHex(input[i + 2]))) {
      output[outputIndex++] = byte;
    }
    else {
      const bytePoint = parseInt(String.fromCodePoint(input[i + 1], input[i + 2]), 16);
      output[outputIndex++] = bytePoint;
      i += 2;
    }
  }

  return output.slice(0, outputIndex);
}

// https://url.spec.whatwg.org/#string-percent-decode
function percentDecodeString (input) {
  const bytes = utf8Encode$1(input);
  return percentDecodeBytes$1(bytes);
}

// https://url.spec.whatwg.org/#c0-control-percent-encode-set
function isC0ControlPercentEncode (c) {
  return c <= 0x1F || c > 0x7E;
}

// https://url.spec.whatwg.org/#fragment-percent-encode-set
const extraFragmentPercentEncodeSet = new Set([p$1(' '), p$1('"'), p$1('<'), p$1('>'), p$1('`')]);
function isFragmentPercentEncode (c) {
  return isC0ControlPercentEncode(c) || extraFragmentPercentEncodeSet.has(c);
}

// https://url.spec.whatwg.org/#query-percent-encode-set
const extraQueryPercentEncodeSet = new Set([p$1(' '), p$1('"'), p$1('#'), p$1('<'), p$1('>')]);
function isQueryPercentEncode (c) {
  return isC0ControlPercentEncode(c) || extraQueryPercentEncodeSet.has(c);
}

// https://url.spec.whatwg.org/#special-query-percent-encode-set
function isSpecialQueryPercentEncode (c) {
  return isQueryPercentEncode(c) || c === p$1("'");
}

// https://url.spec.whatwg.org/#path-percent-encode-set
const extraPathPercentEncodeSet = new Set([p$1('?'), p$1('`'), p$1('{'), p$1('}')]);
function isPathPercentEncode (c) {
  return isQueryPercentEncode(c) || extraPathPercentEncodeSet.has(c);
}

// https://url.spec.whatwg.org/#userinfo-percent-encode-set
const extraUserinfoPercentEncodeSet
	= new Set([p$1('/'), p$1(':'), p$1(';'), p$1('='), p$1('@'), p$1('['), p$1('\\'), p$1(']'), p$1('^'), p$1('|')]);
function isUserinfoPercentEncode (c) {
  return isPathPercentEncode(c) || extraUserinfoPercentEncodeSet.has(c);
}

// https://url.spec.whatwg.org/#component-percent-encode-set
const extraComponentPercentEncodeSet = new Set([p$1('$'), p$1('%'), p$1('&'), p$1('+'), p$1(',')]);
function isComponentPercentEncode (c) {
  return isUserinfoPercentEncode(c) || extraComponentPercentEncodeSet.has(c);
}

// https://url.spec.whatwg.org/#application-x-www-form-urlencoded-percent-encode-set
const extraURLEncodedPercentEncodeSet = new Set([p$1('!'), p$1("'"), p$1('('), p$1(')'), p$1('~')]);
function isURLEncodedPercentEncode$1 (c) {
  return isComponentPercentEncode(c) || extraURLEncodedPercentEncodeSet.has(c);
}

// https://url.spec.whatwg.org/#code-point-percent-encode-after-encoding
// https://url.spec.whatwg.org/#utf-8-percent-encode
// Assuming encoding is always utf-8 allows us to trim one of the logic branches. TODO: support encoding.
// The "-Internal" variant here has code points as JS strings. The external version used by other files has code points
// as JS numbers, like the rest of the codebase.
function utf8PercentEncodeCodePointInternal (codePoint, percentEncodePredicate) {
  const bytes = utf8Encode$1(codePoint);
  let output = '';
  for (const byte of bytes) {
    // Our percentEncodePredicate operates on bytes, not code points, so this is slightly different from the spec.
    if (!percentEncodePredicate(byte)) {
      output += String.fromCharCode(byte);
    }
    else {
      output += percentEncode(byte);
    }
  }

  return output;
}

function utf8PercentEncodeCodePoint (codePoint, percentEncodePredicate) {
  return utf8PercentEncodeCodePointInternal(String.fromCodePoint(codePoint), percentEncodePredicate);
}

// https://url.spec.whatwg.org/#string-percent-encode-after-encoding
// https://url.spec.whatwg.org/#string-utf-8-percent-encode
function utf8PercentEncodeString$1 (input, percentEncodePredicate, spaceAsPlus) {
  if (spaceAsPlus === void 0) spaceAsPlus = false;

  let output = '';
  for (const codePoint of input) {
    if (spaceAsPlus && codePoint === ' ') {
      output += '+';
    }
    else {
      output += utf8PercentEncodeCodePointInternal(codePoint, percentEncodePredicate);
    }
  }
  return output;
}

const percentEncoding = {
  isC0ControlPercentEncode: isC0ControlPercentEncode,
  isFragmentPercentEncode: isFragmentPercentEncode,
  isQueryPercentEncode: isQueryPercentEncode,
  isSpecialQueryPercentEncode: isSpecialQueryPercentEncode,
  isPathPercentEncode: isPathPercentEncode,
  isUserinfoPercentEncode: isUserinfoPercentEncode,
  isURLEncodedPercentEncode: isURLEncodedPercentEncode$1,
  percentDecodeString: percentDecodeString,
  percentDecodeBytes: percentDecodeBytes$1,
  utf8PercentEncodeString: utf8PercentEncodeString$1,
  utf8PercentEncodeCodePoint: utf8PercentEncodeCodePoint,
};

(function (module) {
  const ref = require$$0$1;
  const toASCII = ref.toASCII;

  const infra$1 = infra;
  const ref$1 = encoding;
  const utf8DecodeWithoutBOM = ref$1.utf8DecodeWithoutBOM;
  const ref$2 = percentEncoding;
  const percentDecodeString = ref$2.percentDecodeString;
  const utf8PercentEncodeCodePoint = ref$2.utf8PercentEncodeCodePoint;
  const utf8PercentEncodeString = ref$2.utf8PercentEncodeString;
  const isC0ControlPercentEncode = ref$2.isC0ControlPercentEncode;
  const isFragmentPercentEncode = ref$2.isFragmentPercentEncode;
  const isQueryPercentEncode = ref$2.isQueryPercentEncode;
  const isSpecialQueryPercentEncode = ref$2.isSpecialQueryPercentEncode;
  const isPathPercentEncode = ref$2.isPathPercentEncode;
  const isUserinfoPercentEncode = ref$2.isUserinfoPercentEncode;

  function p (char) {
    return char.codePointAt(0);
  }

  const specialSchemes = {
    ftp: 21,
    file: null,
    http: 80,
    https: 443,
    ws: 80,
    wss: 443,
  };

  const failure = Symbol('failure');

  function countSymbols (str) {
    //   return [].concat( str ).length;
    return str.length;
  }

  function at (input, idx) {
    const c = input[idx];
    return isNaN(c) ? undefined : String.fromCodePoint(c);
  }

  function isSingleDot (buffer) {
    return buffer === '.' || buffer.toLowerCase() === '%2e';
  }

  function isDoubleDot (buffer) {
    buffer = buffer.toLowerCase();
    return buffer === '..' || buffer === '%2e.' || buffer === '.%2e' || buffer === '%2e%2e';
  }

  function isWindowsDriveLetterCodePoints (cp1, cp2) {
    return infra$1.isASCIIAlpha(cp1) && (cp2 === p(':') || cp2 === p('|'));
  }

  function isWindowsDriveLetterString (string) {
    return string.length === 2 && infra$1.isASCIIAlpha(string.codePointAt(0)) && (string[1] === ':' || string[1] === '|');
  }

  function isNormalizedWindowsDriveLetterString (string) {
    return string.length === 2 && infra$1.isASCIIAlpha(string.codePointAt(0)) && string[1] === ':';
  }

  function containsForbiddenHostCodePoint (string) {
    return string.search(/\0|\t|\n|\r| |#|\/|:|<|>|\?|@|\[|\\|\]|\^|\|/) !== -1;
  }

  function containsForbiddenDomainCodePoint (string) {
    return containsForbiddenHostCodePoint(string) || string.search(/[\0-\x1F]|%|\x7F/) !== -1;
  }

  function isSpecialScheme (scheme) {
    return specialSchemes[scheme] !== undefined;
  }

  function isSpecial (url) {
    return isSpecialScheme(url.scheme);
  }

  function isNotSpecial (url) {
    return !isSpecialScheme(url.scheme);
  }

  function defaultPort (scheme) {
    return specialSchemes[scheme];
  }

  function parseIPv4Number (input) {
    if (input === '') {
      return failure;
    }

    let R = 10;

    if (input.length >= 2 && input.charAt(0) === '0' && input.charAt(1).toLowerCase() === 'x') {
      input = input.substring(2);
      R = 16;
    }
    else if (input.length >= 2 && input.charAt(0) === '0') {
      input = input.substring(1);
      R = 8;
    }

    if (input === '') {
      return 0;
    }

    let regex = /(?:[\0-\/8-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/;
    if (R === 10) {
      regex = /(?:[\0-\/:-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/;
    }
    if (R === 16) {
      regex = /(?:[\0-\/:-@G-`g-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/;
    }

    if (regex.test(input)) {
      return failure;
    }

    return parseInt(input, R);
  }

  function parseIPv4 (input) {
    const parts = input.split('.');
    if (parts[parts.length - 1] === '') {
      if (parts.length > 1) {
        parts.pop();
      }
    }

    if (parts.length > 4) {
      return failure;
    }

    const numbers = [];
    for (const part of parts) {
      const n = parseIPv4Number(part);
      if (n === failure) {
        return failure;
      }

      numbers.push(n);
    }

    for (let i = 0; i < numbers.length - 1; ++i) {
      if (numbers[i] > 255) {
        return failure;
      }
    }
    if (numbers[numbers.length - 1] >= Math.pow(256, (5 - numbers.length))) {
      return failure;
    }

    let ipv4 = numbers.pop();
    let counter = 0;

    for (const n$1 of numbers) {
      ipv4 += n$1 * Math.pow(256, (3 - counter));
      ++counter;
    }

    return ipv4;
  }

  function serializeIPv4 (address) {
    let output = '';
    let n = address;

    for (let i = 1; i <= 4; ++i) {
      output = String(n % 256) + output;
      if (i !== 4) {
        output = '.' + output;
      }
      n = Math.floor(n / 256);
    }

    return output;
  }

  function parseIPv6 (input) {
    const address = [0, 0, 0, 0, 0, 0, 0, 0];
    let pieceIndex = 0;
    let compress = null;
    let pointer = 0;

    input = Array.from(input, function (c) {
      return c.codePointAt(0);
    });

    if (input[pointer] === p(':')) {
      if (input[pointer + 1] !== p(':')) {
        return failure;
      }

      pointer += 2;
      ++pieceIndex;
      compress = pieceIndex;
    }

    while (pointer < input.length) {
      if (pieceIndex === 8) {
        return failure;
      }

      if (input[pointer] === p(':')) {
        if (compress !== null) {
          return failure;
        }
        ++pointer;
        ++pieceIndex;
        compress = pieceIndex;
        continue;
      }

      let value = 0;
      let length = 0;

      while (length < 4 && infra$1.isASCIIHex(input[pointer])) {
        value = value * 0x10 + parseInt(at(input, pointer), 16);
        ++pointer;
        ++length;
      }

      if (input[pointer] === p('.')) {
        if (length === 0) {
          return failure;
        }

        pointer -= length;

        if (pieceIndex > 6) {
          return failure;
        }

        let numbersSeen = 0;

        while (input[pointer] !== undefined) {
          let ipv4Piece = null;

          if (numbersSeen > 0) {
            if (input[pointer] === p('.') && numbersSeen < 4) {
              ++pointer;
            }
            else {
              return failure;
            }
          }

          if (!infra$1.isASCIIDigit(input[pointer])) {
            return failure;
          }

          while (infra$1.isASCIIDigit(input[pointer])) {
            const number = parseInt(at(input, pointer));
            if (ipv4Piece === null) {
              ipv4Piece = number;
            }
            else if (ipv4Piece === 0) {
              return failure;
            }
            else {
              ipv4Piece = ipv4Piece * 10 + number;
            }
            if (ipv4Piece > 255) {
              return failure;
            }
            ++pointer;
          }

          address[pieceIndex] = address[pieceIndex] * 0x100 + ipv4Piece;

          ++numbersSeen;

          if (numbersSeen === 2 || numbersSeen === 4) {
            ++pieceIndex;
          }
        }

        if (numbersSeen !== 4) {
          return failure;
        }

        break;
      }
      else if (input[pointer] === p(':')) {
        ++pointer;
        if (input[pointer] === undefined) {
          return failure;
        }
      }
      else if (input[pointer] !== undefined) {
        return failure;
      }

      address[pieceIndex] = value;
      ++pieceIndex;
    }

    if (compress !== null) {
      let swaps = pieceIndex - compress;
      pieceIndex = 7;
      while (pieceIndex !== 0 && swaps > 0) {
        const temp = address[compress + swaps - 1];
        address[compress + swaps - 1] = address[pieceIndex];
        address[pieceIndex] = temp;
        --pieceIndex;
        --swaps;
      }
    }
    else if (compress === null && pieceIndex !== 8) {
      return failure;
    }

    return address;
  }

  function serializeIPv6 (address) {
    let output = '';
    const compress = findLongestZeroSequence(address);
    let ignore0 = false;

    for (let pieceIndex = 0; pieceIndex <= 7; ++pieceIndex) {
      if (ignore0 && address[pieceIndex] === 0) {
        continue;
      }
      else if (ignore0) {
        ignore0 = false;
      }

      if (compress === pieceIndex) {
        const separator = pieceIndex === 0 ? '::' : ':';
        output += separator;
        ignore0 = true;
        continue;
      }

      output += address[pieceIndex].toString(16);

      if (pieceIndex !== 7) {
        output += ':';
      }
    }

    return output;
  }

  function parseHost (input, isNotSpecialArg) {
    if (isNotSpecialArg === void 0) isNotSpecialArg = false;

    if (input[0] === '[') {
      if (input[input.length - 1] !== ']') {
        return failure;
      }

      return parseIPv6(input.substring(1, input.length - 1));
    }

    if (isNotSpecialArg) {
      return parseOpaqueHost(input);
    }

    const domain = utf8DecodeWithoutBOM(percentDecodeString(input));
    const asciiDomain = domainToASCII(domain);
    if (asciiDomain === failure) {
      return failure;
    }

    if (containsForbiddenDomainCodePoint(asciiDomain)) {
      return failure;
    }

    if (endsInANumber(asciiDomain)) {
      return parseIPv4(asciiDomain);
    }

    return asciiDomain;
  }

  function endsInANumber (input) {
    const parts = input.split('.');
    if (parts[parts.length - 1] === '') {
      if (parts.length === 1) {
        return false;
      }
      parts.pop();
    }

    const last = parts[parts.length - 1];
    if (parseIPv4Number(last) !== failure) {
      return true;
    }

    if (/^[0-9]+$/.test(last)) {
      return true;
    }

    return false;
  }

  function parseOpaqueHost (input) {
    if (containsForbiddenHostCodePoint(input)) {
      return failure;
    }

    return utf8PercentEncodeString(input, isC0ControlPercentEncode);
  }

  function findLongestZeroSequence (arr) {
    let maxIdx = null;
    let maxLen = 1; // only find elements > 1
    let currStart = null;
    let currLen = 0;

    for (let i = 0; i < arr.length; ++i) {
      if (arr[i] !== 0) {
        if (currLen > maxLen) {
          maxIdx = currStart;
          maxLen = currLen;
        }

        currStart = null;
        currLen = 0;
      }
      else {
        if (currStart === null) {
          currStart = i;
        }
        ++currLen;
      }
    }

    // if trailing zeros
    if (currLen > maxLen) {
      return currStart;
    }

    return maxIdx;
  }

  function serializeHost (host) {
    if (typeof host === 'number') {
      return serializeIPv4(host);
    }

    // IPv6 serializer
    if (host instanceof Array) {
      return ('[' + (serializeIPv6(host)) + ']');
    }

    return host;
  }

  function domainToASCII (domain, _beStrict) {

    const result = toASCII(domain);
    if (result === null || result === '') {
      return failure;
    }
    return result;
  }

  function trimControlChars (url) {
    return url.replace(/^[\0- ]+|[\0- ]+$/g, '');
  }

  function trimTabAndNewline (url) {
    return url.replace(/\t|\n|\r/g, '');
  }

  function shortenPath (url) {
    const path = url.path;
    if (path.length === 0) {
      return;
    }
    if (url.scheme === 'file' && path.length === 1 && isNormalizedWindowsDriveLetter(path[0])) {
      return;
    }

    path.pop();
  }

  function includesCredentials (url) {
    return url.username !== '' || url.password !== '';
  }

  function cannotHaveAUsernamePasswordPort (url) {
    return url.host === null || url.host === '' || url.scheme === 'file';
  }

  function hasAnOpaquePath (url) {
    return typeof url.path === 'string';
  }

  function isNormalizedWindowsDriveLetter (string) {
    return /^[A-Za-z]:$/.test(string);
  }

  function URLStateMachine (input, base, encodingOverride, url, stateOverride) {
    this.pointer = 0;
    this.input = input;
    this.base = base || null;
    this.encodingOverride = encodingOverride || 'utf-8';
    this.stateOverride = stateOverride;
    this.url = url;
    this.failure = false;
    this.parseError = false;

    if (!this.url) {
      this.url = {
        scheme: '',
        username: '',
        password: '',
        host: null,
        port: null,
        path: [],
        query: null,
        fragment: null,
      };

      const res$1 = trimControlChars(this.input);
      if (res$1 !== this.input) {
        this.parseError = true;
      }
      this.input = res$1;
    }

    const res = trimTabAndNewline(this.input);
    if (res !== this.input) {
      this.parseError = true;
    }
    this.input = res;

    this.state = stateOverride || 'scheme start';

    this.buffer = '';
    this.atFlag = false;
    this.arrFlag = false;
    this.passwordTokenSeenFlag = false;

    this.input = Array.from(this.input, function (c) {
      return c.codePointAt(0);
    });

    for (; this.pointer <= this.input.length; ++this.pointer) {
      const c = this.input[this.pointer];
      const cStr = isNaN(c) ? undefined : String.fromCodePoint(c);

      // exec state machine
      const ret = this[('parse ' + (this.state))](c, cStr);
      if (!ret) {
        break; // terminate algorithm
      }
      else if (ret === failure) {
        this.failure = true;
        break;
      }
    }
  }

  URLStateMachine.prototype['parse scheme start'] = function parseSchemeStart (c, cStr) {
    if (infra$1.isASCIIAlpha(c)) {
      this.buffer += cStr.toLowerCase();
      this.state = 'scheme';
    }
    else if (!this.stateOverride) {
      this.state = 'no scheme';
      --this.pointer;
    }
    else {
      this.parseError = true;
      return failure;
    }

    return true;
  };

  URLStateMachine.prototype['parse scheme'] = function parseScheme (c, cStr) {
    if (infra$1.isASCIIAlphanumeric(c) || c === p('+') || c === p('-') || c === p('.')) {
      this.buffer += cStr.toLowerCase();
    }
    else if (c === p(':')) {
      if (this.stateOverride) {
        if (isSpecial(this.url) && !isSpecialScheme(this.buffer)) {
          return false;
        }

        if (!isSpecial(this.url) && isSpecialScheme(this.buffer)) {
          return false;
        }

        if ((includesCredentials(this.url) || this.url.port !== null) && this.buffer === 'file') {
          return false;
        }

        if (this.url.scheme === 'file' && this.url.host === '') {
          return false;
        }
      }
      this.url.scheme = this.buffer;
      if (this.stateOverride) {
        if (this.url.port === defaultPort(this.url.scheme)) {
          this.url.port = null;
        }
        return false;
      }
      this.buffer = '';
      if (this.url.scheme === 'file') {
        if (this.input[this.pointer + 1] !== p('/') || this.input[this.pointer + 2] !== p('/')) {
          this.parseError = true;
        }
        this.state = 'file';
      }
      else if (isSpecial(this.url) && this.base !== null && this.base.scheme === this.url.scheme) {
        this.state = 'special relative or authority';
      }
      else if (isSpecial(this.url)) {
        this.state = 'special authority slashes';
      }
      else if (this.input[this.pointer + 1] === p('/')) {
        this.state = 'path or authority';
        ++this.pointer;
      }
      else {
        this.url.path = '';
        this.state = 'opaque path';
      }
    }
    else if (!this.stateOverride) {
      this.buffer = '';
      this.state = 'no scheme';
      this.pointer = -1;
    }
    else {
      this.parseError = true;
      return failure;
    }

    return true;
  };

  URLStateMachine.prototype['parse no scheme'] = function parseNoScheme (c) {
    if (this.base === null || (hasAnOpaquePath(this.base) && c !== p('#'))) {
      return failure;
    }
    else if (hasAnOpaquePath(this.base) && c === p('#')) {
      this.url.scheme = this.base.scheme;
      this.url.path = this.base.path;
      this.url.query = this.base.query;
      this.url.fragment = '';
      this.state = 'fragment';
    }
    else if (this.base.scheme === 'file') {
      this.state = 'file';
      --this.pointer;
    }
    else {
      this.state = 'relative';
      --this.pointer;
    }

    return true;
  };

  URLStateMachine.prototype['parse special relative or authority'] = function parseSpecialRelativeOrAuthority (c) {
    if (c === p('/') && this.input[this.pointer + 1] === p('/')) {
      this.state = 'special authority ignore slashes';
      ++this.pointer;
    }
    else {
      this.parseError = true;
      this.state = 'relative';
      --this.pointer;
    }

    return true;
  };

  URLStateMachine.prototype['parse path or authority'] = function parsePathOrAuthority (c) {
    if (c === p('/')) {
      this.state = 'authority';
    }
    else {
      this.state = 'path';
      --this.pointer;
    }

    return true;
  };

  URLStateMachine.prototype['parse relative'] = function parseRelative (c) {
    this.url.scheme = this.base.scheme;
    if (c === p('/')) {
      this.state = 'relative slash';
    }
    else if (isSpecial(this.url) && c === p('\\')) {
      this.parseError = true;
      this.state = 'relative slash';
    }
    else {
      this.url.username = this.base.username;
      this.url.password = this.base.password;
      this.url.host = this.base.host;
      this.url.port = this.base.port;
      this.url.path = this.base.path.slice();
      this.url.query = this.base.query;
      if (c === p('?')) {
        this.url.query = '';
        this.state = 'query';
      }
      else if (c === p('#')) {
        this.url.fragment = '';
        this.state = 'fragment';
      }
      else if (!isNaN(c)) {
        this.url.query = null;
        this.url.path.pop();
        this.state = 'path';
        --this.pointer;
      }
    }

    return true;
  };

  URLStateMachine.prototype['parse relative slash'] = function parseRelativeSlash (c) {
    if (isSpecial(this.url) && (c === p('/') || c === p('\\'))) {
      if (c === p('\\')) {
        this.parseError = true;
      }
      this.state = 'special authority ignore slashes';
    }
    else if (c === p('/')) {
      this.state = 'authority';
    }
    else {
      this.url.username = this.base.username;
      this.url.password = this.base.password;
      this.url.host = this.base.host;
      this.url.port = this.base.port;
      this.state = 'path';
      --this.pointer;
    }

    return true;
  };

  URLStateMachine.prototype['parse special authority slashes'] = function parseSpecialAuthoritySlashes (c) {
    if (c === p('/') && this.input[this.pointer + 1] === p('/')) {
      this.state = 'special authority ignore slashes';
      ++this.pointer;
    }
    else {
      this.parseError = true;
      this.state = 'special authority ignore slashes';
      --this.pointer;
    }

    return true;
  };

  URLStateMachine.prototype['parse special authority ignore slashes'] = function parseSpecialAuthorityIgnoreSlashes (c) {
    if (c !== p('/') && c !== p('\\')) {
      this.state = 'authority';
      --this.pointer;
    }
    else {
      this.parseError = true;
    }

    return true;
  };

  URLStateMachine.prototype['parse authority'] = function parseAuthority (c, cStr) {
    if (c === p('@')) {
      this.parseError = true;
      if (this.atFlag) {
        this.buffer = '%40' + (this.buffer);
      }
      this.atFlag = true;

      // careful, this is based on buffer and has its own pointer (this.pointer != pointer) and inner chars
      const len = countSymbols(this.buffer);
      for (let pointer = 0; pointer < len; ++pointer) {
        const codePoint = this.buffer.codePointAt(pointer);

        if (codePoint === p(':') && !this.passwordTokenSeenFlag) {
          this.passwordTokenSeenFlag = true;
          continue;
        }
        const encodedCodePoints = utf8PercentEncodeCodePoint(codePoint, isUserinfoPercentEncode);
        if (this.passwordTokenSeenFlag) {
          this.url.password += encodedCodePoints;
        }
        else {
          this.url.username += encodedCodePoints;
        }
      }
      this.buffer = '';
    }
    else if (isNaN(c) || c === p('/') || c === p('?') || c === p('#')
			|| (isSpecial(this.url) && c === p('\\'))) {
      if (this.atFlag && this.buffer === '') {
        this.parseError = true;
        return failure;
      }
      this.pointer -= countSymbols(this.buffer) + 1;
      this.buffer = '';
      this.state = 'host';
    }
    else {
      this.buffer += cStr;
    }

    return true;
  };

  URLStateMachine.prototype['parse hostname']
		= URLStateMachine.prototype['parse host'] = function parseHostName (c, cStr) {
      if (this.stateOverride && this.url.scheme === 'file') {
        --this.pointer;
        this.state = 'file host';
      }
      else if (c === p(':') && !this.arrFlag) {
        if (this.buffer === '') {
          this.parseError = true;
          return failure;
        }

        if (this.stateOverride === 'hostname') {
          return false;
        }

        const host = parseHost(this.buffer, isNotSpecial(this.url));
        if (host === failure) {
          return failure;
        }

        this.url.host = host;
        this.buffer = '';
        this.state = 'port';
      }
      else if (isNaN(c) || c === p('/') || c === p('?') || c === p('#')
				|| (isSpecial(this.url) && c === p('\\'))) {
        --this.pointer;
        if (isSpecial(this.url) && this.buffer === '') {
          this.parseError = true;
          return failure;
        }
        else if (this.stateOverride && this.buffer === ''
					&& (includesCredentials(this.url) || this.url.port !== null)) {
          this.parseError = true;
          return false;
        }

        const host$1 = parseHost(this.buffer, isNotSpecial(this.url));
        if (host$1 === failure) {
          return failure;
        }

        this.url.host = host$1;
        this.buffer = '';
        this.state = 'path start';
        if (this.stateOverride) {
          return false;
        }
      }
      else {
        if (c === p('[')) {
          this.arrFlag = true;
        }
        else if (c === p(']')) {
          this.arrFlag = false;
        }
        this.buffer += cStr;
      }

      return true;
    };

  URLStateMachine.prototype['parse port'] = function parsePort (c, cStr) {
    if (infra$1.isASCIIDigit(c)) {
      this.buffer += cStr;
    }
    else if (isNaN(c) || c === p('/') || c === p('?') || c === p('#')
			|| (isSpecial(this.url) && c === p('\\'))
			|| this.stateOverride) {
      if (this.buffer !== '') {
        const port = parseInt(this.buffer);
        if (port > Math.pow(2, 16) - 1) {
          this.parseError = true;
          return failure;
        }
        this.url.port = port === defaultPort(this.url.scheme) ? null : port;
        this.buffer = '';
      }
      if (this.stateOverride) {
        return false;
      }
      this.state = 'path start';
      --this.pointer;
    }
    else {
      this.parseError = true;
      return failure;
    }

    return true;
  };

  const fileOtherwiseCodePoints = new Set([p('/'), p('\\'), p('?'), p('#')]);

  function startsWithWindowsDriveLetter (input, pointer) {
    const length = input.length - pointer;
    return length >= 2
			&& isWindowsDriveLetterCodePoints(input[pointer], input[pointer + 1])
			&& (length === 2 || fileOtherwiseCodePoints.has(input[pointer + 2]));
  }

  URLStateMachine.prototype['parse file'] = function parseFile (c) {
    this.url.scheme = 'file';
    this.url.host = '';

    if (c === p('/') || c === p('\\')) {
      if (c === p('\\')) {
        this.parseError = true;
      }
      this.state = 'file slash';
    }
    else if (this.base !== null && this.base.scheme === 'file') {
      this.url.host = this.base.host;
      this.url.path = this.base.path.slice();
      this.url.query = this.base.query;
      if (c === p('?')) {
        this.url.query = '';
        this.state = 'query';
      }
      else if (c === p('#')) {
        this.url.fragment = '';
        this.state = 'fragment';
      }
      else if (!isNaN(c)) {
        this.url.query = null;
        if (!startsWithWindowsDriveLetter(this.input, this.pointer)) {
          shortenPath(this.url);
        }
        else {
          this.parseError = true;
          this.url.path = [];
        }

        this.state = 'path';
        --this.pointer;
      }
    }
    else {
      this.state = 'path';
      --this.pointer;
    }

    return true;
  };

  URLStateMachine.prototype['parse file slash'] = function parseFileSlash (c) {
    if (c === p('/') || c === p('\\')) {
      if (c === p('\\')) {
        this.parseError = true;
      }
      this.state = 'file host';
    }
    else {
      if (this.base !== null && this.base.scheme === 'file') {
        if (!startsWithWindowsDriveLetter(this.input, this.pointer)
					&& isNormalizedWindowsDriveLetterString(this.base.path[0])) {
          this.url.path.push(this.base.path[0]);
        }
        this.url.host = this.base.host;
      }
      this.state = 'path';
      --this.pointer;
    }

    return true;
  };

  URLStateMachine.prototype['parse file host'] = function parseFileHost (c, cStr) {

    if (isNaN(c) || c === p('/') || c === p('\\') || c === p('?') || c === p('#')) {
      --this.pointer;
      if (!this.stateOverride && isWindowsDriveLetterString(this.buffer)) {
        this.parseError = true;
        this.state = 'path';
      }
      else if (this.buffer === '') {
        this.url.host = '';
        if (this.stateOverride) {
          return false;
        }
        this.state = 'path start';
      }
      else {
        let host = parseHost(this.buffer, isNotSpecial(this.url));
        if (host === failure) {
          return failure;
        }
        if (host === 'localhost') {
          host = '';
        }
        this.url.host = host;

        if (this.stateOverride) {
          return false;
        }

        this.buffer = '';
        this.state = 'path start';
      }
    }
    else {
      this.buffer += cStr;
    }

    return true;
  };

  URLStateMachine.prototype['parse path start'] = function parsePathStart (c) {
    if (isSpecial(this.url)) {
      if (c === p('\\')) {
        this.parseError = true;
      }
      this.state = 'path';

      if (c !== p('/') && c !== p('\\')) {
        --this.pointer;
      }
    }
    else if (!this.stateOverride && c === p('?')) {
      this.url.query = '';
      this.state = 'query';
    }
    else if (!this.stateOverride && c === p('#')) {
      this.url.fragment = '';
      this.state = 'fragment';
    }
    else if (c !== undefined) {
      this.state = 'path';
      if (c !== p('/')) {
        --this.pointer;
      }
    }
    else if (this.stateOverride && this.url.host === null) {
      this.url.path.push('');
    }

    return true;
  };

  URLStateMachine.prototype['parse path'] = function parsePath (c) {
    if (isNaN(c) || c === p('/') || (isSpecial(this.url) && c === p('\\'))
			|| (!this.stateOverride && (c === p('?') || c === p('#')))) {
      if (isSpecial(this.url) && c === p('\\')) {
        this.parseError = true;
      }

      if (isDoubleDot(this.buffer)) {
        shortenPath(this.url);
        if (c !== p('/') && !(isSpecial(this.url) && c === p('\\'))) {
          this.url.path.push('');
        }
      }
      else if (isSingleDot(this.buffer) && c !== p('/')
				&& !(isSpecial(this.url) && c === p('\\'))) {
        this.url.path.push('');
      }
      else if (!isSingleDot(this.buffer)) {
        if (this.url.scheme === 'file' && this.url.path.length === 0 && isWindowsDriveLetterString(this.buffer)) {
          this.buffer = (this.buffer[0]) + ':';
        }
        this.url.path.push(this.buffer);
      }
      this.buffer = '';
      if (c === p('?')) {
        this.url.query = '';
        this.state = 'query';
      }
      if (c === p('#')) {
        this.url.fragment = '';
        this.state = 'fragment';
      }
    }
    else {
      // TODO: If c is not a URL code point and not "%", parse error.

      if (c === p('%')
				&& (!infra$1.isASCIIHex(this.input[this.pointer + 1])
					|| !infra$1.isASCIIHex(this.input[this.pointer + 2]))) {
        this.parseError = true;
      }

      this.buffer += utf8PercentEncodeCodePoint(c, isPathPercentEncode);
    }

    return true;
  };

  URLStateMachine.prototype['parse opaque path'] = function parseOpaquePath (c) {
    if (c === p('?')) {
      this.url.query = '';
      this.state = 'query';
    }
    else if (c === p('#')) {
      this.url.fragment = '';
      this.state = 'fragment';
    }
    else {
      // TODO: Add: not a URL code point
      if (!isNaN(c) && c !== p('%')) {
        this.parseError = true;
      }

      if (c === p('%')
				&& (!infra$1.isASCIIHex(this.input[this.pointer + 1])
					|| !infra$1.isASCIIHex(this.input[this.pointer + 2]))) {
        this.parseError = true;
      }

      if (!isNaN(c)) {
        this.url.path += utf8PercentEncodeCodePoint(c, isC0ControlPercentEncode);
      }
    }

    return true;
  };

  URLStateMachine.prototype['parse query'] = function parseQuery (c, cStr) {
    if (!isSpecial(this.url) || this.url.scheme === 'ws' || this.url.scheme === 'wss') {
      this.encodingOverride = 'utf-8';
    }

    if ((!this.stateOverride && c === p('#')) || isNaN(c)) {
      const queryPercentEncodePredicate = isSpecial(this.url) ? isSpecialQueryPercentEncode : isQueryPercentEncode;
      this.url.query += utf8PercentEncodeString(this.buffer, queryPercentEncodePredicate);

      this.buffer = '';

      if (c === p('#')) {
        this.url.fragment = '';
        this.state = 'fragment';
      }
    }
    else if (!isNaN(c)) {
      // TODO: If c is not a URL code point and not "%", parse error.

      if (c === p('%')
				&& (!infra$1.isASCIIHex(this.input[this.pointer + 1])
					|| !infra$1.isASCIIHex(this.input[this.pointer + 2]))) {
        this.parseError = true;
      }

      this.buffer += cStr;
    }

    return true;
  };

  URLStateMachine.prototype['parse fragment'] = function parseFragment (c) {
    if (!isNaN(c)) {
      // TODO: If c is not a URL code point and not "%", parse error.
      if (c === p('%')
				&& (!infra$1.isASCIIHex(this.input[this.pointer + 1])
					|| !infra$1.isASCIIHex(this.input[this.pointer + 2]))) {
        this.parseError = true;
      }

      this.url.fragment += utf8PercentEncodeCodePoint(c, isFragmentPercentEncode);
    }

    return true;
  };

  function serializeURL (url, excludeFragment) {
    let output = (url.scheme) + ':';
    if (url.host !== null) {
      output += '//';

      if (url.username !== '' || url.password !== '') {
        output += url.username;
        if (url.password !== '') {
          output += ':' + (url.password);
        }
        output += '@';
      }

      output += serializeHost(url.host);

      if (url.port !== null) {
        output += ':' + (url.port);
      }
    }

    if (url.host === null && !hasAnOpaquePath(url) && url.path.length > 1 && url.path[0] === '') {
      output += '/.';
    }
    output += serializePath(url);

    if (url.query !== null) {
      output += '?' + (url.query);
    }

    if (!excludeFragment && url.fragment !== null) {
      output += '#' + (url.fragment);
    }

    return output;
  }

  function serializeOrigin (tuple) {
    let result = (tuple.scheme) + '://';
    result += serializeHost(tuple.host);

    if (tuple.port !== null) {
      result += ':' + (tuple.port);
    }

    return result;
  }

  function serializePath (url) {
    if (hasAnOpaquePath(url)) {
      return url.path;
    }

    let output = '';
    for (const segment of url.path) {
      output += '/' + segment;
    }
    return output;
  }

  module.exports.serializeURL = serializeURL;

  module.exports.serializePath = serializePath;

  module.exports.serializeURLOrigin = function (url) {
    // https://url.spec.whatwg.org/#concept-url-origin
    switch (url.scheme) {
      case 'blob':
        try {
          return module.exports.serializeURLOrigin(module.exports.parseURL(serializePath(url)));
        }
        catch (e) {
          // serializing an opaque origin returns "null"
          return 'null';
        }
      case 'ftp':
      case 'http':
      case 'https':
      case 'ws':
      case 'wss':
        return serializeOrigin({
          scheme: url.scheme,
          host: url.host,
          port: url.port,
        });
      case 'file':
        // The spec says:
        // > Unfortunate as it is, this is left as an exercise to the reader. When in doubt, return a new opaque origin.
        // Browsers tested so far:
        // - Chrome says "file://", but treats file: URLs as cross-origin for most (all?) purposes; see e.g.
        //   https://bugs.chromium.org/p/chromium/issues/detail?id=37586
        // - Firefox says "null", but treats file: URLs as same-origin sometimes based on directory stuff; see
        //   https://developer.mozilla.org/en-US/docs/Archive/Misc_top_level/Same-origin_policy_for_file:_URIs
        return 'null';
      default:
        // serializing an opaque origin returns "null"
        return 'null';
    }
  };

  module.exports.basicURLParse = function (input, options) {
    if (options === undefined) {
      options = {};
    }

    const usm = new URLStateMachine(input, options.baseURL, options.encodingOverride, options.url, options.stateOverride);

    if (usm.failure) {
      return null;
    }

    return usm.url;
  };

  module.exports.setTheUsername = function (url, username) {
    url.username = utf8PercentEncodeString(username, isUserinfoPercentEncode);
  };

  module.exports.setThePassword = function (url, password) {
    url.password = utf8PercentEncodeString(password, isUserinfoPercentEncode);
  };

  module.exports.serializeHost = serializeHost;

  module.exports.cannotHaveAUsernamePasswordPort = cannotHaveAUsernamePasswordPort;

  module.exports.hasAnOpaquePath = hasAnOpaquePath;

  module.exports.serializeInteger = function (integer) {
    return String(integer);
  };

  module.exports.parseURL = function (input, options) {
    if (options === undefined) {
      options = {};
    }

    // We don't handle blobs, so this just delegates:
    return module.exports.basicURLParse(input, { baseURL: options.baseURL, encodingOverride: options.encodingOverride });
  };
}(urlStateMachine));

const ref = encoding;
const utf8Encode = ref.utf8Encode;
const utf8DecodeWithoutBOM = ref.utf8DecodeWithoutBOM;
const ref$1 = percentEncoding;
const percentDecodeBytes = ref$1.percentDecodeBytes;
const utf8PercentEncodeString = ref$1.utf8PercentEncodeString;
const isURLEncodedPercentEncode = ref$1.isURLEncodedPercentEncode;

function p (char) {
  return char.codePointAt(0);
}

// https://url.spec.whatwg.org/#concept-urlencoded-parser
function parseUrlencoded (input) {
  const sequences = strictlySplitByteSequence(input, p('&'));
  const output = [];
  for (const bytes of sequences) {
    if (bytes.length === 0) {
      continue;
    }

    let name = (void 0); let value = (void 0);
    const indexOfEqual = bytes.indexOf(p('='));

    if (indexOfEqual >= 0) {
      name = bytes.slice(0, indexOfEqual);
      value = bytes.slice(indexOfEqual + 1);
    }
    else {
      name = bytes;
      value = new Uint8Array(0);
    }

    name = replaceByteInByteSequence(name, 0x2B, 0x20);
    value = replaceByteInByteSequence(value, 0x2B, 0x20);

    const nameString = utf8DecodeWithoutBOM(percentDecodeBytes(name));
    const valueString = utf8DecodeWithoutBOM(percentDecodeBytes(value));

    output.push([nameString, valueString]);
  }
  return output;
}

// https://url.spec.whatwg.org/#concept-urlencoded-string-parser
function parseUrlencodedString (input) {
  return parseUrlencoded(utf8Encode(input));
}

// https://url.spec.whatwg.org/#concept-urlencoded-serializer
function serializeUrlencoded (tuples, encodingOverride) {
  if (encodingOverride === void 0) encodingOverride = undefined;

  let encoding = 'utf-8';
  if (encodingOverride !== undefined) {
    // TODO "get the output encoding", i.e. handle encoding labels vs. names.
    encoding = encodingOverride;
  }

  let output = '';
  for (const [i, tuple] of tuples.entries()) {
    // TODO: handle encoding override

    const name = utf8PercentEncodeString(tuple[0], isURLEncodedPercentEncode, true);

    let value = tuple[1];
    if (tuple.length > 2 && tuple[2] !== undefined) {
      if (tuple[2] === 'hidden' && name === '_charset_') {
        value = encoding;
      }
      else if (tuple[2] === 'file') {
        // value is a File object
        value = value.name;
      }
    }

    value = utf8PercentEncodeString(value, isURLEncodedPercentEncode, true);

    if (i !== 0) {
      output += '&';
    }
    output += name + '=' + value;
  }
  return output;
}

function strictlySplitByteSequence (buf, cp) {
  const list = [];
  let last = 0;
  let i = buf.indexOf(cp);
  while (i >= 0) {
    list.push(buf.slice(last, i));
    last = i + 1;
    i = buf.indexOf(cp, last);
  }
  if (last !== buf.length) {
    list.push(buf.slice(last));
  }
  return list;
}

function replaceByteInByteSequence (buf, from, to) {
  let i = buf.indexOf(from);
  while (i >= 0) {
    buf[i] = to;
    i = buf.indexOf(from, i + 1);
  }
  return buf;
}

const urlencoded$2 = {
  parseUrlencodedString: parseUrlencodedString,
  serializeUrlencoded: serializeUrlencoded,
};

const urlencoded$1 = urlencoded$2;

const URLSearchParams$1 = /* @__PURE__ */(function () {
  function URLSearchParams (constructorArgs, ref) {
    let doNotStripQMark = ref.doNotStripQMark; if (doNotStripQMark === void 0) doNotStripQMark = false;

    let init = constructorArgs[0];
    this._list = [];
    this._url = null;

    if (!doNotStripQMark && typeof init === 'string' && init[0] === '?') {
      init = init.slice(1);
    }

    if (Array.isArray(init)) {
      for (const pair of init) {
        if (pair.length !== 2) {
          throw new TypeError("Failed to construct 'URLSearchParams': parameter 1 sequence's element does not "
						+ 'contain exactly two elements.');
        }
        this._list.push([pair[0], pair[1]]);
      }
    }
    else if (typeof init === 'object' && Object.getPrototypeOf(init) === null) {
      for (const name of Object.keys(init)) {
        const value = init[name];
        this._list.push([name, value]);
      }
    }
    else {
      this._list = urlencoded$1.parseUrlencodedString(init);
    }
  }

  URLSearchParams.prototype._updateSteps = function _updateSteps () {
    if (this._url !== null) {
      let query = urlencoded$1.serializeUrlencoded(this._list);
      if (query === '') {
        query = null;
      }
      this._url._url.query = query;
    }
  };

  URLSearchParams.prototype.append = function append (name, value) {
    this._list.push([name, value]);
    this._updateSteps();
  };

  URLSearchParams.prototype.delete = function delete$1 (name) {
    let i = 0;
    while (i < this._list.length) {
      if (this._list[i][0] === name) {
        this._list.splice(i, 1);
      }
      else {
        i++;
      }
    }
    this._updateSteps();
  };

  URLSearchParams.prototype.get = function get (name) {
    for (const tuple of this._list) {
      if (tuple[0] === name) {
        return tuple[1];
      }
    }
    return null;
  };

  URLSearchParams.prototype.getAll = function getAll (name) {
    const output = [];
    for (const tuple of this._list) {
      if (tuple[0] === name) {
        output.push(tuple[1]);
      }
    }
    return output;
  };

  URLSearchParams.prototype.has = function has (name) {
    for (const tuple of this._list) {
      if (tuple[0] === name) {
        return true;
      }
    }
    return false;
  };

  URLSearchParams.prototype.set = function set (name, value) {
    let found = false;
    let i = 0;
    while (i < this._list.length) {
      if (this._list[i][0] === name) {
        if (found) {
          this._list.splice(i, 1);
        }
        else {
          found = true;
          this._list[i][1] = value;
          i++;
        }
      }
      else {
        i++;
      }
    }
    if (!found) {
      this._list.push([name, value]);
    }
    this._updateSteps();
  };

  URLSearchParams.prototype.sort = function sort () {
    this._list.sort(function (a, b) {
      if (a[0] < b[0]) {
        return -1;
      }
      if (a[0] > b[0]) {
        return 1;
      }
      return 0;
    });

    this._updateSteps();
  };

  URLSearchParams.prototype[Symbol.iterator] = function () {
    return this._list[Symbol.iterator]();
  };

  URLSearchParams.prototype.toString = function toString () {
    return urlencoded$1.serializeUrlencoded(this._list);
  };

  return URLSearchParams;
}());

const usm = urlStateMachine.exports;
const urlencoded = urlencoded$2;
const URLSearchParams = URLSearchParams$1;

const URL = /* @__PURE__ */(function () {
  function URL (url, base) {
    let parsedBase = null;
    if (base !== undefined) {
      parsedBase = usm.basicURLParse(base);
      if (parsedBase === null) {
        throw new TypeError(('Invalid base URL: ' + base));
      }
    }

    const parsedURL = usm.basicURLParse(url, { baseURL: parsedBase });
    if (parsedURL === null) {
      throw new TypeError(('Invalid URL: ' + url));
    }

    const query = parsedURL.query !== null ? parsedURL.query : '';

    this._url = parsedURL;

    // We cannot invoke the "new URLSearchParams object" algorithm without going through the constructor, which strips
    // question mark by default. Therefore the doNotStripQMark hack is used.
    this._query = new URLSearchParams([query], { doNotStripQMark: true });
    this._query._url = this;
  }

  const prototypeAccessors = { href: { configurable: true }, origin: { configurable: true }, protocol: { configurable: true }, username: { configurable: true }, password: { configurable: true }, host: { configurable: true }, hostname: { configurable: true }, port: { configurable: true }, pathname: { configurable: true }, search: { configurable: true }, searchParams: { configurable: true }, hash: { configurable: true } };

  prototypeAccessors.href.get = function () {
    return usm.serializeURL(this._url);
  };

  prototypeAccessors.href.set = function (v) {
    const parsedURL = usm.basicURLParse(v);
    if (parsedURL === null) {
      throw new TypeError(('Invalid URL: ' + v));
    }

    this._url = parsedURL;

    this._query._list.splice(0);
    const query = parsedURL.query;
    if (query !== null) {
      this._query._list = urlencoded.parseUrlencodedString(query);
    }
  };

  prototypeAccessors.origin.get = function () {
    return usm.serializeURLOrigin(this._url);
  };

  prototypeAccessors.protocol.get = function () {
    return ((this._url.scheme) + ':');
  };

  prototypeAccessors.protocol.set = function (v) {
    usm.basicURLParse((v + ':'), { url: this._url, stateOverride: 'scheme start' });
  };

  prototypeAccessors.username.get = function () {
    return this._url.username;
  };

  prototypeAccessors.username.set = function (v) {
    if (usm.cannotHaveAUsernamePasswordPort(this._url)) {
      return;
    }

    usm.setTheUsername(this._url, v);
  };

  prototypeAccessors.password.get = function () {
    return this._url.password;
  };

  prototypeAccessors.password.set = function (v) {
    if (usm.cannotHaveAUsernamePasswordPort(this._url)) {
      return;
    }

    usm.setThePassword(this._url, v);
  };

  prototypeAccessors.host.get = function () {
    const url = this._url;

    if (url.host === null) {
      return '';
    }

    if (url.port === null) {
      return usm.serializeHost(url.host);
    }

    return ((usm.serializeHost(url.host)) + ':' + (usm.serializeInteger(url.port)));
  };

  prototypeAccessors.host.set = function (v) {
    if (usm.hasAnOpaquePath(this._url)) {
      return;
    }

    usm.basicURLParse(v, { url: this._url, stateOverride: 'host' });
  };

  prototypeAccessors.hostname.get = function () {
    if (this._url.host === null) {
      return '';
    }

    return usm.serializeHost(this._url.host);
  };

  prototypeAccessors.hostname.set = function (v) {
    if (usm.hasAnOpaquePath(this._url)) {
      return;
    }

    usm.basicURLParse(v, { url: this._url, stateOverride: 'hostname' });
  };

  prototypeAccessors.port.get = function () {
    if (this._url.port === null) {
      return '';
    }

    return usm.serializeInteger(this._url.port);
  };

  prototypeAccessors.port.set = function (v) {
    if (usm.cannotHaveAUsernamePasswordPort(this._url)) {
      return;
    }

    if (v === '') {
      this._url.port = null;
    }
    else {
      usm.basicURLParse(v, { url: this._url, stateOverride: 'port' });
    }
  };

  prototypeAccessors.pathname.get = function () {
    return usm.serializePath(this._url);
  };

  prototypeAccessors.pathname.set = function (v) {
    if (usm.hasAnOpaquePath(this._url)) {
      return;
    }

    this._url.path = [];
    usm.basicURLParse(v, { url: this._url, stateOverride: 'path start' });
  };

  prototypeAccessors.search.get = function () {
    if (this._url.query === null || this._url.query === '') {
      return '';
    }

    return ('?' + (this._url.query));
  };

  prototypeAccessors.search.set = function (v) {
    const url = this._url;

    if (v === '') {
      url.query = null;
      this._query._list = [];
      return;
    }

    const input = v[0] === '?' ? v.substring(1) : v;
    url.query = '';
    usm.basicURLParse(input, { url: url, stateOverride: 'query' });
    this._query._list = urlencoded.parseUrlencodedString(input);
  };

  prototypeAccessors.searchParams.get = function () {
    return this._query;
  };

  prototypeAccessors.hash.get = function () {
    if (this._url.fragment === null || this._url.fragment === '') {
      return '';
    }

    return ('#' + (this._url.fragment));
  };

  prototypeAccessors.hash.set = function (v) {
    if (v === '') {
      this._url.fragment = null;
      return;
    }

    const input = v[0] === '#' ? v.substring(1) : v;
    this._url.fragment = '';
    usm.basicURLParse(input, { url: this._url, stateOverride: 'fragment' });
  };

  URL.prototype.toJSON = function toJSON () {
    return this.href;
  };

  Object.defineProperties(URL.prototype, prototypeAccessors);

  return URL;
}());

export { URL, URLSearchParams };
