'use strict';

const clfDate = require('clf-date');

function listAvailableFormats () {
  return ['simple', 'extended', 'clf', 'json'];
}

function getFormatter (format, isAddon) {
  switch (format.toLowerCase()) {
    case 'simple':
      return isAddon ? formatSimpleAddon : formatSimple;
    case 'extended':
      return isAddon ? formatExtendedAddon : formatExtended;
    case 'clf':
      return isAddon ? formatCLFAddon : formatCLF;
    case 'json':
      return (l) => JSON.stringify(l);
  }
}

function formatSource (l) {
  if (l.s != null) {
    const location = l.s.ct ? `${l.s.ct}, ${l.s.co}` : l.s.co;
    return `${l.ipS} - ${location}`;
  }
  else {
    return l.ipS;
  }
}

function formatSimple (l) {
  return `${new Date(l.t).toISOString()} ${l.ipS} ${l.vb} ${l.path}`;
}

function formatExtended (l) {
  return `${new Date(l.t).toISOString()} [ ${formatSource(l)} ] ${l.vb} ${l.h} ${l.path} ${l.sC}`;
}

function formatCLF (l) {
  return `${l.ipS} - - [${clfDate(new Date(l.t))}] "${l.vb} ${l.path} -" ${l.sC} ${l.bOut}`;
}

function formatSimpleAddon (l) {
  return `${new Date(l.t).toISOString()} ${l.ipS}`;
}

function formatExtendedAddon (l) {
  return `${new Date(l.t).toISOString()} [ ${formatSource(l)} ] duration(ms): ${l.sDuration}`;
}

function formatCLFAddon (l) {
  return `${l.ipS} - - [${clfDate(new Date(l.t))}] "- - -" - ${l.bOut}`;
}

module.exports = { listAvailableFormats, getFormatter };
