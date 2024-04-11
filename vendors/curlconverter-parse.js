// The MIT License (MIT)
//
// Copyright (c) 2014-2016 Nick Carneiro
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
//   The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

'use strict';

var Parser = require('tree-sitter');
var Bash = require('@curlconverter/tree-sitter-bash');

class CCError extends Error {
}
const UTF8encoder = new TextEncoder();
// Note: !has() will lead to type errors
// TODO: replace with Object.hasOwn() once Node 16 is EOL'd on 2023-09-11
function has(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
function isInt(s) {
    return /^\s*[+-]?\d+$/.test(s);
}

// Words act like strings. They're lists of characters, except some
// characters can be shell variables or expressions.
// They're implemented like this:
// ["foobar", {type: "variable", value: "baz", text: "$baz"}, "qux"]
// Except for the empty string [""], there should be no empty strings in the array.
// TODO: Words should keep a list of operations that happened to them
// like .replace() so that we can generate code that also does that operation
// on the contents of the environment variable or the output of the command.
class Word {
    constructor(tokens) {
        this.valueOf = Word.toString;
        if (typeof tokens === "string") {
            tokens = [tokens];
        }
        if (tokens === undefined || tokens.length === 0) {
            tokens = [""];
        }
        this.tokens = [];
        for (const t of tokens) {
            if (typeof t === "string") {
                if (this.tokens.length > 0 &&
                    typeof this.tokens[this.tokens.length - 1] === "string") {
                    // If we have 2+ strings in a row, merge them
                    this.tokens[this.tokens.length - 1] += t;
                }
                else if (t) {
                    // skip empty strings
                    this.tokens.push(t);
                }
            }
            else {
                this.tokens.push(t);
            }
        }
        if (this.tokens.length === 0) {
            this.tokens.push("");
        }
    }
    get length() {
        let len = 0;
        for (const t of this.tokens) {
            if (typeof t === "string") {
                len += t.length;
            }
            else {
                len += 1;
            }
        }
        return len;
    }
    *[Symbol.iterator]() {
        for (const t of this.tokens) {
            if (typeof t === "string") {
                for (const c of t) {
                    yield c;
                }
            }
            else {
                yield t;
            }
        }
    }
    // TODO: do we need this function?
    get(index) {
        let i = 0;
        for (const t of this.tokens) {
            if (typeof t === "string") {
                if (i + t.length > index) {
                    return t[index - i];
                }
                i += t.length;
            }
            else {
                if (i === index) {
                    return t;
                }
                i += 1;
            }
        }
        throw new CCError("Index out of bounds");
    }
    charAt(index = 0) {
        try {
            return this.get(index);
        }
        catch (_a) { }
        return "";
    }
    indexOf(search, start) {
        if (start === undefined) {
            start = 0;
        }
        let i = 0;
        for (const t of this.tokens) {
            if (typeof t === "string") {
                if (i + t.length > start) {
                    const index = t.indexOf(search, start - i);
                    if (index !== -1) {
                        return i + index;
                    }
                }
                i += t.length;
            }
            else {
                i += 1;
            }
        }
        return -1;
    }
    // Like indexOf() but accepts a string of characters and returns the index of the first one
    // it finds
    indexOfFirstChar(search) {
        let i = 0;
        for (const t of this.tokens) {
            if (typeof t === "string") {
                for (const c of t) {
                    if (search.includes(c)) {
                        return i;
                    }
                    i += 1;
                }
            }
            else {
                i += 1;
            }
        }
        return -1;
    }
    removeFirstChar(c) {
        if (this.length === 0) {
            return new Word();
        }
        if (this.charAt(0) === c) {
            return this.slice(1);
        }
        return this.copy();
    }
    copy() {
        return new Word(this.tokens);
    }
    slice(indexStart, indexEnd) {
        if (indexStart === undefined) {
            indexStart = this.length;
        }
        if (indexEnd === undefined) {
            indexEnd = this.length;
        }
        if (indexStart >= this.length) {
            return new Word();
        }
        if (indexStart < 0) {
            indexStart = Math.max(indexStart + this.length, 0);
        }
        if (indexEnd < 0) {
            indexEnd = Math.max(indexEnd + this.length, 0);
        }
        if (indexEnd <= indexStart) {
            return new Word();
        }
        const ret = [];
        let i = 0;
        for (const t of this.tokens) {
            if (typeof t === "string") {
                if (i + t.length > indexStart) {
                    if (i < indexEnd) {
                        ret.push(t.slice(Math.max(indexStart - i, 0), indexEnd - i));
                    }
                }
                i += t.length;
            }
            else {
                if (i >= indexStart && i < indexEnd) {
                    ret.push(t);
                }
                i += 1;
            }
        }
        return new Word(ret);
    }
    // TODO: check
    includes(search, start) {
        if (start === undefined) {
            start = 0;
        }
        let i = 0;
        for (const t of this.tokens) {
            if (typeof t === "string") {
                if (i + t.length > start) {
                    if (t.includes(search, start - i)) {
                        return true;
                    }
                }
                i += t.length;
            }
            else {
                i += 1;
            }
        }
        return false;
    }
    test(search) {
        for (const t of this.tokens) {
            if (typeof t === "string") {
                if (search.test(t)) {
                    return true;
                }
            }
        }
        return false;
    }
    prepend(c) {
        const ret = this.copy();
        if (ret.tokens.length && typeof ret.tokens[0] === "string") {
            ret.tokens[0] = c + ret.tokens[0];
        }
        else {
            ret.tokens.unshift(c);
        }
        return ret;
    }
    append(c) {
        const ret = this.copy();
        if (ret.tokens.length &&
            typeof ret.tokens[ret.tokens.length - 1] === "string") {
            ret.tokens[ret.tokens.length - 1] += c;
        }
        else {
            ret.tokens.push(c);
        }
        return ret;
    }
    // Merges two Words
    add(other) {
        return new Word([...this.tokens, ...other.tokens]);
    }
    // Returns the first match, searches each string independently
    // TODO: improve this
    match(regex) {
        for (const t of this.tokens) {
            if (typeof t === "string") {
                const match = t.match(regex);
                if (match) {
                    return match;
                }
            }
        }
        return null;
    }
    search(regex) {
        let offset = 0;
        for (const t of this.tokens) {
            if (typeof t === "string") {
                const match = t.search(regex);
                if (match !== -1) {
                    return offset + match;
                }
                offset += t.length;
            }
        }
        return -1;
    }
    // .replace() is called per-string, so it won't work through shell variables
    replace(search, replacement) {
        const ret = [];
        for (const t of this.tokens) {
            if (typeof t === "string") {
                ret.push(t.replace(search, replacement));
            }
            else {
                ret.push(t);
            }
        }
        return new Word(ret);
    }
    // splits correctly, not like String.split()
    // The last entry can contain the separator if limit entries has been reached
    split(separator, limit) {
        const ret = [];
        let i = 0;
        let start = 0;
        while (i < this.length) {
            let match = true;
            for (let j = 0; j < separator.length; j++) {
                if (this.get(i + j) !== separator.charAt(j)) {
                    match = false;
                    break;
                }
            }
            if (match) {
                ret.push(this.slice(start, i));
                i += separator.length;
                start = i;
                if (limit !== undefined && ret.length === limit - 1) {
                    break;
                }
            }
            else {
                i += 1;
            }
        }
        if (start <= this.length) {
            ret.push(this.slice(start));
        }
        return ret;
    }
    toLowerCase() {
        return new Word(this.tokens.map((t) => (typeof t === "string" ? t.toLowerCase() : t)));
    }
    toUpperCase() {
        return new Word(this.tokens.map((t) => (typeof t === "string" ? t.toUpperCase() : t)));
    }
    trimStart() {
        const ret = [];
        let i, t;
        for ([i, t] of this.tokens.entries()) {
            if (typeof t === "string") {
                if (i === 0) {
                    t = t.trimStart();
                }
                if (t) {
                    ret.push(t);
                }
            }
            else {
                ret.push(t);
            }
        }
        if (ret.length === 0) {
            return new Word();
        }
        return new Word(ret);
    }
    trimEnd() {
        const ret = [];
        let i, t;
        for ([i, t] of this.tokens.entries()) {
            if (typeof t === "string") {
                if (i === this.tokens.length - 1) {
                    t = t.trimEnd();
                }
                if (t) {
                    ret.push(t);
                }
            }
            else {
                ret.push(t);
            }
        }
        if (ret.length === 0) {
            return new Word();
        }
        return new Word(ret);
    }
    trim() {
        const ret = [];
        let i, t;
        for ([i, t] of this.tokens.entries()) {
            if (typeof t === "string") {
                if (i === 0) {
                    t = t.trimStart();
                }
                if (i === this.tokens.length - 1) {
                    t = t.trimEnd();
                }
                if (t) {
                    ret.push(t);
                }
            }
            else {
                ret.push(t);
            }
        }
        if (ret.length === 0) {
            return new Word();
        }
        return new Word(ret);
    }
    isEmpty() {
        if (this.tokens.length === 0) {
            return true;
        }
        if (this.tokens.length === 1 && typeof this.tokens[0] === "string") {
            return this.tokens[0].length === 0;
        }
        return false;
    }
    toBool() {
        return !this.isEmpty();
    }
    // Returns true if .tokens contains no variables/commands
    isString() {
        for (const t of this.tokens) {
            if (typeof t !== "string") {
                return false;
            }
        }
        return true;
    }
    firstShellToken() {
        for (const t of this.tokens) {
            if (typeof t !== "string") {
                return t;
            }
        }
        return null;
    }
    startsWith(prefix) {
        if (this.tokens.length === 0) {
            return false;
        }
        if (typeof this.tokens[0] === "string") {
            return this.tokens[0].startsWith(prefix);
        }
        return false;
    }
    endsWith(suffix) {
        if (this.tokens.length === 0) {
            return false;
        }
        const lastToken = this.tokens[this.tokens.length - 1];
        if (typeof lastToken === "string") {
            return lastToken.endsWith(suffix);
        }
        return false;
    }
    // This destroys the information about the original tokenization
    toString() {
        return this.tokens
            .map((t) => (typeof t === "string" ? t : t.text))
            .join("");
    }
}
function eq(it, other) {
    if (it === undefined ||
        it === null ||
        other === undefined ||
        other === null) {
        return it === other;
    }
    if (typeof other === "string") {
        return (it.tokens.length === 1 &&
            typeof it.tokens[0] === "string" &&
            it.tokens[0] === other);
    }
    return (it.tokens.length === other.tokens.length &&
        it.tokens.every((itToken, i) => {
            const otherToken = other.tokens[i];
            if (typeof itToken === "string") {
                return itToken === otherToken;
            }
            else if (typeof otherToken !== "string") {
                return itToken.text === otherToken.text;
            }
            return false;
        }));
}
function firstShellToken(word) {
    if (typeof word === "string") {
        return null;
    }
    return word.firstShellToken();
}
function mergeWords(...words) {
    const ret = [];
    for (const w of words) {
        if (w instanceof Word) {
            ret.push(...w.tokens);
        }
        else {
            ret.push(w);
        }
    }
    return new Word(ret);
}
function joinWords(words, joinChar) {
    const ret = [];
    for (const w of words) {
        if (ret.length) {
            ret.push(joinChar);
        }
        ret.push(...w.tokens);
    }
    return new Word(ret);
}

const parser = new Parser();
parser.setLanguage(Bash);

function warnf(global, warning) {
    global.warnings.push(warning);
}
function underlineNode(node, curlCommand) {
    // doesn't include leading whitespace
    const command = node.tree.rootNode;
    let startIndex = node.startIndex;
    let endIndex = node.endIndex;
    if (!curlCommand) {
        curlCommand = command.text;
        startIndex -= command.startIndex;
        endIndex -= command.startIndex;
    }
    if (startIndex === endIndex) {
        endIndex++;
    }
    // TODO: \r ?
    let lineStart = startIndex;
    if (startIndex > 0) {
        // If it's -1 we're on the first line
        lineStart = curlCommand.lastIndexOf("\n", startIndex - 1) + 1;
    }
    let underlineLength = endIndex - startIndex;
    let lineEnd = curlCommand.indexOf("\n", startIndex);
    if (lineEnd === -1) {
        lineEnd = curlCommand.length;
    }
    else if (lineEnd < endIndex) {
        // Add extra "^" past the end of a line to signal that the node continues
        underlineLength = lineEnd - startIndex + 1;
    }
    const line = curlCommand.slice(lineStart, lineEnd);
    const underline = " ".repeat(startIndex - lineStart) + "^".repeat(underlineLength);
    return line + "\n" + underline;
}
function warnIfPartsIgnored(request, warnings, support) {
    if (request.urls.length > 1 && !(support === null || support === void 0 ? void 0 : support.multipleUrls)) {
        warnings.push([
            "multiple-urls",
            "found " +
                request.urls.length +
                " URLs, only the first one will be used: " +
                request.urls
                    .map((u) => JSON.stringify(u.originalUrl.toString()))
                    .join(", "),
        ]);
    }
    if (request.dataReadsFile && !(support === null || support === void 0 ? void 0 : support.dataReadsFile)) {
        warnings.push([
            "unsafe-data",
            // TODO: better wording. Could be "body:" too
            "the generated data content is wrong, " +
                // TODO: might not come from "@"
                JSON.stringify("@" + request.dataReadsFile) +
                " means read the file " +
                JSON.stringify(request.dataReadsFile),
        ]);
    }
    if (request.urls[0].queryReadsFile && !(support === null || support === void 0 ? void 0 : support.queryReadsFile)) {
        warnings.push([
            "unsafe-query",
            "the generated URL query string is wrong, " +
                JSON.stringify("@" + request.urls[0].queryReadsFile) +
                " means read the file " +
                JSON.stringify(request.urls[0].queryReadsFile),
        ]);
    }
    if (request.cookieFiles && !(support === null || support === void 0 ? void 0 : support.cookieFiles)) {
        warnings.push([
            "cookie-files",
            "passing a file for --cookie/-b is not supported: " +
                request.cookieFiles.map((c) => JSON.stringify(c.toString())).join(", "),
        ]);
    }
}

const BACKSLASHES = /\\./gs;
function removeBackslash(m) {
    return m.charAt(1) === "\n" ? "" : m.charAt(1);
}
function removeBackslashes(str) {
    return str.replace(BACKSLASHES, removeBackslash);
}
// https://www.gnu.org/software/bash/manual/bash.html#Double-Quotes
const DOUBLE_QUOTE_BACKSLASHES = /\\[\\$`"\n]/gs;
function removeDoubleQuoteBackslashes(str) {
    return str.replace(DOUBLE_QUOTE_BACKSLASHES, removeBackslash);
}
// ANSI-C quoted strings look $'like this'.
// Not all shells have them but Bash does
// https://www.gnu.org/software/bash/manual/html_node/ANSI_002dC-Quoting.html
//
// https://git.savannah.gnu.org/cgit/bash.git/tree/lib/sh/strtrans.c
const ANSI_BACKSLASHES = /\\(\\|a|b|e|E|f|n|r|t|v|'|"|\?|[0-7]{1,3}|x[0-9A-Fa-f]{1,2}|u[0-9A-Fa-f]{1,4}|U[0-9A-Fa-f]{1,8}|c.)/gs;
function removeAnsiCBackslashes(str) {
    function unescapeChar(m) {
        switch (m.charAt(1)) {
            case "\\":
                return "\\";
            case "a":
                return "\x07";
            case "b":
                return "\b";
            case "e":
            case "E":
                return "\x1B";
            case "f":
                return "\f";
            case "n":
                return "\n";
            case "r":
                return "\r";
            case "t":
                return "\t";
            case "v":
                return "\v";
            case "'":
                return "'";
            case '"':
                return '"';
            case "?":
                return "?";
            case "c":
                // Bash handles all characters by considering the first byte
                // of its UTF-8 input and can produce invalid UTF-8, whereas
                // JavaScript stores strings in UTF-16
                if (m.codePointAt(2) > 127) {
                    throw new CCError('non-ASCII control character in ANSI-C quoted string: "\\u{' +
                        m.codePointAt(2).toString(16) +
                        '}"');
                }
                // If this produces a 0x00 (null) character, it will cause bash to
                // terminate the string at that character, but we return the null
                // character in the result.
                return m[2] === "?"
                    ? "\x7F"
                    : String.fromCodePoint(m[2].toUpperCase().codePointAt(0) & 0b00011111);
            case "x":
            case "u":
            case "U":
                // Hexadecimal character literal
                // Unlike bash, this will error if the the code point is greater than 10FFFF
                return String.fromCodePoint(parseInt(m.slice(2), 16));
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
                // Octal character literal
                return String.fromCodePoint(parseInt(m.slice(1), 8) % 256);
            default:
                // There must be a mis-match between ANSI_BACKSLASHES and the switch statement
                throw new CCError("unhandled character in ANSI-C escape code: " + JSON.stringify(m));
        }
    }
    return str.replace(ANSI_BACKSLASHES, unescapeChar);
}
function toTokens(node, curlCommand, warnings) {
    let vals = [];
    switch (node.type) {
        case "word":
            return [removeBackslashes(node.text)];
        case "raw_string":
            return [node.text.slice(1, -1)];
        case "ansi_c_string":
            return [removeAnsiCBackslashes(node.text.slice(2, -1))];
        case "string":
        case "translated_string": {
            // TODO: MISSING quotes, for example
            // curl "example.com
            let prevEnd = node.type === "string" ? 1 : 2;
            let res = "";
            for (const child of node.namedChildren) {
                res += removeDoubleQuoteBackslashes(node.text.slice(prevEnd, child.startIndex - node.startIndex));
                // expansion, simple_expansion or command_substitution (or concat?)
                const subVal = toTokens(child, curlCommand, warnings);
                if (typeof subVal === "string") {
                    res += subVal;
                }
                else {
                    if (res) {
                        vals.push(res);
                        res = "";
                    }
                    vals = vals.concat(subVal);
                }
                prevEnd = child.endIndex - node.startIndex;
            }
            res += removeDoubleQuoteBackslashes(node.text.slice(prevEnd, -1));
            if (res || vals.length === 0) {
                vals.push(res);
            }
            return vals;
        }
        case "simple_expansion":
            // TODO: handle variables downstream
            // '$' + variable_name or special_variable_name
            warnings.push([
                "expansion",
                "found environment variable\n" + underlineNode(node, curlCommand),
            ]);
            if (node.firstNamedChild &&
                node.firstNamedChild.type === "special_variable_name") {
                // https://www.gnu.org/software/bash/manual/bash.html#Special-Parameters
                // TODO: warning isn't printed
                warnings.push([
                    "special_variable_name",
                    node.text +
                        " is a special Bash variable\n" +
                        underlineNode(node.firstNamedChild, curlCommand),
                ]);
            }
            return [
                {
                    type: "variable",
                    value: node.text.slice(1),
                    text: node.text,
                    syntaxNode: node,
                },
            ];
        case "expansion":
            // Expansions look ${like_this}
            // https://www.gnu.org/software/bash/manual/bash.html#Shell-Parameter-Expansion
            // TODO: MISSING }, for example
            // curl example${com
            warnings.push([
                "expansion",
                "found expansion expression\n" + underlineNode(node, curlCommand),
            ]);
            // variable_name or subscript or no child
            // TODO: handle substitutions
            return [
                {
                    type: "variable",
                    value: node.text.slice(2, -1),
                    text: node.text,
                    syntaxNode: node,
                },
            ];
        case "command_substitution":
            // TODO: MISSING ), for example
            // curl example$(com
            warnings.push([
                "expansion",
                "found command substitution expression\n" +
                    underlineNode(node, curlCommand),
            ]);
            return [
                {
                    type: "command",
                    // TODO: further tokenize and pass an array of args
                    // to subprocess.run() or a command name + string args to C#
                    value: node.text.slice(node.text.startsWith("$(") ? 2 : 1, -1),
                    text: node.text,
                    syntaxNode: node,
                },
            ];
        case "concatenation": {
            // item[]=1 turns into item=1 if we don't do this
            // https://github.com/tree-sitter/tree-sitter-bash/issues/104
            let prevEnd = 0;
            let res = "";
            for (const child of node.children) {
                // TODO: removeBackslashes()?
                // Can we get anything other than []{} characters here?
                res += node.text.slice(prevEnd, child.startIndex - node.startIndex);
                prevEnd = child.endIndex - node.startIndex;
                const subVal = toTokens(child, curlCommand, warnings);
                if (typeof subVal === "string") {
                    res += subVal;
                }
                else {
                    if (res) {
                        vals.push(res);
                        res = "";
                    }
                    vals = vals.concat(subVal);
                }
            }
            res += node.text.slice(prevEnd);
            if (res || vals.length === 0) {
                vals.push(res);
            }
            return vals;
        }
        default:
            throw new CCError("unexpected argument type " +
                JSON.stringify(node.type) +
                '. Must be one of "word", "string", "raw_string", "ansi_c_string", "expansion", "simple_expansion", "translated_string" or "concatenation"\n' +
                underlineNode(node, curlCommand));
    }
}
function toWord(node, curlCommand, warnings) {
    return new Word(toTokens(node, curlCommand, warnings));
}
function warnAboutErrorNodes(ast, curlCommand, warnings) {
    // TODO: get only named children?
    const cursor = ast.walk();
    cursor.gotoFirstChild();
    while (cursor.gotoNextSibling()) {
        if (cursor.nodeType === "ERROR") {
            let currentNode = cursor.currentNode;
            try {
                // TreeCursor.currentNode is a property in Node but a function in the browser
                // https://github.com/tree-sitter/tree-sitter/issues/2195
                currentNode = cursor.currentNode();
            }
            catch (_a) { }
            warnings.push([
                "bash",
                `Bash parsing error on line ${cursor.startPosition.row + 1}:\n` +
                    underlineNode(currentNode, curlCommand),
            ]);
            break;
        }
    }
}
function warnAboutUselessBackslash(n, curlCommandLines, warnings) {
    const lastCommandLine = curlCommandLines[n.endPosition.row];
    const impromperBackslash = lastCommandLine.match(/\\\s+$/);
    if (impromperBackslash &&
        curlCommandLines.length > n.endPosition.row + 1 &&
        impromperBackslash.index !== undefined) {
        warnings.push([
            "unescaped-newline",
            "The trailling '\\' on line " +
                (n.endPosition.row + 1) +
                " is followed by whitespace, so it won't escape the newline after it:\n" +
                // TODO: cut off line if it's very long?
                lastCommandLine +
                "\n" +
                " ".repeat(impromperBackslash.index) +
                "^".repeat(impromperBackslash[0].length),
        ]);
    }
}
function extractRedirect(node, curlCommand, warnings) {
    if (!node.childCount) {
        throw new CCError('got empty "redirected_statement" AST node');
    }
    let stdin, stdinFile;
    const [command, ...redirects] = node.namedChildren;
    if (command.type !== "command") {
        throw new CCError('got "redirected_statement" AST node whose first child is not a "command", got ' +
            command.type +
            " instead\n" +
            underlineNode(command, curlCommand));
    }
    if (node.childCount < 2) {
        throw new CCError('got "redirected_statement" AST node with only one child - no redirect');
    }
    if (redirects.length > 1) {
        warnings.push([
            "multiple-redirects",
            // TODO: this is misleading because not all generators use the redirect
            "found " +
                redirects.length +
                " redirect nodes. Only the first one will be used:\n" +
                underlineNode(redirects[1], curlCommand),
        ]);
    }
    const redirect = redirects[0];
    if (redirect.type === "file_redirect") {
        stdinFile = toWord(redirect.namedChildren[0], curlCommand, warnings);
    }
    else if (redirect.type === "heredoc_redirect") {
        // heredoc bodies are children of the parent program node
        // https://github.com/tree-sitter/tree-sitter-bash/issues/118
        if (redirect.namedChildCount < 1) {
            throw new CCError('got "redirected_statement" AST node with heredoc but no heredoc start');
        }
        const heredocStart = redirect.namedChildren[0].text;
        const heredocBody = node.nextNamedSibling;
        if (!heredocBody) {
            throw new CCError('got "redirected_statement" AST node with no heredoc body');
        }
        // TODO: herestrings and heredocs are different
        if (heredocBody.type !== "heredoc_body") {
            throw new CCError('got "redirected_statement" AST node with heredoc but no heredoc body, got ' +
                heredocBody.type +
                " instead");
        }
        // TODO: heredocs can do variable expansion and stuff
        if (heredocStart.length) {
            stdin = new Word(heredocBody.text.slice(0, -heredocStart.length));
        }
        else {
            // this shouldn't happen
            stdin = new Word(heredocBody.text);
        }
    }
    else if (redirect.type === "herestring_redirect") {
        if (redirect.namedChildCount < 1 || !redirect.firstNamedChild) {
            throw new CCError('got "redirected_statement" AST node with empty herestring');
        }
        // TODO: this just converts bash code to text
        stdin = new Word(redirect.firstNamedChild.text);
    }
    else {
        throw new CCError('got "redirected_statement" AST node whose second child is not one of "file_redirect", "heredoc_redirect" or "herestring_redirect", got ' +
            command.type +
            " instead");
    }
    return [command, stdin, stdinFile];
}
function _findCurlInPipeline(node, curlCommand, warnings) {
    let command, stdin, stdinFile;
    for (const child of node.namedChildren) {
        if (child.type === "command") {
            const commandName = child.namedChildren[0];
            if (commandName.type !== "command_name") {
                throw new CCError('got "command" AST node whose first child is not a "command_name", got ' +
                    commandName.type +
                    " instead\n" +
                    underlineNode(commandName, curlCommand));
            }
            const commandNameWord = commandName.namedChildren[0];
            if (commandNameWord.type !== "word") {
                throw new CCError('got "command_name" AST node whose first child is not a "word", got ' +
                    commandNameWord.type +
                    " instead\n" +
                    underlineNode(commandNameWord, curlCommand));
            }
            if (commandNameWord.text === "curl") {
                if (!command) {
                    command = child;
                }
                else {
                    warnings.push([
                        "multiple-curl-in-pipeline",
                        "found multiple curl commands in pipeline:\n" +
                            underlineNode(child, curlCommand),
                    ]);
                }
            }
        }
        else if (child.type === "redirected_statement") {
            const [redirCommand, redirStdin, redirStdinFile] = extractRedirect(child, curlCommand, warnings);
            if (redirCommand.namedChildren[0].text === "curl") {
                if (!command) {
                    [command, stdin, stdinFile] = [
                        redirCommand,
                        redirStdin,
                        redirStdinFile,
                    ];
                }
                else {
                    warnings.push([
                        "multiple-curl-in-pipeline",
                        "found multiple curl commands in pipeline:\n" +
                            underlineNode(redirCommand, curlCommand),
                    ]);
                }
            }
        }
        else if (child.type === "pipeline") {
            // pipelines can be nested
            // https://github.com/tree-sitter/tree-sitter-bash/issues/167
            const [nestedCommand, nestedStdin, nestedStdinFile] = _findCurlInPipeline(child, curlCommand, warnings);
            if (!nestedCommand) {
                continue;
            }
            if (nestedCommand.namedChildren[0].text === "curl") {
                if (!command) {
                    [command, stdin, stdinFile] = [
                        nestedCommand,
                        nestedStdin,
                        nestedStdinFile,
                    ];
                }
                else {
                    warnings.push([
                        "multiple-curl-in-pipeline",
                        "found multiple curl commands in pipeline:\n" +
                            underlineNode(nestedCommand, curlCommand),
                    ]);
                }
            }
        }
    }
    return [command, stdin, stdinFile];
}
// TODO: use pipeline input/output redirects,
// i.e. add stdinCommand and stdout/stdoutFile/stdoutCommand
function findCurlInPipeline(node, curlCommand, warnings) {
    const [command, stdin, stdinFile] = _findCurlInPipeline(node, curlCommand, warnings);
    if (!command) {
        throw new CCError("could not find curl command in pipeline\n" +
            underlineNode(node, curlCommand));
    }
    return [command, stdin, stdinFile];
}
// TODO: check entire AST for ERROR/MISSING nodes
// TODO: get all command nodes
function extractCommandNodes(ast, curlCommand, warnings) {
    // https://github.com/tree-sitter/tree-sitter-bash/blob/master/grammar.js
    // The AST must be in a nice format, i.e.
    // (program
    //   (command
    //     name: (command_name (word))
    //     argument+: (
    //       word |
    //       "string" |
    //       'raw_string' |
    //       $'ansi_c_string' |
    //       $"translated_string" |
    //       ${expansion} |
    //       $simple_expansion |
    //       concatenation)))
    // or
    // (program
    //   (redirected_statement
    //     body: (command, same as above)
    //     redirect))
    // Shouldn't happen.
    if (ast.rootNode.type !== "program") {
        // TODO: better error message.
        throw new CCError(
        // TODO: expand "AST" acronym the first time it appears in an error message
        'expected a "program" top-level AST node, got ' +
            ast.rootNode.type +
            " instead");
    }
    if (ast.rootNode.namedChildCount < 1 || !ast.rootNode.namedChildren) {
        // TODO: better error message.
        throw new CCError('empty "program" node');
    }
    const curlCommandLines = curlCommand.split("\n");
    let sawComment = false;
    const commands = [];
    // Get top-level command and redirected_statement AST nodes, skipping comments
    for (const n of ast.rootNode.namedChildren) {
        switch (n.type) {
            case "comment":
                sawComment = true;
                continue;
            case "command":
                commands.push([n, undefined, undefined]);
                warnAboutUselessBackslash(n, curlCommandLines, warnings);
                break;
            case "redirected_statement":
                commands.push(extractRedirect(n, curlCommand, warnings));
                warnAboutUselessBackslash(n, curlCommandLines, warnings);
                break;
            case "pipeline":
                commands.push(findCurlInPipeline(n, curlCommand, warnings));
                warnAboutUselessBackslash(n, curlCommandLines, warnings);
                break;
            case "heredoc_body": // https://github.com/tree-sitter/tree-sitter-bash/issues/118
                continue;
            case "ERROR":
                throw new CCError(`Bash parsing error on line ${n.startPosition.row + 1}:\n` +
                    underlineNode(n, curlCommand));
            default:
                // TODO: better error message.
                throw new CCError("found " +
                    JSON.stringify(n.type) +
                    ' AST node, only "command", "pipeline" or "redirected_statement" are supported\n' +
                    underlineNode(n, curlCommand));
        }
    }
    if (!commands.length) {
        // NOTE: if you add more node types in the `for` loop above, this error needs to be updated.
        // We would probably need to keep track of the node types we've seen.
        throw new CCError('expected a "command" or "redirected_statement" AST node' +
            (sawComment ? ', only found "comment" nodes' : ""));
    }
    return commands;
}
function toNameAndArgv(command, curlCommand, warnings) {
    if (command.childCount < 1) {
        // TODO: better error message.
        throw new CCError('empty "command" node\n' + underlineNode(command, curlCommand));
    }
    // TODO: add childrenForFieldName to tree-sitter node/web bindings
    let commandNameLoc = 0;
    // TODO: parse variable_assignment nodes and replace variables in the command
    // TODO: support file_redirect
    for (const n of command.namedChildren) {
        if (n.type === "variable_assignment" || n.type === "file_redirect") {
            warnings.push([
                "command-preamble",
                "skipping " +
                    JSON.stringify(n.type) +
                    " expression\n" +
                    underlineNode(n, curlCommand),
            ]);
            commandNameLoc += 1;
        }
        else {
            // it must be the command name
            if (n.type !== "command_name") {
                throw new CCError('expected "command_name", "variable_assignment" or "file_redirect" AST node, found ' +
                    n.type +
                    " instead\n" +
                    underlineNode(n, curlCommand));
            }
            break;
        }
    }
    const [name, ...args] = command.namedChildren.slice(commandNameLoc);
    // Shouldn't happen
    if (name === undefined) {
        throw new CCError('found "command" AST node with no "command_name" child\n' +
            underlineNode(command, curlCommand));
    }
    return [name, args];
}
// Checks that name is "curl"
function nameToWord(name, curlCommand, warnings) {
    if (name.childCount < 1 || !name.firstChild) {
        throw new CCError('found empty "command_name" AST node\n' + underlineNode(name, curlCommand));
    }
    else if (name.childCount > 1) {
        warnings.push([
            "extra-command_name-children",
            'expected "command_name" node to only have one child but it has ' +
                name.childCount,
        ]);
    }
    const nameNode = name.firstChild;
    const nameWord = toWord(nameNode, curlCommand, warnings);
    const nameWordStr = nameWord.toString();
    const cmdNameShellToken = firstShellToken(nameWord);
    if (cmdNameShellToken) {
        // The most common reason for the command name to contain an expression
        // is probably users accidentally copying a $ from the shell prompt
        // without a space after it
        if (nameWordStr !== "$curl") {
            // TODO: or just assume it evaluates to "curl"?
            throw new CCError("expected command name to be a simple value but found a " +
                cmdNameShellToken.type +
                "\n" +
                underlineNode(cmdNameShellToken.syntaxNode, curlCommand));
        }
    }
    else if (nameWordStr.trim() !== "curl") {
        const c = nameWordStr.trim();
        if (!c) {
            throw new CCError("found command without a command_name\n" +
                underlineNode(nameNode, curlCommand));
        }
        throw new CCError('command should begin with "curl" but instead begins with ' +
            JSON.stringify(clip(c)) +
            "\n" +
            underlineNode(nameNode, curlCommand));
    }
    return nameWord;
}
function tokenize(curlCommand, warnings = []) {
    const ast = parser.parse(curlCommand);
    warnAboutErrorNodes(ast, curlCommand, warnings);
    // TODO: pass syntax nodes for each token downstream and use it to
    // highlight the problematic parts in warnings/errors so that it's clear
    // which command a warning/error is for
    const commandNodes = extractCommandNodes(ast, curlCommand, warnings);
    const commands = [];
    for (const [command, stdin, stdinFile] of commandNodes) {
        const [name, argv] = toNameAndArgv(command, curlCommand, warnings);
        commands.push([
            [
                nameToWord(name, curlCommand, warnings),
                ...argv.map((arg) => toWord(arg, curlCommand, warnings)),
            ],
            stdin,
            stdinFile,
        ]);
    }
    return commands;
}

const CURLAUTH_BASIC = 1 << 0;
const CURLAUTH_DIGEST = 1 << 1;
const CURLAUTH_NEGOTIATE = 1 << 2;
const CURLAUTH_NTLM = 1 << 3;
const CURLAUTH_DIGEST_IE = 1 << 4;
const CURLAUTH_NTLM_WB = 1 << 5;
const CURLAUTH_BEARER = 1 << 6;
const CURLAUTH_AWS_SIGV4 = 1 << 7;
const CURLAUTH_ANY = ~CURLAUTH_DIGEST_IE;
// This is this function
// https://github.com/curl/curl/blob/curl-7_86_0/lib/http.c#L455
// which is not the correct function, since it works on the response.
//
// Curl also filters out auth schemes it doesn't support,
// https://github.com/curl/curl/blob/curl-7_86_0/lib/setopt.c#L970
// but we "support" all of them, so we don't need to do that.
function pickAuth(mask) {
    if (mask === CURLAUTH_ANY) {
        return "basic";
    }
    const auths = [
        [CURLAUTH_NEGOTIATE, "negotiate"],
        [CURLAUTH_BEARER, "bearer"],
        [CURLAUTH_DIGEST, "digest"],
        [CURLAUTH_NTLM, "ntlm"],
        [CURLAUTH_NTLM_WB, "ntlm-wb"],
        [CURLAUTH_BASIC, "basic"],
        // This check happens outside this function because we obviously
        // don't need to to specify --no-basic to use aws-sigv4
        // https://github.com/curl/curl/blob/curl-7_86_0/lib/setopt.c#L678-L679
        [CURLAUTH_AWS_SIGV4, "aws-sigv4"],
    ];
    for (const [auth, authName] of auths) {
        if (mask & auth) {
            return authName;
        }
    }
    return "none";
}

// prettier-ignore
const curlLongOpts = {
    // BEGIN EXTRACTED OPTIONS
    "url": { type: "string", name: "url" },
    "dns-ipv4-addr": { type: "string", name: "dns-ipv4-addr" },
    "dns-ipv6-addr": { type: "string", name: "dns-ipv6-addr" },
    "random-file": { type: "string", name: "random-file" },
    "egd-file": { type: "string", name: "egd-file" },
    "oauth2-bearer": { type: "string", name: "oauth2-bearer" },
    "connect-timeout": { type: "string", name: "connect-timeout" },
    "doh-url": { type: "string", name: "doh-url" },
    "ciphers": { type: "string", name: "ciphers" },
    "dns-interface": { type: "string", name: "dns-interface" },
    "disable-epsv": { type: "bool", name: "disable-epsv" },
    "no-disable-epsv": { type: "bool", name: "disable-epsv", expand: false },
    "disallow-username-in-url": { type: "bool", name: "disallow-username-in-url" },
    "no-disallow-username-in-url": { type: "bool", name: "disallow-username-in-url", expand: false },
    "epsv": { type: "bool", name: "epsv" },
    "no-epsv": { type: "bool", name: "epsv", expand: false },
    "dns-servers": { type: "string", name: "dns-servers" },
    "trace": { type: "string", name: "trace" },
    "npn": { type: "bool", name: "npn" },
    "no-npn": { type: "bool", name: "npn", expand: false },
    "trace-ascii": { type: "string", name: "trace-ascii" },
    "alpn": { type: "bool", name: "alpn" },
    "no-alpn": { type: "bool", name: "alpn", expand: false },
    "limit-rate": { type: "string", name: "limit-rate" },
    "rate": { type: "string", name: "rate" },
    "compressed": { type: "bool", name: "compressed" },
    "no-compressed": { type: "bool", name: "compressed", expand: false },
    "tr-encoding": { type: "bool", name: "tr-encoding" },
    "no-tr-encoding": { type: "bool", name: "tr-encoding", expand: false },
    "digest": { type: "bool", name: "digest" },
    "no-digest": { type: "bool", name: "digest", expand: false },
    "negotiate": { type: "bool", name: "negotiate" },
    "no-negotiate": { type: "bool", name: "negotiate", expand: false },
    "ntlm": { type: "bool", name: "ntlm" },
    "no-ntlm": { type: "bool", name: "ntlm", expand: false },
    "ntlm-wb": { type: "bool", name: "ntlm-wb" },
    "no-ntlm-wb": { type: "bool", name: "ntlm-wb", expand: false },
    "basic": { type: "bool", name: "basic" },
    "no-basic": { type: "bool", name: "basic", expand: false },
    "anyauth": { type: "bool", name: "anyauth" },
    "no-anyauth": { type: "bool", name: "anyauth", expand: false },
    "wdebug": { type: "bool", name: "wdebug" },
    "no-wdebug": { type: "bool", name: "wdebug", expand: false },
    "ftp-create-dirs": { type: "bool", name: "ftp-create-dirs" },
    "no-ftp-create-dirs": { type: "bool", name: "ftp-create-dirs", expand: false },
    "create-dirs": { type: "bool", name: "create-dirs" },
    "no-create-dirs": { type: "bool", name: "create-dirs", expand: false },
    "create-file-mode": { type: "string", name: "create-file-mode" },
    "max-redirs": { type: "string", name: "max-redirs" },
    "proxy-ntlm": { type: "bool", name: "proxy-ntlm" },
    "no-proxy-ntlm": { type: "bool", name: "proxy-ntlm", expand: false },
    "crlf": { type: "bool", name: "crlf" },
    "no-crlf": { type: "bool", name: "crlf", expand: false },
    "stderr": { type: "string", name: "stderr" },
    "aws-sigv4": { type: "string", name: "aws-sigv4" },
    "interface": { type: "string", name: "interface" },
    "krb": { type: "string", name: "krb" },
    "krb4": { type: "string", name: "krb" },
    "haproxy-protocol": { type: "bool", name: "haproxy-protocol" },
    "no-haproxy-protocol": { type: "bool", name: "haproxy-protocol", expand: false },
    "haproxy-clientip": { type: "string", name: "haproxy-clientip" },
    "max-filesize": { type: "string", name: "max-filesize" },
    "disable-eprt": { type: "bool", name: "disable-eprt" },
    "no-disable-eprt": { type: "bool", name: "disable-eprt", expand: false },
    "eprt": { type: "bool", name: "eprt" },
    "no-eprt": { type: "bool", name: "eprt", expand: false },
    "xattr": { type: "bool", name: "xattr" },
    "no-xattr": { type: "bool", name: "xattr", expand: false },
    "ftp-ssl": { type: "bool", name: "ssl" },
    "no-ftp-ssl": { type: "bool", name: "ssl", expand: false },
    "ssl": { type: "bool", name: "ssl" },
    "no-ssl": { type: "bool", name: "ssl", expand: false },
    "ftp-pasv": { type: "bool", name: "ftp-pasv" },
    "no-ftp-pasv": { type: "bool", name: "ftp-pasv", expand: false },
    "socks5": { type: "string", name: "socks5" },
    "tcp-nodelay": { type: "bool", name: "tcp-nodelay" },
    "no-tcp-nodelay": { type: "bool", name: "tcp-nodelay", expand: false },
    "proxy-digest": { type: "bool", name: "proxy-digest" },
    "no-proxy-digest": { type: "bool", name: "proxy-digest", expand: false },
    "proxy-basic": { type: "bool", name: "proxy-basic" },
    "no-proxy-basic": { type: "bool", name: "proxy-basic", expand: false },
    "retry": { type: "string", name: "retry" },
    "retry-connrefused": { type: "bool", name: "retry-connrefused" },
    "no-retry-connrefused": { type: "bool", name: "retry-connrefused", expand: false },
    "retry-delay": { type: "string", name: "retry-delay" },
    "retry-max-time": { type: "string", name: "retry-max-time" },
    "proxy-negotiate": { type: "bool", name: "proxy-negotiate" },
    "no-proxy-negotiate": { type: "bool", name: "proxy-negotiate", expand: false },
    "form-escape": { type: "bool", name: "form-escape" },
    "no-form-escape": { type: "bool", name: "form-escape", expand: false },
    "ftp-account": { type: "string", name: "ftp-account" },
    "proxy-anyauth": { type: "bool", name: "proxy-anyauth" },
    "no-proxy-anyauth": { type: "bool", name: "proxy-anyauth", expand: false },
    "trace-time": { type: "bool", name: "trace-time" },
    "no-trace-time": { type: "bool", name: "trace-time", expand: false },
    "ignore-content-length": { type: "bool", name: "ignore-content-length" },
    "no-ignore-content-length": { type: "bool", name: "ignore-content-length", expand: false },
    "ftp-skip-pasv-ip": { type: "bool", name: "ftp-skip-pasv-ip" },
    "no-ftp-skip-pasv-ip": { type: "bool", name: "ftp-skip-pasv-ip", expand: false },
    "ftp-method": { type: "string", name: "ftp-method" },
    "local-port": { type: "string", name: "local-port" },
    "socks4": { type: "string", name: "socks4" },
    "socks4a": { type: "string", name: "socks4a" },
    "ftp-alternative-to-user": { type: "string", name: "ftp-alternative-to-user" },
    "ftp-ssl-reqd": { type: "bool", name: "ssl-reqd" },
    "no-ftp-ssl-reqd": { type: "bool", name: "ssl-reqd", expand: false },
    "ssl-reqd": { type: "bool", name: "ssl-reqd" },
    "no-ssl-reqd": { type: "bool", name: "ssl-reqd", expand: false },
    "sessionid": { type: "bool", name: "sessionid" },
    "no-sessionid": { type: "bool", name: "sessionid", expand: false },
    "ftp-ssl-control": { type: "bool", name: "ftp-ssl-control" },
    "no-ftp-ssl-control": { type: "bool", name: "ftp-ssl-control", expand: false },
    "ftp-ssl-ccc": { type: "bool", name: "ftp-ssl-ccc" },
    "no-ftp-ssl-ccc": { type: "bool", name: "ftp-ssl-ccc", expand: false },
    "ftp-ssl-ccc-mode": { type: "string", name: "ftp-ssl-ccc-mode" },
    "libcurl": { type: "string", name: "libcurl" },
    "raw": { type: "bool", name: "raw" },
    "no-raw": { type: "bool", name: "raw", expand: false },
    "post301": { type: "bool", name: "post301" },
    "no-post301": { type: "bool", name: "post301", expand: false },
    "keepalive": { type: "bool", name: "keepalive" },
    "no-keepalive": { type: "bool", name: "keepalive", expand: false },
    "socks5-hostname": { type: "string", name: "socks5-hostname" },
    "keepalive-time": { type: "string", name: "keepalive-time" },
    "post302": { type: "bool", name: "post302" },
    "no-post302": { type: "bool", name: "post302", expand: false },
    "noproxy": { type: "string", name: "noproxy" },
    "socks5-gssapi-nec": { type: "bool", name: "socks5-gssapi-nec" },
    "no-socks5-gssapi-nec": { type: "bool", name: "socks5-gssapi-nec", expand: false },
    "proxy1.0": { type: "string", name: "proxy1.0" },
    "tftp-blksize": { type: "string", name: "tftp-blksize" },
    "mail-from": { type: "string", name: "mail-from" },
    "mail-rcpt": { type: "string", name: "mail-rcpt" },
    "ftp-pret": { type: "bool", name: "ftp-pret" },
    "no-ftp-pret": { type: "bool", name: "ftp-pret", expand: false },
    "proto": { type: "string", name: "proto" },
    "proto-redir": { type: "string", name: "proto-redir" },
    "resolve": { type: "string", name: "resolve" },
    "delegation": { type: "string", name: "delegation" },
    "mail-auth": { type: "string", name: "mail-auth" },
    "post303": { type: "bool", name: "post303" },
    "no-post303": { type: "bool", name: "post303", expand: false },
    "metalink": { type: "bool", name: "metalink" },
    "no-metalink": { type: "bool", name: "metalink", expand: false },
    "sasl-authzid": { type: "string", name: "sasl-authzid" },
    "sasl-ir": { type: "bool", name: "sasl-ir" },
    "no-sasl-ir": { type: "bool", name: "sasl-ir", expand: false },
    "test-event": { type: "bool", name: "test-event" },
    "no-test-event": { type: "bool", name: "test-event", expand: false },
    "unix-socket": { type: "string", name: "unix-socket" },
    "path-as-is": { type: "bool", name: "path-as-is" },
    "no-path-as-is": { type: "bool", name: "path-as-is", expand: false },
    "socks5-gssapi-service": { type: "string", name: "proxy-service-name" },
    "proxy-service-name": { type: "string", name: "proxy-service-name" },
    "service-name": { type: "string", name: "service-name" },
    "proto-default": { type: "string", name: "proto-default" },
    "expect100-timeout": { type: "string", name: "expect100-timeout" },
    "tftp-no-options": { type: "bool", name: "tftp-no-options" },
    "no-tftp-no-options": { type: "bool", name: "tftp-no-options", expand: false },
    "connect-to": { type: "string", name: "connect-to" },
    "abstract-unix-socket": { type: "string", name: "abstract-unix-socket" },
    "tls-max": { type: "string", name: "tls-max" },
    "suppress-connect-headers": { type: "bool", name: "suppress-connect-headers" },
    "no-suppress-connect-headers": { type: "bool", name: "suppress-connect-headers", expand: false },
    "compressed-ssh": { type: "bool", name: "compressed-ssh" },
    "no-compressed-ssh": { type: "bool", name: "compressed-ssh", expand: false },
    "happy-eyeballs-timeout-ms": { type: "string", name: "happy-eyeballs-timeout-ms" },
    "retry-all-errors": { type: "bool", name: "retry-all-errors" },
    "no-retry-all-errors": { type: "bool", name: "retry-all-errors", expand: false },
    "trace-ids": { type: "bool", name: "trace-ids" },
    "no-trace-ids": { type: "bool", name: "trace-ids", expand: false },
    "http1.0": { type: "bool", name: "http1.0" },
    "http1.1": { type: "bool", name: "http1.1" },
    "http2": { type: "bool", name: "http2" },
    "http2-prior-knowledge": { type: "bool", name: "http2-prior-knowledge" },
    "http3": { type: "bool", name: "http3" },
    "http3-only": { type: "bool", name: "http3-only" },
    "http0.9": { type: "bool", name: "http0.9" },
    "no-http0.9": { type: "bool", name: "http0.9", expand: false },
    "proxy-http2": { type: "bool", name: "proxy-http2" },
    "no-proxy-http2": { type: "bool", name: "proxy-http2", expand: false },
    "tlsv1": { type: "bool", name: "tlsv1" },
    "tlsv1.0": { type: "bool", name: "tlsv1.0" },
    "tlsv1.1": { type: "bool", name: "tlsv1.1" },
    "tlsv1.2": { type: "bool", name: "tlsv1.2" },
    "tlsv1.3": { type: "bool", name: "tlsv1.3" },
    "tls13-ciphers": { type: "string", name: "tls13-ciphers" },
    "proxy-tls13-ciphers": { type: "string", name: "proxy-tls13-ciphers" },
    "sslv2": { type: "bool", name: "sslv2" },
    "sslv3": { type: "bool", name: "sslv3" },
    "ipv4": { type: "bool", name: "ipv4" },
    "ipv6": { type: "bool", name: "ipv6" },
    "append": { type: "bool", name: "append" },
    "no-append": { type: "bool", name: "append", expand: false },
    "user-agent": { type: "string", name: "user-agent" },
    "cookie": { type: "string", name: "cookie" },
    "alt-svc": { type: "string", name: "alt-svc" },
    "hsts": { type: "string", name: "hsts" },
    "use-ascii": { type: "bool", name: "use-ascii" },
    "no-use-ascii": { type: "bool", name: "use-ascii", expand: false },
    "cookie-jar": { type: "string", name: "cookie-jar" },
    "continue-at": { type: "string", name: "continue-at" },
    "data": { type: "string", name: "data" },
    "data-raw": { type: "string", name: "data-raw" },
    "data-ascii": { type: "string", name: "data-ascii" },
    "data-binary": { type: "string", name: "data-binary" },
    "data-urlencode": { type: "string", name: "data-urlencode" },
    "json": { type: "string", name: "json" },
    "url-query": { type: "string", name: "url-query" },
    "dump-header": { type: "string", name: "dump-header" },
    "referer": { type: "string", name: "referer" },
    "cert": { type: "string", name: "cert" },
    "cacert": { type: "string", name: "cacert" },
    "cert-type": { type: "string", name: "cert-type" },
    "key": { type: "string", name: "key" },
    "key-type": { type: "string", name: "key-type" },
    "pass": { type: "string", name: "pass" },
    "engine": { type: "string", name: "engine" },
    "ca-native": { type: "bool", name: "ca-native" },
    "no-ca-native": { type: "bool", name: "ca-native", expand: false },
    "proxy-ca-native": { type: "bool", name: "proxy-ca-native" },
    "no-proxy-ca-native": { type: "bool", name: "proxy-ca-native", expand: false },
    "capath": { type: "string", name: "capath" },
    "pubkey": { type: "string", name: "pubkey" },
    "hostpubmd5": { type: "string", name: "hostpubmd5" },
    "hostpubsha256": { type: "string", name: "hostpubsha256" },
    "crlfile": { type: "string", name: "crlfile" },
    "tlsuser": { type: "string", name: "tlsuser" },
    "tlspassword": { type: "string", name: "tlspassword" },
    "tlsauthtype": { type: "string", name: "tlsauthtype" },
    "ssl-allow-beast": { type: "bool", name: "ssl-allow-beast" },
    "no-ssl-allow-beast": { type: "bool", name: "ssl-allow-beast", expand: false },
    "ssl-auto-client-cert": { type: "bool", name: "ssl-auto-client-cert" },
    "no-ssl-auto-client-cert": { type: "bool", name: "ssl-auto-client-cert", expand: false },
    "proxy-ssl-auto-client-cert": { type: "bool", name: "proxy-ssl-auto-client-cert" },
    "no-proxy-ssl-auto-client-cert": { type: "bool", name: "proxy-ssl-auto-client-cert", expand: false },
    "pinnedpubkey": { type: "string", name: "pinnedpubkey" },
    "proxy-pinnedpubkey": { type: "string", name: "proxy-pinnedpubkey" },
    "cert-status": { type: "bool", name: "cert-status" },
    "no-cert-status": { type: "bool", name: "cert-status", expand: false },
    "doh-cert-status": { type: "bool", name: "doh-cert-status" },
    "no-doh-cert-status": { type: "bool", name: "doh-cert-status", expand: false },
    "false-start": { type: "bool", name: "false-start" },
    "no-false-start": { type: "bool", name: "false-start", expand: false },
    "ssl-no-revoke": { type: "bool", name: "ssl-no-revoke" },
    "no-ssl-no-revoke": { type: "bool", name: "ssl-no-revoke", expand: false },
    "ssl-revoke-best-effort": { type: "bool", name: "ssl-revoke-best-effort" },
    "no-ssl-revoke-best-effort": { type: "bool", name: "ssl-revoke-best-effort", expand: false },
    "tcp-fastopen": { type: "bool", name: "tcp-fastopen" },
    "no-tcp-fastopen": { type: "bool", name: "tcp-fastopen", expand: false },
    "proxy-tlsuser": { type: "string", name: "proxy-tlsuser" },
    "proxy-tlspassword": { type: "string", name: "proxy-tlspassword" },
    "proxy-tlsauthtype": { type: "string", name: "proxy-tlsauthtype" },
    "proxy-cert": { type: "string", name: "proxy-cert" },
    "proxy-cert-type": { type: "string", name: "proxy-cert-type" },
    "proxy-key": { type: "string", name: "proxy-key" },
    "proxy-key-type": { type: "string", name: "proxy-key-type" },
    "proxy-pass": { type: "string", name: "proxy-pass" },
    "proxy-ciphers": { type: "string", name: "proxy-ciphers" },
    "proxy-crlfile": { type: "string", name: "proxy-crlfile" },
    "proxy-ssl-allow-beast": { type: "bool", name: "proxy-ssl-allow-beast" },
    "no-proxy-ssl-allow-beast": { type: "bool", name: "proxy-ssl-allow-beast", expand: false },
    "login-options": { type: "string", name: "login-options" },
    "proxy-cacert": { type: "string", name: "proxy-cacert" },
    "proxy-capath": { type: "string", name: "proxy-capath" },
    "proxy-insecure": { type: "bool", name: "proxy-insecure" },
    "no-proxy-insecure": { type: "bool", name: "proxy-insecure", expand: false },
    "proxy-tlsv1": { type: "bool", name: "proxy-tlsv1" },
    "socks5-basic": { type: "bool", name: "socks5-basic" },
    "no-socks5-basic": { type: "bool", name: "socks5-basic", expand: false },
    "socks5-gssapi": { type: "bool", name: "socks5-gssapi" },
    "no-socks5-gssapi": { type: "bool", name: "socks5-gssapi", expand: false },
    "etag-save": { type: "string", name: "etag-save" },
    "etag-compare": { type: "string", name: "etag-compare" },
    "curves": { type: "string", name: "curves" },
    "fail": { type: "bool", name: "fail" },
    "no-fail": { type: "bool", name: "fail", expand: false },
    "fail-early": { type: "bool", name: "fail-early" },
    "no-fail-early": { type: "bool", name: "fail-early", expand: false },
    "styled-output": { type: "bool", name: "styled-output" },
    "no-styled-output": { type: "bool", name: "styled-output", expand: false },
    "mail-rcpt-allowfails": { type: "bool", name: "mail-rcpt-allowfails" },
    "no-mail-rcpt-allowfails": { type: "bool", name: "mail-rcpt-allowfails", expand: false },
    "fail-with-body": { type: "bool", name: "fail-with-body" },
    "no-fail-with-body": { type: "bool", name: "fail-with-body", expand: false },
    "remove-on-error": { type: "bool", name: "remove-on-error" },
    "no-remove-on-error": { type: "bool", name: "remove-on-error", expand: false },
    "form": { type: "string", name: "form" },
    "form-string": { type: "string", name: "form-string" },
    "globoff": { type: "bool", name: "globoff" },
    "no-globoff": { type: "bool", name: "globoff", expand: false },
    "get": { type: "bool", name: "get" },
    "no-get": { type: "bool", name: "get", expand: false },
    "request-target": { type: "string", name: "request-target" },
    "help": { type: "bool", name: "help" },
    "no-help": { type: "bool", name: "help", expand: false },
    "header": { type: "string", name: "header" },
    "proxy-header": { type: "string", name: "proxy-header" },
    "include": { type: "bool", name: "include" },
    "no-include": { type: "bool", name: "include", expand: false },
    "head": { type: "bool", name: "head" },
    "no-head": { type: "bool", name: "head", expand: false },
    "junk-session-cookies": { type: "bool", name: "junk-session-cookies" },
    "no-junk-session-cookies": { type: "bool", name: "junk-session-cookies", expand: false },
    "remote-header-name": { type: "bool", name: "remote-header-name" },
    "no-remote-header-name": { type: "bool", name: "remote-header-name", expand: false },
    "insecure": { type: "bool", name: "insecure" },
    "no-insecure": { type: "bool", name: "insecure", expand: false },
    "doh-insecure": { type: "bool", name: "doh-insecure" },
    "no-doh-insecure": { type: "bool", name: "doh-insecure", expand: false },
    "config": { type: "string", name: "config" },
    "list-only": { type: "bool", name: "list-only" },
    "no-list-only": { type: "bool", name: "list-only", expand: false },
    "location": { type: "bool", name: "location" },
    "no-location": { type: "bool", name: "location", expand: false },
    "location-trusted": { type: "bool", name: "location-trusted" },
    "no-location-trusted": { type: "bool", name: "location-trusted", expand: false },
    "max-time": { type: "string", name: "max-time" },
    "manual": { type: "bool", name: "manual" },
    "no-manual": { type: "bool", name: "manual", expand: false },
    "netrc": { type: "bool", name: "netrc" },
    "no-netrc": { type: "bool", name: "netrc", expand: false },
    "netrc-optional": { type: "bool", name: "netrc-optional" },
    "no-netrc-optional": { type: "bool", name: "netrc-optional", expand: false },
    "netrc-file": { type: "string", name: "netrc-file" },
    "buffer": { type: "bool", name: "buffer" },
    "no-buffer": { type: "bool", name: "buffer", expand: false },
    "output": { type: "string", name: "output" },
    "remote-name": { type: "bool", name: "remote-name" },
    "no-remote-name": { type: "bool", name: "remote-name", expand: false },
    "remote-name-all": { type: "bool", name: "remote-name-all" },
    "no-remote-name-all": { type: "bool", name: "remote-name-all", expand: false },
    "output-dir": { type: "string", name: "output-dir" },
    "clobber": { type: "bool", name: "clobber" },
    "no-clobber": { type: "bool", name: "clobber", expand: false },
    "proxytunnel": { type: "bool", name: "proxytunnel" },
    "no-proxytunnel": { type: "bool", name: "proxytunnel", expand: false },
    "ftp-port": { type: "string", name: "ftp-port" },
    "disable": { type: "bool", name: "disable" },
    "no-disable": { type: "bool", name: "disable", expand: false },
    "quote": { type: "string", name: "quote" },
    "range": { type: "string", name: "range" },
    "remote-time": { type: "bool", name: "remote-time" },
    "no-remote-time": { type: "bool", name: "remote-time", expand: false },
    "silent": { type: "bool", name: "silent" },
    "no-silent": { type: "bool", name: "silent", expand: false },
    "show-error": { type: "bool", name: "show-error" },
    "no-show-error": { type: "bool", name: "show-error", expand: false },
    "telnet-option": { type: "string", name: "telnet-option" },
    "upload-file": { type: "string", name: "upload-file" },
    "user": { type: "string", name: "user" },
    "proxy-user": { type: "string", name: "proxy-user" },
    "verbose": { type: "bool", name: "verbose" },
    "no-verbose": { type: "bool", name: "verbose", expand: false },
    "version": { type: "bool", name: "version" },
    "no-version": { type: "bool", name: "version", expand: false },
    "write-out": { type: "string", name: "write-out" },
    "proxy": { type: "string", name: "proxy" },
    "preproxy": { type: "string", name: "preproxy" },
    "request": { type: "string", name: "request" },
    "speed-limit": { type: "string", name: "speed-limit" },
    "speed-time": { type: "string", name: "speed-time" },
    "time-cond": { type: "string", name: "time-cond" },
    "parallel": { type: "bool", name: "parallel" },
    "no-parallel": { type: "bool", name: "parallel", expand: false },
    "parallel-max": { type: "string", name: "parallel-max" },
    "parallel-immediate": { type: "bool", name: "parallel-immediate" },
    "no-parallel-immediate": { type: "bool", name: "parallel-immediate", expand: false },
    "progress-bar": { type: "bool", name: "progress-bar" },
    "no-progress-bar": { type: "bool", name: "progress-bar", expand: false },
    "progress-meter": { type: "bool", name: "progress-meter" },
    "no-progress-meter": { type: "bool", name: "progress-meter", expand: false },
    "next": { type: "bool", name: "next" },
    // END EXTRACTED OPTIONS
    // These are options that curl used to have.
    // Those that don't conflict with the current options are supported by curlconverter.
    // TODO: curl's --long-options can be shortened.
    // For example if curl used to only have a single option, "--blah" then
    // "--bla" "--bl" and "--b" all used to be valid options as well. If later
    // "--blaz" was added, suddenly those 3 shortened options are removed (because
    // they are now ambiguous).
    // https://github.com/curlconverter/curlconverter/pull/280#issuecomment-931241328
    port: { type: "string", name: "port", removed: "7.3" },
    // These are now shoretened forms of --upload-file and --continue-at
    //upload: { type: "bool", name: "upload", removed: "7.7" },
    //continue: { type: "bool", name: "continue", removed: "7.9" },
    "ftp-ascii": { type: "bool", name: "use-ascii", removed: "7.10.7" },
    "3p-url": { type: "string", name: "3p-url", removed: "7.16.0" },
    "3p-user": { type: "string", name: "3p-user", removed: "7.16.0" },
    "3p-quote": { type: "string", name: "3p-quote", removed: "7.16.0" },
    "http2.0": { type: "bool", name: "http2", removed: "7.36.0" },
    "no-http2.0": { type: "bool", name: "http2", removed: "7.36.0" },
    "telnet-options": { type: "string", name: "telnet-option", removed: "7.49.0" },
    "http-request": { type: "string", name: "request", removed: "7.49.0" },
    // --socks is now an ambiguous shortening of --socks4, --socks5 and a bunch more
    //socks: { type: "string", name: "socks5", removed: "7.49.0" },
    "capath ": { type: "string", name: "capath", removed: "7.49.0" },
    ftpport: { type: "string", name: "ftp-port", removed: "7.49.0" },
    environment: { type: "bool", name: "environment", removed: "7.54.1" },
    // These never had any effect
    "no-tlsv1": { type: "bool", name: "tlsv1", removed: "7.54.1" },
    "no-tlsv1.2": { type: "bool", name: "tlsv1.2", removed: "7.54.1" },
    "no-http2-prior-knowledge": { type: "bool", name: "http2-prior-knowledge", removed: "7.54.1" },
    "no-ipv6": { type: "bool", name: "ipv6", removed: "7.54.1" },
    "no-ipv4": { type: "bool", name: "ipv4", removed: "7.54.1" },
    "no-sslv2": { type: "bool", name: "sslv2", removed: "7.54.1" },
    "no-tlsv1.0": { type: "bool", name: "tlsv1.0", removed: "7.54.1" },
    "no-tlsv1.1": { type: "bool", name: "tlsv1.1", removed: "7.54.1" },
    "no-sslv3": { type: "bool", name: "sslv3", removed: "7.54.1" },
    "no-http1.0": { type: "bool", name: "http1.0", removed: "7.54.1" },
    "no-next": { type: "bool", name: "next", removed: "7.54.1" },
    "no-tlsv1.3": { type: "bool", name: "tlsv1.3", removed: "7.54.1" },
    "no-environment": { type: "bool", name: "environment", removed: "7.54.1" },
    "no-http1.1": { type: "bool", name: "http1.1", removed: "7.54.1" },
    "no-proxy-tlsv1": { type: "bool", name: "proxy-tlsv1", removed: "7.54.1" },
    "no-http2": { type: "bool", name: "http2", removed: "7.54.1" },
};
// curl lets you not type the full argument as long as it's unambiguous.
// So --sil instead of --silent is okay, --s is not.
const curlLongOptsShortened = {};
for (const [opt, val] of Object.entries(curlLongOpts)) {
    const expand = "expand" in val ? val.expand : true;
    const removed = "removed" in val ? val.removed : false;
    if (expand && !removed) {
        for (let i = 1; i < opt.length; i++) {
            const shortenedOpt = opt.slice(0, i);
            if (!Object.prototype.hasOwnProperty.call(curlLongOptsShortened, shortenedOpt)) {
                if (!Object.prototype.hasOwnProperty.call(curlLongOpts, shortenedOpt)) {
                    curlLongOptsShortened[shortenedOpt] = val;
                }
            }
            else {
                // If more than one option shortens to this, it's ambiguous
                curlLongOptsShortened[shortenedOpt] = null;
            }
        }
    }
}
// Arguments which are supported by all generators, because they're
// easy to implement or because they're handled by upstream code and
// affect something that's easy to implement.
const COMMON_SUPPORTED_ARGS = [
    "url",
    "proto-default",
    // Method
    "request",
    "get",
    "head",
    "no-head",
    // Headers
    "header",
    "user-agent",
    "referer",
    "range",
    "time-cond",
    "cookie",
    "oauth2-bearer",
    // Basic Auth
    "user",
    "basic",
    "no-basic",
    // Data
    "data",
    "data-raw",
    "data-ascii",
    "data-binary",
    "data-urlencode",
    "json",
    "url-query",
    // Trivial support for globoff means controlling whether or not
    // backslash-escaped [] {} will have the backslash removed.
    "globoff",
    // curl will exit if it finds auth credentials in the URL with this option,
    // we remove it from the URL and emit a warning instead.
    "disallow-username-in-url",
    // TODO: --compressed is already the default for some runtimes, in
    // which case we might have to only warn that --no-compressed isn't supported.
];
function toBoolean(opt) {
    if (opt.startsWith("no-disable-")) {
        return true;
    }
    if (opt.startsWith("disable-") || opt.startsWith("no-")) {
        return false;
    }
    return true;
}
// prettier-ignore
const curlShortOpts = {
    // BEGIN EXTRACTED SHORT OPTIONS
    "0": "http1.0",
    "1": "tlsv1",
    "2": "sslv2",
    "3": "sslv3",
    "4": "ipv4",
    "6": "ipv6",
    "a": "append",
    "A": "user-agent",
    "b": "cookie",
    "B": "use-ascii",
    "c": "cookie-jar",
    "C": "continue-at",
    "d": "data",
    "D": "dump-header",
    "e": "referer",
    "E": "cert",
    "f": "fail",
    "F": "form",
    "g": "globoff",
    "G": "get",
    "h": "help",
    "H": "header",
    "i": "include",
    "I": "head",
    "j": "junk-session-cookies",
    "J": "remote-header-name",
    "k": "insecure",
    "K": "config",
    "l": "list-only",
    "L": "location",
    "m": "max-time",
    "M": "manual",
    "n": "netrc",
    "N": "no-buffer",
    "o": "output",
    "O": "remote-name",
    "p": "proxytunnel",
    "P": "ftp-port",
    "q": "disable",
    "Q": "quote",
    "r": "range",
    "R": "remote-time",
    "s": "silent",
    "S": "show-error",
    "t": "telnet-option",
    "T": "upload-file",
    "u": "user",
    "U": "proxy-user",
    "v": "verbose",
    "V": "version",
    "w": "write-out",
    "x": "proxy",
    "X": "request",
    "Y": "speed-limit",
    "y": "speed-time",
    "z": "time-cond",
    "Z": "parallel",
    "#": "progress-bar",
    ":": "next",
    // END EXTRACTED SHORT OPTIONS
};
const changedShortOpts = {
    p: "used to be short for --port <port> (a since-deleted flag) until curl 7.3",
    // TODO: some of these might be renamed options
    t: "used to be short for --upload (a since-deleted boolean flag) until curl 7.7",
    c: "used to be short for --continue (a since-deleted boolean flag) until curl 7.9",
    // TODO: did -@ actually work?
    "@": "used to be short for --create-dirs until curl 7.10.7",
    Z: "used to be short for --max-redirs <num> until curl 7.10.7",
    9: "used to be short for --crlf until curl 7.10.8",
    8: "used to be short for --stderr <file> until curl 7.10.8",
    7: "used to be short for --interface <name> until curl 7.10.8",
    6: "used to be short for --krb <level> (which itself used to be --krb4 <level>) until curl 7.10.8",
    // TODO: did these short options ever actually work?
    5: "used to be another way to specify the url until curl 7.10.8",
    "*": "used to be another way to specify the url until curl 7.49.0",
    "~": "used to be short for --xattr until curl 7.49.0",
};
// type Satisfies<T, U extends T> = void;
// type AssertSubsetKeys = Satisfies<
//   keyof typeof curlLongOpts | "authtype" | "authArgs",
//   keyof OperationConfig
// >;
// These options can be specified more than once, they
// are always returned as a list.
// For all other options, if you specify it more than once
// curl will use the last one.
const canBeList = new Set([
    "authArgs",
    "connect-to",
    "cookie",
    "data",
    "form",
    "header",
    "hsts",
    "mail-rcpt",
    "output",
    "proxy-header",
    "quote",
    "resolve",
    "telnet-option",
    "upload-file",
    "url-query",
    "url",
]);
function checkSupported(global, lookup, longArg, supportedOpts) {
    if (supportedOpts && !supportedOpts.has(longArg.name)) {
        // TODO: better message. include generator name?
        warnf(global, [
            longArg.name,
            lookup +
                " is not a supported option" +
                (longArg.removed ? ", it was removed in curl " + longArg.removed : ""),
        ]);
    }
}
function pushProp(obj, prop, value) {
    if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
        obj[prop] = [];
    }
    obj[prop].push(value);
    return obj;
}
function pushArgValue(global, config, argName, value) {
    // Note: cli.ts assumes that the property names on OperationConfig
    // are the same as the passed in argument in an error message, so
    // if you do something like
    // echo curl example.com | curlconverter - --data-raw foo
    // The error message will say
    // "if you pass --stdin or -, you can't also pass --data"
    // instead of "--data-raw".
    switch (argName) {
        case "data":
        case "data-ascii":
            return pushProp(config, "data", ["data", value]);
        case "data-binary":
            return pushProp(config, "data", [
                // Unless it's a file, --data-binary works the same as --data
                value.startsWith("@") ? "binary" : "data",
                value,
            ]);
        case "data-raw":
            return pushProp(config, "data", [
                // Unless it's a file, --data-raw works the same as --data
                value.startsWith("@") ? "raw" : "data",
                value,
            ]);
        case "data-urlencode":
            return pushProp(config, "data", ["urlencode", value]);
        case "json":
            config.json = true;
            return pushProp(config, "data", ["json", value]);
        case "url-query":
            if (value.startsWith("+")) {
                return pushProp(config, "url-query", ["raw", value.slice(1)]);
            }
            return pushProp(config, "url-query", ["urlencode", value]);
        case "form":
            return pushProp(config, "form", { value, type: "form" });
        case "form-string":
            return pushProp(config, "form", { value, type: "string" });
        case "aws-sigv4":
            pushProp(config, "authArgs", [argName, true]); // error reporting
            config.authtype |= CURLAUTH_AWS_SIGV4;
            break;
        case "oauth2-bearer":
            pushProp(config, "authArgs", [argName, true]); // error reporting
            config.authtype |= CURLAUTH_BEARER;
            break;
        case "unix-socket":
        case "abstract-unix-socket":
            // Ignore distinction
            // TODO: this makes the error message wrong
            // TODO: what's the difference?
            pushProp(config, "unix-socket", value);
            break;
        case "trace":
        case "trace-ascii":
        case "stderr":
        case "libcurl":
        case "config":
        case "parallel-max":
            global[argName] = value;
            break;
        case "language": // --language is a curlconverter specific option
            global[argName] = value.toString();
            return;
    }
    return pushProp(config, argName, value);
}
// Might create a new config
function setArgValue(global, config, argName, toggle) {
    switch (argName) {
        case "digest":
            pushProp(config, "authArgs", [argName, toggle]); // error reporting
            if (toggle) {
                config.authtype |= CURLAUTH_DIGEST;
            }
            else {
                config.authtype &= ~CURLAUTH_DIGEST;
            }
            break;
        case "negotiate":
            pushProp(config, "authArgs", [argName, toggle]); // error reporting
            if (toggle) {
                config.authtype |= CURLAUTH_NEGOTIATE;
            }
            else {
                config.authtype &= ~CURLAUTH_NEGOTIATE;
            }
            break;
        case "ntlm":
            pushProp(config, "authArgs", [argName, toggle]); // error reporting
            if (toggle) {
                config.authtype |= CURLAUTH_NTLM;
            }
            else {
                config.authtype &= ~CURLAUTH_NTLM;
            }
            break;
        case "ntlm-wb":
            pushProp(config, "authArgs", [argName, toggle]); // error reporting
            if (toggle) {
                config.authtype |= CURLAUTH_NTLM_WB;
            }
            else {
                config.authtype &= ~CURLAUTH_NTLM_WB;
            }
            break;
        case "basic":
            pushProp(config, "authArgs", [argName, toggle]); // error reporting
            if (toggle) {
                config.authtype |= CURLAUTH_BASIC;
            }
            else {
                config.authtype &= ~CURLAUTH_BASIC;
            }
            break;
        case "anyauth":
            pushProp(config, "authArgs", [argName, toggle]); // error reporting
            if (toggle) {
                config.authtype = CURLAUTH_ANY;
            }
            break;
        case "location":
            config["location"] = toggle;
            break;
        case "location-trusted":
            config["location"] = toggle;
            config["location-trusted"] = toggle;
            break;
        case "verbose":
        case "version":
        case "trace-time":
        case "test-event":
        case "progress-bar":
        case "progress-meter":
        case "fail-early":
        case "styled-output":
        case "help":
        case "silent":
        case "show-error":
        case "parallel":
        case "parallel-immediate":
        case "stdin": // --stdin or - is a curlconverter specific option
            global[argName] = toggle;
            break;
        case "next":
            // curl ignores --next if the last url node doesn't have a url
            if (toggle &&
                config.url &&
                config.url.length > 0 &&
                config.url.length >= (config["upload-file"] || []).length &&
                config.url.length >= (config.output || []).length) {
                config = { authtype: CURLAUTH_BASIC };
                global.configs.push(config);
            }
            break;
        default:
            config[argName] = toggle;
    }
    return config;
}
function parseArgs(args, longOpts = curlLongOpts, shortenedLongOpts = curlLongOptsShortened, shortOpts = curlShortOpts, supportedOpts, warnings = []) {
    let config = { authtype: CURLAUTH_BASIC };
    const global = { configs: [config], warnings };
    for (let i = 1, stillflags = true; i < args.length; i++) {
        const arg = args[i];
        if (stillflags && arg.startsWith("-")) {
            if (eq(arg, "--")) {
                /* This indicates the end of the flags and thus enables the
                   following (URL) argument to start with -. */
                stillflags = false;
            }
            else if (arg.startsWith("--")) {
                const shellToken = firstShellToken(arg);
                if (shellToken) {
                    // TODO: if there's any text after the "--" or after the variable
                    // we could narrow it down.
                    throw new CCError("this " +
                        shellToken.type +
                        " could " +
                        (shellToken.type === "command" ? "return" : "be") +
                        " anything\n" +
                        underlineNode(shellToken.syntaxNode));
                }
                const argStr = arg.toString();
                const lookup = argStr.slice(2);
                let longArg = shortenedLongOpts[lookup];
                if (typeof longArg === "undefined") {
                    longArg = longOpts[lookup];
                }
                if (longArg === null) {
                    throw new CCError("option " + argStr + ": is ambiguous");
                }
                if (typeof longArg === "undefined") {
                    // TODO: extract a list of deleted arguments to check here
                    throw new CCError("option " + argStr + ": is unknown");
                }
                if (longArg.type === "string") {
                    i++;
                    if (i >= args.length) {
                        throw new CCError("option " + argStr + ": requires parameter");
                    }
                    pushArgValue(global, config, longArg.name, args[i]);
                }
                else {
                    config = setArgValue(global, config, longArg.name, toBoolean(argStr.slice(2))); // TODO: all shortened args work correctly?
                }
                checkSupported(global, argStr, longArg, supportedOpts);
            }
            else {
                // Short option. These can look like
                // -X POST    -> {request: 'POST'}
                // or
                // -XPOST     -> {request: 'POST'}
                // or multiple options
                // -ABCX POST -> {A: true, B: true, C: true, request: 'POST'}
                // or multiple options and a value for the last one
                // -ABCXPOST  -> {A: true, B: true, C: true, request: 'POST'}
                // "-" passed to curl as an argument raises an error,
                // curlconverter's command line uses it to read from stdin
                if (arg.length === 1) {
                    if (Object.prototype.hasOwnProperty.call(shortOpts, "")) {
                        const shortFor = shortOpts[""];
                        const longArg = longOpts[shortFor];
                        if (longArg === null) {
                            throw new CCError("option -: is unknown");
                        }
                        config = setArgValue(global, config, longArg.name, toBoolean(shortFor));
                    }
                    else {
                        throw new CCError("option -: is unknown");
                    }
                }
                for (let j = 1; j < arg.length; j++) {
                    const jthChar = arg.get(j);
                    if (typeof jthChar !== "string") {
                        // A bash variable in the middle of a short option
                        throw new CCError("this " +
                            jthChar.type +
                            " could " +
                            (jthChar.type === "command" ? "return" : "be") +
                            " anything\n" +
                            underlineNode(jthChar.syntaxNode));
                    }
                    if (!has(shortOpts, jthChar)) {
                        if (has(changedShortOpts, jthChar)) {
                            throw new CCError("option " + arg + ": " + changedShortOpts[jthChar]);
                        }
                        // TODO: there are a few deleted short options we could report
                        throw new CCError("option " + arg + ": is unknown");
                    }
                    const lookup = jthChar;
                    const shortFor = shortOpts[lookup];
                    const longArg = longOpts[shortFor];
                    if (longArg === null) {
                        // This could happen if curlShortOpts points to a renamed option or has a typo
                        throw new CCError("ambiguous short option -" + jthChar);
                    }
                    if (longArg.type === "string") {
                        let val;
                        if (j + 1 < arg.length) {
                            // treat -XPOST as -X POST
                            val = arg.slice(j + 1);
                            j = arg.length;
                        }
                        else if (i + 1 < args.length) {
                            i++;
                            val = args[i];
                        }
                        else {
                            throw new CCError("option " + arg.toString() + ": requires parameter");
                        }
                        pushArgValue(global, config, longArg.name, val);
                    }
                    else {
                        // Use shortFor because -N is short for --no-buffer
                        // and we want to end up with {buffer: false}
                        config = setArgValue(global, config, longArg.name, toBoolean(shortFor));
                    }
                    if (lookup) {
                        checkSupported(global, "-" + lookup, longArg, supportedOpts);
                    }
                }
            }
        }
        else {
            if (typeof arg !== "string" &&
                arg.tokens.length &&
                typeof arg.tokens[0] !== "string") {
                const isOrBeginsWith = arg.tokens.length === 1 ? "is" : "begins with";
                warnings.push([
                    "ambiguous argument",
                    "argument " +
                        isOrBeginsWith +
                        " a " +
                        arg.tokens[0].type +
                        ", assuming it's a URL\n" +
                        underlineNode(arg.tokens[0].syntaxNode),
                ]);
            }
            pushArgValue(global, config, "url", arg);
        }
    }
    for (const cfg of global.configs) {
        for (const [arg, values] of Object.entries(cfg)) {
            if (Array.isArray(values) && !canBeList.has(arg)) {
                cfg[arg] = values[values.length - 1];
            }
        }
    }
    return global;
}

// https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Standard_request_fields
// and then searched for "#" in the RFCs that define each header
const COMMA_SEPARATED = new Set([
    "A-IM",
    "Accept",
    "Accept-Charset",
    // "Accept-Datetime",
    "Accept-Encoding",
    "Accept-Language",
    // "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    // TODO: auth-scheme [ 1*SP ( token68 / #auth-param ) ]
    // "Authorization",
    "Cache-Control",
    "Connection",
    "Content-Encoding",
    // "Content-Length",
    // "Content-MD5",
    // "Content-Type", // semicolon
    // "Cookie", // semicolon
    // "Date",
    "Expect",
    "Forwarded",
    // "From",
    // "Host",
    // "HTTP2-Settings",
    "If-Match",
    // "If-Modified-Since",
    "If-None-Match",
    // "If-Range",
    // "If-Unmodified-Since",
    // "Max-Forwards",
    // "Origin",
    // "Pragma",
    // "Prefer", // semicolon
    // "Proxy-Authorization",
    "Range",
    // "Referer",
    "TE",
    "Trailer",
    "Transfer-Encoding",
    // "User-Agent",
    "Upgrade",
    "Via",
    "Warning",
].map((h) => h.toLowerCase()));
const SEMICOLON_SEPARATED = new Set(["Content-Type", "Cookie", "Prefer"].map((h) => h.toLowerCase()));
class Headers {
    constructor(headerArgs, warnings = []) {
        let headers = [];
        if (headerArgs) {
            for (const header of headerArgs) {
                if (header.startsWith("@")) {
                    warnings.push([
                        "header-file",
                        "passing a file for --header/-H is not supported: " +
                            JSON.stringify(header.toString()),
                    ]);
                    continue;
                }
                if (header.includes(":")) {
                    const [name, value] = header.split(":", 2);
                    const nameToken = firstShellToken(name);
                    if (nameToken) {
                        warnings.push([
                            "header-expression",
                            "ignoring " +
                                nameToken.type +
                                " in header name\n" +
                                underlineNode(nameToken.syntaxNode),
                        ]);
                    }
                    // TODO: whitespace-only headers are treated incosistently.
                    // curl -H 'Hosts: ' example.com sends the header
                    // curl -H 'User-Agent: ' example.com doesn't
                    const hasValue = value && value.trim().toBool();
                    const headerValue = hasValue ? value.removeFirstChar(" ") : null;
                    headers.push([name, headerValue]);
                }
                else if (header.includes(";")) {
                    const [name] = header.split(";", 2);
                    headers.push([name, new Word()]);
                }
                else ;
            }
        }
        this.lowercase =
            headers.length > 0 && headers.every((h) => eq(h[0], h[0].toLowerCase()));
        // Handle repeated headers
        // For Cookie and Accept, merge the values using ';' and ',' respectively
        // For other headers, warn about the repeated header
        const uniqueHeaders = {};
        for (const [name, value] of headers) {
            // TODO: something better, at least warn that variable is ignored
            const lowerName = name.toLowerCase().toString();
            if (!uniqueHeaders[lowerName]) {
                uniqueHeaders[lowerName] = [];
            }
            uniqueHeaders[lowerName].push([name, value]);
        }
        headers = [];
        for (const [lowerName, repeatedHeaders] of Object.entries(uniqueHeaders)) {
            if (repeatedHeaders.length === 1) {
                headers.push(repeatedHeaders[0]);
                continue;
            }
            // If they're all null, just use the first one
            if (repeatedHeaders.every((h) => h[1] === null)) {
                const lastRepeat = repeatedHeaders[repeatedHeaders.length - 1];
                // Warn users if some are capitalized differently
                if (new Set(repeatedHeaders.map((h) => h[0])).size > 1) {
                    warnings.push([
                        "repeated-header",
                        `"${lastRepeat[0]}" header unset ${repeatedHeaders.length} times`,
                    ]);
                }
                headers.push(lastRepeat);
                continue;
            }
            // Otherwise there's at least one non-null value, so we can ignore the nulls
            // TODO: if the values of the repeated headers are the same, just use the first one
            //     'content-type': 'application/json; application/json',
            // doesn't really make sense
            const nonEmptyHeaders = repeatedHeaders.filter((h) => h[1] !== null);
            if (nonEmptyHeaders.length === 1) {
                headers.push(nonEmptyHeaders[0]);
                continue;
            }
            let mergeChar = "";
            if (COMMA_SEPARATED.has(lowerName)) {
                mergeChar = ", ";
            }
            else if (SEMICOLON_SEPARATED.has(lowerName)) {
                mergeChar = "; ";
            }
            if (mergeChar) {
                const merged = joinWords(nonEmptyHeaders.map((h) => h[1]), mergeChar);
                warnings.push([
                    "repeated-header",
                    `merged ${nonEmptyHeaders.length} "${nonEmptyHeaders[nonEmptyHeaders.length - 1][0]}" headers together with "${mergeChar.trim()}"`,
                ]);
                headers.push([nonEmptyHeaders[0][0], merged]);
                continue;
            }
            warnings.push([
                "repeated-header",
                `found ${nonEmptyHeaders.length} "${nonEmptyHeaders[nonEmptyHeaders.length - 1][0]}" headers, only the last one will be sent`,
            ]);
            headers = headers.concat(nonEmptyHeaders);
        }
        this.headers = headers;
    }
    get length() {
        return this.headers.length;
    }
    *[Symbol.iterator]() {
        for (const h of this.headers) {
            yield h;
        }
    }
    // Gets the first header, matching case-insensitively
    get(header) {
        const lookup = header.toLowerCase();
        for (const [h, v] of this.headers) {
            if (h.toLowerCase().toString() === lookup) {
                return v;
            }
        }
        return undefined;
    }
    getContentType() {
        const contentTypeHeader = this.get("content-type");
        if (!contentTypeHeader) {
            return contentTypeHeader;
        }
        return contentTypeHeader.split(";")[0].trim().toString();
    }
    has(header) {
        const lookup = header.toLowerCase();
        for (const h of this.headers) {
            if (eq(h[0].toLowerCase(), lookup)) {
                return true;
            }
        }
        return false;
    }
    // Doesn't overwrite existing headers
    setIfMissing(header, value) {
        if (this.has(header)) {
            return false;
        }
        if (this.lowercase) {
            header = header.toLowerCase();
        }
        const k = typeof header === "string" ? new Word(header) : header;
        const v = typeof value === "string" ? new Word(value) : value;
        this.headers.push([k, v]);
        return true;
    }
    prependIfMissing(header, value) {
        if (this.has(header)) {
            return false;
        }
        if (this.lowercase) {
            header = header.toLowerCase();
        }
        const k = typeof header === "string" ? new Word(header) : header;
        const v = typeof value === "string" ? new Word(value) : value;
        this.headers.unshift([k, v]);
        return true;
    }
    set(header, value) {
        if (this.lowercase) {
            header = header.toLowerCase();
        }
        const k = typeof header === "string" ? new Word(header) : header;
        const v = typeof value === "string" ? new Word(value) : value;
        // keep it in the same place if we overwrite
        const searchHeader = k.toLowerCase().toString();
        for (let i = 0; i < this.headers.length; i++) {
            if (eq(this.headers[i][0].toLowerCase(), searchHeader)) {
                this.headers[i][1] = v;
                return;
            }
        }
        this.headers.push([k, v]);
    }
    delete(header) {
        const lookup = header.toLowerCase();
        for (let i = this.headers.length - 1; i >= 0; i--) {
            if (this.headers[i][0].toLowerCase().toString() === lookup) {
                this.headers.splice(i, 1);
            }
        }
    }
    // TODO: doesn't this skip the next element after deleting?
    clearNulls() {
        for (let i = this.headers.length - 1; i >= 0; i--) {
            if (this.headers[i][1] === null) {
                this.headers.splice(i, 1);
            }
        }
    }
    // TODO: shouldn't be used
    count(header) {
        let count = 0;
        const lookup = header.toLowerCase();
        for (const h of this.headers || []) {
            if (h[0].toLowerCase().toString() === lookup) {
                count += 1;
            }
        }
        return count;
    }
    toBool() {
        return this.headers.length > 0 && this.headers.some((h) => h[1] !== null);
    }
}
function parseCookiesStrict(cookieString) {
    const cookies = [];
    for (let cookie of cookieString.split(";")) {
        cookie = cookie.replace(/^ /, "");
        const [name, value] = cookie.split("=", 2);
        if (value === undefined) {
            return null;
        }
        cookies.push([name, value]);
    }
    if (new Set(cookies.map((c) => c[0])).size !== cookies.length) {
        return null;
    }
    return cookies;
}
function parseCookies(cookieString) {
    const cookies = [];
    for (let cookie of cookieString.split(";")) {
        cookie = cookie.trim();
        if (!cookie) {
            continue;
        }
        const [name, value] = cookie.split("=", 2);
        cookies.push([name.trim(), (value || "").trim()]);
    }
    if (new Set(cookies.map((c) => c[0])).size !== cookies.length) {
        return null;
    }
    return cookies;
}

// https://github.com/curl/curl/blob/curl-7_88_1/src/tool_urlglob.c#L327
const MAX_IP6LEN = 128;
function isIpv6(glob) {
    if (glob.length > MAX_IP6LEN) {
        return false;
    }
    // TODO: curl tries to parse the glob as a hostname.
    return !glob.includes("-");
}
function warnAboutGlobs(global, url) {
    // Find any glob expressions in the URL and underline them
    let prev = "";
    for (let i = 0; i < url.length; i++) {
        const cur = url[i];
        if (cur === "[" && prev !== "\\") {
            let j = i + 1;
            while (j < url.length && url[j] !== "]") {
                j++;
            }
            if (j < url.length && url[j] === "]") {
                const glob = url.slice(i, j + 1);
                // could be ipv6 address
                if (!isIpv6(glob)) {
                    warnf(global, [
                        "glob-in-url",
                        `globs in the URL are not supported:\n` +
                            `${url}\n` +
                            " ".repeat(i) +
                            "^".repeat(glob.length),
                    ]);
                }
                prev = "";
            }
            else {
                // No closing bracket
                warnf(global, [
                    "unbalanced-glob",
                    "bracket doesn't have a closing bracket:\n" +
                        `${url}\n` +
                        `${" ".repeat(i)}^`,
                ]);
                return; // malformed URL, stop looking for globs
            }
        }
        else if (cur === "{" && prev !== "\\") {
            let j = i + 1;
            while (j < url.length && url[j] !== "}") {
                j++;
            }
            if (j < url.length && url[j] === "}") {
                const glob = url.slice(i, j + 1);
                warnf(global, [
                    "glob-in-url",
                    `globs in the URL are not supported:\n` +
                        `${url}\n` +
                        " ".repeat(i) +
                        "^".repeat(glob.length),
                ]);
                prev = "";
            }
            else {
                // No closing bracket
                warnf(global, [
                    "unbalanced-glob",
                    "bracket doesn't have a closing bracket:\n" +
                        `${url}\n` +
                        `${" ".repeat(i)}^`,
                ]);
                return; // malformed URL, stop looking for globs
            }
        }
        prev = cur;
    }
}
function parseurl(global, config, url) {
    var _a;
    // This is curl's parseurl()
    // https://github.com/curl/curl/blob/curl-7_85_0/lib/urlapi.c#L1144
    // Except we want to accept all URLs.
    // curl further validates URLs in curl_url_get()
    // https://github.com/curl/curl/blob/curl-7_86_0/lib/urlapi.c#L1374
    const u = {
        scheme: new Word(),
        host: new Word(),
        port: new Word(),
        path: new Word(),
        query: new Word(),
        fragment: new Word(), // with leading '#'
    };
    // Remove url glob escapes
    // https://github.com/curl/curl/blob/curl-7_87_0/src/tool_urlglob.c#L395-L398
    if (!config.globoff) {
        if (url.isString()) {
            warnAboutGlobs(global, url.toString());
        }
        url = url.replace(/\\([[\]{}])/g, "$1");
    }
    // Prepend "http"/"https" if the scheme is missing.
    // RFC 3986 3.1 says
    //   scheme      = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
    // but curl will accept a digit/plus/minus/dot in the first character
    // curl will also accept a url with one / like http:/localhost
    // https://github.com/curl/curl/blob/curl-7_85_0/lib/urlapi.c#L960
    let schemeMatch = null;
    if (url.tokens.length && typeof url.tokens[0] === "string") {
        schemeMatch = url.tokens[0].match(/^([a-zA-Z0-9+-.]*):\/\/*/);
    }
    if (schemeMatch) {
        const [schemeAndSlashes, scheme] = schemeMatch;
        u.scheme = new Word(scheme.toLowerCase());
        url = url.slice(schemeAndSlashes.length);
    }
    else {
        // curl defaults to https://
        // we don't because most libraries won't downgrade to http
        // if you ask for https, unlike curl.
        // TODO: handle file:// scheme
        u.scheme = (_a = config["proto-default"]) !== null && _a !== void 0 ? _a : new Word("http");
    }
    if (!eq(u.scheme, "http") && !eq(u.scheme, "https")) {
        warnf(global, ["bad-scheme", `Protocol "${u.scheme}" not supported`]);
    }
    // https://github.com/curl/curl/blob/curl-7_85_0/lib/urlapi.c#L992
    const hostMatch = url.indexOfFirstChar("/?#");
    if (hostMatch !== -1) {
        u.host = url.slice(0, hostMatch);
        // TODO: u.path might end up empty if indexOfFirstChar found ?#
        u.path = url.slice(hostMatch); // keep leading '/' in .path
        // https://github.com/curl/curl/blob/curl-7_85_0/lib/urlapi.c#L1024
        const fragmentIndex = u.path.indexOf("#");
        const queryIndex = u.path.indexOf("?");
        if (fragmentIndex !== -1) {
            u.fragment = u.path.slice(fragmentIndex);
            if (queryIndex !== -1 && queryIndex < fragmentIndex) {
                u.query = u.path.slice(queryIndex, fragmentIndex);
                u.path = u.path.slice(0, queryIndex);
            }
            else {
                u.path = u.path.slice(0, fragmentIndex);
            }
        }
        else if (queryIndex !== -1) {
            u.query = u.path.slice(queryIndex);
            u.path = u.path.slice(0, queryIndex);
        }
    }
    else {
        u.host = url;
    }
    // parse username:password@hostname
    // https://github.com/curl/curl/blob/curl-7_85_0/lib/urlapi.c#L1083
    // https://github.com/curl/curl/blob/curl-7_85_0/lib/urlapi.c#L460
    // https://github.com/curl/curl/blob/curl-7_85_0/lib/url.c#L2827
    const authMatch = u.host.indexOf("@");
    if (authMatch !== -1) {
        const auth = u.host.slice(0, authMatch);
        u.host = u.host.slice(authMatch + 1); // throw away '@'
        if (!config["disallow-username-in-url"]) {
            u.auth = auth;
            if (auth.includes(":")) {
                [u.user, u.password] = auth.split(":", 2);
            }
            else {
                u.user = auth;
                u.password = new Word(); // if there's no ':', curl will append it
            }
        }
        else {
            // Curl will exit if this is the case, but we just remove it from the URL
            warnf(global, [
                "login-denied",
                `Found auth in URL but --disallow-username-in-url was passed: ${auth.toString()}`,
            ]);
        }
    }
    // TODO: need to extract port first
    // hostname_check()
    // https://github.com/curl/curl/blob/curl-7_86_0/lib/urlapi.c#L572
    // if (!u.host) {
    //   warnf(global, [
    //     "no-host",
    //     "Found empty host in URL: " + JSON.stringify(url),
    //   ]);
    // } else if (u.host.startsWith("[")) {
    //   if (!u.host.endsWith("]")) {
    //     warnf(global, [
    //       "bad-host",
    //       "Found invalid IPv6 address in URL: " + JSON.stringify(url),
    //     ]);
    //   } else {
    //     const firstWeirdCharacter = u.host.match(/[^0123456789abcdefABCDEF:.]/);
    //     // %zone_id
    //     if (firstWeirdCharacter && firstWeirdCharacter[0] !== "%") {
    //       warnf(global, [
    //         "bad-host",
    //         "Found invalid IPv6 address in URL: " + JSON.stringify(url),
    //       ]);
    //     }
    //   }
    // } else {
    //   const firstInvalidCharacter = u.host.match(
    //     /[\r\n\t/:#?!@{}[\]\\$'"^`*<>=;,]/
    //   );
    //   if (firstInvalidCharacter) {
    //     warnf(global, [
    //       "bad-host",
    //       "Found invalid character " +
    //         JSON.stringify(firstInvalidCharacter[0]) +
    //         " in URL: " +
    //         JSON.stringify(url),
    //     ]);
    //   }
    // }
    return u;
}

// Match Python's urllib.parse.quote() behavior
// https://github.com/python/cpython/blob/3.11/Lib/urllib/parse.py#L826
// curl and Python let you send non-ASCII characters by encoding each UTF-8 byte.
// TODO: ignore hex case?
function _percentEncode(s) {
    return [...UTF8encoder.encode(s)]
        .map((b) => {
        if (
        // A-Z
        (b >= 0x41 && b <= 0x5a) ||
            // a-z
            (b >= 0x61 && b <= 0x7a) ||
            // 0-9
            (b >= 0x30 && b <= 0x39) ||
            // -._~
            b === 0x2d ||
            b === 0x2e ||
            b === 0x5f ||
            b === 0x7e) {
            return String.fromCharCode(b);
        }
        return "%" + b.toString(16).toUpperCase().padStart(2, "0");
    })
        .join("");
}
function percentEncode(s) {
    const newTokens = [];
    for (const token of s.tokens) {
        if (typeof token === "string") {
            newTokens.push(_percentEncode(token));
        }
        else {
            newTokens.push(token);
        }
    }
    return new Word(newTokens);
}
function percentEncodePlus(s) {
    const newTokens = [];
    for (const token of s.tokens) {
        if (typeof token === "string") {
            newTokens.push(_percentEncode(token).replace(/%20/g, "+"));
        }
        else {
            newTokens.push(token);
        }
    }
    return new Word(newTokens);
}
// Reimplements decodeURIComponent but ignores variables/commands
function wordDecodeURIComponent(s) {
    const newTokens = [];
    for (const token of s.tokens) {
        if (typeof token === "string") {
            newTokens.push(decodeURIComponent(token));
        }
        else {
            newTokens.push(token);
        }
    }
    return new Word(newTokens);
}
// if url is 'example.com?' the s is ''
// if url is 'example.com'  the s is null
function parseQueryString(s) {
    if (!s || s.isEmpty()) {
        return [null, null];
    }
    const asList = [];
    for (const param of s.split("&")) {
        // Most software libraries don't let you distinguish between a=&b= and a&b,
        // so if we get an `a&b`-type query string, don't bother.
        if (!param.includes("=")) {
            return [null, null];
        }
        const [key, val] = param.split("=", 2);
        let decodedKey;
        let decodedVal;
        try {
            // https://url.spec.whatwg.org/#urlencoded-parsing
            // recommends replacing + with space before decoding.
            decodedKey = wordDecodeURIComponent(key.replace(/\+/g, " "));
            decodedVal = wordDecodeURIComponent(val.replace(/\+/g, " "));
        }
        catch (e) {
            if (e instanceof URIError) {
                // Query string contains invalid percent encoded characters,
                // we cannot properly convert it.
                return [null, null];
            }
            throw e;
        }
        // If the query string doesn't round-trip, we cannot properly convert it.
        // TODO: this is a bit Python-specific, ideally we would check how each runtime/library
        // percent-encodes query strings. For example, a %27 character in the input query
        // string will be decoded to a ' but won't be re-encoded into a %27 by encodeURIComponent
        const roundTripKey = percentEncode(decodedKey);
        const roundTripVal = percentEncode(decodedVal);
        // If the original data used %20 instead of + (what requests will send), that's close enough
        if ((!eq(roundTripKey, key) && !eq(roundTripKey.replace(/%20/g, "+"), key)) ||
            (!eq(roundTripVal, val) && !eq(roundTripVal.replace(/%20/g, "+"), val))) {
            return [null, null];
        }
        asList.push([decodedKey, decodedVal]);
    }
    // Group keys
    const keyWords = {};
    const uniqueKeys = {};
    let prevKey = null;
    for (const [key, val] of asList) {
        const keyStr = key.toString(); // TODO: do this better
        if (prevKey === keyStr) {
            uniqueKeys[keyStr].push(val);
        }
        else if (!Object.prototype.hasOwnProperty.call(uniqueKeys, keyStr)) {
            uniqueKeys[keyStr] = [val];
            keyWords[keyStr] = key;
        }
        else {
            // If there's a repeated key with a different key between
            // one of its repetitions, there is no way to represent
            // this query string as a dictionary.
            return [asList, null];
        }
        prevKey = keyStr;
    }
    // Convert lists with 1 element to the element
    const asDict = [];
    for (const [keyStr, val] of Object.entries(uniqueKeys)) {
        asDict.push([keyWords[keyStr], val.length === 1 ? val[0] : val]);
    }
    return [asList, asDict];
}

function parseDetails(formParam, p, ptr, supported, warnings) {
    while (ptr < p.length && p.charAt(ptr) === ";") {
        ptr += 1;
        while (ptr < p.length && isSpace(p.charAt(ptr))) {
            ptr += 1;
        }
        if (ptr >= p.length) {
            return formParam;
        }
        const value = p.slice(ptr);
        if (value.startsWith("type=")) {
            // TODO: the syntax for type= is more complicated
            [formParam.contentType, ptr] = getParamWord(p, ptr + 5, warnings);
        }
        else if (value.startsWith("filename=")) {
            const [filename, filenameEnd] = getParamWord(p, ptr + 9, warnings);
            ptr = filenameEnd;
            if (supported.filename) {
                formParam.filename = filename;
            }
            else {
                warnings.push([
                    "unsupported-form-detail",
                    "Field file name not allowed here: " + filename.toString(),
                ]);
            }
        }
        else if (value.startsWith("encoder=")) {
            const [encoder, encoderEnd] = getParamWord(p, ptr + 8, warnings);
            ptr = encoderEnd;
            if (supported.encoder) {
                formParam.encoder = encoder;
            }
            else {
                warnings.push([
                    "unsupported-form-detail",
                    "Field encoder not allowed here: " + encoder.toString(),
                ]);
            }
        }
        else if (value.startsWith("headers=")) {
            // TODO: more complicated because of header files
            const [headers, headersEnd] = getParamWord(p, ptr + 8, warnings);
            ptr = headersEnd;
            if (supported.headers) {
                formParam.headers = headers;
            }
            else {
                warnings.push([
                    "unsupported-form-detail",
                    "Field headers not allowed here: " + headers.toString(),
                ]);
            }
        }
        else {
            // TODO: it would be more consistent for curl to skip until the first "=", then
            // getParamWord, because quoting a ; in an unknown value breaks values that
            // come after it, e.g.:
            // curl -F 'myname=myvalue;bfilename="f;oo";filename=oeu' localhost:8888
            const unknown = getParamWord(p, ptr, warnings);
            const unknownEnd = unknown[1];
            ptr = unknownEnd;
            warnings.push([
                "unknown-form-detail",
                "skip unknown form field: " + value.toString(),
            ]);
        }
    }
    return formParam;
}
function isSpace(c) {
    // Implements the following macro from curl:
    // #define ISBLANK(x)  (((x) == ' ') || ((x) == '\t'))
    // #define ISSPACE(x)  (ISBLANK(x) || (((x) >= 0xa) && ((x) <= 0x0d)))
    return (typeof c === "string" &&
        (c === " " || c === "\t" || (c >= "\n" && c <= "\r")));
}
function getParamWord(p, start, warnings) {
    let ptr = start;
    if (p.charAt(ptr) === '"') {
        ptr += 1;
        const parts = [];
        while (ptr < p.length) {
            let curChar = p.charAt(ptr);
            if (curChar === "\\") {
                if (ptr + 1 < p.length) {
                    const nextChar = p.charAt(ptr + 1);
                    if (nextChar === '"' || nextChar === "\\") {
                        ptr += 1;
                        curChar = p.charAt(ptr);
                    }
                }
            }
            else if (curChar === '"') {
                ptr += 1;
                let trailingData = false;
                while (ptr < p.length && p.charAt(ptr) !== ";") {
                    if (!isSpace(p.charAt(ptr))) {
                        trailingData = true;
                    }
                    ptr += 1;
                }
                if (trailingData) {
                    warnings.push([
                        "trailing-form-data",
                        "Trailing data after quoted form parameter",
                    ]);
                }
                return [new Word(parts), ptr];
            }
            parts.push(curChar);
            ptr += 1;
        }
    }
    let sepIdx = p.indexOf(";", start);
    if (sepIdx === -1) {
        sepIdx = p.length;
    }
    return [p.slice(start, sepIdx), sepIdx];
}
function getParamPart(formParam, p, ptr, supported, warnings) {
    while (ptr < p.length && isSpace(p.charAt(ptr))) {
        ptr += 1;
    }
    const [content, contentEnd] = getParamWord(p, ptr, warnings);
    formParam.content = content;
    parseDetails(formParam, p, contentEnd, supported, warnings);
    return formParam;
}
// TODO: https://curl.se/docs/manpage.html#-F
// https://github.com/curl/curl/blob/curl-7_88_1/src/tool_formparse.c
// -F is a complicated option to parse.
function parseForm(form, warnings) {
    const multipartUploads = [];
    let depth = 0;
    for (const multipartArgument of form) {
        const isString = multipartArgument.type === "string";
        if (!multipartArgument.value.includes("=")) {
            throw new CCError('invalid value for --form/-F, missing "=": ' +
                JSON.stringify(multipartArgument.value.toString()));
        }
        const [name, value] = multipartArgument.value.split("=", 2);
        const formParam = { name };
        if (!isString && value.charAt(0) === "(") {
            depth += 1;
            warnings.push([
                "nested-form",
                'Nested form data with "=(" is not supported, it will be flattened',
            ]);
            getParamPart(formParam, value, 1, {
                headers: true,
            }, warnings);
        }
        else if (!isString && name.length === 0 && eq(value, ")")) {
            depth -= 1;
            if (depth < 0) {
                throw new CCError("no multipart to terminate: " +
                    JSON.stringify(multipartArgument.value.toString()));
            }
        }
        else if (!isString && value.charAt(0) === "@") {
            // TODO: there can be multiple files separated by a comma
            getParamPart(formParam, value, 1, {
                filename: true,
                encoder: true,
                headers: true,
            }, warnings);
            formParam.contentFile = formParam.content;
            delete formParam.content;
            if (formParam.filename === null || formParam.filename === undefined) {
                formParam.filename = formParam.contentFile;
            }
            if (formParam.contentType === null ||
                formParam.contentType === undefined) ;
        }
        else if (!isString && value.charAt(0) === "<") {
            getParamPart(formParam, value, 1, {
                encoder: true,
                headers: true,
            }, warnings);
            formParam.contentFile = formParam.content;
            delete formParam.content;
            if (formParam.contentType === null ||
                formParam.contentType === undefined) ;
        }
        else {
            if (isString) {
                formParam.content = value;
            }
            else {
                getParamPart(formParam, value, 0, {
                    filename: true,
                    encoder: true,
                    headers: true,
                }, warnings);
            }
        }
        multipartUploads.push(formParam);
    }
    return multipartUploads;
}

function buildURL(global, config, url, uploadFile, outputFile, stdin, stdinFile) {
    const originalUrl = url;
    const u = parseurl(global, config, url);
    // https://github.com/curl/curl/blob/curl-7_85_0/src/tool_operate.c#L1124
    // https://github.com/curl/curl/blob/curl-7_85_0/src/tool_operhlp.c#L76
    if (uploadFile) {
        // TODO: it's more complicated
        if (u.path.isEmpty()) {
            u.path = uploadFile.prepend("/");
        }
        else if (u.path.endsWith("/")) {
            u.path = u.path.add(uploadFile);
        }
        if (config.get) {
            warnf(global, [
                "data-ignored",
                "curl doesn't let you pass --get and --upload-file together",
            ]);
        }
    }
    const urlWithOriginalQuery = mergeWords(u.scheme, "://", u.host, u.path, u.query, u.fragment);
    // curl example.com example.com?foo=bar --url-query isshared=t
    // will make requests for
    // example.com/?isshared=t
    // example.com/?foo=bar&isshared=t
    //
    // so the query could come from
    //   1. `--url` (i.e. the requested URL)
    //   2. `--url-query` or `--get --data` (the latter takes precedence)
    //
    // If it comes from the latter, we might need to generate code to read
    // from one or more files.
    // When there's multiple urls, the latter applies to all of them
    // but the query from --url only applies to that URL.
    //
    // There's 3 cases for the query:
    // 1. it's well-formed and can be expressed as a list of tuples (or a dict)
    //   `?one=1&one=1&two=2`
    // 2. it can't, for example because one of the pieces doesn't have a '='
    //   `?one`
    // 3. we need to generate code that reads from a file
    //
    // If there's only one URL we merge the query from the URL with the shared part.
    //
    // If there's multiple URLs and a shared part that reads from a file (case 3),
    // we only write the file reading code once, pass it as the params= argument
    // and the part from the URL has to be passed as a string in the URL
    // and requests will combine the query in the URL with the query in params=.
    //
    // Otherwise, we print each query for each URL individually, either as a
    // list of tuples if we can or in the URL if we can't.
    //
    // When files are passed in through --data-urlencode or --url-query
    // we can usually treat them as case 1 as well (in Python), but that would
    // generate code slightly different from curl because curl reads the file once
    // upfront, whereas we would read the file multiple times and it might contain
    // different data each time (for example if it's /dev/urandom).
    let urlQueryArray = null;
    let queryArray = null;
    let queryStrReadsFile = null;
    if (u.query.toBool() || (config["url-query"] && config["url-query"].length)) {
        let queryStr = null;
        let queryParts = [];
        if (u.query.toBool()) {
            // remove the leading '?'
            queryParts.push(["raw", u.query.slice(1)]);
            [queryArray, queryStr, queryStrReadsFile] = buildData(queryParts, stdin, stdinFile);
            urlQueryArray = queryArray;
        }
        if (config["url-query"]) {
            queryParts = queryParts.concat(config["url-query"]);
            [queryArray, queryStr, queryStrReadsFile] = buildData(queryParts, stdin, stdinFile);
        }
        // TODO: check the curl source code
        // TODO: curl localhost:8888/?
        // will request /?
        // but
        // curl localhost:8888/? --url-query ''
        // (or --get --data '') will request /
        u.query = new Word();
        if (queryStr && queryStr.toBool()) {
            u.query = queryStr.prepend("?");
        }
    }
    const urlWithoutQueryArray = mergeWords(u.scheme, "://", u.host, u.path, u.fragment);
    url = mergeWords(u.scheme, "://", u.host, u.path, u.query, u.fragment);
    let urlWithoutQueryList = url;
    // TODO: parseQueryString() doesn't accept leading '?'
    let [queryList, queryDict] = parseQueryString(u.query.toBool() ? u.query.slice(1) : new Word());
    if (queryList && queryList.length) {
        // TODO: remove the fragment too?
        urlWithoutQueryList = mergeWords(u.scheme, "://", u.host, u.path, u.fragment);
    }
    else {
        queryList = null;
        queryDict = null;
    }
    // TODO: --path-as-is
    // TODO: --request-target
    // curl expects you to uppercase methods always. If you do -X PoSt, that's what it
    // will send, but most APIs will helpfully uppercase what you pass in as the method.
    //
    // There are many places where curl determines the method, this is the last one:
    // https://github.com/curl/curl/blob/curl-7_85_0/lib/http.c#L2032
    let method = new Word("GET");
    if (config.request &&
        // Safari adds `-X null` if it can't determine the request type
        // https://github.com/WebKit/WebKit/blob/f58ef38d48f42f5d7723691cb090823908ff5f9f/Source/WebInspectorUI/UserInterface/Models/Resource.js#L1250
        !eq(config.request, "null")) {
        method = config.request;
    }
    else if (config.head) {
        method = new Word("HEAD");
    }
    else if (uploadFile && uploadFile.toBool()) {
        // --upload-file '' doesn't do anything.
        method = new Word("PUT");
    }
    else if (!config.get && (has(config, "data") || has(config, "form"))) {
        method = new Word("POST");
    }
    const requestUrl = {
        originalUrl,
        urlWithoutQueryList,
        url,
        urlObj: u,
        urlWithOriginalQuery,
        urlWithoutQueryArray,
        method,
    };
    if (queryStrReadsFile) {
        requestUrl.queryReadsFile = queryStrReadsFile;
    }
    if (queryList) {
        requestUrl.queryList = queryList;
        if (queryDict) {
            requestUrl.queryDict = queryDict;
        }
    }
    if (queryArray) {
        requestUrl.queryArray = queryArray;
    }
    if (urlQueryArray) {
        requestUrl.urlQueryArray = urlQueryArray;
    }
    if (uploadFile) {
        if (eq(uploadFile, "-") || eq(uploadFile, ".")) {
            if (stdinFile) {
                requestUrl.uploadFile = stdinFile;
            }
            else if (stdin) {
                warnf(global, [
                    "upload-file-with-stdin-content",
                    "--upload-file with stdin content is not supported",
                ]);
                requestUrl.uploadFile = uploadFile;
                // TODO: this is complicated,
                // --upload-file only applies per-URL so .data needs to become per-URL...
                // if you pass --data and --upload-file or --get and --upload-file, curl will error
                // if (config.url && config.url.length === 1) {
                //   config.data = [["raw", stdin]];
                // } else {
                //   warnf(global, [
                //     "upload-file-with-stdin-content-and-multiple-urls",
                //     "--upload-file with stdin content and multiple URLs is not supported",
                //   ]);
                // }
            }
            else {
                requestUrl.uploadFile = uploadFile;
            }
        }
        else {
            requestUrl.uploadFile = uploadFile;
        }
    }
    if (outputFile) {
        // TODO: get stdout redirects of command
        requestUrl.output = outputFile;
    }
    // --user takes precedence over the URL
    const auth = config.user || u.auth;
    if (auth) {
        const [user, pass] = auth.split(":", 2);
        requestUrl.auth = [user, pass || new Word()];
    }
    return requestUrl;
}
function buildData(configData, stdin, stdinFile) {
    const data = [];
    let dataStrState = new Word();
    for (const [i, x] of configData.entries()) {
        const type = x[0];
        let value = x[1];
        let name = null;
        if (i > 0 && type !== "json") {
            dataStrState = dataStrState.append("&");
        }
        if (type === "urlencode") {
            // curl checks for = before @
            const splitOn = value.includes("=") || !value.includes("@") ? "=" : "@";
            // If there's no = or @ then the entire content is treated as a value and encoded
            if (value.includes("@") || value.includes("=")) {
                [name, value] = value.split(splitOn, 2);
            }
            if (splitOn === "=") {
                if (name && name.toBool()) {
                    dataStrState = dataStrState.add(name).append("=");
                }
                // curl's --data-urlencode percent-encodes spaces as "+"
                // https://github.com/curl/curl/blob/curl-7_86_0/src/tool_getparam.c#L630
                dataStrState = dataStrState.add(percentEncodePlus(value));
                continue;
            }
            name = name && name.toBool() ? name : null;
            value = value.prepend("@");
        }
        let filename = null;
        if (type !== "raw" && value.startsWith("@")) {
            filename = value.slice(1);
            if (eq(filename, "-")) {
                if (stdin !== undefined) {
                    switch (type) {
                        case "binary":
                        case "json":
                            value = stdin;
                            break;
                        case "urlencode":
                            value = mergeWords(name && name.length ? name.append("=") : new Word(), percentEncodePlus(stdin));
                            break;
                        default:
                            value = stdin.replace(/[\n\r]/g, "");
                    }
                    filename = null;
                }
                else if (stdinFile !== undefined) {
                    filename = stdinFile;
                }
                else ;
            }
        }
        if (filename !== null) {
            if (dataStrState.toBool()) {
                data.push(dataStrState);
                dataStrState = new Word();
            }
            const dataParam = {
                // If `filename` isn't null, then `type` can't be "raw"
                filetype: type,
                filename,
            };
            if (name) {
                dataParam.name = name;
            }
            data.push(dataParam);
        }
        else {
            dataStrState = dataStrState.add(value);
        }
    }
    if (dataStrState.toBool()) {
        data.push(dataStrState);
    }
    let dataStrReadsFile = null;
    const dataStr = mergeWords(...data.map((d) => {
        if (!(d instanceof Word)) {
            dataStrReadsFile || (dataStrReadsFile = d.filename.toString()); // report first file
            if (d.name) {
                return mergeWords(d.name, "=@", d.filename);
            }
            return d.filename.prepend("@");
        }
        return d;
    }));
    return [data, dataStr, dataStrReadsFile];
}
function buildRequest(global, config, stdin, stdinFile) {
    var _a, _b;
    if (!config.url || !config.url.length) {
        // TODO: better error message (could be parsing fail)
        throw new CCError("no URL specified!");
    }
    const headers = new Headers(config.header);
    let cookies;
    const cookieFiles = [];
    const cookieHeader = headers.get("cookie");
    if (cookieHeader) {
        const parsedCookies = parseCookiesStrict(cookieHeader);
        if (parsedCookies) {
            cookies = parsedCookies;
        }
    }
    else if (cookieHeader === undefined && config.cookie) {
        // If there is a Cookie header, --cookies is ignored
        const cookieStrings = [];
        for (const c of config.cookie) {
            // a --cookie without a = character reads from it as a filename
            if (c.includes("=")) {
                cookieStrings.push(c);
            }
            else {
                cookieFiles.push(c);
            }
        }
        if (cookieStrings.length) {
            const cookieString = joinWords(config.cookie, "; ");
            headers.setIfMissing("Cookie", cookieString);
            const parsedCookies = parseCookies(cookieString);
            if (parsedCookies) {
                cookies = parsedCookies;
            }
        }
    }
    if (config["user-agent"]) {
        headers.setIfMissing("User-Agent", config["user-agent"]);
    }
    if (config.referer) {
        // referer can be ";auto" or followed by ";auto", we ignore that.
        const referer = config.referer.replace(/;auto$/, "");
        if (referer.length) {
            headers.setIfMissing("Referer", referer);
        }
    }
    if (config.range) {
        let range = config.range.prepend("bytes=");
        if (!range.includes("-")) {
            range = range.append("-");
        }
        headers.setIfMissing("Range", range);
    }
    if (config["time-cond"]) {
        let timecond = config["time-cond"];
        let header = "If-Modified-Since";
        switch (timecond.charAt(0)) {
            case "+":
                timecond = timecond.slice(1);
                break;
            case "-":
                timecond = timecond.slice(1);
                header = "If-Unmodified-Since";
                break;
            case "=":
                timecond = timecond.slice(1);
                header = "Last-Modified";
                break;
        }
        // TODO: parse date
        headers.setIfMissing(header, timecond);
    }
    let data;
    let dataStr;
    let dataStrReadsFile;
    let queryArray;
    if (config.data && config.data.length) {
        if (config.get) {
            // https://github.com/curl/curl/blob/curl-7_85_0/src/tool_operate.c#L721
            // --get --data will overwrite --url-query, but if there's no --data, for example,
            // curl --url-query bar --get example.com
            // it won't
            // https://daniel.haxx.se/blog/2022/11/10/append-data-to-the-url-query/
            config["url-query"] = config.data;
            delete config.data;
        }
        else {
            [data, dataStr, dataStrReadsFile] = buildData(config.data, stdin, stdinFile);
        }
    }
    if (config["url-query"]) {
        [queryArray] = buildData(config["url-query"], stdin, stdinFile);
    }
    const urls = [];
    const uploadFiles = config["upload-file"] || [];
    const outputFiles = config.output || [];
    for (const [i, url] of config.url.entries()) {
        urls.push(buildURL(global, config, url, uploadFiles[i], outputFiles[i], stdin, stdinFile));
    }
    // --get moves --data into the URL's query string
    if (config.get && config.data) {
        delete config.data;
    }
    if ((config["upload-file"] || []).length > config.url.length) {
        warnf(global, [
            "too-many-upload-files",
            "Got more --upload-file/-T options than URLs: " +
                ((_a = config["upload-file"]) === null || _a === void 0 ? void 0 : _a.map((f) => JSON.stringify(f.toString())).join(", ")),
        ]);
    }
    if ((config.output || []).length > config.url.length) {
        warnf(global, [
            "too-many-ouptut-files",
            "Got more --output/-o options than URLs: " +
                ((_b = config.output) === null || _b === void 0 ? void 0 : _b.map((f) => JSON.stringify(f.toString())).join(", ")),
        ]);
    }
    const request = {
        urls,
        authType: pickAuth(config.authtype),
        headers,
    };
    // TODO: warn about unused stdin?
    if (stdin) {
        request.stdin = stdin;
    }
    if (stdinFile) {
        request.stdinFile = stdinFile;
    }
    if (config.globoff !== undefined) {
        request.globoff = config.globoff;
    }
    if (cookies) {
        // generators that use .cookies need to do
        // deleteHeader(request, 'cookie')
        request.cookies = cookies;
    }
    if (cookieFiles.length) {
        request.cookieFiles = cookieFiles;
    }
    if (config["cookie-jar"]) {
        request.cookieJar = config["cookie-jar"];
    }
    if (config.compressed !== undefined) {
        request.compressed = config.compressed;
    }
    if (config.json) {
        headers.setIfMissing("Content-Type", "application/json");
        headers.setIfMissing("Accept", "application/json");
    }
    else if (config.data) {
        headers.setIfMissing("Content-Type", "application/x-www-form-urlencoded");
    }
    else if (config.form) {
        // TODO: warn when details (;filename=, etc.) are not supported
        // by each converter.
        request.multipartUploads = parseForm(config.form, global.warnings);
    }
    if (config["aws-sigv4"]) {
        // https://github.com/curl/curl/blob/curl-7_86_0/lib/setopt.c#L678-L679
        request.authType = "aws-sigv4";
        request.awsSigV4 = config["aws-sigv4"];
    }
    if (request.authType === "bearer" && config["oauth2-bearer"]) {
        const bearer = config["oauth2-bearer"].prepend("Bearer ");
        headers.setIfMissing("Authorization", bearer);
    }
    if (config.delegation) {
        request.delegation = config.delegation;
    }
    // TODO: ideally we should generate code that explicitly unsets the header too
    // no HTTP libraries allow that.
    headers.clearNulls();
    if (config.data && config.data.length) {
        request.data = dataStr;
        if (dataStrReadsFile) {
            request.dataReadsFile = dataStrReadsFile;
        }
        request.dataArray = data;
        // TODO: remove these
        request.isDataRaw = false;
        request.isDataBinary = (data || []).some((d) => !(d instanceof Word) && d.filetype === "binary");
    }
    if (queryArray) {
        // If we have to generate code that reads from a file, we
        // need to do it once for all URLs.
        request.queryArray = queryArray;
    }
    if (config["ipv4"] !== undefined) {
        request["ipv4"] = config["ipv4"];
    }
    if (config["ipv6"] !== undefined) {
        request["ipv6"] = config["ipv6"];
    }
    if (config.ciphers) {
        request.ciphers = config.ciphers;
    }
    if (config.insecure) {
        request.insecure = true;
    }
    // TODO: if the URL doesn't start with https://, curl doesn't verify
    // certificates, etc.
    if (config.cert) {
        if (config.cert.startsWith("pkcs11:") || !config.cert.match(/[:\\]/)) {
            request.cert = [config.cert, null];
        }
        else {
            // TODO: curl does more complex processing
            // find un-backslash-escaped colon, backslash might also be escaped with a backslash
            let colon = -1;
            try {
                // Safari versions older than 16.4 don't support negative lookbehind
                colon = config.cert.search(/(?<!\\)(?:\\\\)*:/);
            }
            catch (_c) {
                colon = config.cert.search(/:/);
            }
            if (colon === -1) {
                request.cert = [config.cert, null];
            }
            else {
                const cert = config.cert.slice(0, colon);
                const password = config.cert.slice(colon + 1);
                if (password.toBool()) {
                    request.cert = [cert, password];
                }
                else {
                    request.cert = [cert, null];
                }
            }
        }
    }
    if (config["cert-type"]) {
        request.certType = config["cert-type"];
    }
    if (config.key) {
        request.key = config.key;
    }
    if (config["key-type"]) {
        request.keyType = config["key-type"];
    }
    if (config.cacert) {
        request.cacert = config.cacert;
    }
    if (config.capath) {
        request.capath = config.capath;
    }
    if (config.crlfile) {
        request.crlfile = config.crlfile;
    }
    if (config.pinnedpubkey) {
        request.pinnedpubkey = config.pinnedpubkey;
    }
    if (config["random-file"]) {
        request.randomFile = config["random-file"];
    }
    if (config["egd-file"]) {
        request.egdFile = config["egd-file"];
    }
    if (config.hsts) {
        request.hsts = config.hsts;
    }
    if (config.proxy) {
        // https://github.com/curl/curl/blob/e498a9b1fe5964a18eb2a3a99dc52160d2768261/lib/url.c#L2388-L2390
        request.proxy = config.proxy;
        if (config["proxy-user"]) {
            request.proxyAuth = config["proxy-user"];
        }
    }
    if (config.noproxy) {
        request.noproxy = config.noproxy;
    }
    if (config["max-time"]) {
        request.timeout = config["max-time"];
        if (config["max-time"].isString() &&
            // TODO: parseFloat() like curl
            isNaN(parseFloat(config["max-time"].toString()))) {
            warnf(global, [
                "max-time-not-number",
                "option --max-time: expected a proper numerical parameter: " +
                    JSON.stringify(config["max-time"].toString()),
            ]);
        }
    }
    if (config["connect-timeout"]) {
        request.connectTimeout = config["connect-timeout"];
        if (config["connect-timeout"].isString() &&
            isNaN(parseFloat(config["connect-timeout"].toString()))) {
            warnf(global, [
                "connect-timeout-not-number",
                "option --connect-timeout: expected a proper numerical parameter: " +
                    JSON.stringify(config["connect-timeout"].toString()),
            ]);
        }
    }
    if (config["limit-rate"]) {
        request.limitRate = config["limit-rate"];
    }
    if (Object.prototype.hasOwnProperty.call(config, "keepalive")) {
        request.keepAlive = config.keepalive;
    }
    if (Object.prototype.hasOwnProperty.call(config, "location")) {
        request.followRedirects = config.location;
    }
    if (config["location-trusted"]) {
        request.followRedirectsTrusted = config["location-trusted"];
    }
    if (config["max-redirs"]) {
        request.maxRedirects = config["max-redirs"].trim();
        if (config["max-redirs"].isString() &&
            !isInt(config["max-redirs"].toString())) {
            warnf(global, [
                "max-redirs-not-int",
                "option --max-redirs: expected a proper numerical parameter: " +
                    JSON.stringify(config["max-redirs"].toString()),
            ]);
        }
    }
    if (config.retry) {
        request.retry = config.retry;
    }
    // TODO: this should write to the same "httpVersion" variable
    const http2 = config.http2 || config["http2-prior-knowledge"];
    if (http2) {
        request.http2 = http2;
    }
    if (config.http3 || config["http3-only"]) {
        request.http3 = true;
    }
    if (config["unix-socket"]) {
        request.unixSocket = config["unix-socket"];
    }
    if (config["netrc-optional"] || config["netrc-file"]) {
        request.netrc = "optional";
    }
    else if (config.netrc) {
        request.netrc = "required";
    }
    else if (config.netrc === false) {
        // TODO || config["netrc-optional"] === false ?
        request.netrc = "ignored";
    }
    if (config["continue-at"]) {
        request.continueAt = config["continue-at"];
    }
    if (Object.prototype.hasOwnProperty.call(config, "clobber")) {
        request.clobber = config.clobber;
    }
    if (Object.prototype.hasOwnProperty.call(config, "remote-time")) {
        request.remoteTime = config["remote-time"];
    }
    // Global options
    if (Object.prototype.hasOwnProperty.call(global, "verbose")) {
        request.verbose = global.verbose;
    }
    if (Object.prototype.hasOwnProperty.call(global, "silent")) {
        request.silent = global.silent;
    }
    return request;
}
function buildRequests(global, stdin, stdinFile) {
    if (!global.configs.length) {
        // shouldn't happen
        warnf(global, ["no-configs", "got empty config object"]);
    }
    return global.configs.map((config) => buildRequest(global, config, stdin, stdinFile));
}
function getFirst(requests, warnings, support) {
    if (requests.length > 1) {
        warnings.push([
            "next",
            // TODO: better message, we might have two requests because of
            // --next or because of multiple curl commands or both
            "got " +
                requests.length +
                " curl requests, only converting the first one",
        ]);
    }
    const request = requests[0];
    warnIfPartsIgnored(request, warnings, support);
    return request;
}

function clip(s, maxLength = 30) {
    if (s.length > maxLength) {
        return s.slice(0, maxLength - 3) + "...";
    }
    return s;
}
function findCommands(curlCommand, warnings) {
    if (typeof curlCommand === "string") {
        return tokenize(curlCommand, warnings);
    }
    if (curlCommand.length === 0) {
        throw new CCError("no arguments provided");
    }
    if (curlCommand[0].trim() !== "curl") {
        throw new CCError('command should begin with "curl" but instead begins with ' +
            JSON.stringify(clip(curlCommand[0])));
    }
    return [[curlCommand.map((arg) => new Word(arg)), undefined, undefined]];
}
/**
 * Accepts a string of Bash code or a tokenized argv array.
 * Returns an array of parsed curl objects.
 * @param command a string of Bash code containing at least one curl command or an
 * array of shell argument tokens (meant for passing process.argv).
 */
function parse(command, supportedArgs, warnings = []) {
    let requests = [];
    const curlCommands = findCommands(command, warnings);
    for (const [argv, stdin, stdinFile] of curlCommands) {
        const globalConfig = parseArgs(argv, curlLongOpts, curlLongOptsShortened, curlShortOpts, supportedArgs, warnings);
        requests = requests.concat(buildRequests(globalConfig, stdin, stdinFile));
    }
    return requests;
}

exports.COMMON_SUPPORTED_ARGS = COMMON_SUPPORTED_ARGS;
exports.clip = clip;
exports.getFirst = getFirst;
exports.parse = parse;
