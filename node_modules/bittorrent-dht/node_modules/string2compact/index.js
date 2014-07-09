module.exports = function (addrs) {
  if (typeof addrs === 'string') {
    addrs = [ addrs ]
  }
  var buf = new Buffer(addrs.length * 6)
  addrs.forEach(function (addr, i) {
    var offset = i * 6
    var s = addr.split(':')
    if (s.length !== 2) {
      throw new Error('invalid address format, expecting: 10.10.10.5:128')
    }

    var ip = s[0]
    var port = Number(s[1])
    var bytes = ip.split('.')

    buf[offset] = Number(bytes[0])
    buf[offset + 1] = Number(bytes[1])
    buf[offset + 2] = Number(bytes[2])
    buf[offset + 3] = Number(bytes[3])
    buf.writeUInt16BE(port, offset + 4)

  })

  return buf
}

/**
 * Also support this usage:
 *   string2compact.multi([ '10.10.10.5:128', '100.56.58.99:28525' ])
 *
 * for parallelism with the `compact2string` module.
 */
module.exports.multi = module.exports
