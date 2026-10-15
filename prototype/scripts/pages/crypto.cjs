const { sha256 } = require('@noble/hashes/sha256')
const { bytesToHex, utf8ToBytes } = require('@noble/hashes/utils')
exports.randomUUID = () => globalThis.crypto.randomUUID()
exports.createHash = algorithm => {
  if (algorithm !== 'sha256') throw new Error('Unsupported review hash: ' + algorithm)
  const hash = sha256.create()
  return {
    update(value) { hash.update(typeof value === 'string' ? utf8ToBytes(value) : value); return this },
    digest(encoding) {
      if (encoding !== 'hex') throw new Error('Unsupported hash encoding: ' + encoding)
      return bytesToHex(hash.digest())
    }
  }
}
