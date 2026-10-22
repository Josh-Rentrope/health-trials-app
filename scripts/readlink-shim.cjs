// readlink-shim.cjs
//
// Windows/exFAT quirk repair, not application logic.
//
// On an exFAT volume, Node's `fs.readlink` on a *regular file* fails with
// EISDIR instead of the EINVAL it returns on NTFS/ext4. Next's build calls
// readlink to ask "is this a symlink?" and treats EINVAL as the normal "no"
// answer; EISDIR is unexpected and aborts the build.
//
// This shim normalises the two codes. On a filesystem that behaves correctly it
// changes nothing. It does not make a real symlink readable -- there are none in
// this checkout -- it only stops a non-symlink from being reported as a
// directory.
//
// Loaded with `node --require ./scripts/readlink-shim.cjs` by `npm run build`.

'use strict';

const fs = require('fs');

function toEINVAL(path) {
  const err = new Error(`EINVAL: invalid argument, readlink '${path}'`);
  err.code = 'EINVAL';
  err.errno = -4071;
  err.syscall = 'readlink';
  err.path = path;
  return err;
}

const originalSync = fs.readlinkSync;
fs.readlinkSync = function (path, options) {
  try {
    return originalSync.call(fs, path, options);
  } catch (err) {
    if (err && err.code === 'EISDIR') throw toEINVAL(path);
    throw err;
  }
};

const originalAsync = fs.readlink;
fs.readlink = function (path, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  originalAsync.call(fs, path, options, (err, target) => {
    if (err && err.code === 'EISDIR') return callback(toEINVAL(path));
    callback(err, target);
  });
};

const originalPromise = fs.promises.readlink.bind(fs.promises);
fs.promises.readlink = async function (path, options) {
  try {
    return await originalPromise(path, options);
  } catch (err) {
    if (err && err.code === 'EISDIR') throw toEINVAL(path);
    throw err;
  }
};
