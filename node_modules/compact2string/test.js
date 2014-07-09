
var assert = require('assert');
var compact2string = require('./');

describe('compact2string', function() {

  it('should return expected', function() {
    assert.equal('10.10.10.5:65408', compact2string(new Buffer("0A0A0A05FF80", "hex")));
  });

  it('should throw an error if the buffer length isn\'t 6', function() {
    assert.throws(function() {
      compact2string(new Buffer("0A0A0A05", "hex"));
    }, /should contain 6 bytes/);
  });

  it('should return expected multi', function() {
    assert.deepEqual([ '10.10.10.5:128', '100.56.58.99:28525' ], compact2string.multi(new Buffer("0A0A0A05008064383a636f6d", "hex")));
  });

  it('should throw an error if the buffer isn\'t a multiple of 6', function() {
    assert.throws(function() {
      compact2string.multi(new Buffer("0A0A0A05050505", "hex"));
    }, /multiple of/);
  });

});