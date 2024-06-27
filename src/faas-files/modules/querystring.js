function e (e, n) {
  return Object.prototype.hasOwnProperty.call(e, n);
} const n = function (n, r, t, o) {
  r = r || '&', t = t || '='; const a = {}; if (typeof n !== 'string' || n.length === 0) {
    return a;
  } const u = /\+/g; n = n.split(r); let c = 1e3; o && typeof o.maxKeys === 'number' && (c = o.maxKeys); let i = n.length; c > 0 && i > c && (i = c); for (let s = 0; s < i; ++s) {
    var p; var f; var d; var y; const m = n[s].replace(u, '%20'); const l = m.indexOf(t); l >= 0 ? (p = m.substr(0, l), f = m.substr(l + 1)) : (p = m, f = ''), d = decodeURIComponent(p), y = decodeURIComponent(f), e(a, d) ? Array.isArray(a[d]) ? a[d].push(y) : a[d] = [a[d], y] : a[d] = y;
  } return a;
}; const r = function (e) {
  switch (typeof e) {
    case 'string': return e; case 'boolean': return e ? 'true' : 'false'; case 'number': return isFinite(e) ? e : ''; default: return '';
  }
}; const t = function (e, n, t, o) {
  return n = n || '&', t = t || '=', e === null && (e = void 0), typeof e === 'object'
    ? Object.keys(e).map(function (o) {
      const a = encodeURIComponent(r(o)) + t; return Array.isArray(e[o])
        ? e[o].map(function (e) {
          return a + encodeURIComponent(r(e));
        }).join(n)
        : a + encodeURIComponent(r(e[o]));
    }).join(n)
    : o ? encodeURIComponent(r(o)) + t + encodeURIComponent(r(e)) : '';
}; const o = {}; o.decode = o.parse = n, o.encode = o.stringify = t; o.decode; o.encode; o.parse; o.stringify;

o.decode;
o.encode;
o.parse;
o.stringify;

const decode = o.decode;
const encode = o.encode;
const parse = o.parse;
const stringify = o.stringify;

export { decode, o as default, encode, parse, stringify };
