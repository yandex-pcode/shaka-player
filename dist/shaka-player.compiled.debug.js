// file:src/log.js
/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var Log = (function (){
		var start = new Date();
		var LOG_LEVEL_ERROR 	= 4;
		var LOG_LEVEL_WARNING 	= 3;
		var LOG_LEVEL_INFO 		= 2;
		var LOG_LEVEL_DEBUG		= 1;
		var log_level = LOG_LEVEL_ERROR;
		var logObject = {
			setLogLevel : function(level) {
				if (level == this.debug) log_level = LOG_LEVEL_DEBUG;
				else if (level == this.info) log_level = LOG_LEVEL_INFO;
				else if (level == this.warn) log_level = LOG_LEVEL_WARNING;
				else if (level == this.error) log_level = LOG_LEVEL_ERROR;
				else log_level = LOG_LEVEL_ERROR;
			},
			debug : function(module, msg) {
				if (console.debug === undefined) {
					console.debug = console.log;
				}
				if (LOG_LEVEL_DEBUG >= log_level) {
					console.debug("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
				}
			},
			log : function(module, msg) {
				this.debug(module.msg)
			},
			info : function(module, msg) {
				if (LOG_LEVEL_INFO >= log_level) {
					console.info("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
				}
			},
			warn : function(module, msg) {
				if (LOG_LEVEL_WARNING >= log_level) {
					console.warn("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
				}
			},
			error : function(module, msg) {
				if (LOG_LEVEL_ERROR >= log_level) {
					console.error("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
				}
			}
		};
		return logObject;
	})();
	
/* Helper function to print a duration value in the form H:MM:SS.MS */
Log.getDurationString = function(duration, _timescale) {
	var neg;
	/* Helper function to print a number on a fixed number of digits */
	function pad(number, length) {
		var str = '' + number;
		var a = str.split('.');		
		while (a[0].length < length) {
			a[0] = '0' + a[0];
		}
		return a.join('.');
	}
	if (duration < 0) {
		neg = true;
		duration = -duration;
	} else {
		neg = false;	
	}
	var timescale = _timescale || 1;
	var duration_sec = duration/timescale;
	var hours = Math.floor(duration_sec/3600);
	duration_sec -= hours * 3600;
	var minutes = Math.floor(duration_sec/60);
	duration_sec -= minutes * 60;		
	var msec = duration_sec*1000;
	duration_sec = Math.floor(duration_sec);
	msec -= duration_sec*1000;
	msec = Math.floor(msec);
	return (neg ? "-": "")+hours+":"+pad(minutes,2)+":"+pad(duration_sec,2)+"."+pad(msec,3);
}
	
/* Helper function to stringify HTML5 TimeRanges objects */	
Log.printRanges = function(ranges) {
	var length = ranges.length;
	if (length > 0) {
		var str = "";
		for (var i = 0; i < length; i++) {
		  if (i > 0) str += ",";
		  str += "["+Log.getDurationString(ranges.start(i))+ ","+Log.getDurationString(ranges.end(i))+"]";
		}
		return str;
	} else {
		return "(empty)";
	}
}

if (typeof exports !== 'undefined') {
	exports.Log = Log;
}
// file:src/stream.js
var MP4BoxStream = function(arrayBuffer) {
  if (arrayBuffer instanceof ArrayBuffer) {
    this.buffer = arrayBuffer;
    this.dataview = new DataView(arrayBuffer);
  } else {
    throw ("Needs an array buffer");
  }
  this.position = 0;
};

/*************************************************************************
  Common API between MultiBufferStream and SimpleStream
 *************************************************************************/
MP4BoxStream.prototype.getPosition = function() {
  return this.position;
}

MP4BoxStream.prototype.getEndPosition = function() {
  return this.buffer.byteLength;
}

MP4BoxStream.prototype.getLength = function() {
  return this.buffer.byteLength;
}

MP4BoxStream.prototype.seek = function (pos) {
  var npos = Math.max(0, Math.min(this.buffer.byteLength, pos));
  this.position = (isNaN(npos) || !isFinite(npos)) ? 0 : npos;
  return true;
}

MP4BoxStream.prototype.isEos = function () {
  return this.getPosition() >= this.getEndPosition();
}

/*************************************************************************
  Read methods, simimar to DataStream but simpler
 *************************************************************************/
MP4BoxStream.prototype.readAnyInt = function(size, signed) {
  var res = 0;
  if (this.position + size <= this.buffer.byteLength) {
    switch (size) {
      case 1:
        if (signed) {
          res = this.dataview.getInt8(this.position);
        } else {
          res = this.dataview.getUint8(this.position);          
        }
        break;
      case 2:
        if (signed) {
          res = this.dataview.getInt16(this.position);
        } else {
          res = this.dataview.getUint16(this.position);          
        }
        break;
      case 3:
        if (signed) {
          throw ("No method for reading signed 24 bits values");
        } else {
          res = this.dataview.getUint8(this.position) << 16;
          res |= this.dataview.getUint8(this.position) << 8;
          res |= this.dataview.getUint8(this.position);
        }
        break;
      case 4:
        if (signed) {
          res = this.dataview.getInt32(this.position);
        } else {
          res = this.dataview.getUint32(this.position);          
        }
        break;
      case 8:
        if (signed) {
          throw ("No method for reading signed 64 bits values");
        } else {
          res = this.dataview.getUint32(this.position) << 32;          
          res |= this.dataview.getUint32(this.position);
        }
        break;
      default:
        throw ("readInt method not implemented for size: "+size);  
    }
    this.position+= size;
    return res;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readUint8 = function() {
  return this.readAnyInt(1, false);
}

MP4BoxStream.prototype.readUint16 = function() {
  return this.readAnyInt(2, false);
}

MP4BoxStream.prototype.readUint24 = function() {
  return this.readAnyInt(3, false);
}

MP4BoxStream.prototype.readUint32 = function() {
  return this.readAnyInt(4, false);
}

MP4BoxStream.prototype.readUint64 = function() {
  return this.readAnyInt(8, false);
}

MP4BoxStream.prototype.readString = function(length) {
  if (this.position + length <= this.buffer.byteLength) {
    var s = "";
    for (var i = 0; i < length; i++) {
      s += String.fromCharCode(this.readUint8());
    }
    return s;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readCString = function() {
  var arr = [];
  while(true) {
    var b = this.readUint8();
    if (b !== 0) {
      arr.push(b);
    } else {
      break;
    }
  }
  return String.fromCharCode.apply(null, arr); 
}

MP4BoxStream.prototype.readInt8 = function() {
  return this.readAnyInt(1, true);
}

MP4BoxStream.prototype.readInt16 = function() {
  return this.readAnyInt(2, true);
}

MP4BoxStream.prototype.readInt32 = function() {
  return this.readAnyInt(4, true);
}

MP4BoxStream.prototype.readInt64 = function() {
  return this.readAnyInt(8, false);
}

MP4BoxStream.prototype.readUint8Array = function(length) {
  var arr = new Uint8Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint8();
  }
  return arr;
}

MP4BoxStream.prototype.readInt16Array = function(length) {
  var arr = new Int16Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readInt16();
  }
  return arr;
}

MP4BoxStream.prototype.readUint16Array = function(length) {
  var arr = new Int16Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint16();
  }
  return arr;
}

MP4BoxStream.prototype.readUint32Array = function(length) {
  var arr = new Uint32Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint32();
  }
  return arr;
}

MP4BoxStream.prototype.readInt32Array = function(length) {
  var arr = new Int32Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readInt32();
  }
  return arr;
}

if (typeof exports !== 'undefined') {
  exports.MP4BoxStream = MP4BoxStream;
}// file:src/DataStream.js
/**
  DataStream reads scalars, arrays and structs of data from an ArrayBuffer.
  It's like a file-like DataView on steroids.

  @param {ArrayBuffer} arrayBuffer ArrayBuffer to read from.
  @param {?Number} byteOffset Offset from arrayBuffer beginning for the DataStream.
  @param {?Boolean} endianness DataStream.BIG_ENDIAN or DataStream.LITTLE_ENDIAN (the default).
  */
var DataStream = function(arrayBuffer, byteOffset, endianness) {
  this._byteOffset = byteOffset || 0;
  if (arrayBuffer instanceof ArrayBuffer) {
    this.buffer = arrayBuffer;
  } else if (typeof arrayBuffer == "object") {
    this.dataView = arrayBuffer;
    if (byteOffset) {
      this._byteOffset += byteOffset;
    }
  } else {
    this.buffer = new ArrayBuffer(arrayBuffer || 0);
  }
  this.position = 0;
  this.endianness = endianness == null ? DataStream.LITTLE_ENDIAN : endianness;
};
DataStream.prototype = {};

DataStream.prototype.getPosition = function() {
  return this.position;
}

/**
  Internal function to resize the DataStream buffer when required.
  @param {number} extra Number of bytes to add to the buffer allocation.
  @return {null}
  */
DataStream.prototype._realloc = function(extra) {
  if (!this._dynamicSize) {
    return;
  }
  var req = this._byteOffset + this.position + extra;
  var blen = this._buffer.byteLength;
  if (req <= blen) {
    if (req > this._byteLength) {
      this._byteLength = req;
    }
    return;
  }
  if (blen < 1) {
    blen = 1;
  }
  while (req > blen) {
    blen *= 2;
  }
  var buf = new ArrayBuffer(blen);
  var src = new Uint8Array(this._buffer);
  var dst = new Uint8Array(buf, 0, src.length);
  dst.set(src);
  this.buffer = buf;
  this._byteLength = req;
};

/**
  Internal function to trim the DataStream buffer when required.
  Used for stripping out the extra bytes from the backing buffer when
  the virtual byteLength is smaller than the buffer byteLength (happens after
  growing the buffer with writes and not filling the extra space completely).

  @return {null}
  */
DataStream.prototype._trimAlloc = function() {
  if (this._byteLength == this._buffer.byteLength) {
    return;
  }
  var buf = new ArrayBuffer(this._byteLength);
  var dst = new Uint8Array(buf);
  var src = new Uint8Array(this._buffer, 0, dst.length);
  dst.set(src);
  this.buffer = buf;
};


/**
  Big-endian const to use as default endianness.
  @type {boolean}
  */
DataStream.BIG_ENDIAN = false;

/**
  Little-endian const to use as default endianness.
  @type {boolean}
  */
DataStream.LITTLE_ENDIAN = true;

/**
  Virtual byte length of the DataStream backing buffer.
  Updated to be max of original buffer size and last written size.
  If dynamicSize is false is set to buffer size.
  @type {number}
  */
DataStream.prototype._byteLength = 0;

/**
  Returns the byte length of the DataStream object.
  @type {number}
  */
Object.defineProperty(DataStream.prototype, 'byteLength',
  { get: function() {
    return this._byteLength - this._byteOffset;
  }});

/**
  Set/get the backing ArrayBuffer of the DataStream object.
  The setter updates the DataView to point to the new buffer.
  @type {Object}
  */
Object.defineProperty(DataStream.prototype, 'buffer',
  { get: function() {
      this._trimAlloc();
      return this._buffer;
    },
    set: function(v) {
      this._buffer = v;
      this._dataView = new DataView(this._buffer, this._byteOffset);
      this._byteLength = this._buffer.byteLength;
    } });

/**
  Set/get the byteOffset of the DataStream object.
  The setter updates the DataView to point to the new byteOffset.
  @type {number}
  */
Object.defineProperty(DataStream.prototype, 'byteOffset',
  { get: function() {
      return this._byteOffset;
    },
    set: function(v) {
      this._byteOffset = v;
      this._dataView = new DataView(this._buffer, this._byteOffset);
      this._byteLength = this._buffer.byteLength;
    } });

/**
  Set/get the backing DataView of the DataStream object.
  The setter updates the buffer and byteOffset to point to the DataView values.
  @type {Object}
  */
Object.defineProperty(DataStream.prototype, 'dataView',
  { get: function() {
      return this._dataView;
    },
    set: function(v) {
      this._byteOffset = v.byteOffset;
      this._buffer = v.buffer;
      this._dataView = new DataView(this._buffer, this._byteOffset);
      this._byteLength = this._byteOffset + v.byteLength;
    } });

/**
  Sets the DataStream read/write position to given position.
  Clamps between 0 and DataStream length.

  @param {number} pos Position to seek to.
  @return {null}
  */
DataStream.prototype.seek = function(pos) {
  var npos = Math.max(0, Math.min(this.byteLength, pos));
  this.position = (isNaN(npos) || !isFinite(npos)) ? 0 : npos;
};

/**
  Returns true if the DataStream seek pointer is at the end of buffer and
  there's no more data to read.

  @return {boolean} True if the seek pointer is at the end of the buffer.
  */
DataStream.prototype.isEof = function() {
  return (this.position >= this._byteLength);
};


/**
  Maps a Uint8Array into the DataStream buffer.

  Nice for quickly reading in data.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} Uint8Array to the DataStream backing buffer.
  */
DataStream.prototype.mapUint8Array = function(length) {
  this._realloc(length * 1);
  var arr = new Uint8Array(this._buffer, this.byteOffset+this.position, length);
  this.position += length * 1;
  return arr;
};


/**
  Reads an Int32Array of desired length and endianness from the DataStream.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} The read Int32Array.
 */
DataStream.prototype.readInt32Array = function(length, e) {
  length = length == null ? (this.byteLength-this.position / 4) : length;
  var arr = new Int32Array(length);
  DataStream.memcpy(arr.buffer, 0,
                    this.buffer, this.byteOffset+this.position,
                    length*arr.BYTES_PER_ELEMENT);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += arr.byteLength;
  return arr;
};

/**
  Reads an Int16Array of desired length and endianness from the DataStream.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} The read Int16Array.
 */
DataStream.prototype.readInt16Array = function(length, e) {
  length = length == null ? (this.byteLength-this.position / 2) : length;
  var arr = new Int16Array(length);
  DataStream.memcpy(arr.buffer, 0,
                    this.buffer, this.byteOffset+this.position,
                    length*arr.BYTES_PER_ELEMENT);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += arr.byteLength;
  return arr;
};

/**
  Reads an Int8Array of desired length from the DataStream.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} The read Int8Array.
 */
DataStream.prototype.readInt8Array = function(length) {
  length = length == null ? (this.byteLength-this.position) : length;
  var arr = new Int8Array(length);
  DataStream.memcpy(arr.buffer, 0,
                    this.buffer, this.byteOffset+this.position,
                    length*arr.BYTES_PER_ELEMENT);
  this.position += arr.byteLength;
  return arr;
};

/**
  Reads a Uint32Array of desired length and endianness from the DataStream.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} The read Uint32Array.
 */
DataStream.prototype.readUint32Array = function(length, e) {
  length = length == null ? (this.byteLength-this.position / 4) : length;
  var arr = new Uint32Array(length);
  DataStream.memcpy(arr.buffer, 0,
                    this.buffer, this.byteOffset+this.position,
                    length*arr.BYTES_PER_ELEMENT);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += arr.byteLength;
  return arr;
};

/**
  Reads a Uint16Array of desired length and endianness from the DataStream.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} The read Uint16Array.
 */
DataStream.prototype.readUint16Array = function(length, e) {
  length = length == null ? (this.byteLength-this.position / 2) : length;
  var arr = new Uint16Array(length);
  DataStream.memcpy(arr.buffer, 0,
                    this.buffer, this.byteOffset+this.position,
                    length*arr.BYTES_PER_ELEMENT);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += arr.byteLength;
  return arr;
};

/**
  Reads a Uint8Array of desired length from the DataStream.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} The read Uint8Array.
 */
DataStream.prototype.readUint8Array = function(length) {
  length = length == null ? (this.byteLength-this.position) : length;
  var arr = new Uint8Array(length);
  DataStream.memcpy(arr.buffer, 0,
                    this.buffer, this.byteOffset+this.position,
                    length*arr.BYTES_PER_ELEMENT);
  this.position += arr.byteLength;
  return arr;
};

/**
  Reads a Float64Array of desired length and endianness from the DataStream.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} The read Float64Array.
 */
DataStream.prototype.readFloat64Array = function(length, e) {
  length = length == null ? (this.byteLength-this.position / 8) : length;
  var arr = new Float64Array(length);
  DataStream.memcpy(arr.buffer, 0,
                    this.buffer, this.byteOffset+this.position,
                    length*arr.BYTES_PER_ELEMENT);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += arr.byteLength;
  return arr;
};

/**
  Reads a Float32Array of desired length and endianness from the DataStream.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} The read Float32Array.
 */
DataStream.prototype.readFloat32Array = function(length, e) {
  length = length == null ? (this.byteLength-this.position / 4) : length;
  var arr = new Float32Array(length);
  DataStream.memcpy(arr.buffer, 0,
                    this.buffer, this.byteOffset+this.position,
                    length*arr.BYTES_PER_ELEMENT);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += arr.byteLength;
  return arr;
};


/**
  Reads a 32-bit int from the DataStream with the desired endianness.

  @param {?boolean} e Endianness of the number.
  @return {number} The read number.
 */
DataStream.prototype.readInt32 = function(e) {
  var v = this._dataView.getInt32(this.position, e == null ? this.endianness : e);
  this.position += 4;
  return v;
};

/**
  Reads a 16-bit int from the DataStream with the desired endianness.

  @param {?boolean} e Endianness of the number.
  @return {number} The read number.
 */
DataStream.prototype.readInt16 = function(e) {
  var v = this._dataView.getInt16(this.position, e == null ? this.endianness : e);
  this.position += 2;
  return v;
};

/**
  Reads an 8-bit int from the DataStream.

  @return {number} The read number.
 */
DataStream.prototype.readInt8 = function() {
  var v = this._dataView.getInt8(this.position);
  this.position += 1;
  return v;
};

/**
  Reads a 32-bit unsigned int from the DataStream with the desired endianness.

  @param {?boolean} e Endianness of the number.
  @return {number} The read number.
 */
DataStream.prototype.readUint32 = function(e) {
  var v = this._dataView.getUint32(this.position, e == null ? this.endianness : e);
  this.position += 4;
  return v;
};

/**
  Reads a 16-bit unsigned int from the DataStream with the desired endianness.

  @param {?boolean} e Endianness of the number.
  @return {number} The read number.
 */
DataStream.prototype.readUint16 = function(e) {
  var v = this._dataView.getUint16(this.position, e == null ? this.endianness : e);
  this.position += 2;
  return v;
};

/**
  Reads an 8-bit unsigned int from the DataStream.

  @return {number} The read number.
 */
DataStream.prototype.readUint8 = function() {
  var v = this._dataView.getUint8(this.position);
  this.position += 1;
  return v;
};

/**
  Reads a 32-bit float from the DataStream with the desired endianness.

  @param {?boolean} e Endianness of the number.
  @return {number} The read number.
 */
DataStream.prototype.readFloat32 = function(e) {
  var v = this._dataView.getFloat32(this.position, e == null ? this.endianness : e);
  this.position += 4;
  return v;
};

/**
  Reads a 64-bit float from the DataStream with the desired endianness.

  @param {?boolean} e Endianness of the number.
  @return {number} The read number.
 */
DataStream.prototype.readFloat64 = function(e) {
  var v = this._dataView.getFloat64(this.position, e == null ? this.endianness : e);
  this.position += 8;
  return v;
};

/**
  Native endianness. Either DataStream.BIG_ENDIAN or DataStream.LITTLE_ENDIAN
  depending on the platform endianness.

  @type {boolean}
 */
DataStream.endianness = new Int8Array(new Int16Array([1]).buffer)[0] > 0;

/**
  Copies byteLength bytes from the src buffer at srcOffset to the
  dst buffer at dstOffset.

  @param {Object} dst Destination ArrayBuffer to write to.
  @param {number} dstOffset Offset to the destination ArrayBuffer.
  @param {Object} src Source ArrayBuffer to read from.
  @param {number} srcOffset Offset to the source ArrayBuffer.
  @param {number} byteLength Number of bytes to copy.
 */
DataStream.memcpy = function(dst, dstOffset, src, srcOffset, byteLength) {
  var dstU8 = new Uint8Array(dst, dstOffset, byteLength);
  var srcU8 = new Uint8Array(src, srcOffset, byteLength);
  dstU8.set(srcU8);
};

/**
  Converts array to native endianness in-place.

  @param {Object} array Typed array to convert.
  @param {boolean} arrayIsLittleEndian True if the data in the array is
                                       little-endian. Set false for big-endian.
  @return {Object} The converted typed array.
 */
DataStream.arrayToNative = function(array, arrayIsLittleEndian) {
  if (arrayIsLittleEndian == this.endianness) {
    return array;
  } else {
    return this.flipArrayEndianness(array);
  }
};

/**
  Converts native endianness array to desired endianness in-place.

  @param {Object} array Typed array to convert.
  @param {boolean} littleEndian True if the converted array should be
                                little-endian. Set false for big-endian.
  @return {Object} The converted typed array.
 */
DataStream.nativeToEndian = function(array, littleEndian) {
  if (this.endianness == littleEndian) {
    return array;
  } else {
    return this.flipArrayEndianness(array);
  }
};

/**
  Flips typed array endianness in-place.

  @param {Object} array Typed array to flip.
  @return {Object} The converted typed array.
 */
DataStream.flipArrayEndianness = function(array) {
  var u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  for (var i=0; i<array.byteLength; i+=array.BYTES_PER_ELEMENT) {
    for (var j=i+array.BYTES_PER_ELEMENT-1, k=i; j>k; j--, k++) {
      var tmp = u8[k];
      u8[k] = u8[j];
      u8[j] = tmp;
    }
  }
  return array;
};

/**
  Seek position where DataStream#readStruct ran into a problem.
  Useful for debugging struct parsing.

  @type {number}
 */
DataStream.prototype.failurePosition = 0;

String.fromCharCodeUint8 = function(uint8arr) {
    var arr = [];
    for (var i = 0; i < uint8arr.length; i++) {
      arr[i] = uint8arr[i];
    }
    return String.fromCharCode.apply(null, arr);
}
/**
  Read a string of desired length and encoding from the DataStream.

  @param {number} length The length of the string to read in bytes.
  @param {?string} encoding The encoding of the string data in the DataStream.
                            Defaults to ASCII.
  @return {string} The read string.
 */
DataStream.prototype.readString = function(length, encoding) {
  if (encoding == null || encoding == "ASCII") {
    return String.fromCharCodeUint8.apply(null, [this.mapUint8Array(length == null ? this.byteLength-this.position : length)]);
  } else {
    return (new TextDecoder(encoding)).decode(this.mapUint8Array(length));
  }
};

/**
  Read null-terminated string of desired length from the DataStream. Truncates
  the returned string so that the null byte is not a part of it.

  @param {?number} length The length of the string to read.
  @return {string} The read string.
 */
DataStream.prototype.readCString = function(length) {
  var blen = this.byteLength-this.position;
  var u8 = new Uint8Array(this._buffer, this._byteOffset + this.position);
  var len = blen;
  if (length != null) {
    len = Math.min(length, blen);
  }
  for (var i = 0; i < len && u8[i] !== 0; i++); // find first zero byte
  var s = String.fromCharCodeUint8.apply(null, [this.mapUint8Array(i)]);
  if (length != null) {
    this.position += len-i;
  } else if (i != blen) {
    this.position += 1; // trailing zero if not at end of buffer
  }
  return s;
};

/* 
   TODO: fix endianness for 24/64-bit fields
   TODO: check range/support for 64-bits numbers in JavaScript
*/
var MAX_SIZE = Math.pow(2, 32);

DataStream.prototype.readInt64 = function () {
  return (this.readInt32()*MAX_SIZE)+this.readUint32();
}
DataStream.prototype.readUint64 = function () {
	return (this.readUint32()*MAX_SIZE)+this.readUint32();
}

DataStream.prototype.readInt64 = function () {
  return (this.readUint32()*MAX_SIZE)+this.readUint32();
}

DataStream.prototype.readUint24 = function () {
	return (this.readUint8()<<16)+(this.readUint8()<<8)+this.readUint8();
}

if (typeof exports !== 'undefined') {
  exports.DataStream = DataStream;  
}
// file:src/DataStream-write.js
/**
  Saves the DataStream contents to the given filename.
  Uses Chrome's anchor download property to initiate download.
 
  @param {string} filename Filename to save as.
  @return {null}
  */
DataStream.prototype.save = function(filename) {
  var blob = new Blob([this.buffer]);
  if (window.URL && URL.createObjectURL) {
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement('a');
      // Required in Firefox:
      document.body.appendChild(a);
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      // Required in Firefox:
      a.setAttribute('target', '_self');
      a.click();
      window.URL.revokeObjectURL(url);
  } else {
      throw("DataStream.save: Can't create object URL.");
  }
};

/**
  Whether to extend DataStream buffer when trying to write beyond its size.
  If set, the buffer is reallocated to twice its current size until the
  requested write fits the buffer.
  @type {boolean}
  */
DataStream.prototype._dynamicSize = true;
Object.defineProperty(DataStream.prototype, 'dynamicSize',
  { get: function() {
      return this._dynamicSize;
    },
    set: function(v) {
      if (!v) {
        this._trimAlloc();
      }
      this._dynamicSize = v;
    } });

/**
  Internal function to trim the DataStream buffer when required.
  Used for stripping out the first bytes when not needed anymore.

  @return {null}
  */
DataStream.prototype.shift = function(offset) {
  var buf = new ArrayBuffer(this._byteLength-offset);
  var dst = new Uint8Array(buf);
  var src = new Uint8Array(this._buffer, offset, dst.length);
  dst.set(src);
  this.buffer = buf;
  this.position -= offset;
};

/**
  Writes an Int32Array of specified endianness to the DataStream.

  @param {Object} arr The array to write.
  @param {?boolean} e Endianness of the data to write.
 */
DataStream.prototype.writeInt32Array = function(arr, e) {
  this._realloc(arr.length * 4);
  if (arr instanceof Int32Array &&
      this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
    DataStream.memcpy(this._buffer, this.byteOffset+this.position,
                      arr.buffer, 0,
                      arr.byteLength);
    this.mapInt32Array(arr.length, e);
  } else {
    for (var i=0; i<arr.length; i++) {
      this.writeInt32(arr[i], e);
    }
  }
};

/**
  Writes an Int16Array of specified endianness to the DataStream.

  @param {Object} arr The array to write.
  @param {?boolean} e Endianness of the data to write.
 */
DataStream.prototype.writeInt16Array = function(arr, e) {
  this._realloc(arr.length * 2);
  if (arr instanceof Int16Array &&
      this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
    DataStream.memcpy(this._buffer, this.byteOffset+this.position,
                      arr.buffer, 0,
                      arr.byteLength);
    this.mapInt16Array(arr.length, e);
  } else {
    for (var i=0; i<arr.length; i++) {
      this.writeInt16(arr[i], e);
    }
  }
};

/**
  Writes an Int8Array to the DataStream.

  @param {Object} arr The array to write.
 */
DataStream.prototype.writeInt8Array = function(arr) {
  this._realloc(arr.length * 1);
  if (arr instanceof Int8Array &&
      this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
    DataStream.memcpy(this._buffer, this.byteOffset+this.position,
                      arr.buffer, 0,
                      arr.byteLength);
    this.mapInt8Array(arr.length);
  } else {
    for (var i=0; i<arr.length; i++) {
      this.writeInt8(arr[i]);
    }
  }
};

/**
  Writes a Uint32Array of specified endianness to the DataStream.

  @param {Object} arr The array to write.
  @param {?boolean} e Endianness of the data to write.
 */
DataStream.prototype.writeUint32Array = function(arr, e) {
  this._realloc(arr.length * 4);
  if (arr instanceof Uint32Array &&
      this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
    DataStream.memcpy(this._buffer, this.byteOffset+this.position,
                      arr.buffer, 0,
                      arr.byteLength);
    this.mapUint32Array(arr.length, e);
  } else {
    for (var i=0; i<arr.length; i++) {
      this.writeUint32(arr[i], e);
    }
  }
};

/**
  Writes a Uint16Array of specified endianness to the DataStream.

  @param {Object} arr The array to write.
  @param {?boolean} e Endianness of the data to write.
 */
DataStream.prototype.writeUint16Array = function(arr, e) {
  this._realloc(arr.length * 2);
  if (arr instanceof Uint16Array &&
      this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
    DataStream.memcpy(this._buffer, this.byteOffset+this.position,
                      arr.buffer, 0,
                      arr.byteLength);
    this.mapUint16Array(arr.length, e);
  } else {
    for (var i=0; i<arr.length; i++) {
      this.writeUint16(arr[i], e);
    }
  }
};

/**
  Writes a Uint8Array to the DataStream.

  @param {Object} arr The array to write.
 */
DataStream.prototype.writeUint8Array = function(arr) {
  this._realloc(arr.length * 1);
  if (arr instanceof Uint8Array &&
      this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
    DataStream.memcpy(this._buffer, this.byteOffset+this.position,
                      arr.buffer, 0,
                      arr.byteLength);
    this.mapUint8Array(arr.length);
  } else {
    for (var i=0; i<arr.length; i++) {
      this.writeUint8(arr[i]);
    }
  }
};

/**
  Writes a Float64Array of specified endianness to the DataStream.

  @param {Object} arr The array to write.
  @param {?boolean} e Endianness of the data to write.
 */
DataStream.prototype.writeFloat64Array = function(arr, e) {
  this._realloc(arr.length * 8);
  if (arr instanceof Float64Array &&
      this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
    DataStream.memcpy(this._buffer, this.byteOffset+this.position,
                      arr.buffer, 0,
                      arr.byteLength);
    this.mapFloat64Array(arr.length, e);
  } else {
    for (var i=0; i<arr.length; i++) {
      this.writeFloat64(arr[i], e);
    }
  }
};

/**
  Writes a Float32Array of specified endianness to the DataStream.

  @param {Object} arr The array to write.
  @param {?boolean} e Endianness of the data to write.
 */
DataStream.prototype.writeFloat32Array = function(arr, e) {
  this._realloc(arr.length * 4);
  if (arr instanceof Float32Array &&
      this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
    DataStream.memcpy(this._buffer, this.byteOffset+this.position,
                      arr.buffer, 0,
                      arr.byteLength);
    this.mapFloat32Array(arr.length, e);
  } else {
    for (var i=0; i<arr.length; i++) {
      this.writeFloat32(arr[i], e);
    }
  }
};


/**
  Writes a 32-bit int to the DataStream with the desired endianness.

  @param {number} v Number to write.
  @param {?boolean} e Endianness of the number.
 */
DataStream.prototype.writeInt32 = function(v, e) {
  this._realloc(4);
  this._dataView.setInt32(this.position, v, e == null ? this.endianness : e);
  this.position += 4;
};

/**
  Writes a 16-bit int to the DataStream with the desired endianness.

  @param {number} v Number to write.
  @param {?boolean} e Endianness of the number.
 */
DataStream.prototype.writeInt16 = function(v, e) {
  this._realloc(2);
  this._dataView.setInt16(this.position, v, e == null ? this.endianness : e);
  this.position += 2;
};

/**
  Writes an 8-bit int to the DataStream.

  @param {number} v Number to write.
 */
DataStream.prototype.writeInt8 = function(v) {
  this._realloc(1);
  this._dataView.setInt8(this.position, v);
  this.position += 1;
};

/**
  Writes a 32-bit unsigned int to the DataStream with the desired endianness.

  @param {number} v Number to write.
  @param {?boolean} e Endianness of the number.
 */
DataStream.prototype.writeUint32 = function(v, e) {
  this._realloc(4);
  this._dataView.setUint32(this.position, v, e == null ? this.endianness : e);
  this.position += 4;
};

/**
  Writes a 16-bit unsigned int to the DataStream with the desired endianness.

  @param {number} v Number to write.
  @param {?boolean} e Endianness of the number.
 */
DataStream.prototype.writeUint16 = function(v, e) {
  this._realloc(2);
  this._dataView.setUint16(this.position, v, e == null ? this.endianness : e);
  this.position += 2;
};

/**
  Writes an 8-bit unsigned  int to the DataStream.

  @param {number} v Number to write.
 */
DataStream.prototype.writeUint8 = function(v) {
  this._realloc(1);
  this._dataView.setUint8(this.position, v);
  this.position += 1;
};

/**
  Writes a 32-bit float to the DataStream with the desired endianness.

  @param {number} v Number to write.
  @param {?boolean} e Endianness of the number.
 */
DataStream.prototype.writeFloat32 = function(v, e) {
  this._realloc(4);
  this._dataView.setFloat32(this.position, v, e == null ? this.endianness : e);
  this.position += 4;
};

/**
  Writes a 64-bit float to the DataStream with the desired endianness.

  @param {number} v Number to write.
  @param {?boolean} e Endianness of the number.
 */
DataStream.prototype.writeFloat64 = function(v, e) {
  this._realloc(8);
  this._dataView.setFloat64(this.position, v, e == null ? this.endianness : e);
  this.position += 8;
};

/**
  Write a UCS-2 string of desired endianness to the DataStream. The
  lengthOverride argument lets you define the number of characters to write.
  If the string is shorter than lengthOverride, the extra space is padded with
  zeroes.

  @param {string} str The string to write.
  @param {?boolean} endianness The endianness to use for the written string data.
  @param {?number} lengthOverride The number of characters to write.
 */
DataStream.prototype.writeUCS2String = function(str, endianness, lengthOverride) {
  if (lengthOverride == null) {
    lengthOverride = str.length;
  }
  for (var i = 0; i < str.length && i < lengthOverride; i++) {
    this.writeUint16(str.charCodeAt(i), endianness);
  }
  for (; i<lengthOverride; i++) {
    this.writeUint16(0);
  }
};

/**
  Writes a string of desired length and encoding to the DataStream.

  @param {string} s The string to write.
  @param {?string} encoding The encoding for the written string data.
                            Defaults to ASCII.
  @param {?number} length The number of characters to write.
 */
DataStream.prototype.writeString = function(s, encoding, length) {
  var i = 0;
  if (encoding == null || encoding == "ASCII") {
    if (length != null) {
      var len = Math.min(s.length, length);
      for (i=0; i<len; i++) {
        this.writeUint8(s.charCodeAt(i));
      }
      for (; i<length; i++) {
        this.writeUint8(0);
      }
    } else {
      for (i=0; i<s.length; i++) {
        this.writeUint8(s.charCodeAt(i));
      }
    }
  } else {
    this.writeUint8Array((new TextEncoder(encoding)).encode(s.substring(0, length)));
  }
};

/**
  Writes a null-terminated string to DataStream and zero-pads it to length
  bytes. If length is not given, writes the string followed by a zero.
  If string is longer than length, the written part of the string does not have
  a trailing zero.

  @param {string} s The string to write.
  @param {?number} length The number of characters to write.
 */
DataStream.prototype.writeCString = function(s, length) {
  var i = 0;
  if (length != null) {
    var len = Math.min(s.length, length);
    for (i=0; i<len; i++) {
      this.writeUint8(s.charCodeAt(i));
    }
    for (; i<length; i++) {
      this.writeUint8(0);
    }
  } else {
    for (i=0; i<s.length; i++) {
      this.writeUint8(s.charCodeAt(i));
    }
    this.writeUint8(0);
  }
};

/**
  Writes a struct to the DataStream. Takes a structDefinition that gives the
  types and a struct object that gives the values. Refer to readStruct for the
  structure of structDefinition.

  @param {Object} structDefinition Type definition of the struct.
  @param {Object} struct The struct data object.
  */
DataStream.prototype.writeStruct = function(structDefinition, struct) {
  for (var i = 0; i < structDefinition.length; i+=2) {
    var t = structDefinition[i+1];
    this.writeType(t, struct[structDefinition[i]], struct);
  }
};

/**
  Writes object v of type t to the DataStream.

  @param {Object} t Type of data to write.
  @param {Object} v Value of data to write.
  @param {Object} struct Struct to pass to write callback functions.
  */
DataStream.prototype.writeType = function(t, v, struct) {
  var tp;
  if (typeof t == "function") {
    return t(this, v);
  } else if (typeof t == "object" && !(t instanceof Array)) {
    return t.set(this, v, struct);
  }
  var lengthOverride = null;
  var charset = "ASCII";
  var pos = this.position;
  if (typeof(t) == 'string' && /:/.test(t)) {
    tp = t.split(":");
    t = tp[0];
    lengthOverride = parseInt(tp[1]);
  }
  if (typeof t == 'string' && /,/.test(t)) {
    tp = t.split(",");
    t = tp[0];
    charset = parseInt(tp[1]);
  }

  switch(t) {
    case 'uint8':
      this.writeUint8(v);
      break;
    case 'int8':
      this.writeInt8(v);
      break;

    case 'uint16':
      this.writeUint16(v, this.endianness);
      break;
    case 'int16':
      this.writeInt16(v, this.endianness);
      break;
    case 'uint32':
      this.writeUint32(v, this.endianness);
      break;
    case 'int32':
      this.writeInt32(v, this.endianness);
      break;
    case 'float32':
      this.writeFloat32(v, this.endianness);
      break;
    case 'float64':
      this.writeFloat64(v, this.endianness);
      break;

    case 'uint16be':
      this.writeUint16(v, DataStream.BIG_ENDIAN);
      break;
    case 'int16be':
      this.writeInt16(v, DataStream.BIG_ENDIAN);
      break;
    case 'uint32be':
      this.writeUint32(v, DataStream.BIG_ENDIAN);
      break;
    case 'int32be':
      this.writeInt32(v, DataStream.BIG_ENDIAN);
      break;
    case 'float32be':
      this.writeFloat32(v, DataStream.BIG_ENDIAN);
      break;
    case 'float64be':
      this.writeFloat64(v, DataStream.BIG_ENDIAN);
      break;

    case 'uint16le':
      this.writeUint16(v, DataStream.LITTLE_ENDIAN);
      break;
    case 'int16le':
      this.writeInt16(v, DataStream.LITTLE_ENDIAN);
      break;
    case 'uint32le':
      this.writeUint32(v, DataStream.LITTLE_ENDIAN);
      break;
    case 'int32le':
      this.writeInt32(v, DataStream.LITTLE_ENDIAN);
      break;
    case 'float32le':
      this.writeFloat32(v, DataStream.LITTLE_ENDIAN);
      break;
    case 'float64le':
      this.writeFloat64(v, DataStream.LITTLE_ENDIAN);
      break;

    case 'cstring':
      this.writeCString(v, lengthOverride);
      break;

    case 'string':
      this.writeString(v, charset, lengthOverride);
      break;

    case 'u16string':
      this.writeUCS2String(v, this.endianness, lengthOverride);
      break;

    case 'u16stringle':
      this.writeUCS2String(v, DataStream.LITTLE_ENDIAN, lengthOverride);
      break;

    case 'u16stringbe':
      this.writeUCS2String(v, DataStream.BIG_ENDIAN, lengthOverride);
      break;

    default:
      if (t.length == 3) {
        var ta = t[1];
        for (var i=0; i<v.length; i++) {
          this.writeType(ta, v[i]);
        }
        break;
      } else {
        this.writeStruct(t, v);
        break;
      }
  }
  if (lengthOverride != null) {
    this.position = pos;
    this._realloc(lengthOverride);
    this.position = pos + lengthOverride;
  }
};


DataStream.prototype.writeUint64 = function (v) {
	var h = Math.floor(v / MAX_SIZE);
	this.writeUint32(h);
	this.writeUint32(v & 0xFFFFFFFF);
}

DataStream.prototype.writeUint24 = function (v) {
	this.writeUint8((v & 0x00FF0000)>>16);
	this.writeUint8((v & 0x0000FF00)>>8);
	this.writeUint8((v & 0x000000FF));
}

DataStream.prototype.adjustUint32 = function(position, value) {
	var pos = this.position;
	this.seek(position);
	this.writeUint32(value);
	this.seek(pos);
}
// file:src/DataStream-map.js
/**
  Maps an Int32Array into the DataStream buffer, swizzling it to native
  endianness in-place. The current offset from the start of the buffer needs to
  be a multiple of element size, just like with typed array views.

  Nice for quickly reading in data. Warning: potentially modifies the buffer
  contents.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} Int32Array to the DataStream backing buffer.
  */
DataStream.prototype.mapInt32Array = function(length, e) {
  this._realloc(length * 4);
  var arr = new Int32Array(this._buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += length * 4;
  return arr;
};

/**
  Maps an Int16Array into the DataStream buffer, swizzling it to native
  endianness in-place. The current offset from the start of the buffer needs to
  be a multiple of element size, just like with typed array views.

  Nice for quickly reading in data. Warning: potentially modifies the buffer
  contents.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} Int16Array to the DataStream backing buffer.
  */
DataStream.prototype.mapInt16Array = function(length, e) {
  this._realloc(length * 2);
  var arr = new Int16Array(this._buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += length * 2;
  return arr;
};

/**
  Maps an Int8Array into the DataStream buffer.

  Nice for quickly reading in data.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} Int8Array to the DataStream backing buffer.
  */
DataStream.prototype.mapInt8Array = function(length) {
  this._realloc(length * 1);
  var arr = new Int8Array(this._buffer, this.byteOffset+this.position, length);
  this.position += length * 1;
  return arr;
};

/**
  Maps a Uint32Array into the DataStream buffer, swizzling it to native
  endianness in-place. The current offset from the start of the buffer needs to
  be a multiple of element size, just like with typed array views.

  Nice for quickly reading in data. Warning: potentially modifies the buffer
  contents.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} Uint32Array to the DataStream backing buffer.
  */
DataStream.prototype.mapUint32Array = function(length, e) {
  this._realloc(length * 4);
  var arr = new Uint32Array(this._buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += length * 4;
  return arr;
};

/**
  Maps a Uint16Array into the DataStream buffer, swizzling it to native
  endianness in-place. The current offset from the start of the buffer needs to
  be a multiple of element size, just like with typed array views.

  Nice for quickly reading in data. Warning: potentially modifies the buffer
  contents.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} Uint16Array to the DataStream backing buffer.
  */
DataStream.prototype.mapUint16Array = function(length, e) {
  this._realloc(length * 2);
  var arr = new Uint16Array(this._buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += length * 2;
  return arr;
};

/**
  Maps a Float64Array into the DataStream buffer, swizzling it to native
  endianness in-place. The current offset from the start of the buffer needs to
  be a multiple of element size, just like with typed array views.

  Nice for quickly reading in data. Warning: potentially modifies the buffer
  contents.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} Float64Array to the DataStream backing buffer.
  */
DataStream.prototype.mapFloat64Array = function(length, e) {
  this._realloc(length * 8);
  var arr = new Float64Array(this._buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += length * 8;
  return arr;
};

/**
  Maps a Float32Array into the DataStream buffer, swizzling it to native
  endianness in-place. The current offset from the start of the buffer needs to
  be a multiple of element size, just like with typed array views.

  Nice for quickly reading in data. Warning: potentially modifies the buffer
  contents.

  @param {number} length Number of elements to map.
  @param {?boolean} e Endianness of the data to read.
  @return {Object} Float32Array to the DataStream backing buffer.
  */
DataStream.prototype.mapFloat32Array = function(length, e) {
  this._realloc(length * 4);
  var arr = new Float32Array(this._buffer, this.byteOffset+this.position, length);
  DataStream.arrayToNative(arr, e == null ? this.endianness : e);
  this.position += length * 4;
  return arr;
};
// file:src/buffer.js
/**
 * MultiBufferStream is a class that acts as a SimpleStream for parsing 
 * It holds several, possibly non-contiguous ArrayBuffer objects, each with a fileStart property 
 * containing the offset for the buffer data in an original/virtual file 
 *
 * It inherits also from DataStream for all read/write/alloc operations
 */

/**
 * Constructor
 */
var MultiBufferStream = function(buffer) {
	/* List of ArrayBuffers, with a fileStart property, sorted in fileStart order and non overlapping */
	this.buffers = [];	
	this.bufferIndex = -1;
	if (buffer) {
		this.insertBuffer(buffer);
		this.bufferIndex = 0;
	}
}
MultiBufferStream.prototype = new DataStream(new ArrayBuffer(), 0, DataStream.BIG_ENDIAN);

/************************************************************************************
  Methods for the managnement of the buffers (insertion, removal, concatenation, ...)
 ***********************************************************************************/

MultiBufferStream.prototype.initialized = function() {
	var firstBuffer;
	if (this.bufferIndex > -1) {
		return true;
	} else if (this.buffers.length > 0) {
		firstBuffer = this.buffers[0];
		if (firstBuffer.fileStart === 0) {
			this.buffer = firstBuffer;
			this.bufferIndex = 0;
			Log.debug("MultiBufferStream", "Stream ready for parsing");
			return true;
		} else {
			Log.warn("MultiBufferStream", "The first buffer should have a fileStart of 0");
			this.logBufferLevel();
			return false;
		}
	} else {
		Log.warn("MultiBufferStream", "No buffer to start parsing from");
		this.logBufferLevel();
		return false;
	}			
}

/**
 * helper functions to concatenate two ArrayBuffer objects
 * @param  {ArrayBuffer} buffer1 
 * @param  {ArrayBuffer} buffer2 
 * @return {ArrayBuffer} the concatenation of buffer1 and buffer2 in that order
 */
ArrayBuffer.concat = function(buffer1, buffer2) {
  Log.debug("ArrayBuffer", "Trying to create a new buffer of size: "+(buffer1.byteLength + buffer2.byteLength));
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

/**
 * Reduces the size of a given buffer, but taking the part between offset and offset+newlength
 * @param  {ArrayBuffer} buffer    
 * @param  {Number}      offset    the start of new buffer
 * @param  {Number}      newLength the length of the new buffer
 * @return {ArrayBuffer}           the new buffer
 */
MultiBufferStream.prototype.reduceBuffer = function(buffer, offset, newLength) {
	var smallB;
	smallB = new Uint8Array(newLength);
	smallB.set(new Uint8Array(buffer, offset, newLength));
	smallB.buffer.fileStart = buffer.fileStart+offset;
	smallB.buffer.usedBytes = 0;
	return smallB.buffer;	
}

/**
 * Inserts the new buffer in the sorted list of buffers,
 *  making sure, it is not overlapping with existing ones (possibly reducing its size).
 *  if the new buffer overrides/replaces the 0-th buffer (for instance because it is bigger), 
 *  updates the DataStream buffer for parsing 
*/
MultiBufferStream.prototype.insertBuffer = function(ab) {	
	var to_add = true;
	/* TODO: improve insertion if many buffers */
	for (var i = 0; i < this.buffers.length; i++) {
		var b = this.buffers[i];
		if (ab.fileStart <= b.fileStart) {
			/* the insertion position is found */
			if (ab.fileStart === b.fileStart) {
				/* The new buffer overlaps with an existing buffer */
				if (ab.byteLength >  b.byteLength) {
					/* the new buffer is bigger than the existing one
					   remove the existing buffer and try again to insert 
					   the new buffer to check overlap with the next ones */
					this.buffers.splice(i, 1);
					i--; 
					continue;
				} else {
					/* the new buffer is smaller than the existing one, just drop it */
					Log.warn("MultiBufferStream", "Buffer (fileStart: "+ab.fileStart+" - Length: "+ab.byteLength+") already appended, ignoring");
				}
			} else {
				/* The beginning of the new buffer is not overlapping with an existing buffer
				   let's check the end of it */
				if (ab.fileStart + ab.byteLength <= b.fileStart) {
					/* no overlap, we can add it as is */
				} else {
					/* There is some overlap, cut the new buffer short, and add it*/
					ab = this.reduceBuffer(ab, 0, b.fileStart - ab.fileStart);
				}
				Log.debug("MultiBufferStream", "Appending new buffer (fileStart: "+ab.fileStart+" - Length: "+ab.byteLength+")");
				this.buffers.splice(i, 0, ab);
				/* if this new buffer is inserted in the first place in the list of the buffer, 
				   and the DataStream is initialized, make it the buffer used for parsing */
				if (i === 0) {
					this.buffer = ab;
				}
			}
			to_add = false;
			break;
		} else if (ab.fileStart < b.fileStart + b.byteLength) {
			/* the new buffer overlaps its beginning with the end of the current buffer */
			var offset = b.fileStart + b.byteLength - ab.fileStart;
			var newLength = ab.byteLength - offset;
			if (newLength > 0) {
				/* the new buffer is bigger than the current overlap, drop the overlapping part and try again inserting the remaining buffer */
				ab = this.reduceBuffer(ab, offset, newLength);
			} else {
				/* the content of the new buffer is entirely contained in the existing buffer, drop it entirely */
				to_add = false;
				break;
			}
		}
	}
	/* if the buffer has not been added, we can add it at the end */
	if (to_add) {
		Log.debug("MultiBufferStream", "Appending new buffer (fileStart: "+ab.fileStart+" - Length: "+ab.byteLength+")");
		this.buffers.push(ab);
		/* if this new buffer is inserted in the first place in the list of the buffer, 
		   and the DataStream is initialized, make it the buffer used for parsing */
		if (i === 0) {
			this.buffer = ab;
		}
	}
}

/**
 * Displays the status of the buffers (number and used bytes)
 * @param  {Object} info callback method for display
 */
MultiBufferStream.prototype.logBufferLevel = function(info) {
	var i;
	var buffer;
	var used, total;
	var ranges = [];
	var range;
	var bufferedString = "";
	used = 0;
	total = 0;
	for (i = 0; i < this.buffers.length; i++) {
		buffer = this.buffers[i];
		if (i === 0) {
			range = {};
			ranges.push(range);
			range.start = buffer.fileStart;
			range.end = buffer.fileStart+buffer.byteLength;
			bufferedString += "["+range.start+"-";
		} else if (range.end === buffer.fileStart) {
			range.end = buffer.fileStart+buffer.byteLength;
		} else {
			range = {};
			range.start = buffer.fileStart;
			bufferedString += (ranges[ranges.length-1].end-1)+"], ["+range.start+"-";
			range.end = buffer.fileStart+buffer.byteLength;
			ranges.push(range);
		}
		used += buffer.usedBytes;
		total += buffer.byteLength;
	}
	if (ranges.length > 0) {
		bufferedString += (range.end-1)+"]";
	}
	var log = (info ? Log.info : Log.debug)
	if (this.buffers.length === 0) {
		log("MultiBufferStream", "No more buffer in memory");
	} else {
		log("MultiBufferStream", ""+this.buffers.length+" stored buffer(s) ("+used+"/"+total+" bytes): "+bufferedString);
	}
}

MultiBufferStream.prototype.cleanBuffers = function () {
	var i;
	var buffer;
	for (i = 0; i < this.buffers.length; i++) {
		buffer = this.buffers[i];
		if (buffer.usedBytes === buffer.byteLength) {
			Log.debug("MultiBufferStream", "Removing buffer #"+i);
			this.buffers.splice(i, 1);
			i--;
		}
	}
}

MultiBufferStream.prototype.mergeNextBuffer = function() {
	var next_buffer;
	if (this.bufferIndex+1 < this.buffers.length) {
		next_buffer = this.buffers[this.bufferIndex+1];
		if (next_buffer.fileStart === this.buffer.fileStart + this.buffer.byteLength) {
			var oldLength = this.buffer.byteLength;
			var oldUsedBytes = this.buffer.usedBytes;
			var oldFileStart = this.buffer.fileStart;
			this.buffers[this.bufferIndex] = ArrayBuffer.concat(this.buffer, next_buffer);
			this.buffer = this.buffers[this.bufferIndex];
			this.buffers.splice(this.bufferIndex+1, 1);
			this.buffer.usedBytes = oldUsedBytes; /* TODO: should it be += ? */
			this.buffer.fileStart = oldFileStart;
			Log.debug("ISOFile", "Concatenating buffer for box parsing (length: "+oldLength+"->"+this.buffer.byteLength+")");
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}


/*************************************************************************
  Seek-related functions
 *************************************************************************/

/**
 * Finds the buffer that holds the given file position
 * @param  {Boolean} fromStart    indicates if the search should start from the current buffer (false) 
 *                                or from the first buffer (true)
 * @param  {Number}  filePosition position in the file to seek to
 * @param  {Boolean} markAsUsed   indicates if the bytes in between the current position and the seek position 
 *                                should be marked as used for garbage collection
 * @return {Number}               the index of the buffer holding the seeked file position, -1 if not found.
 */
MultiBufferStream.prototype.findPosition = function(fromStart, filePosition, markAsUsed) {
	var i;
	var abuffer = null;
	var index = -1;

	/* find the buffer with the largest position smaller than the given position */
	if (fromStart === true) {
	   /* the reposition can be in the past, we need to check from the beginning of the list of buffers */
		i = 0;
	} else {
		i = this.bufferIndex;
	}

	while (i < this.buffers.length) {
		abuffer = this.buffers[i];
		if (abuffer.fileStart <= filePosition) {
			index = i;
			if (markAsUsed) {
				if (abuffer.fileStart + abuffer.byteLength <= filePosition) {
					abuffer.usedBytes = abuffer.byteLength;	
				} else {
					abuffer.usedBytes = filePosition - abuffer.fileStart;
				}		
				this.logBufferLevel();	
			}
		} else {
			break;
		}
		i++;
	}

	if (index !== -1) {
		abuffer = this.buffers[index];
		if (abuffer.fileStart + abuffer.byteLength >= filePosition) {			
			Log.debug("MultiBufferStream", "Found position in existing buffer #"+index);
			return index;
		} else {
			return -1;
		}
	} else {
		return -1;
	}
}

/**
 * Finds the largest file position contained in a buffer or in the next buffers if they are contiguous (no gap)
 * starting from the given buffer index or from the current buffer if the index is not given
 *
 * @param  {Number} inputindex Index of the buffer to start from
 * @return {Number}            The largest file position found in the buffers
 */
MultiBufferStream.prototype.findEndContiguousBuf = function(inputindex) {
	var i;
	var currentBuf;
	var nextBuf;
	var index = (inputindex !== undefined ? inputindex : this.bufferIndex);
	currentBuf = this.buffers[index];
	/* find the end of the contiguous range of data */
	if (this.buffers.length > index+1) {
		for (i = index+1; i < this.buffers.length; i++) {
			nextBuf = this.buffers[i];
			if (nextBuf.fileStart === currentBuf.fileStart + currentBuf.byteLength) {
				currentBuf = nextBuf;
			} else {
				break;
			}
		}
	}
	/* return the position of last byte in the file that we have */
	return currentBuf.fileStart + currentBuf.byteLength;
}

/**
 * Returns the largest file position contained in the buffers, larger than the given position
 * @param  {Number} pos the file position to start from
 * @return {Number}     the largest position in the current buffer or in the buffer and the next contiguous 
 *                      buffer that holds the given position
 */
MultiBufferStream.prototype.getEndFilePositionAfter = function(pos) {
	var index = this.findPosition(true, pos, false);
	if (index !== -1) {
		return this.findEndContiguousBuf(index);
	} else {
		return pos;
	}
}

/*************************************************************************
  Garbage collection related functions
 *************************************************************************/

/**
 * Marks a given number of bytes as used in the current buffer for garbage collection
 * @param {Number} nbBytes 
 */
MultiBufferStream.prototype.addUsedBytes = function(nbBytes) {
	this.buffer.usedBytes += nbBytes;
	this.logBufferLevel();
}

/**
 * Marks the entire current buffer as used, ready for garbage collection
 */
MultiBufferStream.prototype.setAllUsedBytes = function() {
	this.buffer.usedBytes = this.buffer.byteLength;
	this.logBufferLevel();
}

/*************************************************************************
  Common API between MultiBufferStream and SimpleStream
 *************************************************************************/

/**
 * Tries to seek to a given file position
 * if possible, repositions the parsing from there and returns true 
 * if not possible, does not change anything and returns false 
 * @param  {Number}  filePosition position in the file to seek to
 * @param  {Boolean} fromStart    indicates if the search should start from the current buffer (false) 
 *                                or from the first buffer (true)
 * @param  {Boolean} markAsUsed   indicates if the bytes in between the current position and the seek position 
 *                                should be marked as used for garbage collection
 * @return {Boolean}              true if the seek succeeded, false otherwise
 */
MultiBufferStream.prototype.seek = function(filePosition, fromStart, markAsUsed) {
	var index;
	index = this.findPosition(fromStart, filePosition, markAsUsed);
	if (index !== -1) {
		this.buffer = this.buffers[index];
		this.bufferIndex = index;
		this.position = filePosition - this.buffer.fileStart;
		Log.debug("MultiBufferStream", "Repositioning parser at buffer position: "+this.position);
		return true;
	} else {
		Log.debug("MultiBufferStream", "Position "+filePosition+" not found in buffered data");
		return false;
	}
}

/**
 * Returns the current position in the file
 * @return {Number} the position in the file
 */
MultiBufferStream.prototype.getPosition = function() {
	if (this.bufferIndex === -1 || this.buffers[this.bufferIndex] === null) {
		throw "Error accessing position in the MultiBufferStream";
	}
	return this.buffers[this.bufferIndex].fileStart+this.position;
}

/**
 * Returns the length of the current buffer
 * @return {Number} the length of the current buffer
 */
MultiBufferStream.prototype.getLength = function() {
	return this.byteLength;
}

MultiBufferStream.prototype.getEndPosition = function() {
	if (this.bufferIndex === -1 || this.buffers[this.bufferIndex] === null) {
		throw "Error accessing position in the MultiBufferStream";
	}
	return this.buffers[this.bufferIndex].fileStart+this.byteLength;
}

if (typeof exports !== 'undefined') {
	exports.MultiBufferStream = MultiBufferStream;
}// file:src/descriptor.js
/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var MPEG4DescriptorParser = function () {
	var ES_DescrTag 			= 0x03;
	var DecoderConfigDescrTag 	= 0x04;
	var DecSpecificInfoTag 		= 0x05;
	var SLConfigDescrTag 		= 0x06;

	var descTagToName = [];
	descTagToName[ES_DescrTag] 				= "ES_Descriptor";
	descTagToName[DecoderConfigDescrTag] 	= "DecoderConfigDescriptor";
	descTagToName[DecSpecificInfoTag] 		= "DecoderSpecificInfo";
	descTagToName[SLConfigDescrTag] 		= "SLConfigDescriptor";

	this.getDescriptorName = function(tag) {
		return descTagToName[tag];
	}

	var that = this;
	var classes = {};

	this.parseOneDescriptor = function (stream) {
		var hdrSize = 0;
		var size = 0;
		var tag;
		var desc;
		var byteRead;
		tag = stream.readUint8();
		hdrSize++;
		byteRead = stream.readUint8();
		hdrSize++;
		while (byteRead & 0x80) {
			size = (byteRead & 0x7F)<<7;
			byteRead = stream.readUint8();
			hdrSize++;
		}
		size += byteRead & 0x7F;
		Log.debug("MPEG4DescriptorParser", "Found "+(descTagToName[tag] || "Descriptor "+tag)+", size "+size+" at position "+stream.getPosition());
		if (descTagToName[tag]) {
			desc = new classes[descTagToName[tag]](size);
		} else {
			desc = new classes.Descriptor(size);
		}
		desc.parse(stream);
		return desc;
	}

	classes.Descriptor = function(_tag, _size) {
		this.tag = _tag;
		this.size = _size;
		this.descs = [];
	}

	classes.Descriptor.prototype.parse = function (stream) {
		this.data = stream.readUint8Array(this.size);
	}

	classes.Descriptor.prototype.findDescriptor = function (tag) {
		for (var i = 0; i < this.descs.length; i++) {
			if (this.descs[i].tag == tag) {
				return this.descs[i];
			}
		}
		return null;
	}

	classes.Descriptor.prototype.parseRemainingDescriptors = function (stream) {
		var start = stream.position;
		while (stream.position < start+this.size) {
			var desc = that.parseOneDescriptor(stream);
			this.descs.push(desc);
		}
	}

	classes.ES_Descriptor = function (size) {
		classes.Descriptor.call(this, ES_DescrTag, size);
	}

	classes.ES_Descriptor.prototype = new classes.Descriptor();

	classes.ES_Descriptor.prototype.parse = function(stream) {
		this.ES_ID = stream.readUint16();
		this.flags = stream.readUint8();
		this.size -= 3;
		if (this.flags & 0x80) {
			this.dependsOn_ES_ID = stream.readUint16();
			this.size -= 2;
		} else {
			this.dependsOn_ES_ID = 0;
		}
		if (this.flags & 0x40) {
			var l = stream.readUint8();
			this.URL = stream.readString(l);
			this.size -= l+1;
		} else {
			this.URL = "";
		}
		if (this.flags & 0x20) {
			this.OCR_ES_ID = stream.readUint16();
			this.size -= 2;
		} else {
			this.OCR_ES_ID = 0;
		}
		this.parseRemainingDescriptors(stream);
	}

	classes.ES_Descriptor.prototype.getOTI = function(stream) {
		var dcd = this.findDescriptor(DecoderConfigDescrTag);
		if (dcd) {
			return dcd.oti;
		} else {
			return 0;
		}
	}

	classes.ES_Descriptor.prototype.getAudioConfig = function(stream) {
		var dcd = this.findDescriptor(DecoderConfigDescrTag);
		if (!dcd) return null;
		var dsi = dcd.findDescriptor(DecSpecificInfoTag);
		if (dsi && dsi.data) {
			var audioObjectType = (dsi.data[0]& 0xF8) >> 3;
			if (audioObjectType === 31 && dsi.data.length >= 2) {
				audioObjectType = 32 + ((dsi.data[0] & 0x7) << 3) + ((dsi.data[1] & 0xE0) >> 5);
			}
			return audioObjectType;
		} else {
			return null;
		}
	}

	classes.DecoderConfigDescriptor = function (size) {
		classes.Descriptor.call(this, DecoderConfigDescrTag, size);
	}
	classes.DecoderConfigDescriptor.prototype = new classes.Descriptor();

	classes.DecoderConfigDescriptor.prototype.parse = function(stream) {
		this.oti = stream.readUint8();
		this.streamType = stream.readUint8();
		this.bufferSize = stream.readUint24();
		this.maxBitrate = stream.readUint32();
		this.avgBitrate = stream.readUint32();
		this.size -= 13;
		this.parseRemainingDescriptors(stream);
	}

	classes.DecoderSpecificInfo = function (size) {
		classes.Descriptor.call(this, DecSpecificInfoTag, size);
	}
	classes.DecoderSpecificInfo.prototype = new classes.Descriptor();

	classes.SLConfigDescriptor = function (size) {
		classes.Descriptor.call(this, SLConfigDescrTag, size);
	}
	classes.SLConfigDescriptor.prototype = new classes.Descriptor();

	return this;
}

if (typeof exports !== 'undefined') {
	exports.MPEG4DescriptorParser = MPEG4DescriptorParser;
}// file:src/box.js
/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var BoxParser = {
	ERR_INVALID_DATA : -1,
	ERR_NOT_ENOUGH_DATA : 0,
	OK : 1,

	// Boxes to be created with default parsing
	BASIC_BOXES: [ "mdat", "idat", "free", "skip", "meco", "strk" ],
	FULL_BOXES: [ "hmhd", "nmhd", "iods", "xml ", "bxml", "ipro", "mere" ],
	CONTAINER_BOXES: [
		[ "moov", [ "trak", "pssh" ] ],
		[ "trak" ],
		[ "edts" ],
		[ "mdia" ],
		[ "minf" ],
		[ "dinf" ],
		[ "stbl", [ "sgpd", "sbgp" ] ],
		[ "mvex", [ "trex" ] ],
		[ "moof", [ "traf" ] ],
		[ "traf", [ "trun", "sgpd", "sbgp" ] ],
		[ "vttc" ],
		[ "tref" ],
		[ "iref" ],
		[ "mfra", [ "tfra" ] ],
		[ "meco" ],
		[ "hnti" ],
		[ "hinf" ],
		[ "strk" ],
		[ "strd" ],
		[ "sinf" ],
		[ "rinf" ],
		[ "schi" ],
		[ "trgr" ],
		[ "udta", ["kind"] ],
		[ "iprp", ["ipma"] ],
		[ "ipco"]
	],
	// Boxes effectively created
	boxCodes : [],
	fullBoxCodes : [],
	containerBoxCodes : [],
	sampleEntryCodes : {},
	sampleGroupEntryCodes: [],
	trackGroupTypes: [],
	UUIDBoxes: {},
	UUIDs: [],
	initialize: function() {
		BoxParser.FullBox.prototype = new BoxParser.Box();
		BoxParser.ContainerBox.prototype = new BoxParser.Box();
		BoxParser.SampleEntry.prototype = new BoxParser.Box();
		BoxParser.TrackGroupTypeBox.prototype = new BoxParser.FullBox();

		/* creating constructors for simple boxes */
		BoxParser.BASIC_BOXES.forEach(function(type) {
			BoxParser.createBoxCtor(type)
		});
		BoxParser.FULL_BOXES.forEach(function(type) {
			BoxParser.createFullBoxCtor(type);
		});
		BoxParser.CONTAINER_BOXES.forEach(function(types) {
			BoxParser.createContainerBoxCtor(types[0], null, types[1]);
		});
	},
	Box: function(_type, _size, _uuid) {
		this.type = _type;
		this.size = _size;
		this.uuid = _uuid;
	},
	FullBox: function(type, size, uuid) {
		BoxParser.Box.call(this, type, size, uuid);
		this.flags = 0;
		this.version = 0;
	},
	ContainerBox: function(type, size, uuid) {
		BoxParser.Box.call(this, type, size, uuid);
		this.boxes = [];
	},
	SampleEntry: function(type, size, hdr_size, start) {
		BoxParser.ContainerBox.call(this, type, size);
		this.hdr_size = hdr_size;
		this.start = start;
	},
	SampleGroupEntry: function(type) {
		this.grouping_type = type;
	},
	TrackGroupTypeBox: function(type, size) {
		BoxParser.FullBox.call(this, type, size);
	},
	createBoxCtor: function(type, parseMethod){
		BoxParser.boxCodes.push(type);
		BoxParser[type+"Box"] = function(size) {
			BoxParser.Box.call(this, type, size);
		}
		BoxParser[type+"Box"].prototype = new BoxParser.Box();
		if (parseMethod) BoxParser[type+"Box"].prototype.parse = parseMethod;
	},
	createFullBoxCtor: function(type, parseMethod) {
		//BoxParser.fullBoxCodes.push(type);
		BoxParser[type+"Box"] = function(size) {
			BoxParser.FullBox.call(this, type, size);
		}
		BoxParser[type+"Box"].prototype = new BoxParser.FullBox();
		BoxParser[type+"Box"].prototype.parse = function(stream) {
			this.parseFullHeader(stream);
			if (parseMethod) {
				parseMethod.call(this, stream);
			}
		};
	},
	addSubBoxArrays: function(subBoxNames) {
		if (subBoxNames) {
			this.subBoxNames = subBoxNames;
			var nbSubBoxes = subBoxNames.length;
			for (var k = 0; k<nbSubBoxes; k++) {
				this[subBoxNames[k]+"s"] = [];
			}
		}
	},
	createContainerBoxCtor: function(type, parseMethod, subBoxNames) {
		//BoxParser.containerBoxCodes.push(type);
		BoxParser[type+"Box"] = function(size) {
			BoxParser.ContainerBox.call(this, type, size);
			BoxParser.addSubBoxArrays.call(this, subBoxNames);
		}
		BoxParser[type+"Box"].prototype = new BoxParser.ContainerBox();
		if (parseMethod) BoxParser[type+"Box"].prototype.parse = parseMethod;
	},
	createMediaSampleEntryCtor: function(mediaType, parseMethod, subBoxNames) {
		BoxParser.sampleEntryCodes[mediaType] = [];
		BoxParser[mediaType+"SampleEntry"] = function(type, size) {
			BoxParser.SampleEntry.call(this, type, size);
			BoxParser.addSubBoxArrays.call(this, subBoxNames);
		};
		BoxParser[mediaType+"SampleEntry"].prototype = new BoxParser.SampleEntry();
		if (parseMethod) BoxParser[mediaType+"SampleEntry"].prototype .parse = parseMethod;
	},
	createSampleEntryCtor: function(mediaType, type, parseMethod, subBoxNames) {
		BoxParser.sampleEntryCodes[mediaType].push(type);
		BoxParser[type+"SampleEntry"] = function(size) {
			BoxParser[mediaType+"SampleEntry"].call(this, type, size);
			BoxParser.addSubBoxArrays.call(this, subBoxNames);
		};
		BoxParser[type+"SampleEntry"].prototype = new BoxParser[mediaType+"SampleEntry"]();
		if (parseMethod) BoxParser[type+"SampleEntry"].prototype.parse = parseMethod;
	},
	createEncryptedSampleEntryCtor: function(mediaType, type, parseMethod) {
		BoxParser.createSampleEntryCtor.call(this, mediaType, type, parseMethod, ["sinf"]);
	},
	createSampleGroupCtor: function(type, parseMethod) {
		//BoxParser.sampleGroupEntryCodes.push(type);
		BoxParser[type+"SampleGroupEntry"] = function(size) {
			BoxParser.SampleGroupEntry.call(this, type, size);
		}
		BoxParser[type+"SampleGroupEntry"].prototype = new BoxParser.SampleGroupEntry();
		if (parseMethod) BoxParser[type+"SampleGroupEntry"].prototype.parse = parseMethod;
	},
	createTrackGroupCtor: function(type, parseMethod) {
		//BoxParser.trackGroupTypes.push(type);
		BoxParser[type+"TrackGroupTypeBox"] = function(size) {
			BoxParser.TrackGroupTypeBox.call(this, type, size);
		}
		BoxParser[type+"TrackGroupTypeBox"].prototype = new BoxParser.TrackGroupTypeBox();
		if (parseMethod) BoxParser[type+"TrackGroupTypeBox"].prototype.parse = parseMethod;
	},
	createUUIDBox: function(uuid, isFullBox, isContainerBox, parseMethod) {
		BoxParser.UUIDs.push(uuid);
		BoxParser.UUIDBoxes[uuid] = function(size) {
			if (isFullBox) {
				BoxParser.FullBox.call(this, "uuid", size, uuid);
			} else {
				if (isContainerBox) {
					BoxParser.ContainerBox.call(this, "uuid", size, uuid);
				} else {
					BoxParser.Box.call(this, "uuid", size, uuid);
				}
			}
		}
		BoxParser.UUIDBoxes[uuid].prototype = (isFullBox ? new BoxParser.FullBox() : (isContainerBox ? new BoxParser.ContainerBox() : new BoxParser.Box()));
		if (parseMethod) {
			if (isFullBox) {
				BoxParser.UUIDBoxes[uuid].prototype.parse = function(stream) {
					this.parseFullHeader(stream);
					if (parseMethod) {
						parseMethod.call(this, stream);
					}
				}
			} else {
				BoxParser.UUIDBoxes[uuid].prototype.parse = parseMethod;
			}
		}
	}
}

BoxParser.initialize();

BoxParser.TKHD_FLAG_ENABLED    = 0x000001;
BoxParser.TKHD_FLAG_IN_MOVIE   = 0x000002;
BoxParser.TKHD_FLAG_IN_PREVIEW = 0x000004;

BoxParser.TFHD_FLAG_BASE_DATA_OFFSET	= 0x01;
BoxParser.TFHD_FLAG_SAMPLE_DESC			= 0x02;
BoxParser.TFHD_FLAG_SAMPLE_DUR			= 0x08;
BoxParser.TFHD_FLAG_SAMPLE_SIZE			= 0x10;
BoxParser.TFHD_FLAG_SAMPLE_FLAGS		= 0x20;
BoxParser.TFHD_FLAG_DUR_EMPTY			= 0x10000;
BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF= 0x20000;

BoxParser.TRUN_FLAGS_DATA_OFFSET= 0x01;
BoxParser.TRUN_FLAGS_FIRST_FLAG	= 0x04;
BoxParser.TRUN_FLAGS_DURATION	= 0x100;
BoxParser.TRUN_FLAGS_SIZE		= 0x200;
BoxParser.TRUN_FLAGS_FLAGS		= 0x400;
BoxParser.TRUN_FLAGS_CTS_OFFSET	= 0x800;

BoxParser.Box.prototype.add = function(name) {
	return this.addBox(new BoxParser[name+"Box"]());
}

BoxParser.Box.prototype.addBox = function(box) {
	this.boxes.push(box);
	if (this[box.type+"s"]) {
		this[box.type+"s"].push(box);
	} else {
		this[box.type] = box;
	}
	return box;
}

BoxParser.Box.prototype.set = function(prop, value) {
	this[prop] = value;
	return this;
}

BoxParser.Box.prototype.addEntry = function(value, _prop) {
	var prop = _prop || "entries";
	if (!this[prop]) {
		this[prop] = [];
	}
	this[prop].push(value);
	return this;
}

if (typeof exports !== "undefined") {
	exports.BoxParser = BoxParser;
}
// file:src/box-parse.js
/* 
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
BoxParser.parseUUID = function(stream) {
	return BoxParser.parseHex16(stream);
}

BoxParser.parseHex16 = function(stream) {
	var hex16 = ""
	for (var i = 0; i <16; i++) {
		var hex = stream.readUint8().toString(16);
		hex16 += (hex.length === 1 ? "0"+hex : hex);
	}
	return hex16;
}

BoxParser.parseOneBox = function(stream, headerOnly, parentSize) {
	var box;
	var start = stream.getPosition();
	var hdr_size = 0;
	var diff;
	var uuid;
	if (stream.getEndPosition() - start < 8) {
		Log.debug("BoxParser", "Not enough data in stream to parse the type and size of the box");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
	}
	if (parentSize && parentSize < 8) {
		Log.debug("BoxParser", "Not enough bytes left in the parent box to parse a new box");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
	}
	var size = stream.readUint32();
	var type = stream.readString(4);
	var box_type = type;
	Log.debug("BoxParser", "Found box of type '"+type+"' and size "+size+" at position "+start);
	hdr_size = 8;
	if (type == "uuid") {
		if ((stream.getEndPosition() - stream.getPosition() < 16) || (parentSize -hdr_size < 16)) {
			stream.seek(start);
			Log.debug("BoxParser", "Not enough bytes left in the parent box to parse a UUID box");
			return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
		}
		uuid = BoxParser.parseUUID(stream);
		hdr_size += 16;
		box_type = uuid;
	}
	if (size == 1) {
		if ((stream.getEndPosition() - stream.getPosition() < 8) || (parentSize && (parentSize - hdr_size) < 8)) {
			stream.seek(start);
			Log.warn("BoxParser", "Not enough data in stream to parse the extended size of the \""+type+"\" box");
			return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
		}
		size = stream.readUint64();
		hdr_size += 8;
	} else if (size === 0) {
		/* box extends till the end of file or invalid file */
		if (parentSize) {
			size = parentSize;
		} else {
			/* box extends till the end of file */
			if (type !== "mdat") {
				Log.error("BoxParser", "Unlimited box size not supported for type: '"+type+"'");
				box = new BoxParser.Box(type, size);
				return { code: BoxParser.OK, box: box, size: box.size };
			}
		}
	}
	if (size < hdr_size) {
		Log.error("BoxParser", "Box of type "+type+" has an invalid size "+size+" (too small to be a box)");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size, start: start };
	}
	if (parentSize && size > parentSize) {
		Log.error("BoxParser", "Box of type '"+type+"' has a size "+size+" greater than its container size "+parentSize);
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size, start: start };
	}
	if (start + size > stream.getEndPosition()) {
		stream.seek(start);
		Log.info("BoxParser", "Not enough data in stream to parse the entire '"+type+"' box");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size, start: start };
	}
	if (headerOnly) {
		return { code: BoxParser.OK, type: type, size: size, hdr_size: hdr_size, start: start };
	} else {
		if (BoxParser[type+"Box"]) {
			box = new BoxParser[type+"Box"](size);
		} else {
			if (type !== "uuid") {
				Log.warn("BoxParser", "Unknown box type: '"+type+"'");
				box = new BoxParser.Box(type, size);
				box.has_unparsed_data = true;
			} else {
				if (BoxParser.UUIDBoxes[uuid]) {
					box = new BoxParser.UUIDBoxes[uuid](size);
				} else {
					Log.warn("BoxParser", "Unknown uuid type: '"+uuid+"'");
					box = new BoxParser.Box(type, size);
					box.uuid = uuid;
					box.has_unparsed_data = true;
				}
			}
		}
	}
	box.hdr_size = hdr_size;
	/* recording the position of the box in the input stream */
	box.start = start;
	if (box.write === BoxParser.Box.prototype.write && box.type !== "mdat") {
		Log.info("BoxParser", "'"+box_type+"' box writing not yet implemented, keeping unparsed data in memory for later write");
		box.parseDataAndRewind(stream);
	}
	box.parse(stream);
	diff = stream.getPosition() - (box.start+box.size);
	if (diff < 0) {
		Log.warn("BoxParser", "Parsing of box '"+box_type+"' did not read the entire indicated box data size (missing "+(-diff)+" bytes), seeking forward");
		stream.seek(box.start+box.size);
	} else if (diff > 0) {
		Log.error("BoxParser", "Parsing of box '"+box_type+"' read "+diff+" more bytes than the indicated box data size, seeking backwards");
		stream.seek(box.start+box.size);
	}
	return { code: BoxParser.OK, box: box, size: box.size };
}

BoxParser.Box.prototype.parse = function(stream) {
	if (this.type != "mdat") {
		this.data = stream.readUint8Array(this.size-this.hdr_size);
	} else {
		if (this.size === 0) {
			stream.seek(stream.getEndPosition());
		} else {
			stream.seek(this.start+this.size);
		}
	}
}

/* Used to parse a box without consuming its data, to allow detailled parsing
   Useful for boxes for which a write method is not yet implemented */
BoxParser.Box.prototype.parseDataAndRewind = function(stream) {
	this.data = stream.readUint8Array(this.size-this.hdr_size);
	// rewinding
	stream.position -= this.size-this.hdr_size;
}

BoxParser.FullBox.prototype.parseDataAndRewind = function(stream) {
	this.parseFullHeader(stream);
	this.data = stream.readUint8Array(this.size-this.hdr_size);
	// restore the header size as if the full header had not been parsed
	this.hdr_size -= 4;
	// rewinding
	stream.position -= this.size-this.hdr_size;
}

BoxParser.FullBox.prototype.parseFullHeader = function (stream) {
	this.version = stream.readUint8();
	this.flags = stream.readUint24();
	this.hdr_size += 4;
}

BoxParser.FullBox.prototype.parse = function (stream) {
	this.parseFullHeader(stream);
	this.data = stream.readUint8Array(this.size-this.hdr_size);
}

BoxParser.ContainerBox.prototype.parse = function(stream) {
	var ret;
	var box;
	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			box = ret.box;
			/* store the box in the 'boxes' array to preserve box order (for offset) but also store box in a property for more direct access */
			this.boxes.push(box);
			if (this.subBoxNames && this.subBoxNames.indexOf(box.type) != -1) {
				this[this.subBoxNames[this.subBoxNames.indexOf(box.type)]+"s"].push(box);
			} else {
				var box_type = box.type !== "uuid" ? box.type : box.uuid;
				if (this[box_type]) {
					Log.warn("Box of type "+box_type+" already stored in field of this type");
				} else {
					this[box_type] = box;
				}
			}
		} else {
			return;
		}
	}
}

BoxParser.Box.prototype.parseLanguage = function(stream) {
	this.language = stream.readUint16();
	var chars = [];
	chars[0] = (this.language>>10)&0x1F;
	chars[1] = (this.language>>5)&0x1F;
	chars[2] = (this.language)&0x1F;
	this.languageString = String.fromCharCode(chars[0]+0x60, chars[1]+0x60, chars[2]+0x60);
}

// file:src/parsing/sampleentries/sampleentry.js
BoxParser.SAMPLE_ENTRY_TYPE_VISUAL 		= "Visual";
BoxParser.SAMPLE_ENTRY_TYPE_AUDIO 		= "Audio";
BoxParser.SAMPLE_ENTRY_TYPE_HINT 		= "Hint";
BoxParser.SAMPLE_ENTRY_TYPE_METADATA 	= "Metadata";
BoxParser.SAMPLE_ENTRY_TYPE_SUBTITLE 	= "Subtitle";
BoxParser.SAMPLE_ENTRY_TYPE_SYSTEM 		= "System";
BoxParser.SAMPLE_ENTRY_TYPE_TEXT 		= "Text";

BoxParser.SampleEntry.prototype.parseHeader = function(stream) {
	stream.readUint8Array(6);
	this.data_reference_index = stream.readUint16();
	this.hdr_size += 8;
}

BoxParser.SampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.data = stream.readUint8Array(this.size - this.hdr_size);
}

BoxParser.SampleEntry.prototype.parseDataAndRewind = function(stream) {
	this.parseHeader(stream);
	this.data = stream.readUint8Array(this.size - this.hdr_size);
	// restore the header size as if the sample entry header had not been parsed
	this.hdr_size -= 8;
	// rewinding
	stream.position -= this.size-this.hdr_size;
}

BoxParser.SampleEntry.prototype.parseFooter = function(stream) {
	BoxParser.ContainerBox.prototype.parse.call(this, stream);
}

// Base SampleEntry types with default parsing
BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_HINT);
BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_METADATA);
BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SUBTITLE);
BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SYSTEM);
BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_TEXT);

//Base SampleEntry types for Audio and Video with specific parsing
BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, function(stream) {
	var compressorname_length;
	this.parseHeader(stream);
	stream.readUint16();
	stream.readUint16();
	stream.readUint32Array(3);
	this.width = stream.readUint16();
	this.height = stream.readUint16();
	this.horizresolution = stream.readUint32();
	this.vertresolution = stream.readUint32();
	stream.readUint32();
	this.frame_count = stream.readUint16();
	compressorname_length = Math.min(31, stream.readUint8());
	this.compressorname = stream.readString(compressorname_length);
	if (compressorname_length < 31) {
		stream.readString(31 - compressorname_length);
	}
	this.depth = stream.readUint16();
	stream.readUint16();
	this.parseFooter(stream);
});

BoxParser.createMediaSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_AUDIO, function(stream) {
	this.parseHeader(stream);
	stream.readUint32Array(2);
	this.channel_count = stream.readUint16();
	this.samplesize = stream.readUint16();
	stream.readUint16();
	stream.readUint16();
	this.samplerate = (stream.readUint32()/(1<<16));
	this.parseFooter(stream);
});

// Sample entries inheriting from Audio and Video
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, "avc1");
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, "avc2");
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, "avc3");
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, "avc4");
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, "av01");
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, "hvc1");
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, "hev1");
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_AUDIO, 	"mp4a");
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_AUDIO, 	"ac-3");
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_AUDIO, 	"ec-3");

// Encrypted sample entries
BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_VISUAL, 	"encv");
BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_AUDIO, 	"enca");
BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SUBTITLE, 	"encu");
BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SYSTEM, 	"encs");
BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_TEXT, 		"enct");
BoxParser.createEncryptedSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_METADATA, 	"encm");


// file:src/parsing/av1C.js
BoxParser.createBoxCtor("av1C", function(stream) {
	var i;
	var toparse;
	var tmp = stream.readUint8();
	if ((tmp >> 7) & 0x1 !== 1) {
		Log.error("av1C marker problem");
		return;
	}
	this.version = tmp & 0x7F;
	if (this.version !== 1) {
		Log.error("av1C version "+this.version+" not supported");
		return;
	}
	tmp = stream.readUint8();
	this.seq_profile = (tmp >> 5) & 0x7;
	this.seq_level_idx_0 = tmp & 0x1F;
	tmp = stream.readUint8();
	this.seq_tier_0 = (tmp >> 7) & 0x1;
	this.high_bitdepth = (tmp >> 6) & 0x1;
	this.twelve_bit = (tmp >> 5) & 0x1;
	this.monochrome = (tmp >> 4) & 0x1;
	this.chroma_subsampling_x = (tmp >> 3) & 0x1;
	this.chroma_subsampling_y = (tmp >> 2) & 0x1;
	this.chroma_sample_position = (tmp & 0x3);
	tmp = stream.readUint8();
	this.reserved_1 = (tmp >> 5) & 0x7;
	if (this.reserved_1 !== 0) {
		Log.error("av1C reserved_1 parsing problem");
		return;
	}
	this.initial_presentation_delay_present = (tmp >> 4) & 0x1;
	if (this.initial_presentation_delay_present === 1) {
		this.initial_presentation_delay_minus_one = (tmp & 0xF);
	} else {
		this.reserved_2 = (tmp & 0xF);
		if (this.reserved_2 !== 0) {
			Log.error("av1C reserved_2 parsing problem");
			return;
		}
	}

	var configOBUs_length = this.size - this.hdr_size - 4;
	this.configOBUs = stream.readUint8Array(configOBUs_length);
});

// file:src/parsing/avcC.js
BoxParser.createBoxCtor("avcC", function(stream) {
	var i;
	var toparse;
	this.configurationVersion = stream.readUint8();
	this.AVCProfileIndication = stream.readUint8();
	this.profile_compatibility = stream.readUint8();
	this.AVCLevelIndication = stream.readUint8();
	this.lengthSizeMinusOne = (stream.readUint8() & 0x3);
	this.nb_SPS_nalus = (stream.readUint8() & 0x1F);
	toparse = this.size - this.hdr_size - 6;
	this.SPS = [];
	for (i = 0; i < this.nb_SPS_nalus; i++) {
		this.SPS[i] = {};
		this.SPS[i].length = stream.readUint16();
		this.SPS[i].nalu = stream.readUint8Array(this.SPS[i].length);
		toparse -= 2+this.SPS[i].length;
	}
	this.nb_PPS_nalus = stream.readUint8();
	toparse--;
	this.PPS = [];
	for (i = 0; i < this.nb_PPS_nalus; i++) {
		this.PPS[i] = {};
		this.PPS[i].length = stream.readUint16();
		this.PPS[i].nalu = stream.readUint8Array(this.PPS[i].length);
		toparse -= 2+this.PPS[i].length;
	}
	if (toparse>0) {
		this.ext = stream.readUint8Array(toparse);
	}
});

// file:src/parsing/btrt.js
BoxParser.createBoxCtor("btrt", function(stream) {
	this.bufferSizeDB = stream.readUint32();
	this.maxBitrate = stream.readUint32();
	this.avgBitrate = stream.readUint32();
});

// file:src/parsing/clap.js
BoxParser.createBoxCtor("clap", function(stream) {
	this.cleanApertureWidthN = stream.readUint32();
	this.cleanApertureWidthD = stream.readUint32();
	this.cleanApertureHeightN = stream.readUint32();
	this.cleanApertureHeightD = stream.readUint32();
	this.horizOffN = stream.readUint32();
	this.horizOffD = stream.readUint32();
	this.vertOffN = stream.readUint32();
	this.vertOffD = stream.readUint32();
});// file:src/parsing/clli.js
BoxParser.createBoxCtor("clli", function(stream) {
	this.max_content_light_level = stream.readUint16();
    this.max_pic_average_light_level = stream.readUint16();
});

// file:src/parsing/co64.js
BoxParser.createFullBoxCtor("co64", function(stream) {
	var entry_count;
	var i;
	entry_count = stream.readUint32();
	this.chunk_offsets = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.chunk_offsets.push(stream.readUint64());
		}
	}
});

// file:src/parsing/CoLL.js
BoxParser.createFullBoxCtor("CoLL", function(stream) {
	this.maxCLL = stream.readUint16();
    this.maxFALL = stream.readUint16();
});

// file:src/parsing/colr.js
BoxParser.createBoxCtor("colr", function(stream) {
	this.colour_type = stream.readString(4);
	if (this.colour_type === 'nclx') {
		this.colour_primaries = stream.readUint16();
		this.transfer_characteristics = stream.readUint16();
		this.matrix_coefficients = stream.readUint16();
		var tmp = stream.readUint8();
		this.full_range_flag = tmp >> 7;
	} else if (this.colour_type === 'rICC') {
		this.ICC_profile = stream.readUint8Array(this.size - 4);
	} else if (this.colour_type === 'prof') {
		this.ICC_profile = stream.readUint8Array(this.size - 4);
	}
});// file:src/parsing/cprt.js
BoxParser.createFullBoxCtor("cprt", function (stream) {
	this.parseLanguage(stream);
	this.notice = stream.readCString();
});

// file:src/parsing/cslg.js
BoxParser.createFullBoxCtor("cslg", function(stream) {
	var entry_count;
	if (this.version === 0) {
		this.compositionToDTSShift = stream.readInt32(); /* signed */
		this.leastDecodeToDisplayDelta = stream.readInt32(); /* signed */
		this.greatestDecodeToDisplayDelta = stream.readInt32(); /* signed */
		this.compositionStartTime = stream.readInt32(); /* signed */
		this.compositionEndTime = stream.readInt32(); /* signed */
	}
});

// file:src/parsing/ctts.js
BoxParser.createFullBoxCtor("ctts", function(stream) {
	var entry_count;
	var i;
	entry_count = stream.readUint32();
	this.sample_counts = [];
	this.sample_offsets = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			/* some files are buggy and declare version=0 while using signed offsets.
			   The likelyhood of using the most significant bit in a 32-bits time offset is very low,
			   so using signed value here as well */
			   var value = stream.readInt32();
			   if (value < 0) {
			   		Log.warn("BoxParser", "ctts box uses negative values without using version 1");
			   }
			this.sample_offsets.push(value);
		}
	} else if (this.version == 1) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			this.sample_offsets.push(stream.readInt32()); /* signed */
		}
	}
});

// file:src/parsing/dac3.js
BoxParser.createBoxCtor("dac3", function(stream) {
	var tmp_byte1 = stream.readUint8();
	var tmp_byte2 = stream.readUint8();
	var tmp_byte3 = stream.readUint8();
	this.fscod = tmp_byte1 >> 6;
	this.bsid  = ((tmp_byte1 >> 1) & 0x1F);
	this.bsmod = ((tmp_byte1 & 0x1) <<  2) | ((tmp_byte2 >> 6) & 0x3);
	this.acmod = ((tmp_byte2 >> 3) & 0x7);
	this.lfeon = ((tmp_byte2 >> 2) & 0x1);
	this.bit_rate_code = (tmp_byte2 & 0x3) | ((tmp_byte3 >> 5) & 0x7);
});

// file:src/parsing/dec3.js
BoxParser.createBoxCtor("dec3", function(stream) {
	var tmp_16 = stream.readUint16();
	this.data_rate = tmp_16 >> 3;
	this.num_ind_sub = tmp_16 & 0x7;
	this.ind_subs = [];
	for (var i = 0; i < this.num_ind_sub+1; i++) {
		var ind_sub = {};
		this.ind_subs.push(ind_sub);
		var tmp_byte1 = stream.readUint8();
		var tmp_byte2 = stream.readUint8();
		var tmp_byte3 = stream.readUint8();
		ind_sub.fscod = tmp_byte1 >> 6;
		ind_sub.bsid  = ((tmp_byte1 >> 1) & 0x1F);
		ind_sub.bsmod = ((tmp_byte1 & 0x1) << 4) | ((tmp_byte2 >> 4) & 0xF);
		ind_sub.acmod = ((tmp_byte2 >> 1) & 0x7);
		ind_sub.lfeon = (tmp_byte2 & 0x1);
		ind_sub.num_dep_sub = ((tmp_byte3 >> 1) & 0xF);
		if (ind_sub.num_dep_sub > 0) {
			ind_sub.chan_loc = ((tmp_byte3 & 0x1) << 8) | stream.readUint8();
		}
	}
});

// file:src/parsing/dfLa.js
BoxParser.createFullBoxCtor("dfLa", function(stream) {
    var BLOCKTYPE_MASK = 0x7F;
    var LASTMETADATABLOCKFLAG_MASK = 0x80;

    var boxesFound = [];
    var knownBlockTypes = [
        "STREAMINFO",
        "PADDING",
        "APPLICATION",
        "SEEKTABLE",
        "VORBIS_COMMENT",
        "CUESHEET",
        "PICTURE",
        "RESERVED"
    ];

    // dfLa is a FullBox
    this.parseFullHeader(stream);

    // for (i=0; ; i++) { // to end of box
    do {
        var flagAndType = stream.readUint8();

        var type = Math.min(
            (flagAndType & BLOCKTYPE_MASK),
            (knownBlockTypes.length - 1)
        );

        // if this is a STREAMINFO block, read the true samplerate since this
        // can be different to the AudioSampleEntry samplerate.
        if (!(type)) {
            // read past all the other stuff
            stream.readUint8Array(13);

            // extract samplerate
            this.samplerate = (stream.readUint32() >> 12);

            // read to end of STREAMINFO
            stream.readUint8Array(20);
        } else {
            // not interested in other block types so just discard length bytes
            stream.readUint8Array(stream.readUint24());
        }

        boxesFound.push(knownBlockTypes[type]);

        if (!!(flagAndType & LASTMETADATABLOCKFLAG_MASK)) {
            break;
        }
    } while (true);

    this.numMetadataBlocks =
        boxesFound.length + " (" + boxesFound.join(", ") + ")";
});
// file:src/parsing/dimm.js
BoxParser.createBoxCtor("dimm", function(stream) {
	this.bytessent = stream.readUint64();
});

// file:src/parsing/dmax.js
BoxParser.createBoxCtor("dmax", function(stream) {
	this.time = stream.readUint32();
});

// file:src/parsing/dmed.js
BoxParser.createBoxCtor("dmed", function(stream) {
	this.bytessent = stream.readUint64();
});

// file:src/parsing/dref.js
BoxParser.createFullBoxCtor("dref", function(stream) {
	var ret;
	var box;
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		ret = BoxParser.parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			box = ret.box;
			this.entries.push(box);
		} else {
			return;
		}
	}
});

// file:src/parsing/drep.js
BoxParser.createBoxCtor("drep", function(stream) {
	this.bytessent = stream.readUint64();
});

// file:src/parsing/elng.js
BoxParser.createFullBoxCtor("elng", function(stream) {
	this.extended_language = stream.readString(this.size-this.hdr_size);
});

// file:src/parsing/elst.js
BoxParser.createFullBoxCtor("elst", function(stream) {
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		var entry = {};
		this.entries.push(entry);
		if (this.version === 1) {
			entry.segment_duration = stream.readUint64();
			entry.media_time = stream.readInt64();
		} else {
			entry.segment_duration = stream.readUint32();
			entry.media_time = stream.readInt32();
		}
		entry.media_rate_integer = stream.readInt16();
		entry.media_rate_fraction = stream.readInt16();
	}
});

// file:src/parsing/emsg.js
BoxParser.createFullBoxCtor("emsg", function(stream) {
	if (this.version == 1) {
		this.timescale 					= stream.readUint32();
		this.presentation_time_delta 	= stream.readUint64();
		this.event_duration			 	= stream.readUint32();
		this.id 						= stream.readUint32();
		this.scheme_id_uri 				= stream.readCString();
		this.value 						= stream.readCString();
	} else {
		this.scheme_id_uri 				= stream.readCString();
		this.value 						= stream.readCString();
		this.timescale 					= stream.readUint32();
		this.presentation_time_delta 	= stream.readUint32();
		this.event_duration			 	= stream.readUint32();
		this.id 						= stream.readUint32();
	}
	var message_size = this.size - this.hdr_size - (4*4 + (this.scheme_id_uri.length+1) + (this.value.length+1));
	if (this.version == 1) {
		message_size -= 4;
	}
	this.message_data = stream.readUint8Array(message_size);
});

// file:src/parsing/esds.js
BoxParser.createFullBoxCtor("esds", function(stream) {
	var esd_data = stream.readUint8Array(this.size-this.hdr_size);
	if (typeof MPEG4DescriptorParser !== "undefined") {
		var esd_parser = new MPEG4DescriptorParser();
		this.esd = esd_parser.parseOneDescriptor(new DataStream(esd_data.buffer, 0, DataStream.BIG_ENDIAN));
	}
});

// file:src/parsing/fiel.js
BoxParser.createBoxCtor("fiel", function(stream) {
	this.fieldCount = stream.readUint8();
	this.fieldOrdering = stream.readUint8();
});

// file:src/parsing/frma.js
BoxParser.createBoxCtor("frma", function(stream) {
	this.data_format = stream.readString(4);
});

// file:src/parsing/ftyp.js
BoxParser.createBoxCtor("ftyp", function(stream) {
	var toparse = this.size - this.hdr_size;
	this.major_brand = stream.readString(4);
	this.minor_version = stream.readUint32();
	toparse -= 8;
	this.compatible_brands = [];
	var i = 0;
	while (toparse>=4) {
		this.compatible_brands[i] = stream.readString(4);
		toparse -= 4;
		i++;
	}
});

// file:src/parsing/hdlr.js
BoxParser.createFullBoxCtor("hdlr", function(stream) {
	if (this.version === 0) {
		stream.readUint32();
		this.handler = stream.readString(4);
		stream.readUint32Array(3);
		this.name = stream.readString(this.size-this.hdr_size-20);
		if (this.name[this.name.length-1]==='\0') {
			this.name = this.name.slice(0,-1);
		}
	}
});

// file:src/parsing/hvcC.js
BoxParser.createBoxCtor("hvcC", function(stream) {
	var i, j;
	var nb_nalus;
	var length;
	var tmp_byte;
	this.configurationVersion = stream.readUint8();
	tmp_byte = stream.readUint8();
	this.general_profile_space = tmp_byte >> 6;
	this.general_tier_flag = (tmp_byte & 0x20) >> 5;
	this.general_profile_idc = (tmp_byte & 0x1F);
	this.general_profile_compatibility = stream.readUint32();
	this.general_constraint_indicator = stream.readUint8Array(6);
	this.general_level_idc = stream.readUint8();
	this.min_spatial_segmentation_idc = stream.readUint16() & 0xFFF;
	this.parallelismType = (stream.readUint8() & 0x3);
	this.chroma_format_idc = (stream.readUint8() & 0x3);
	this.bit_depth_luma_minus8 = (stream.readUint8() & 0x7);
	this.bit_depth_chroma_minus8 = (stream.readUint8() & 0x7);
	this.avgFrameRate = stream.readUint16();
	tmp_byte = stream.readUint8();
	this.constantFrameRate = (tmp_byte >> 6);
	this.numTemporalLayers = (tmp_byte & 0XD) >> 3;
	this.temporalIdNested = (tmp_byte & 0X4) >> 2;
	this.lengthSizeMinusOne = (tmp_byte & 0X3);

	this.nalu_arrays = [];
	var numOfArrays = stream.readUint8();
	for (i = 0; i < numOfArrays; i++) {
		var nalu_array = [];
		this.nalu_arrays.push(nalu_array);
		tmp_byte = stream.readUint8()
		nalu_array.completeness = (tmp_byte & 0x80) >> 7;
		nalu_array.nalu_type = tmp_byte & 0x3F;
		var numNalus = stream.readUint16();
		for (j = 0; j < numNalus; j++) {
			var nalu = {}
			nalu_array.push(nalu);
			length = stream.readUint16();
			nalu.data   = stream.readUint8Array(length);
		}
	}
});

// file:src/parsing/iinf.js
BoxParser.createFullBoxCtor("iinf", function(stream) {
	var ret;
	if (this.version === 0) {
		this.entry_count = stream.readUint16();
	} else {
		this.entry_count = stream.readUint32();
	}
	this.item_infos = [];
	for (var i = 0; i < this.entry_count; i++) {
		ret = BoxParser.parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			if (ret.box.type !== "infe") {
				Log.error("BoxParser", "Expected 'infe' box, got "+ret.box.type);
			}
			this.item_infos[i] = ret.box;
		} else {
			return;
		}
	}
});

// file:src/parsing/iloc.js
BoxParser.createFullBoxCtor("iloc", function(stream) {
	var byte;
	byte = stream.readUint8();
	this.offset_size = (byte >> 4) & 0xF;
	this.length_size = byte & 0xF;
	byte = stream.readUint8();
	this.base_offset_size = (byte >> 4) & 0xF;
	if (this.version === 1 || this.version === 2) {
		this.index_size = byte & 0xF;
	} else {
		this.index_size = 0;
		// reserved = byte & 0xF;
	}
	this.items = [];
	var item_count = 0;
	if (this.version < 2) {
		item_count = stream.readUint16();
	} else if (this.version === 2) {
		item_count = stream.readUint32();
	} else {
		throw "version of iloc box not supported";
	}
	for (var i = 0; i < item_count; i++) {
		var item = {};
		this.items.push(item);
		if (this.version < 2) {
			item.item_ID = stream.readUint16();
		} else if (this.version === 2) {
			item.item_ID = stream.readUint16();
		} else {
			throw "version of iloc box not supported";
		}
		if (this.version === 1 || this.version === 2) {
			item.construction_method = (stream.readUint16() & 0xF);
		} else {
			item.construction_method = 0;
		}
		item.data_reference_index = stream.readUint16();
		switch(this.base_offset_size) {
			case 0:
				item.base_offset = 0;
				break;
			case 4:
				item.base_offset = stream.readUint32();
				break;
			case 8:
				item.base_offset = stream.readUint64();
				break;
			default:
				throw "Error reading base offset size";
		}
		var extent_count = stream.readUint16();
		item.extents = [];
		for (var j=0; j < extent_count; j++) {
			var extent = {};
			item.extents.push(extent);
			if (this.version === 1 || this.version === 2) {
				switch(this.index_size) {
					case 0:
						extent.extent_index = 0;
						break;
					case 4:
						extent.extent_index = stream.readUint32();
						break;
					case 8:
						extent.extent_index = stream.readUint64();
						break;
					default:
						throw "Error reading extent index";
				}
			}
			switch(this.offset_size) {
				case 0:
					extent.extent_offset = 0;
					break;
				case 4:
					extent.extent_offset = stream.readUint32();
					break;
				case 8:
					extent.extent_offset = stream.readUint64();
					break;
				default:
					throw "Error reading extent index";
			}
			switch(this.length_size) {
				case 0:
					extent.extent_length = 0;
					break;
				case 4:
					extent.extent_length = stream.readUint32();
					break;
				case 8:
					extent.extent_length = stream.readUint64();
					break;
				default:
					throw "Error reading extent index";
			}
		}
	}
});

// file:src/parsing/infe.js
BoxParser.createFullBoxCtor("infe", function(stream) {
	if (this.version === 0 || this.version === 1) {
		this.item_ID = stream.readUint16();
		this.item_protection_index = stream.readUint16();
		this.item_name = stream.readCString();
		this.content_type = stream.readCString();
		this.content_encoding = stream.readCString();
	}
	if (this.version === 1) {
		this.extension_type = stream.readString(4);
		Log.warn("BoxParser", "Cannot parse extension type");
		stream.seek(this.start+this.size);
		return;
	}
	if (this.version >= 2) {
		if (this.version === 2) {
			this.item_ID = stream.readUint16();
		} else if (this.version === 3) {
			this.item_ID = stream.readUint32();
		}
		this.item_protection_index = stream.readUint16();
		this.item_type = stream.readString(4);
		this.item_name = stream.readCString();
		if (this.item_type === "mime") {
			this.content_type = stream.readCString();
			this.content_encoding = stream.readCString();
		} else if (this.item_type === "uri ") {
			this.item_uri_type = stream.readCString();
		}
	}
});
// file:src/parsing/ipma.js
BoxParser.createFullBoxCtor("ipma", function(stream) {
	var i, j;
	entry_count = stream.readUint32();
	this.associations = [];
	for(i=0; i<entry_count; i++) {
		var item_assoc = {};
		this.associations.push(item_assoc);
		if (this.version < 1) {
			item_assoc.id = stream.readUint16();
		} else {
			item_assoc.id = stream.readUint32();
		}
		var association_count = stream.readUint8();
		item_assoc.props = [];
		for (j = 0; j < association_count; j++) {
			var tmp = stream.readUint8();
			var p = {};
			item_assoc.props.push(p);
			p.essential = ((tmp & 0x80) >> 7) === 1;
			if (this.flags & 0x1) {
				p.property_index = (tmp & 0x7F) << 8 | stream.readUint8();
			} else {
				p.property_index = (tmp & 0x7F);
			}
		}
	}
});

// file:src/parsing/iref.js
BoxParser.createFullBoxCtor("iref", function(stream) {
	var ret;
	var entryCount;
	var box;
	this.references = [];

	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			if (this.version === 0) {
				box = new BoxParser.SingleItemTypeReferenceBox(ret.type, ret.size, ret.hdr_size, ret.start);
			} else {
				box = new BoxParser.SingleItemTypeReferenceBoxLarge(ret.type, ret.size, ret.hdr_size, ret.start);
			}
			if (box.write === BoxParser.Box.prototype.write && box.type !== "mdat") {
				Log.warn("BoxParser", box.type+" box writing not yet implemented, keeping unparsed data in memory for later write");
				box.parseDataAndRewind(stream);
			}
			box.parse(stream);
			this.references.push(box);
		} else {
			return;
		}
	}
});
// file:src/parsing/irot.js
BoxParser.createBoxCtor("irot", function(stream) {
	this.angle = stream.readUint8() & 0x3;
});

// file:src/parsing/ispe.js
BoxParser.createFullBoxCtor("ispe", function(stream) {
	this.image_width = stream.readUint32();
	this.image_height = stream.readUint32();
});// file:src/parsing/kind.js
BoxParser.createFullBoxCtor("kind", function(stream) {
	this.schemeURI = stream.readCString();
	this.value = stream.readCString();
});
// file:src/parsing/leva.js
BoxParser.createFullBoxCtor("leva", function(stream) {
	var count = stream.readUint8();
	this.levels = [];
	for (var i = 0; i < count; i++) {
		var level = {};
		this.levels[i] = level;
		level.track_ID = stream.readUint32();
		var tmp_byte = stream.readUint8();
		level.padding_flag = tmp_byte >> 7;
		level.assignment_type = tmp_byte & 0x7F;
		switch (level.assignment_type) {
			case 0:
				level.grouping_type = stream.readString(4);
				break;
			case 1:
				level.grouping_type = stream.readString(4);
				level.grouping_type_parameter = stream.readUint32();
				break;
			case 2:
				break;
			case 3:
				break;
			case 4:
				level.sub_track_id = stream.readUint32();
				break;
			default:
				Log.warn("BoxParser", "Unknown leva assignement type");
		}
	}
});

// file:src/parsing/maxr.js
BoxParser.createBoxCtor("maxr", function(stream) {
	this.period = stream.readUint32();
	this.bytes = stream.readUint32();
});

// file:src/parsing/mdcv.js
BoxParser.createBoxCtor("mdcv", function(stream) {
    this.display_primaries = [];
    this.display_primaries[0] = {};
    this.display_primaries[0].x = stream.readUint16();
    this.display_primaries[0].y = stream.readUint16();
    this.display_primaries[1] = {};
    this.display_primaries[1].x = stream.readUint16();
    this.display_primaries[1].y = stream.readUint16();
    this.display_primaries[2] = {};
    this.display_primaries[2].x = stream.readUint16();
    this.display_primaries[2].y = stream.readUint16();
    this.white_point = {};
    this.white_point.x = stream.readUint16();
    this.white_point.y = stream.readUint16();
    this.max_display_mastering_luminance = stream.readUint32();
    this.min_display_mastering_luminance = stream.readUint32();
});

// file:src/parsing/mdhd.js
BoxParser.createFullBoxCtor("mdhd", function(stream) {
	if (this.version == 1) {
		this.creation_time = stream.readUint64();
		this.modification_time = stream.readUint64();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		this.creation_time = stream.readUint32();
		this.modification_time = stream.readUint32();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint32();
	}
	this.parseLanguage(stream);
	stream.readUint16();
});

// file:src/parsing/mehd.js
BoxParser.createFullBoxCtor("mehd", function(stream) {
	if (this.flags & 0x1) {
		Log.warn("BoxParser", "mehd box incorrectly uses flags set to 1, converting version to 1");
		this.version = 1;
	}
	if (this.version == 1) {
		this.fragment_duration = stream.readUint64();
	} else {
		this.fragment_duration = stream.readUint32();
	}
});

// file:src/parsing/meta.js
BoxParser.createFullBoxCtor("meta", function(stream) {
	this.boxes = [];
	BoxParser.ContainerBox.prototype.parse.call(this, stream);
});
// file:src/parsing/mfhd.js
BoxParser.createFullBoxCtor("mfhd", function(stream) {
	this.sequence_number = stream.readUint32();
});

// file:src/parsing/mfro.js
BoxParser.createFullBoxCtor("mfro", function(stream) {
	this._size = stream.readUint32();
});

// file:src/parsing/mvhd.js
BoxParser.createFullBoxCtor("mvhd", function(stream) {
	if (this.version == 1) {
		this.creation_time = stream.readUint64();
		this.modification_time = stream.readUint64();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		this.creation_time = stream.readUint32();
		this.modification_time = stream.readUint32();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint32();
	}
	this.rate = stream.readUint32();
	this.volume = stream.readUint16()>>8;
	stream.readUint16();
	stream.readUint32Array(2);
	this.matrix = stream.readUint32Array(9);
	stream.readUint32Array(6);
	this.next_track_id = stream.readUint32();
});
// file:src/parsing/npck.js
BoxParser.createBoxCtor("npck", function(stream) {
	this.packetssent = stream.readUint32();
});

// file:src/parsing/nump.js
BoxParser.createBoxCtor("nump", function(stream) {
	this.packetssent = stream.readUint64();
});

// file:src/parsing/padb.js
BoxParser.createFullBoxCtor("padb", function(stream) {
	var sample_count = stream.readUint32();
	this.padbits = [];
	for (var i = 0; i < Math.floor((sample_count+1)/2); i++) {
		this.padbits = stream.readUint8();
	}
});

// file:src/parsing/pasp.js
BoxParser.createBoxCtor("pasp", function(stream) {
	this.hSpacing = stream.readUint32();
	this.vSpacing = stream.readUint32();
});// file:src/parsing/payl.js
BoxParser.createBoxCtor("payl", function(stream) {
	this.text = stream.readString(this.size - this.hdr_size);
});

// file:src/parsing/payt.js
BoxParser.createBoxCtor("payt", function(stream) {
	this.payloadID = stream.readUint32();
	var count = stream.readUint8();
	this.rtpmap_string = stream.readString(count);
});

// file:src/parsing/pdin.js
BoxParser.createFullBoxCtor("pdin", function(stream) {
	var count = (this.size - this.hdr_size)/8;
	this.rate = [];
	this.initial_delay = [];
	for (var i = 0; i < count; i++) {
		this.rate[i] = stream.readUint32();
		this.initial_delay[i] = stream.readUint32();
	}
});

// file:src/parsing/pitm.js
BoxParser.createFullBoxCtor("pitm", function(stream) {
	if (this.version === 0) {
		this.item_id = stream.readUint16();
	} else {
		this.item_id = stream.readUint32();
	}
});

// file:src/parsing/pixi.js
BoxParser.createFullBoxCtor("pixi", function(stream) {
	var i;
	this.num_channels = stream.readUint8();
	this.bits_per_channels = [];
	for (i = 0; i < this.num_channels; i++) {
		this.bits_per_channels[i] = stream.readUint8();
	}
});

// file:src/parsing/pmax.js
BoxParser.createBoxCtor("pmax", function(stream) {
	this.bytes = stream.readUint32();
});

// file:src/parsing/prft.js
BoxParser.createFullBoxCtor("prft", function(stream) {
	this.ref_track_id = stream.readUint32();
	this.ntp_timestamp = stream.readUint64();
	if (this.version === 0) {
		this.media_time = stream.readUint32();
	} else {
		this.media_time = stream.readUint64();
	}
});

// file:src/parsing/pssh.js
BoxParser.createFullBoxCtor("pssh", function(stream) {
	this.system_id = BoxParser.parseHex16(stream);
	if (this.version > 0) {
		var count = stream.readUint32();
		this.kid = [];
		for (var i = 0; i < count; i++) {
			this.kid[i] = BoxParser.parseHex16(stream);
		}
	}
	var datasize = stream.readUint32();
	if (datasize > 0) {
		this.data = stream.readUint8Array(datasize);
	}
});

// file:src/parsing/qt/clef.js
BoxParser.createFullBoxCtor("clef", function(stream) {
	this.width = stream.readUint32();
	this.height = stream.readUint32();
});// file:src/parsing/qt/enof.js
BoxParser.createFullBoxCtor("enof", function(stream) {
	this.width = stream.readUint32();
	this.height = stream.readUint32();
});// file:src/parsing/qt/prof.js
BoxParser.createFullBoxCtor("prof", function(stream) {
	this.width = stream.readUint32();
	this.height = stream.readUint32();
});// file:src/parsing/qt/tapt.js
BoxParser.createContainerBoxCtor("tapt", null, [ "clef", "prof", "enof"]);// file:src/parsing/rtp.js
BoxParser.createBoxCtor("rtp ", function(stream) {
	this.descriptionformat = stream.readString(4);
	this.sdptext = stream.readString(this.size - this.hdr_size - 4);
});

// file:src/parsing/saio.js
BoxParser.createFullBoxCtor("saio", function(stream) {
	if (this.flags & 0x1) {
		this.aux_info_type = stream.readUint32();
		this.aux_info_type_parameter = stream.readUint32();
	}
	var count = stream.readUint32();
	this.offset = [];
	for (var i = 0; i < count; i++) {
		if (this.version === 0) {
			this.offset[i] = stream.readUint32();
		} else {
			this.offset[i] = stream.readUint64();
		}
	}
});
// file:src/parsing/saiz.js
BoxParser.createFullBoxCtor("saiz", function(stream) {
	if (this.flags & 0x1) {
		this.aux_info_type = stream.readUint32();
		this.aux_info_type_parameter = stream.readUint32();
	}
	this.default_sample_info_size = stream.readUint8();
	var count = stream.readUint32();
	this.sample_info_size = [];
	if (this.default_sample_info_size === 0) {
		for (var i = 0; i < count; i++) {
			this.sample_info_size[i] = stream.readUint8();
		}
	}
});

// file:src/parsing/sampleentries/mett.js
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_METADATA, "mett", function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
});

// file:src/parsing/sampleentries/metx.js
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_METADATA, "metx", function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.namespace = stream.readCString();
	this.schema_location = stream.readCString();
	this.parseFooter(stream);
});

// file:src/parsing/sampleentries/sbtt.js
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SUBTITLE, "sbtt", function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
});

// file:src/parsing/sampleentries/stpp.js
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SUBTITLE, "stpp", function(stream) {
	this.parseHeader(stream);
	this.namespace = stream.readCString();
	this.schema_location = stream.readCString();
	this.auxiliary_mime_types = stream.readCString();
	this.parseFooter(stream);
});

// file:src/parsing/sampleentries/stxt.js
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SUBTITLE, "stxt", function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
});

// file:src/parsing/sampleentries/tx3g.js
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_SUBTITLE, "tx3g", function(stream) {
	this.parseHeader(stream);
	this.displayFlags = stream.readUint32();
	this.horizontal_justification = stream.readInt8();
	this.vertical_justification = stream.readInt8();
	this.bg_color_rgba = stream.readUint8Array(4);
	this.box_record = stream.readInt16Array(4);
	this.style_record = stream.readUint8Array(12);
	this.parseFooter(stream);
});
// file:src/parsing/sampleentries/wvtt.js
BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_METADATA, "wvtt", function(stream) {
	this.parseHeader(stream);
	this.parseFooter(stream);
});

// file:src/parsing/samplegroups/alst.js
BoxParser.createSampleGroupCtor("alst", function(stream) {
	var i;
	var roll_count = stream.readUint16();
	this.first_output_sample = stream.readUint16();
	this.sample_offset = [];
	for (i = 0; i < roll_count; i++) {
		this.sample_offset[i] = stream.readUint32();
	}
	var remaining = this.description_length - 4 - 4*roll_count;
	this.num_output_samples = [];
	this.num_total_samples = [];
	for (i = 0; i < remaining/4; i++) {
		this.num_output_samples[i] = stream.readUint16();
		this.num_total_samples[i] = stream.readUint16();
	}
});

// file:src/parsing/samplegroups/avll.js
BoxParser.createSampleGroupCtor("avll", function(stream) {
	this.layerNumber = stream.readUint8();
	this.accurateStatisticsFlag = stream.readUint8();
	this.avgBitRate = stream.readUint16();
	this.avgFrameRate = stream.readUint16();
});

// file:src/parsing/samplegroups/avss.js
BoxParser.createSampleGroupCtor("avss", function(stream) {
	this.subSequenceIdentifier = stream.readUint16();
	this.layerNumber = stream.readUint8();
	var tmp_byte = stream.readUint8();
	this.durationFlag = tmp_byte >> 7;
	this.avgRateFlag = (tmp_byte >> 6) & 0x1;
	if (this.durationFlag) {
		this.duration = stream.readUint32();
	}
	if (this.avgRateFlag) {
		this.accurateStatisticsFlag = stream.readUint8();
		this.avgBitRate = stream.readUint16();
		this.avgFrameRate = stream.readUint16();
	}
	this.dependency = [];
	var numReferences = stream.readUint8();
	for (var i = 0; i < numReferences; i++) {
		var dependencyInfo = {};
		this.dependency.push(dependencyInfo);
		dependencyInfo.subSeqDirectionFlag = stream.readUint8();
		dependencyInfo.layerNumber = stream.readUint8();
		dependencyInfo.subSequenceIdentifier = stream.readUint16();
	}
});

// file:src/parsing/samplegroups/dtrt.js
BoxParser.createSampleGroupCtor("dtrt", function(stream) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
});

// file:src/parsing/samplegroups/mvif.js
BoxParser.createSampleGroupCtor("mvif", function(stream) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
});

// file:src/parsing/samplegroups/prol.js
BoxParser.createSampleGroupCtor("prol", function(stream) {
	this.roll_distance = stream.readInt16();
});

// file:src/parsing/samplegroups/rap.js
BoxParser.createSampleGroupCtor("rap ", function(stream) {
	var tmp_byte = stream.readUint8();
	this.num_leading_samples_known = tmp_byte >> 7;
	this.num_leading_samples = tmp_byte & 0x7F;
});

// file:src/parsing/samplegroups/rash.js
BoxParser.createSampleGroupCtor("rash", function(stream) {
	this.operation_point_count = stream.readUint16();
	if (this.description_length !== 2+(this.operation_point_count === 1?2:this.operation_point_count*6)+9) {
		Log.warn("BoxParser", "Mismatch in "+this.grouping_type+" sample group length");
		this.data =  stream.readUint8Array(this.description_length-2);
	} else {
		if (this.operation_point_count === 1) {
			this.target_rate_share = stream.readUint16();
		} else {
			this.target_rate_share = [];
			this.available_bitrate = [];
			for (var i = 0; i < this.operation_point_count; i++) {
				this.available_bitrate[i] = stream.readUint32();
				this.target_rate_share[i] = stream.readUint16();
			}
		}
		this.maximum_bitrate = stream.readUint32();
		this.minimum_bitrate = stream.readUint32();
		this.discard_priority = stream.readUint8();
	}
});

// file:src/parsing/samplegroups/roll.js
BoxParser.createSampleGroupCtor("roll", function(stream) {
	this.roll_distance = stream.readInt16();
});

// file:src/parsing/samplegroups/samplegroup.js
BoxParser.SampleGroupEntry.prototype.parse = function(stream) {
	Log.warn("BoxParser", "Unknown Sample Group type: "+this.grouping_type);
	this.data =  stream.readUint8Array(this.description_length);
}

// file:src/parsing/samplegroups/scif.js
BoxParser.createSampleGroupCtor("scif", function(stream) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
});

// file:src/parsing/samplegroups/scnm.js
BoxParser.createSampleGroupCtor("scnm", function(stream) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
});

// file:src/parsing/samplegroups/seig.js
BoxParser.createSampleGroupCtor("seig", function(stream) {
	this.reserved = stream.readUint8();
	var tmp = stream.readUint8();
	this.crypt_byte_block = tmp >> 4;
	this.skip_byte_block = tmp & 0xF;
	this.isProtected = stream.readUint8();
	this.Per_Sample_IV_Size = stream.readUint8();
	this.KID = BoxParser.parseHex16(stream);
	this.constant_IV_size = 0;
	this.constant_IV = 0;
	if (this.isProtected === 1 && this.Per_Sample_IV_Size === 0) {
		this.constant_IV_size = stream.readUint8();
		this.constant_IV = stream.readUint8Array(this.constant_IV_size);
	}
});

// file:src/parsing/samplegroups/stsa.js
BoxParser.createSampleGroupCtor("stsa", function(stream) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
});

// file:src/parsing/samplegroups/sync.js
BoxParser.createSampleGroupCtor("sync", function(stream) {
	var tmp_byte = stream.readUint8();
	this.NAL_unit_type = tmp_byte & 0x3F;
});

// file:src/parsing/samplegroups/tele.js
BoxParser.createSampleGroupCtor("tele", function(stream) {
	var tmp_byte = stream.readUint8();
	this.level_independently_decodable = tmp_byte >> 7;
});

// file:src/parsing/samplegroups/tsas.js
BoxParser.createSampleGroupCtor("tsas", function(stream) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
});

// file:src/parsing/samplegroups/tscl.js
BoxParser.createSampleGroupCtor("tscl", function(stream) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
});

// file:src/parsing/samplegroups/vipr.js
BoxParser.createSampleGroupCtor("vipr", function(stream) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
});

// file:src/parsing/sbgp.js
BoxParser.createFullBoxCtor("sbgp", function(stream) {
	this.grouping_type = stream.readString(4);
	if (this.version === 1) {
		this.grouping_type_parameter = stream.readUint32();
	} else {
		this.grouping_type_parameter = 0;
	}
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		var entry = {};
		this.entries.push(entry);
		entry.sample_count = stream.readInt32();
		entry.group_description_index = stream.readInt32();
	}
});

// file:src/parsing/schm.js
BoxParser.createFullBoxCtor("schm", function(stream) {
	this.scheme_type = stream.readString(4);
	this.scheme_version = stream.readUint32();
	if (this.flags & 0x000001) {
		this.scheme_uri = stream.readString(this.size - this.hdr_size - 8);
	}
});

// file:src/parsing/sdp.js
BoxParser.createBoxCtor("sdp ", function(stream) {
	this.sdptext = stream.readString(this.size - this.hdr_size);
});

// file:src/parsing/sdtp.js
BoxParser.createFullBoxCtor("sdtp", function(stream) {
	var tmp_byte;
	var count = (this.size - this.hdr_size);
	this.is_leading = [];
	this.sample_depends_on = [];
	this.sample_is_depended_on = [];
	this.sample_has_redundancy = [];
	for (var i = 0; i < count; i++) {
		tmp_byte = stream.readUint8();
		this.is_leading[i] = tmp_byte >> 6;
		this.sample_depends_on[i] = (tmp_byte >> 4) & 0x3;
		this.sample_is_depended_on[i] = (tmp_byte >> 2) & 0x3;
		this.sample_has_redundancy[i] = tmp_byte & 0x3;
	}
});

// file:src/parsing/senc.js
// Cannot be fully parsed because Per_Sample_IV_Size needs to be known
BoxParser.createFullBoxCtor("senc" /*, function(stream) {
	this.parseFullHeader(stream);
	var sample_count = stream.readUint32();
	this.samples = [];
	for (var i = 0; i < sample_count; i++) {
		var sample = {};
		// tenc.default_Per_Sample_IV_Size or seig.Per_Sample_IV_Size
		sample.InitializationVector = this.readUint8Array(Per_Sample_IV_Size*8);
		if (this.flags & 0x2) {
			sample.subsamples = [];
			subsample_count = stream.readUint16();
			for (var j = 0; j < subsample_count; j++) {
				var subsample = {};
				subsample.BytesOfClearData = stream.readUint16();
				subsample.BytesOfProtectedData = stream.readUint32();
				sample.subsamples.push(subsample);
			}
		}
		// TODO
		this.samples.push(sample);
	}
}*/);
// file:src/parsing/sgpd.js
BoxParser.createFullBoxCtor("sgpd", function(stream) {
	this.grouping_type = stream.readString(4);
	Log.debug("BoxParser", "Found Sample Groups of type "+this.grouping_type);
	if (this.version === 1) {
		this.default_length = stream.readUint32();
	} else {
		this.default_length = 0;
	}
	if (this.version >= 2) {
		this.default_group_description_index = stream.readUint32();
	}
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		var entry;
		if (BoxParser[this.grouping_type+"SampleGroupEntry"]) {
			entry = new BoxParser[this.grouping_type+"SampleGroupEntry"](this.grouping_type);
		}  else {
			entry = new BoxParser.SampleGroupEntry(this.grouping_type);
		}
		this.entries.push(entry);
		if (this.version === 1) {
			if (this.default_length === 0) {
				entry.description_length = stream.readUint32();
			} else {
				entry.description_length = this.default_length;
			}
		} else {
			entry.description_length = this.default_length;
		}
		if (entry.write === BoxParser.SampleGroupEntry.prototype.write) {
			Log.info("BoxParser", "SampleGroup for type "+this.grouping_type+" writing not yet implemented, keeping unparsed data in memory for later write");
			// storing data
			entry.data = stream.readUint8Array(entry.description_length);
			// rewinding
			stream.position -= entry.description_length;
		}
		entry.parse(stream);
	}
});

// file:src/parsing/sidx.js
BoxParser.createFullBoxCtor("sidx", function(stream) {
	this.reference_ID = stream.readUint32();
	this.timescale = stream.readUint32();
	if (this.version === 0) {
		this.earliest_presentation_time = stream.readUint32();
		this.first_offset = stream.readUint32();
	} else {
		this.earliest_presentation_time = stream.readUint64();
		this.first_offset = stream.readUint64();
	}
	stream.readUint16();
	this.references = [];
	var count = stream.readUint16();
	for (var i = 0; i < count; i++) {
		var ref = {};
		this.references.push(ref);
		var tmp_32 = stream.readUint32();
		ref.reference_type = (tmp_32 >> 31) & 0x1;
		ref.referenced_size = tmp_32 & 0x7FFFFFFF;
		ref.subsegment_duration = stream.readUint32();
		tmp_32 = stream.readUint32();
		ref.starts_with_SAP = (tmp_32 >> 31) & 0x1;
		ref.SAP_type = (tmp_32 >> 28) & 0x7;
		ref.SAP_delta_time = tmp_32 & 0xFFFFFFF;
	}
});

// file:src/parsing/singleitemtypereference.js
BoxParser.SingleItemTypeReferenceBox = function(type, size, hdr_size, start) {
	BoxParser.Box.call(this, type, size);
	this.hdr_size = hdr_size;
	this.start = start;
}
BoxParser.SingleItemTypeReferenceBox.prototype = new BoxParser.Box();
BoxParser.SingleItemTypeReferenceBox.prototype.parse = function(stream) {
	this.from_item_ID = stream.readUint16();
	var count =  stream.readUint16();
	this.references = [];
	for(var i = 0; i < count; i++) {
		this.references[i] = stream.readUint16();
	}
}

// file:src/parsing/singleitemtypereferencelarge.js
BoxParser.SingleItemTypeReferenceBoxLarge = function(type, size, hdr_size, start) {
	BoxParser.Box.call(this, type, size);
	this.hdr_size = hdr_size;
	this.start = start;
}
BoxParser.SingleItemTypeReferenceBoxLarge.prototype = new BoxParser.Box();
BoxParser.SingleItemTypeReferenceBoxLarge.prototype.parse = function(stream) {
	this.from_item_ID = stream.readUint32();
	var count =  stream.readUint16();
	this.references = [];
	for(var i = 0; i < count; i++) {
		this.references[i] = stream.readUint32();
	}
}

// file:src/parsing/SmDm.js
BoxParser.createFullBoxCtor("SmDm", function(stream) {
	this.primaryRChromaticity_x = stream.readUint16();
    this.primaryRChromaticity_y = stream.readUint16();
    this.primaryGChromaticity_x = stream.readUint16();
    this.primaryGChromaticity_y = stream.readUint16();
    this.primaryBChromaticity_x = stream.readUint16();
    this.primaryBChromaticity_y = stream.readUint16();
    this.whitePointChromaticity_x = stream.readUint16();
    this.whitePointChromaticity_y = stream.readUint16();
    this.luminanceMax = stream.readUint32();
    this.luminanceMin = stream.readUint32();
});

// file:src/parsing/smhd.js
BoxParser.createFullBoxCtor("smhd", function(stream) {
	this.balance = stream.readUint16();
	stream.readUint16();
});

// file:src/parsing/ssix.js
BoxParser.createFullBoxCtor("ssix", function(stream) {
	this.subsegments = [];
	var subsegment_count = stream.readUint32();
	for (var i = 0; i < subsegment_count; i++) {
		var subsegment = {};
		this.subsegments.push(subsegment);
		subsegment.ranges = [];
		var range_count = stream.readUint32();
		for (var j = 0; j < range_count; j++) {
			var range = {};
			subsegment.ranges.push(range);
			range.level = stream.readUint8();
			range.range_size = stream.readUint24();
		}
	}
});

// file:src/parsing/stco.js
BoxParser.createFullBoxCtor("stco", function(stream) {
	var entry_count;
	entry_count = stream.readUint32();
	this.chunk_offsets = [];
	if (this.version === 0) {
		for (var i = 0; i < entry_count; i++) {
			this.chunk_offsets.push(stream.readUint32());
		}
	}
});

// file:src/parsing/stdp.js
BoxParser.createFullBoxCtor("stdp", function(stream) {
	var count = (this.size - this.hdr_size)/2;
	this.priority = [];
	for (var i = 0; i < count; i++) {
		this.priority[i] = stream.readUint16();
	}
});

// file:src/parsing/sthd.js
BoxParser.createFullBoxCtor("sthd");

// file:src/parsing/stri.js
BoxParser.createFullBoxCtor("stri", function(stream) {
	this.switch_group = stream.readUint16();
	this.alternate_group = stream.readUint16();
	this.sub_track_id = stream.readUint32();
	var count = (this.size - this.hdr_size - 8)/4;
	this.attribute_list = [];
	for (var i = 0; i < count; i++) {
		this.attribute_list[i] = stream.readUint32();
	}
});

// file:src/parsing/stsc.js
BoxParser.createFullBoxCtor("stsc", function(stream) {
	var entry_count;
	var i;
	entry_count = stream.readUint32();
	this.first_chunk = [];
	this.samples_per_chunk = [];
	this.sample_description_index = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.first_chunk.push(stream.readUint32());
			this.samples_per_chunk.push(stream.readUint32());
			this.sample_description_index.push(stream.readUint32());
		}
	}
});

// file:src/parsing/stsd.js
BoxParser.createFullBoxCtor("stsd", function(stream) {
	var i;
	var ret;
	var entryCount;
	var box;
	this.entries = [];
	entryCount = stream.readUint32();
	for (i = 1; i <= entryCount; i++) {
		ret = BoxParser.parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			if (BoxParser[ret.type+"SampleEntry"]) {
				box = new BoxParser[ret.type+"SampleEntry"](ret.size);
				box.hdr_size = ret.hdr_size;
				box.start = ret.start;
			} else {
				Log.warn("BoxParser", "Unknown sample entry type: "+ret.type);
				box = new BoxParser.SampleEntry(ret.type, ret.size, ret.hdr_size, ret.start);
			}
			if (box.write === BoxParser.SampleEntry.prototype.write) {
				Log.info("BoxParser", "SampleEntry "+box.type+" box writing not yet implemented, keeping unparsed data in memory for later write");
				box.parseDataAndRewind(stream);
			}
			box.parse(stream);
			this.entries.push(box);
		} else {
			return;
		}
	}
});

// file:src/parsing/stsg.js
BoxParser.createFullBoxCtor("stsg", function(stream) {
	this.grouping_type = stream.readUint32();
	var count = stream.readUint16();
	this.group_description_index = [];
	for (var i = 0; i < count; i++) {
		this.group_description_index[i] = stream.readUint32();
	}
});

// file:src/parsing/stsh.js
BoxParser.createFullBoxCtor("stsh", function(stream) {
	var entry_count;
	var i;
	entry_count = stream.readUint32();
	this.shadowed_sample_numbers = [];
	this.sync_sample_numbers = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.shadowed_sample_numbers.push(stream.readUint32());
			this.sync_sample_numbers.push(stream.readUint32());
		}
	}
});

// file:src/parsing/stss.js
BoxParser.createFullBoxCtor("stss", function(stream) {
	var i;
	var entry_count;
	entry_count = stream.readUint32();
	if (this.version === 0) {
		this.sample_numbers = [];
		for(i=0; i<entry_count; i++) {
			this.sample_numbers.push(stream.readUint32());
		}
	}
});

// file:src/parsing/stsz.js
BoxParser.createFullBoxCtor("stsz", function(stream) {
	var i;
	this.sample_sizes = [];
	if (this.version === 0) {
		this.sample_size = stream.readUint32();
		this.sample_count = stream.readUint32();
		for (i = 0; i < this.sample_count; i++) {
			if (this.sample_size === 0) {
				this.sample_sizes.push(stream.readUint32());
			} else {
				this.sample_sizes[i] = this.sample_size;
			}
		}
	}
});

// file:src/parsing/stts.js
BoxParser.createFullBoxCtor("stts", function(stream) {
	var entry_count;
	var i;
	var delta;
	entry_count = stream.readUint32();
	this.sample_counts = [];
	this.sample_deltas = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			delta = stream.readInt32();
			if (delta < 0) {
				Log.warn("BoxParser", "File uses negative stts sample delta, using value 1 instead, sync may be lost!");
				delta = 1;
			}
			this.sample_deltas.push(delta);
		}
	}
});

// file:src/parsing/stvi.js
BoxParser.createFullBoxCtor("stvi", function(stream) {
	var tmp32 = stream.readUint32();
	this.single_view_allowed = tmp32 & 0x3;
	this.stereo_scheme = stream.readUint32();
	var length = stream.readUint32();
	this.stereo_indication_type = stream.readString(length);
	var ret;
	var box;
	this.boxes = [];
	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			box = ret.box;
			this.boxes.push(box);
			this[box.type] = box;
		} else {
			return;
		}
	}
});

// file:src/parsing/styp.js
BoxParser.createBoxCtor("styp", function(stream) {
	BoxParser.ftypBox.prototype.parse.call(this, stream);
});

// file:src/parsing/stz2.js
BoxParser.createFullBoxCtor("stz2", function(stream) {
	var i;
	var sample_size;
	var sample_count;
	this.sample_sizes = [];
	if (this.version === 0) {
		this.reserved = stream.readUint24();
		this.field_size = stream.readUint8();
		sample_count = stream.readUint32();
		if (this.field_size === 4) {
			for (i = 0; i < sample_count; i+=2) {
				var tmp = stream.readUint8();
				this.sample_sizes[i] = (tmp >> 4) & 0xF;
				this.sample_sizes[i+1] = tmp & 0xF;
			}
		} else if (this.field_size === 8) {
			for (i = 0; i < sample_count; i++) {
				this.sample_sizes[i] = stream.readUint8();
			}
		} else if (this.field_size === 16) {
			for (i = 0; i < sample_count; i++) {
				this.sample_sizes[i] = stream.readUint16();
			}
		} else {
			Log.error("BoxParser", "Error in length field in stz2 box");
		}
	}
});

// file:src/parsing/subs.js
BoxParser.createFullBoxCtor("subs", function(stream) {
	var i,j;
	var entry_count;
	var subsample_count;
	entry_count = stream.readUint32();
	this.entries = [];
	for (i = 0; i < entry_count; i++) {
		var sampleInfo = {};
		this.entries[i] = sampleInfo;
		sampleInfo.sample_delta = stream.readUint32();
		sampleInfo.subsamples = [];
		subsample_count = stream.readUint16();
		if (subsample_count>0) {
			for (j = 0; j < subsample_count; j++) {
				var subsample = {};
				sampleInfo.subsamples.push(subsample);
				if (this.version == 1) {
					subsample.size = stream.readUint32();
				} else {
					subsample.size = stream.readUint16();
				}
				subsample.priority = stream.readUint8();
				subsample.discardable = stream.readUint8();
				subsample.codec_specific_parameters = stream.readUint32();
			}
		}
	}
});

// file:src/parsing/tenc.js
BoxParser.createFullBoxCtor("tenc", function(stream) {
	stream.readUint8(); // reserved
	if (this.version === 0) {
		stream.readUint8();
	} else {
		var tmp = stream.readUint8();
		this.default_crypt_byte_block = (tmp >> 4) & 0xF;
		this.default_skip_byte_block = tmp & 0xF;
	}
	this.default_isProtected = stream.readUint8();
	this.default_Per_Sample_IV_Size = stream.readUint8();
	this.default_KID = BoxParser.parseHex16(stream);
	if (this.default_isProtected === 1 && this.default_Per_Sample_IV_Size === 0) {
		this.default_constant_IV_size = stream.readUint8();
		this.default_constant_IV = stream.readUint8Array(this.default_constant_IV_size);
	}
});// file:src/parsing/tfdt.js
BoxParser.createFullBoxCtor("tfdt", function(stream) {
	if (this.version == 1) {
		this.baseMediaDecodeTime = stream.readUint64();
	} else {
		this.baseMediaDecodeTime = stream.readUint32();
	}
});

// file:src/parsing/tfhd.js
BoxParser.createFullBoxCtor("tfhd", function(stream) {
	var readBytes = 0;
	this.track_id = stream.readUint32();
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_BASE_DATA_OFFSET)) {
		this.base_data_offset = stream.readUint64();
		readBytes += 8;
	} else {
		this.base_data_offset = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC)) {
		this.default_sample_description_index = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_description_index = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR)) {
		this.default_sample_duration = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_duration = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE)) {
		this.default_sample_size = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_size = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS)) {
		this.default_sample_flags = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_flags = 0;
	}
});

// file:src/parsing/tfra.js
BoxParser.createFullBoxCtor("tfra", function(stream) {
	this.track_ID = stream.readUint32();
	stream.readUint24();
	var tmp_byte = stream.readUint8();
	this.length_size_of_traf_num = (tmp_byte >> 4) & 0x3;
	this.length_size_of_trun_num = (tmp_byte >> 2) & 0x3;
	this.length_size_of_sample_num = (tmp_byte) & 0x3;
	this.entries = [];
	var number_of_entries = stream.readUint32();
	for (var i = 0; i < number_of_entries; i++) {
		if (this.version === 1) {
			this.time = stream.readUint64();
			this.moof_offset = stream.readUint64();
		} else {
			this.time = stream.readUint32();
			this.moof_offset = stream.readUint32();
		}
		this.traf_number = stream["readUint"+(8*(this.length_size_of_traf_num+1))]();
		this.trun_number = stream["readUint"+(8*(this.length_size_of_trun_num+1))]();
		this.sample_number = stream["readUint"+(8*(this.length_size_of_sample_num+1))]();
	}
});

// file:src/parsing/tkhd.js
BoxParser.createFullBoxCtor("tkhd", function(stream) {
	if (this.version == 1) {
		this.creation_time = stream.readUint64();
		this.modification_time = stream.readUint64();
		this.track_id = stream.readUint32();
		stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		this.creation_time = stream.readUint32();
		this.modification_time = stream.readUint32();
		this.track_id = stream.readUint32();
		stream.readUint32();
		this.duration = stream.readUint32();
	}
	stream.readUint32Array(2);
	this.layer = stream.readInt16();
	this.alternate_group = stream.readInt16();
	this.volume = stream.readInt16()>>8;
	stream.readUint16();
	this.matrix = stream.readInt32Array(9);
	this.width = stream.readUint32();
	this.height = stream.readUint32();
});

// file:src/parsing/tmax.js
BoxParser.createBoxCtor("tmax", function(stream) {
	this.time = stream.readUint32();
});

// file:src/parsing/tmin.js
BoxParser.createBoxCtor("tmin", function(stream) {
	this.time = stream.readUint32();
});

// file:src/parsing/totl.js
BoxParser.createBoxCtor("totl",function(stream) {
	this.bytessent = stream.readUint32();
});

// file:src/parsing/tpay.js
BoxParser.createBoxCtor("tpay", function(stream) {
	this.bytessent = stream.readUint32();
});

// file:src/parsing/tpyl.js
BoxParser.createBoxCtor("tpyl", function(stream) {
	this.bytessent = stream.readUint64();
});

// file:src/parsing/TrackGroup.js
BoxParser.TrackGroupTypeBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.track_group_id = stream.readUint32();
}

// file:src/parsing/trackgroups/msrc.js
BoxParser.createTrackGroupCtor("msrc");// file:src/parsing/TrakReference.js
BoxParser.TrackReferenceTypeBox = function(type, size, hdr_size, start) {
	BoxParser.Box.call(this, type, size);
	this.hdr_size = hdr_size;
	this.start = start;
}
BoxParser.TrackReferenceTypeBox.prototype = new BoxParser.Box();
BoxParser.TrackReferenceTypeBox.prototype.parse = function(stream) {
	this.track_ids = stream.readUint32Array((this.size-this.hdr_size)/4);
}

// file:src/parsing/tref.js
BoxParser.trefBox.prototype.parse = function(stream) {
	var ret;
	var box;
	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			box = new BoxParser.TrackReferenceTypeBox(ret.type, ret.size, ret.hdr_size, ret.start);
			if (box.write === BoxParser.Box.prototype.write && box.type !== "mdat") {
				Log.info("BoxParser", "TrackReference "+box.type+" box writing not yet implemented, keeping unparsed data in memory for later write");
				box.parseDataAndRewind(stream);
			}
			box.parse(stream);
			this.boxes.push(box);
		} else {
			return;
		}
	}
}

// file:src/parsing/trep.js
BoxParser.createFullBoxCtor("trep", function(stream) {
	this.track_ID = stream.readUint32();
	this.boxes = [];
	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			box = ret.box;
			this.boxes.push(box);
		} else {
			return;
		}
	}
});

// file:src/parsing/trex.js
BoxParser.createFullBoxCtor("trex", function(stream) {
	this.track_id = stream.readUint32();
	this.default_sample_description_index = stream.readUint32();
	this.default_sample_duration = stream.readUint32();
	this.default_sample_size = stream.readUint32();
	this.default_sample_flags = stream.readUint32();
});

// file:src/parsing/trpy.js
BoxParser.createBoxCtor("trpy", function(stream) {
	this.bytessent = stream.readUint64();
});

// file:src/parsing/trun.js
BoxParser.createFullBoxCtor("trun", function(stream) {
	var readBytes = 0;
	this.sample_count = stream.readUint32();
	readBytes+= 4;
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) ) {
		this.data_offset = stream.readInt32(); //signed
		readBytes += 4;
	} else {
		this.data_offset = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG) ) {
		this.first_sample_flags = stream.readUint32();
		readBytes += 4;
	} else {
		this.first_sample_flags = 0;
	}
	this.sample_duration = [];
	this.sample_size = [];
	this.sample_flags = [];
	this.sample_composition_time_offset = [];
	if (this.size - this.hdr_size > readBytes) {
		for (var i = 0; i < this.sample_count; i++) {
			if (this.flags & BoxParser.TRUN_FLAGS_DURATION) {
				this.sample_duration[i] = stream.readUint32();
			}
			if (this.flags & BoxParser.TRUN_FLAGS_SIZE) {
				this.sample_size[i] = stream.readUint32();
			}
			if (this.flags & BoxParser.TRUN_FLAGS_FLAGS) {
				this.sample_flags[i] = stream.readUint32();
			}
			if (this.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
				if (this.version === 0) {
					this.sample_composition_time_offset[i] = stream.readUint32();
				} else {
					this.sample_composition_time_offset[i] = stream.readInt32(); //signed
				}
			}
		}
	}
});

// file:src/parsing/tsel.js
BoxParser.createFullBoxCtor("tsel", function(stream) {
	this.switch_group = stream.readUint32();
	var count = (this.size - this.hdr_size - 4)/4;
	this.attribute_list = [];
	for (var i = 0; i < count; i++) {
		this.attribute_list[i] = stream.readUint32();
	}
});

// file:src/parsing/txtC.js
BoxParser.createFullBoxCtor("txtC", function(stream) {
	this.config = stream.readCString();
});

// file:src/parsing/url.js
BoxParser.createFullBoxCtor("url ", function(stream) {
	if (this.flags !== 0x000001) {
		this.location = stream.readCString();
	}
});

// file:src/parsing/urn.js
BoxParser.createFullBoxCtor("urn ", function(stream) {
	this.name = stream.readCString();
	if (this.size - this.hdr_size - this.name.length - 1 > 0) {
		this.location = stream.readCString();
	}
});

// file:src/parsing/uuid/piff/piffLsm.js
BoxParser.createUUIDBox("a5d40b30e81411ddba2f0800200c9a66", true, false, function(stream) {
    this.LiveServerManifest = stream.readString(this.size - this.hdr_size)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
});// file:src/parsing/uuid/piff/piffPssh.js
BoxParser.createUUIDBox("d08a4f1810f34a82b6c832d8aba183d3", true, false, function(stream) {
	this.system_id = BoxParser.parseHex16(stream);
	var datasize = stream.readUint32();
	if (datasize > 0) {
		this.data = stream.readUint8Array(datasize);
	}
});

// file:src/parsing/uuid/piff/piffSenc.js
BoxParser.createUUIDBox("a2394f525a9b4f14a2446c427c648df4", true, false /*, function(stream) {
	if (this.flags & 0x1) {
		this.AlgorithmID = stream.readUint24();
		this.IV_size = stream.readUint8();
		this.KID = BoxParser.parseHex16(stream);
	}
	var sample_count = stream.readUint32();
	this.samples = [];
	for (var i = 0; i < sample_count; i++) {
		var sample = {};
		sample.InitializationVector = this.readUint8Array(this.IV_size*8);
		if (this.flags & 0x2) {
			sample.subsamples = [];
			sample.NumberOfEntries = stream.readUint16();
			for (var j = 0; j < sample.NumberOfEntries; j++) {
				var subsample = {};
				subsample.BytesOfClearData = stream.readUint16();
				subsample.BytesOfProtectedData = stream.readUint32();
				sample.subsamples.push(subsample);
			}
		}
		this.samples.push(sample);
	}
}*/);
// file:src/parsing/uuid/piff/piffTenc.js
BoxParser.createUUIDBox("8974dbce7be74c5184f97148f9882554", true, false, function(stream) {
	this.default_AlgorithmID = stream.readUint24();
	this.default_IV_size = stream.readUint8();
	this.default_KID = BoxParser.parseHex16(stream);
});// file:src/parsing/uuid/piff/piffTfrf.js
BoxParser.createUUIDBox("d4807ef2ca3946958e5426cb9e46a79f", true, false, function(stream) {
    this.fragment_count = stream.readUint8();
    this.entries = [];

    for (var i = 0; i < this.fragment_count; i++) {
        var entry = {};
        var absolute_time = 0;
        var absolute_duration = 0;

        if (this.version === 1) {
            absolute_time = stream.readUint64();
            absolute_duration = stream.readUint64();
        } else {
            absolute_time = stream.readUint32();
            absolute_duration = stream.readUint32();
        }

        entry.absolute_time = absolute_time;
        entry.absolute_duration = absolute_duration;

        this.entries.push(entry);
    }
});// file:src/parsing/uuid/piff/piffTfxd.js
BoxParser.createUUIDBox("6d1d9b0542d544e680e2141daff757b2", true, false, function(stream) {
    if (this.version === 1) {
       this.absolute_time = stream.readUint64();
       this.duration = stream.readUint64();
    } else {
       this.absolute_time = stream.readUint32();
       this.duration = stream.readUint32();
    }
});// file:src/parsing/vmhd.js
BoxParser.createFullBoxCtor("vmhd", function(stream) {
	this.graphicsmode = stream.readUint16();
	this.opcolor = stream.readUint16Array(3);
});

// file:src/parsing/vpcC.js
BoxParser.createFullBoxCtor("vpcC", function (stream) {
	var tmp;
	if (this.version === 1) {
		this.profile = stream.readUint8();
		this.level = stream.readUint8();
		tmp = stream.readUint8();
		this.bitDepth = tmp >> 4;
		this.chromaSubsampling = (tmp >> 1) & 0x7;
		this.videoFullRangeFlag = tmp & 0x1;
		this.colourPrimaries = stream.readUint8();
		this.transferCharacteristics = stream.readUint8();
		this.matrixCoefficients = stream.readUint8();
		this.codecIntializationDataSize = stream.readUint16();
		this.codecIntializationData = stream.readUint8Array(this.codecIntializationDataSize);
	} else {
		this.profile = stream.readUint8();
		this.level = stream.readUint8();
		tmp = stream.readUint8();
		this.bitDepth = (tmp >> 4) & 0xF;
		this.colorSpace = tmp & 0xF;
		tmp = stream.readUint8();
		this.chromaSubsampling = (tmp >> 4) & 0xF;
		this.transferFunction = (tmp >> 1) & 0x7;
		this.videoFullRangeFlag = tmp & 0x1;
		this.codecIntializationDataSize = stream.readUint16();
		this.codecIntializationData = stream.readUint8Array(this.codecIntializationDataSize);
	}
});// file:src/parsing/vttC.js
BoxParser.createBoxCtor("vttC", function(stream) {
	this.text = stream.readString(this.size - this.hdr_size);
});

// file:src/box-codecs.js
BoxParser.SampleEntry.prototype.isVideo = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isAudio = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isSubtitle = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isMetadata = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isHint = function() {
	return false;
}

BoxParser.SampleEntry.prototype.getCodec = function() {
	return this.type.replace('.','');
}

BoxParser.SampleEntry.prototype.getWidth = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getHeight = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getChannelCount = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getSampleRate = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getSampleSize = function() {
	return "";
}

BoxParser.VisualSampleEntry.prototype.isVideo = function() {
	return true;
}

BoxParser.VisualSampleEntry.prototype.getWidth = function() {
	return this.width;
}

BoxParser.VisualSampleEntry.prototype.getHeight = function() {
	return this.height;
}

BoxParser.AudioSampleEntry.prototype.isAudio = function() {
	return true;
}

BoxParser.AudioSampleEntry.prototype.getChannelCount = function() {
	return this.channel_count;
}

BoxParser.AudioSampleEntry.prototype.getSampleRate = function() {
	return this.samplerate;
}

BoxParser.AudioSampleEntry.prototype.getSampleSize = function() {
	return this.samplesize;
}

BoxParser.SubtitleSampleEntry.prototype.isSubtitle = function() {
	return true;
}

BoxParser.MetadataSampleEntry.prototype.isMetadata = function() {
	return true;
}


BoxParser.decimalToHex = function(d, padding) {
	var hex = Number(d).toString(16);
	padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
	while (hex.length < padding) {
		hex = "0" + hex;
	}
	return hex;
}

BoxParser.avc1SampleEntry.prototype.getCodec =
BoxParser.avc2SampleEntry.prototype.getCodec =
BoxParser.avc3SampleEntry.prototype.getCodec =
BoxParser.avc4SampleEntry.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.avcC) {
		return baseCodec+"."+BoxParser.decimalToHex(this.avcC.AVCProfileIndication)+
						  ""+BoxParser.decimalToHex(this.avcC.profile_compatibility)+
						  ""+BoxParser.decimalToHex(this.avcC.AVCLevelIndication);
	} else {
		return baseCodec;
	}
}

BoxParser.hev1SampleEntry.prototype.getCodec =
BoxParser.hvc1SampleEntry.prototype.getCodec = function() {
	var i;
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.hvcC) {
		baseCodec += '.';
		switch (this.hvcC.general_profile_space) {
			case 0:
				baseCodec += '';
				break;
			case 1:
				baseCodec += 'A';
				break;
			case 2:
				baseCodec += 'B';
				break;
			case 3:
				baseCodec += 'C';
				break;
		}
		baseCodec += this.hvcC.general_profile_idc;
		baseCodec += '.';
		var val = this.hvcC.general_profile_compatibility;
		var reversed = 0;
		for (i=0; i<32; i++) {
			reversed |= val & 1;
			if (i==31) break;
			reversed <<= 1;
			val >>=1;
		}
		baseCodec += BoxParser.decimalToHex(reversed, 0);
		baseCodec += '.';
		if (this.hvcC.general_tier_flag === 0) {
			baseCodec += 'L';
		} else {
			baseCodec += 'H';
		}
		baseCodec += this.hvcC.general_level_idc;
		var hasByte = false;
		var constraint_string = "";
		for (i = 5; i >= 0; i--) {
			if (this.hvcC.general_constraint_indicator[i] || hasByte) {
				constraint_string = "."+BoxParser.decimalToHex(this.hvcC.general_constraint_indicator[i], 0)+constraint_string;
				hasByte = true;
			}
		}
		baseCodec += constraint_string;
	}
	return baseCodec;
}

BoxParser.mp4aSampleEntry.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.esds && this.esds.esd) {
		var oti = this.esds.esd.getOTI();
		var dsi = this.esds.esd.getAudioConfig();
		return baseCodec+"."+BoxParser.decimalToHex(oti)+(dsi ? "."+dsi: "");
	} else {
		return baseCodec;
	}
}

BoxParser.stxtSampleEntry.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if(this.mime_format) {
		return baseCodec + "." + this.mime_format;
	} else {
		return baseCodec
	}
}

BoxParser.av01SampleEntry.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	var bitdepth;
	if (this.av1C.seq_profile === 2 && this.av1C.high_bitdepth === 1) {
		bitdepth = (this.av1C.twelve_bit === 1) ? "12" : "10";
	} else if ( this.av1C.seq_profile <= 2 ) {
		bitdepth = (this.av1C.high_bitdepth === 1) ? "10" : "08";
	}
	// TODO need to parse the SH to find color config
	return baseCodec+"."+this.av1C.seq_profile+"."+this.av1C.seq_level_idx_0+(this.av1C.seq_tier_0?"H":"M")+"."+bitdepth;//+"."+this.av1C.monochrome+"."+this.av1C.chroma_subsampling_x+""+this.av1C.chroma_subsampling_y+""+this.av1C.chroma_sample_position;
}


// file:src/box-write.js
/* 
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
BoxParser.Box.prototype.writeHeader = function(stream, msg) {
	this.size += 8;
	if (this.size > MAX_SIZE) {
		this.size += 8;
	}
	if (this.type === "uuid") {
		this.size += 16;
	}
	Log.debug("BoxWriter", "Writing box "+this.type+" of size: "+this.size+" at position "+stream.getPosition()+(msg || ""));
	if (this.size > MAX_SIZE) {
		stream.writeUint32(1);
	} else {
		this.sizePosition = stream.getPosition();
		stream.writeUint32(this.size);
	}
	stream.writeString(this.type, null, 4);
	if (this.type === "uuid") {
		stream.writeUint8Array(this.uuid);
	}
	if (this.size > MAX_SIZE) {
		stream.writeUint64(this.size);
	} 
}

BoxParser.FullBox.prototype.writeHeader = function(stream) {
	this.size += 4;
	BoxParser.Box.prototype.writeHeader.call(this, stream, " v="+this.version+" f="+this.flags);
	stream.writeUint8(this.version);
	stream.writeUint24(this.flags);
}

BoxParser.Box.prototype.write = function(stream) {
	if (this.type === "mdat") {
		/* TODO: fix this */
		if (this.data) {
			this.size = this.data.length;
			this.writeHeader(stream);
			stream.writeUint8Array(this.data);
		}
	} else {
		this.size = (this.data ? this.data.length : 0);
		this.writeHeader(stream);
		if (this.data) {
			stream.writeUint8Array(this.data);
		}
	}
}

BoxParser.ContainerBox.prototype.write = function(stream) {
	this.size = 0;
	this.writeHeader(stream);
	for (var i=0; i<this.boxes.length; i++) {
		if (this.boxes[i]) {
			this.boxes[i].write(stream);
			this.size += this.boxes[i].size;
		}
	}
	/* adjusting the size, now that all sub-boxes are known */
	Log.debug("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);
}

BoxParser.TrackReferenceTypeBox.prototype.write = function(stream) {
	this.size = this.track_ids.length*4;
	this.writeHeader(stream);
	stream.writeUint32Array(this.track_ids);
}

// file:src/writing/avcC.js
BoxParser.avcCBox.prototype.write = function(stream) {
	var i;
	this.size = 7;
	for (i = 0; i < this.SPS.length; i++) {
		this.size += 2+this.SPS[i].length;
	}
	for (i = 0; i < this.PPS.length; i++) {
		this.size += 2+this.PPS[i].length;
	}
	if (this.ext) {
		this.size += this.ext.length;
	}
	this.writeHeader(stream);
	stream.writeUint8(this.configurationVersion);
	stream.writeUint8(this.AVCProfileIndication);
	stream.writeUint8(this.profile_compatibility);
	stream.writeUint8(this.AVCLevelIndication);
	stream.writeUint8(this.lengthSizeMinusOne + (63<<2));
	stream.writeUint8(this.SPS.length + (7<<5));
	for (i = 0; i < this.SPS.length; i++) {
		stream.writeUint16(this.SPS[i].length);
		stream.writeUint8Array(this.SPS[i].nalu);
	}
	stream.writeUint8(this.PPS.length);
	for (i = 0; i < this.PPS.length; i++) {
		stream.writeUint16(this.PPS[i].length);
		stream.writeUint8Array(this.PPS[i].nalu);
	}
	if (this.ext) {
		stream.writeUint8Array(this.ext);
	}
}

// file:src/writing/co64.js
BoxParser.co64Box.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4+8*this.chunk_offsets.length;
	this.writeHeader(stream);
	stream.writeUint32(this.chunk_offsets.length);
	for(i=0; i<this.chunk_offsets.length; i++) {
		stream.writeUint64(this.chunk_offsets[i]);
	}
}

// file:src/writing/cslg.js
BoxParser.cslgBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4*5;
	this.writeHeader(stream);
	stream.writeInt32(this.compositionToDTSShift);
	stream.writeInt32(this.leastDecodeToDisplayDelta);
	stream.writeInt32(this.greatestDecodeToDisplayDelta);
	stream.writeInt32(this.compositionStartTime);
	stream.writeInt32(this.compositionEndTime);
}

// file:src/writing/ctts.js
BoxParser.cttsBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4+8*this.sample_counts.length;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_counts.length);
	for(i=0; i<this.sample_counts.length; i++) {
		stream.writeUint32(this.sample_counts[i]);
		if (this.version === 1) {
			stream.writeInt32(this.sample_offsets[i]); /* signed */
		} else {			
			stream.writeUint32(this.sample_offsets[i]); /* unsigned */
		}
	}
}

// file:src/writing/dref.js
BoxParser.drefBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4; //
	this.writeHeader(stream);
	stream.writeUint32(this.entries.length);
	for (var i = 0; i < this.entries.length; i++) {
		this.entries[i].write(stream);
		this.size += this.entries[i].size;
	}	
	/* adjusting the size, now that all sub-boxes are known */
	Log.debug("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);
}

// file:src/writing/elng.js
BoxParser.elngBox.prototype.write = function(stream) {
	this.version = 0;	
	this.flags = 0;
	this.size = this.extended_language.length;
	this.writeHeader(stream);
	stream.writeString(this.extended_language);
}

// file:src/writing/elst.js
BoxParser.elstBox.prototype.write = function(stream) {
	this.version = 0;	
	this.flags = 0;
	this.size = 4+12*this.entries.length;
	this.writeHeader(stream);
	stream.writeUint32(this.entries.length);
	for (var i = 0; i < this.entries.length; i++) {
		var entry = this.entries[i];
		stream.writeUint32(entry.segment_duration);
		stream.writeInt32(entry.media_time);
		stream.writeInt16(entry.media_rate_integer);
		stream.writeInt16(entry.media_rate_fraction);
	}
}

// file:src/writing/emsg.js
BoxParser.emsgBox.prototype.write = function(stream) {
	this.version = 0;	
	this.flags = 0;
	this.size = 4*4+this.message_data.length+(this.scheme_id_uri.length+1)+(this.value.length+1);
	this.writeHeader(stream);
	stream.writeCString(this.scheme_id_uri);
	stream.writeCString(this.value);
	stream.writeUint32(this.timescale);
	stream.writeUint32(this.presentation_time_delta);
	stream.writeUint32(this.event_duration);
	stream.writeUint32(this.id);
	stream.writeUint8Array(this.message_data);
}

// file:src/writing/ftyp.js
BoxParser.ftypBox.prototype.write = function(stream) {
	this.size = 8+4*this.compatible_brands.length;
	this.writeHeader(stream);
	stream.writeString(this.major_brand, null, 4);
	stream.writeUint32(this.minor_version);
	for (var i = 0; i < this.compatible_brands.length; i++) {
		stream.writeString(this.compatible_brands[i], null, 4);
	}
}

// file:src/writing/hdlr.js
BoxParser.hdlrBox.prototype.write = function(stream) {
	this.size = 5*4+this.name.length+1;
	this.version = 0;
	this.flags = 0;
	this.writeHeader(stream);
	stream.writeUint32(0);
	stream.writeString(this.handler, null, 4);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeCString(this.name);
}

// file:src/writing/kind.js
BoxParser.kindBox.prototype.write = function(stream) {
	this.version = 0;	
	this.flags = 0;
	this.size = (this.schemeURI.length+1)+(this.value.length+1);
	this.writeHeader(stream);
	stream.writeCString(this.schemeURI);
	stream.writeCString(this.value);
}

// file:src/writing/mdhd.js
BoxParser.mdhdBox.prototype.write = function(stream) {
	this.size = 4*4+2*2;
	this.flags = 0;
	this.version = 0;
	this.writeHeader(stream);
	stream.writeUint32(this.creation_time);
	stream.writeUint32(this.modification_time);
	stream.writeUint32(this.timescale);
	stream.writeUint32(this.duration);
	stream.writeUint16(this.language);
	stream.writeUint16(0);
}

// file:src/writing/mehd.js
BoxParser.mehdBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4;
	this.writeHeader(stream);
	stream.writeUint32(this.fragment_duration);
}

// file:src/writing/mfhd.js
BoxParser.mfhdBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4;
	this.writeHeader(stream);
	stream.writeUint32(this.sequence_number);
}

// file:src/writing/mvhd.js
BoxParser.mvhdBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 23*4+2*2;
	this.writeHeader(stream);
	stream.writeUint32(this.creation_time);
	stream.writeUint32(this.modification_time);
	stream.writeUint32(this.timescale);
	stream.writeUint32(this.duration);
	stream.writeUint32(this.rate);
	stream.writeUint16(this.volume<<8);
	stream.writeUint16(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32Array(this.matrix);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(this.next_track_id);
}

// file:src/writing/sampleentry.js
BoxParser.SampleEntry.prototype.writeHeader = function(stream) {
	this.size = 8;
	BoxParser.Box.prototype.writeHeader.call(this, stream);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint16(this.data_reference_index);
}

BoxParser.SampleEntry.prototype.writeFooter = function(stream) {
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(stream);
		this.size += this.boxes[i].size;
	}
	Log.debug("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);	
}

BoxParser.SampleEntry.prototype.write = function(stream) {
	this.writeHeader(stream);
	stream.writeUint8Array(this.data);
	this.size += this.data.length;
	Log.debug("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);	
}

BoxParser.VisualSampleEntry.prototype.write = function(stream) {
	this.writeHeader(stream);
	this.size += 2*7+6*4+32;
	stream.writeUint16(0); 
	stream.writeUint16(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint16(this.width);
	stream.writeUint16(this.height);
	stream.writeUint32(this.horizresolution);
	stream.writeUint32(this.vertresolution);
	stream.writeUint32(0);
	stream.writeUint16(this.frame_count);
	stream.writeUint8(Math.min(31, this.compressorname.length));
	stream.writeString(this.compressorname, null, 31);
	stream.writeUint16(this.depth);
	stream.writeInt16(-1);
	this.writeFooter(stream);
}

BoxParser.AudioSampleEntry.prototype.write = function(stream) {
	this.writeHeader(stream);
	this.size += 2*4+3*4;
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint16(this.channel_count);
	stream.writeUint16(this.samplesize);
	stream.writeUint16(0);
	stream.writeUint16(0);
	stream.writeUint32(this.samplerate<<16);
	this.writeFooter(stream);
}

BoxParser.stppSampleEntry.prototype.write = function(stream) {
	this.writeHeader(stream);
	this.size += this.namespace.length+1+
				 this.schema_location.length+1+
				 this.auxiliary_mime_types.length+1;
	stream.writeCString(this.namespace);
	stream.writeCString(this.schema_location);
	stream.writeCString(this.auxiliary_mime_types);
	this.writeFooter(stream);
}

// file:src/writing/samplegroups/samplegroup.js
BoxParser.SampleGroupEntry.prototype.write = function(stream) {
	stream.writeUint8Array(this.data);
}

// file:src/writing/sbgp.js
BoxParser.sbgpBox.prototype.write = function(stream) {
	this.version = 1;	
	this.flags = 0;
	this.size = 12+8*this.entries.length;
	this.writeHeader(stream);
	stream.writeString(this.grouping_type, null, 4);
	stream.writeUint32(this.grouping_type_parameter);
	stream.writeUint32(this.entries.length);
	for (var i = 0; i < this.entries.length; i++) {
		var entry = this.entries[i];
		stream.writeInt32(entry.sample_count);
		stream.writeInt32(entry.group_description_index);
	}
}

// file:src/writing/sgpd.js
BoxParser.sgpdBox.prototype.write = function(stream) {
	var i;
	var entry;
	// leave version as read
	// this.version;
	this.flags = 0;
	this.size = 12;
	for (i = 0; i < this.entries.length; i++) {
		entry = this.entries[i];
		if (this.version === 1) {
			if (this.default_length === 0) {
				this.size += 4;
			}
			this.size += entry.data.length;
		}
	}
	this.writeHeader(stream);
	stream.writeString(this.grouping_type, null, 4);
	if (this.version === 1) {
		stream.writeUint32(this.default_length);
	}
	if (this.version >= 2) {
		stream.writeUint32(this.default_sample_description_index);
	}
	stream.writeUint32(this.entries.length);
	for (i = 0; i < this.entries.length; i++) {
		entry = this.entries[i];
		if (this.version === 1) {
			if (this.default_length === 0) {
				stream.writeUint32(entry.description_length);
			}
		}
		entry.write(stream);
	}
}


// file:src/writing/sidx.js
BoxParser.sidxBox.prototype.write = function(stream) {
	this.version = 0;	
	this.flags = 0;
	this.size = 4*4+2+2+12*this.references.length;
	this.writeHeader(stream);
	stream.writeUint32(this.reference_ID);
	stream.writeUint32(this.timescale);
	stream.writeUint32(this.earliest_presentation_time);
	stream.writeUint32(this.first_offset);
	stream.writeUint16(0);
	stream.writeUint16(this.references.length);
	for (var i = 0; i < this.references.length; i++) {
		var ref = this.references[i];
		stream.writeUint32(ref.reference_type << 31 | ref.referenced_size);
		stream.writeUint32(ref.subsegment_duration);
		stream.writeUint32(ref.starts_with_SAP << 31 | ref.SAP_type << 28 | ref.SAP_delta_time);
	}
}

// file:src/writing/stco.js
BoxParser.stcoBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4+4*this.chunk_offsets.length;
	this.writeHeader(stream);
	stream.writeUint32(this.chunk_offsets.length);
	stream.writeUint32Array(this.chunk_offsets);
}

// file:src/writing/stsc.js
BoxParser.stscBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4+12*this.first_chunk.length;
	this.writeHeader(stream);
	stream.writeUint32(this.first_chunk.length);
	for(i=0; i<this.first_chunk.length; i++) {
		stream.writeUint32(this.first_chunk[i]);
		stream.writeUint32(this.samples_per_chunk[i]);
		stream.writeUint32(this.sample_description_index[i]);
	}
}

// file:src/writing/stsd.js
BoxParser.stsdBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 0;
	this.writeHeader(stream);
	stream.writeUint32(this.entries.length);
	this.size += 4;
	for (i = 0; i < this.entries.length; i++) {
		this.entries[i].write(stream);
		this.size += this.entries[i].size;
	}
	/* adjusting the size, now that all sub-boxes are known */
	Log.debug("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);
}

// file:src/writing/stsh.js
BoxParser.stshBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4+8*this.shadowed_sample_numbers.length;
	this.writeHeader(stream);
	stream.writeUint32(this.shadowed_sample_numbers.length);
	for(i=0; i<this.shadowed_sample_numbers.length; i++) {
		stream.writeUint32(this.shadowed_sample_numbers[i]);
		stream.writeUint32(this.sync_sample_numbers[i]);
	}
}

// file:src/writing/stss.js
BoxParser.stssBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4+4*this.sample_numbers.length;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_numbers.length);
	stream.writeUint32Array(this.sample_numbers);
}

// file:src/writing/stsz.js
BoxParser.stszBox.prototype.write = function(stream) {
	var i;
	var constant = true;
	this.version = 0;
	this.flags = 0;
	if (this.sample_sizes.length > 0) {
		i = 0;
		while (i+1 < this.sample_sizes.length) {
			if (this.sample_sizes[i+1] !==  this.sample_sizes[0]) {
				constant = false;
				break;
			} else {
				i++;
			}
		}
	} else {
		constant = false;
	}
	this.size = 8;
	if (!constant) {
		this.size += 4*this.sample_sizes.length;
	}
	this.writeHeader(stream);
	if (!constant) {
		stream.writeUint32(0);
	} else {
		stream.writeUint32(this.sample_sizes[0]);
	}
	stream.writeUint32(this.sample_sizes.length);
	if (!constant) {
		stream.writeUint32Array(this.sample_sizes);
	}	
}

// file:src/writing/stts.js
BoxParser.sttsBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4+8*this.sample_counts.length;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_counts.length);
	for(i=0; i<this.sample_counts.length; i++) {
		stream.writeUint32(this.sample_counts[i]);
		stream.writeUint32(this.sample_deltas[i]);
	}
}

// file:src/writing/tfdt.js
var UINT32_MAX = Math.pow(2, 32) - 1;

BoxParser.tfdtBox.prototype.write = function(stream) {
	// use version 1 if baseMediaDecodeTime does not fit 32 bits
	this.version = this.baseMediaDecodeTime > UINT32_MAX ? 1 : 0;
	this.flags = 0;
	this.size = 4;
	if (this.version === 1) {
		this.size += 4;
	}
	this.writeHeader(stream);
	if (this.version === 1) {
		stream.writeUint64(this.baseMediaDecodeTime);
	} else {
		stream.writeUint32(this.baseMediaDecodeTime); 
	}
}

// file:src/writing/tfhd.js
BoxParser.tfhdBox.prototype.write = function(stream) {
	this.version = 0;
	this.size = 4;
	if (this.flags & BoxParser.TFHD_FLAG_BASE_DATA_OFFSET) {
		this.size += 8;
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC) {
		this.size += 4;
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR) {
		this.size += 4;
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE) {
		this.size += 4;
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS) {
		this.size += 4;
	}
	this.writeHeader(stream);
	stream.writeUint32(this.track_id);
	if (this.flags & BoxParser.TFHD_FLAG_BASE_DATA_OFFSET) {
		stream.writeUint64(this.base_data_offset);
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC) {
		stream.writeUint32(this.default_sample_description_index);
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR) {
		stream.writeUint32(this.default_sample_duration);
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE) {
		stream.writeUint32(this.default_sample_size);
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS) {
		stream.writeUint32(this.default_sample_flags);
	}
}

// file:src/writing/tkhd.js
BoxParser.tkhdBox.prototype.write = function(stream) {
	this.version = 0;
	//this.flags = 0;
	this.size = 4*18+2*4;
	this.writeHeader(stream);
	stream.writeUint32(this.creation_time);
	stream.writeUint32(this.modification_time);
	stream.writeUint32(this.track_id);
	stream.writeUint32(0);
	stream.writeUint32(this.duration);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeInt16(this.layer);
	stream.writeInt16(this.alternate_group);
	stream.writeInt16(this.volume<<8);
	stream.writeUint16(0);
	stream.writeInt32Array(this.matrix);
	stream.writeUint32(this.width);
	stream.writeUint32(this.height);
}

// file:src/writing/trex.js
BoxParser.trexBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4*5;
	this.writeHeader(stream);
	stream.writeUint32(this.track_id);
	stream.writeUint32(this.default_sample_description_index);
	stream.writeUint32(this.default_sample_duration);
	stream.writeUint32(this.default_sample_size);
	stream.writeUint32(this.default_sample_flags);
}

// file:src/writing/trun.js
BoxParser.trunBox.prototype.write = function(stream) {
	this.version = 0;
	this.size = 4;
	if (this.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) {
		this.size += 4;
	}
	if (this.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG) {
		this.size += 4;
	}
	if (this.flags & BoxParser.TRUN_FLAGS_DURATION) {
		this.size += 4*this.sample_duration.length;
	}
	if (this.flags & BoxParser.TRUN_FLAGS_SIZE) {
		this.size += 4*this.sample_size.length;
	}
	if (this.flags & BoxParser.TRUN_FLAGS_FLAGS) {
		this.size += 4*this.sample_flags.length;
	}
	if (this.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
		this.size += 4*this.sample_composition_time_offset.length;
	}
	this.writeHeader(stream);
	stream.writeUint32(this.sample_count);
	if (this.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) {
		this.data_offset_position = stream.getPosition();
		stream.writeInt32(this.data_offset); //signed
	}
	if (this.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG) {
		stream.writeUint32(this.first_sample_flags);
	}
	for (var i = 0; i < this.sample_count; i++) {
		if (this.flags & BoxParser.TRUN_FLAGS_DURATION) {
			stream.writeUint32(this.sample_duration[i]);
		}
		if (this.flags & BoxParser.TRUN_FLAGS_SIZE) {
			stream.writeUint32(this.sample_size[i]);
		}
		if (this.flags & BoxParser.TRUN_FLAGS_FLAGS) {
			stream.writeUint32(this.sample_flags[i]);
		}
		if (this.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
			if (this.version === 0) {
				stream.writeUint32(this.sample_composition_time_offset[i]);
			} else {
				stream.writeInt32(this.sample_composition_time_offset[i]); //signed
			}
		}
	}		
}

// file:src/writing/url.js
BoxParser["url Box"].prototype.write = function(stream) {
	this.version = 0;	
	if (this.location) {
		this.flags = 0;
		this.size = this.location.length+1;
	} else {
		this.flags = 0x000001;
		this.size = 0;
	}
	this.writeHeader(stream);
	if (this.location) {
		stream.writeCString(this.location);
	}
}

// file:src/writing/urn.js
BoxParser["urn Box"].prototype.write = function(stream) {
	this.version = 0;	
	this.flags = 0;
	this.size = this.name.length+1+(this.location ? this.location.length+1 : 0);
	this.writeHeader(stream);
	stream.writeCString(this.name);
	if (this.location) {
		stream.writeCString(this.location);
	}
}

// file:src/writing/vmhd.js
BoxParser.vmhdBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 1;
	this.size = 8;
	this.writeHeader(stream);
	stream.writeUint16(this.graphicsmode);
	stream.writeUint16Array(this.opcolor);
}

// file:src/box-unpack.js
/* 
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
BoxParser.cttsBox.prototype.unpack = function(samples) {
	var i, j, k;
	k = 0;
	for (i = 0; i < this.sample_counts.length; i++) {
		for (j = 0; j < this.sample_counts[i]; j++) {
			samples[k].pts = samples[k].dts + this.sample_offsets[i];
			k++;
		}
	}
}

BoxParser.sttsBox.prototype.unpack = function(samples) {
	var i, j, k;
	k = 0;
	for (i = 0; i < this.sample_counts.length; i++) {
		for (j = 0; j < this.sample_counts[i]; j++) {
			if (k === 0) {
				samples[k].dts = 0;
			} else {
				samples[k].dts = samples[k-1].dts + this.sample_deltas[i];
			}
			k++;
		}
	}
}

BoxParser.stcoBox.prototype.unpack = function(samples) {
	var i;
	for (i = 0; i < this.chunk_offsets.length; i++) {
		samples[i].offset = this.chunk_offsets[i];
	}
}

BoxParser.stscBox.prototype.unpack = function(samples) {
	var i, j, k, l, m;
	l = 0;
	m = 0;
	for (i = 0; i < this.first_chunk.length; i++) {
		for (j = 0; j < (i+1 < this.first_chunk.length ? this.first_chunk[i+1] : Infinity); j++) {
			m++;
			for (k = 0; k < this.samples_per_chunk[i]; k++) {
				if (samples[l]) {
					samples[l].description_index = this.sample_description_index[i];
					samples[l].chunk_index = m;
				} else {
					return;
				}
				l++;
			}			
		}
	}
}

BoxParser.stszBox.prototype.unpack = function(samples) {
	var i;
	for (i = 0; i < this.sample_sizes.length; i++) {
		samples[i].size = this.sample_sizes[i];
	}
}
// file:src/box-diff.js

BoxParser.DIFF_BOXES_PROP_NAMES = [ "boxes", "entries", "references", "subsamples",
					 	 "items", "item_infos", "extents", "associations",
					 	 "subsegments", "ranges", "seekLists", "seekPoints",
					 	 "esd", "levels"];

BoxParser.DIFF_PRIMITIVE_ARRAY_PROP_NAMES = [ "compatible_brands", "matrix", "opcolor", "sample_counts", "sample_counts", "sample_deltas",
"first_chunk", "samples_per_chunk", "sample_sizes", "chunk_offsets", "sample_offsets", "sample_description_index", "sample_duration" ];

BoxParser.boxEqualFields = function(box_a, box_b) {
	if (box_a && !box_b) return false;
	var prop;
	for (prop in box_a) {
		if (BoxParser.DIFF_BOXES_PROP_NAMES.indexOf(prop) > -1) {
			continue;
		// } else if (excluded_fields && excluded_fields.indexOf(prop) > -1) {
		// 	continue;
		} else if (box_a[prop] instanceof BoxParser.Box || box_b[prop] instanceof BoxParser.Box) {
			continue;
		} else if (typeof box_a[prop] === "undefined" || typeof box_b[prop] === "undefined") {
			continue;
		} else if (typeof box_a[prop] === "function" || typeof box_b[prop] === "function") {
			continue;
		} else if (
			(box_a.subBoxNames && box_a.subBoxNames.indexOf(prop.slice(0,4)) > -1) ||
			(box_b.subBoxNames && box_b.subBoxNames.indexOf(prop.slice(0,4)) > -1))  {
			continue;
		} else {
			if (prop === "data" || prop === "start" || prop === "size" || prop === "creation_time" || prop === "modification_time") {
				continue;
			} else if (BoxParser.DIFF_PRIMITIVE_ARRAY_PROP_NAMES.indexOf(prop) > -1) {
				continue;
			} else {
				if (box_a[prop] !== box_b[prop]) {
					return false;
				}
			}
		}
	}
	return true;
}

BoxParser.boxEqual = function(box_a, box_b) {
	if (!BoxParser.boxEqualFields(box_a, box_b)) {
		return false;
	}
	for (var j = 0; j < BoxParser.DIFF_BOXES_PROP_NAMES.length; j++) {
		var name = BoxParser.DIFF_BOXES_PROP_NAMES[j];
		if (box_a[name] && box_b[name]) {
			if (!BoxParser.boxEqual(box_a[name], box_b[name])) {
				return false;
			}
		}
	}
	return true;
}// file:src/text-mp4.js
/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var VTTin4Parser = function() {	
}

VTTin4Parser.prototype.parseSample = function(data) {
	var cues, cue;
	var stream = new MP4BoxStream(data.buffer);
	cues = [];
	while (!stream.isEos()) {
		cue = BoxParser.parseOneBox(stream, false);
		if (cue.code === BoxParser.OK && cue.box.type === "vttc") {
			cues.push(cue.box);
		}		
	}
	return cues;
}

VTTin4Parser.prototype.getText = function (startTime, endTime, data) {
	function pad(n, width, z) {
	  z = z || '0';
	  n = n + '';
	  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	}
	function secToTimestamp(insec) {
		var h = Math.floor(insec/3600);
		var m = Math.floor((insec - h*3600)/60);
		var s = Math.floor(insec - h*3600 - m*60);
		var ms = Math.floor((insec - h*3600 - m*60 - s)*1000);
		return ""+pad(h, 2)+":"+pad(m,2)+":"+pad(s, 2)+"."+pad(ms, 3);
	}
	var cues = this.parseSample(data);
	var string = "";
	for (var i = 0; i < cues.length; i++) {
		var cueIn4 = cues[i];
		string += secToTimestamp(startTime)+" --> "+secToTimestamp(endTime)+"\r\n";
		string += cueIn4.payl.text;
	}
	return string;
}

var XMLSubtitlein4Parser = function() {	
}

XMLSubtitlein4Parser.prototype.parseSample = function(sample) {
	var res = {};	
	var i;
	res.resources = [];
	var stream = new MP4BoxStream(sample.data.buffer);
	if (!sample.subsamples || sample.subsamples.length === 0) {
		res.documentString = stream.readString(sample.data.length);
	} else {
		res.documentString = stream.readString(sample.subsamples[0].size);
		if (sample.subsamples.length > 1) {
			for (i = 1; i < sample.subsamples.length; i++) {
				res.resources[i] = stream.readUint8Array(sample.subsamples[i].size);
			}
		}
	}
	if (typeof (DOMParser) !== "undefined") {
		res.document = (new DOMParser()).parseFromString(res.documentString, "application/xml");
	}
	return res;
}

var Textin4Parser = function() {	
}

Textin4Parser.prototype.parseSample = function(sample) {
	var textString;
	var stream = new MP4BoxStream(sample.data.buffer);
	textString = stream.readString(sample.data.length);
	return textString;
}

Textin4Parser.prototype.parseConfig = function(data) {
	var textString;
	var stream = new MP4BoxStream(data.buffer);
	stream.readUint32(); // version & flags
	textString = stream.readCString();
	return textString;
}

if (typeof exports !== 'undefined') {
	exports.XMLSubtitlein4Parser = XMLSubtitlein4Parser;
	exports.Textin4Parser = Textin4Parser;
}
// file:src/isofile.js
/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var ISOFile = function (stream) {
	/* MutiBufferStream object used to parse boxes */
	this.stream = stream || new MultiBufferStream();
	/* Array of all boxes (in order) found in the file */
	this.boxes = [];
	/* Array of all mdats */
	this.mdats = [];
	/* Array of all moofs */
	this.moofs = [];
	/* Boolean indicating if the file is compatible with progressive parsing (moov first) */
	this.isProgressive = false;
	/* Boolean used to fire moov start event only once */
	this.moovStartFound = false;
	/* Callback called when the moov parsing starts */
	this.onMoovStart = null;
	/* Boolean keeping track of the call to onMoovStart, to avoid double calls */
	this.moovStartSent = false;
	/* Callback called when the moov is entirely parsed */
	this.onReady = null;
	/* Boolean keeping track of the call to onReady, to avoid double calls */
	this.readySent = false;
	/* Callback to call when segments are ready */
	this.onSegment = null;
	/* Callback to call when samples are ready */
	this.onSamples = null;
	/* Callback to call when there is an error in the parsing or processing of samples */
	this.onError = null;
	/* Boolean indicating if the moov box run-length encoded tables of sample information have been processed */
	this.sampleListBuilt = false;
	/* Array of Track objects for which fragmentation of samples is requested */
	this.fragmentedTracks = [];
	/* Array of Track objects for which extraction of samples is requested */
	this.extractedTracks = [];
	/* Boolean indicating that fragmention is ready */
	this.isFragmentationInitialized = false;
	/* Boolean indicating that fragmented has started */
	this.sampleProcessingStarted = false;
	/* Number of the next 'moof' to generate when fragmenting */
	this.nextMoofNumber = 0;
	/* Boolean indicating if the initial list of items has been produced */
	this.itemListBuilt = false;
	/* Callback called when the sidx box is entirely parsed */
	this.onSidx = null;
	/* Boolean keeping track of the call to onSidx, to avoid double calls */
	this.sidxSent = false;
}

ISOFile.prototype.setSegmentOptions = function(id, user, options) {
	var trak = this.getTrackById(id);
	if (trak) {
		var fragTrack = {};
		this.fragmentedTracks.push(fragTrack);
		fragTrack.id = id;
		fragTrack.user = user;
		fragTrack.trak = trak;
		trak.nextSample = 0;
		fragTrack.segmentStream = null;
		fragTrack.nb_samples = 1000;
		fragTrack.rapAlignement = true;
		if (options) {
			if (options.nbSamples) fragTrack.nb_samples = options.nbSamples;
			if (options.rapAlignement) fragTrack.rapAlignement = options.rapAlignement;
		}
	}
}

ISOFile.prototype.unsetSegmentOptions = function(id) {
	var index = -1;
	for (var i = 0; i < this.fragmentedTracks.length; i++) {
		var fragTrack = this.fragmentedTracks[i];
		if (fragTrack.id == id) {
			index = i;
		}
	}
	if (index > -1) {
		this.fragmentedTracks.splice(index, 1);
	}
}

ISOFile.prototype.setExtractionOptions = function(id, user, options) {
	var trak = this.getTrackById(id);
	if (trak) {
		var extractTrack = {};
		this.extractedTracks.push(extractTrack);
		extractTrack.id = id;
		extractTrack.user = user;
		extractTrack.trak = trak;
		trak.nextSample = 0;
		extractTrack.nb_samples = 1000;
		extractTrack.samples = [];
		if (options) {
			if (options.nbSamples) extractTrack.nb_samples = options.nbSamples;
		}
	}
}

ISOFile.prototype.unsetExtractionOptions = function(id) {
	var index = -1;
	for (var i = 0; i < this.extractedTracks.length; i++) {
		var extractTrack = this.extractedTracks[i];
		if (extractTrack.id == id) {
			index = i;
		}
	}
	if (index > -1) {
		this.extractedTracks.splice(index, 1);
	}
}

ISOFile.prototype.parse = function() {
	var found;
	var ret;
	var box;
	var parseBoxHeadersOnly = false;

	if (this.restoreParsePosition)	{
		if (!this.restoreParsePosition()) {
			return;
		}
	}

	while (true) {

		if (this.hasIncompleteMdat && this.hasIncompleteMdat()) {
			if (this.processIncompleteMdat()) {
				continue;
			} else {
				return;
			}
		} else {
			if (this.saveParsePosition)	{
				this.saveParsePosition();
			}
			ret = BoxParser.parseOneBox(this.stream, parseBoxHeadersOnly);
			if (ret.code === BoxParser.ERR_NOT_ENOUGH_DATA) {
				if (this.processIncompleteBox) {
					if (this.processIncompleteBox(ret)) {
						continue;
					} else {
						return;
					}
				} else {
					return;
				}
			} else {
				var box_type;
				/* the box is entirely parsed */
				box = ret.box;
				box_type = (box.type !== "uuid" ? box.type : box.uuid);
				/* store the box in the 'boxes' array to preserve box order (for file rewrite if needed)  */
				this.boxes.push(box);
				/* but also store box in a property for more direct access */
				switch (box_type) {
					case "mdat":
						this.mdats.push(box);
						break;
					case "moof":
						this.moofs.push(box);
						break;
					case "moov":
						this.moovStartFound = true;
						if (this.mdats.length === 0) {
							this.isProgressive = true;
						}
						/* no break */
						/* falls through */
					default:
						if (this[box_type] !== undefined) {
							Log.warn("ISOFile", "Duplicate Box of type: "+box_type+", overriding previous occurrence");
						}
						this[box_type] = box;
						break;
				}
				if (this.updateUsedBytes) {
					this.updateUsedBytes(box, ret);
				}
			}
		}
	}
}

ISOFile.prototype.checkBuffer = function (ab) {
	if (ab === null || ab === undefined) {
		throw("Buffer must be defined and non empty");
	}
	if (ab.fileStart === undefined) {
		throw("Buffer must have a fileStart property");
	}
	if (ab.byteLength === 0) {
		Log.warn("ISOFile", "Ignoring empty buffer (fileStart: "+ab.fileStart+")");
		this.stream.logBufferLevel();
		return false;
	}
	Log.info("ISOFile", "Processing buffer (fileStart: "+ab.fileStart+")");

	/* mark the bytes in the buffer as not being used yet */
	ab.usedBytes = 0;
	this.stream.insertBuffer(ab);
	this.stream.logBufferLevel();

	if (!this.stream.initialized()) {
		Log.warn("ISOFile", "Not ready to start parsing");
		return false;
	}
	return true;
}

/* Processes a new ArrayBuffer (with a fileStart property)
   Returns the next expected file position, or undefined if not ready to parse */
ISOFile.prototype.appendBuffer = function(ab, last) {
	var nextFileStart;
	if (!this.checkBuffer(ab)) {
		return;
	}

	/* Parse whatever is in the existing buffers */
	this.parse();

	/* Check if the moovStart callback needs to be called */
	if (this.moovStartFound && !this.moovStartSent) {
		this.moovStartSent = true;
		if (this.onMoovStart) this.onMoovStart();
	}

	if (this.moov) {
		/* A moov box has been entirely parsed */

		/* if this is the first call after the moov is found we initialize the list of samples (may be empty in fragmented files) */
		if (!this.sampleListBuilt) {
			this.buildSampleLists();
			this.sampleListBuilt = true;
		}

		/* We update the sample information if there are any new moof boxes */
		this.updateSampleLists();

		/* If the application needs to be informed that the 'moov' has been found,
		   we create the information object and callback the application */
		if (this.onReady && !this.readySent) {
			this.readySent = true;
			this.onReady(this.getInfo());
		}

		/* See if any sample extraction or segment creation needs to be done with the available samples */
		this.processSamples(last);

		/* Inform about the best range to fetch next */
		if (this.nextSeekPosition) {
			nextFileStart = this.nextSeekPosition;
			this.nextSeekPosition = undefined;
		} else {
			nextFileStart = this.nextParsePosition;
		}
		if (this.stream.getEndFilePositionAfter) {
			nextFileStart = this.stream.getEndFilePositionAfter(nextFileStart);
		}
	} else {
		if (this.nextParsePosition) {
			/* moov has not been parsed but the first buffer was received,
			   the next fetch should probably be the next box start */
			nextFileStart = this.nextParsePosition;
		} else {
			/* No valid buffer has been parsed yet, we cannot know what to parse next */
			nextFileStart = 0;
		}
	}
	if (this.sidx) {
		if (this.onSidx && !this.sidxSent) {
			this.onSidx(this.sidx);
			this.sidxSent = true;
		}
	}
	if (this.meta) {
		if (this.flattenItemInfo && !this.itemListBuilt) {
			this.flattenItemInfo();
			this.itemListBuilt = true;
		}
		if (this.processItems) {
			this.processItems(this.onItem);
		}
	}

	if (this.stream.cleanBuffers) {
		Log.info("ISOFile", "Done processing buffer (fileStart: "+ab.fileStart+") - next buffer to fetch should have a fileStart position of "+nextFileStart);
		this.stream.logBufferLevel();
		this.stream.cleanBuffers();
		this.stream.logBufferLevel(true);
		Log.info("ISOFile", "Sample data size in memory: "+this.getAllocatedSampleDataSize());
	}
	return nextFileStart;
}

ISOFile.prototype.getInfo = function() {
	var i, j;
	var movie = {};
	var trak;
	var track;
	var sample_desc;
	var _1904 = (new Date('1904-01-01T00:00:00Z').getTime());

	if (this.moov) {
		movie.hasMoov = true;
		movie.duration = this.moov.mvhd.duration;
		movie.timescale = this.moov.mvhd.timescale;
		movie.isFragmented = (this.moov.mvex != null);
		if (movie.isFragmented && this.moov.mvex.mehd) {
			movie.fragment_duration = this.moov.mvex.mehd.fragment_duration;
		}
		movie.isProgressive = this.isProgressive;
		movie.hasIOD = (this.moov.iods != null);
		movie.brands = [];
		movie.brands.push(this.ftyp.major_brand);
		movie.brands = movie.brands.concat(this.ftyp.compatible_brands);
		movie.created = new Date(_1904+this.moov.mvhd.creation_time*1000);
		movie.modified = new Date(_1904+this.moov.mvhd.modification_time*1000);
		movie.tracks = [];
		movie.audioTracks = [];
		movie.videoTracks = [];
		movie.subtitleTracks = [];
		movie.metadataTracks = [];
		movie.hintTracks = [];
		movie.otherTracks = [];
		for (i = 0; i < this.moov.traks.length; i++) {
			trak = this.moov.traks[i];
			sample_desc = trak.mdia.minf.stbl.stsd.entries[0];
			track = {};
			movie.tracks.push(track);
			track.id = trak.tkhd.track_id;
			track.name = trak.mdia.hdlr.name;
			track.references = [];
			if (trak.tref) {
				for (j = 0; j < trak.tref.boxes.length; j++) {
					ref = {};
					track.references.push(ref);
					ref.type = trak.tref.boxes[j].type;
					ref.track_ids = trak.tref.boxes[j].track_ids;
				}
			}
			if (trak.edts) {
				track.edits = trak.edts.elst.entries;
			}
			track.created = new Date(_1904+trak.tkhd.creation_time*1000);
			track.modified = new Date(_1904+trak.tkhd.modification_time*1000);
			track.movie_duration = trak.tkhd.duration;
			track.movie_timescale = movie.timescale;
			track.layer = trak.tkhd.layer;
			track.alternate_group = trak.tkhd.alternate_group;
			track.volume = trak.tkhd.volume;
			track.matrix = trak.tkhd.matrix;
			track.track_width = trak.tkhd.width/(1<<16);
			track.track_height = trak.tkhd.height/(1<<16);
			track.timescale = trak.mdia.mdhd.timescale;
			track.cts_shift = trak.mdia.minf.stbl.cslg;
			track.duration = trak.mdia.mdhd.duration;
			track.samples_duration = trak.samples_duration;
			track.codec = sample_desc.getCodec();
			track.kind = (trak.udta && trak.udta.kinds.length ? trak.udta.kinds[0] : { schemeURI: "", value: ""});
			track.language = (trak.mdia.elng ? trak.mdia.elng.extended_language : trak.mdia.mdhd.languageString);
			track.nb_samples = trak.samples.length;
			track.size = trak.samples_size;
			track.bitrate = (track.size*8*track.timescale)/track.samples_duration;
			if (sample_desc.isAudio()) {
				track.type = "audio";
				movie.audioTracks.push(track);
				track.audio = {};
				track.audio.sample_rate = sample_desc.getSampleRate();
				track.audio.channel_count = sample_desc.getChannelCount();
				track.audio.sample_size = sample_desc.getSampleSize();
			} else if (sample_desc.isVideo()) {
				track.type = "video";
				movie.videoTracks.push(track);
				track.video = {};
				track.video.width = sample_desc.getWidth();
				track.video.height = sample_desc.getHeight();
			} else if (sample_desc.isSubtitle()) {
				track.type = "subtitles";
				movie.subtitleTracks.push(track);
			} else if (sample_desc.isHint()) {
				track.type = "metadata";
				movie.hintTracks.push(track);
			} else if (sample_desc.isMetadata()) {
				track.type = "metadata";
				movie.metadataTracks.push(track);
			} else {
				track.type = "metadata";
				movie.otherTracks.push(track);
			}
		}
	} else {
		movie.hasMoov = false;
	}
	movie.mime = "";
	if (movie.hasMoov && movie.tracks) {
		if (movie.videoTracks && movie.videoTracks.length > 0) {
			movie.mime += 'video/mp4; codecs=\"';
		} else if (movie.audioTracks && movie.audioTracks.length > 0) {
			movie.mime += 'audio/mp4; codecs=\"';
		} else {
			movie.mime += 'application/mp4; codecs=\"';
		}
		for (i = 0; i < movie.tracks.length; i++) {
			if (i !== 0) movie.mime += ',';
			movie.mime+= movie.tracks[i].codec;
		}
		movie.mime += '\"; profiles=\"';
		movie.mime += this.ftyp.compatible_brands.join();
		movie.mime += '\"';
	}
	return movie;
}

ISOFile.prototype.processSamples = function(last) {
	var i;
	var trak;
	if (!this.sampleProcessingStarted) return;

	/* For each track marked for fragmentation,
	   check if the next sample is there (i.e. if the sample information is known (i.e. moof has arrived) and if it has been downloaded)
	   and create a fragment with it */
	if (this.isFragmentationInitialized && this.onSegment !== null) {
		for (i = 0; i < this.fragmentedTracks.length; i++) {
			var fragTrak = this.fragmentedTracks[i];
			trak = fragTrak.trak;
			while (trak.nextSample < trak.samples.length && this.sampleProcessingStarted) {
				/* The sample information is there (either because the file is not fragmented and this is not the last sample,
				or because the file is fragmented and the moof for that sample has been received */
				Log.debug("ISOFile", "Creating media fragment on track #"+fragTrak.id +" for sample "+trak.nextSample);
				var result = this.createFragment(fragTrak.id, trak.nextSample, fragTrak.segmentStream);
				if (result) {
					fragTrak.segmentStream = result;
					trak.nextSample++;
				} else {
					/* The fragment could not be created because the media data is not there (not downloaded), wait for it */
					break;
				}
				/* A fragment is created by sample, but the segment is the accumulation in the buffer of these fragments.
				   It is flushed only as requested by the application (nb_samples) to avoid too many callbacks */
				if (trak.nextSample % fragTrak.nb_samples === 0 || (last && trak.nextSample >= trak.samples.length)) {
					Log.info("ISOFile", "Sending fragmented data on track #"+fragTrak.id+" for samples ["+Math.max(0,trak.nextSample-fragTrak.nb_samples)+","+(trak.nextSample-1)+"]");
					Log.info("ISOFile", "Sample data size in memory: "+this.getAllocatedSampleDataSize());
					if (this.onSegment) {
						this.onSegment(fragTrak.id, fragTrak.user, fragTrak.segmentStream.buffer, trak.nextSample, (last && trak.nextSample >= trak.samples.length));
					}
					/* force the creation of a new buffer */
					fragTrak.segmentStream = null;
					if (fragTrak !== this.fragmentedTracks[i]) {
						/* make sure we can stop fragmentation if needed */
						break;
					}
				}
			}
		}
	}

	if (this.onSamples !== null) {
		/* For each track marked for data export,
		   check if the next sample is there (i.e. has been downloaded) and send it */
		for (i = 0; i < this.extractedTracks.length; i++) {
			var extractTrak = this.extractedTracks[i];
			trak = extractTrak.trak;
			while (trak.nextSample < trak.samples.length && this.sampleProcessingStarted) {
				Log.debug("ISOFile", "Exporting on track #"+extractTrak.id +" sample #"+trak.nextSample);
				var sample = this.getSample(trak, trak.nextSample);
				if (sample) {
					trak.nextSample++;
					extractTrak.samples.push(sample);
				} else {
					break;
				}
				if (trak.nextSample % extractTrak.nb_samples === 0 || trak.nextSample >= trak.samples.length) {
					Log.debug("ISOFile", "Sending samples on track #"+extractTrak.id+" for sample "+trak.nextSample);
					if (this.onSamples) {
						this.onSamples(extractTrak.id, extractTrak.user, extractTrak.samples);
					}
					extractTrak.samples = [];
					if (extractTrak !== this.extractedTracks[i]) {
						/* check if the extraction needs to be stopped */
						break;
					}
				}
			}
		}
	}
}

/* Find and return specific boxes using recursion and early return */
ISOFile.prototype.getBox = function(type) {
  var result = this.getBoxes(type, true);
  return (result.length ? result[0] : null);
}

ISOFile.prototype.getBoxes = function(type, returnEarly) {
  var result = [];
  ISOFile._sweep.call(this, type, result, returnEarly);
  return result;
}

ISOFile._sweep = function(type, result, returnEarly) {
  if (this.type && this.type == type) result.push(this);
  for (var box in this.boxes) {
    if (result.length && returnEarly) return;
    ISOFile._sweep.call(this.boxes[box], type, result, returnEarly);
  }
}

ISOFile.prototype.getTrackSamplesInfo = function(track_id) {
	var track = this.getTrackById(track_id);
	if (track) {
		return track.samples;
	} else {
		return;
	}
}

ISOFile.prototype.getTrackSample = function(track_id, number) {
	var track = this.getTrackById(track_id);
	var sample = this.getSample(track, number);
	return sample;
}

/* Called by the application to release the resources associated to samples already forwarded to the application */
ISOFile.prototype.releaseUsedSamples = function (id, sampleNum) {
	var size = 0;
	var trak = this.getTrackById(id);
	if (!trak.lastValidSample) trak.lastValidSample = 0;
	for (var i = trak.lastValidSample; i < sampleNum; i++) {
		size+=this.releaseSample(trak, i);
	}
	Log.info("ISOFile", "Track #"+id+" released samples up to "+sampleNum+" (released size: "+size+", remaining: "+this.samplesDataSize+")");
	trak.lastValidSample = sampleNum;
}

ISOFile.prototype.start = function() {
	this.sampleProcessingStarted = true;
	this.processSamples(false);
}

ISOFile.prototype.stop = function() {
	this.sampleProcessingStarted = false;
}

/* Called by the application to flush the remaining samples (e.g. once the download is finished or when no more samples will be added) */
ISOFile.prototype.flush = function() {
	Log.info("ISOFile", "Flushing remaining samples");
	this.updateSampleLists();
	this.processSamples(true);
	this.stream.cleanBuffers();
	this.stream.logBufferLevel(true);
}

/* Finds the byte offset for a given time on a given track
   also returns the time of the previous rap */
ISOFile.prototype.seekTrack = function(time, useRap, trak) {
	var j;
	var sample;
	var seek_offset = Infinity;
	var rap_seek_sample_num = 0;
	var seek_sample_num = 0;
	var timescale;

	if (trak.samples.length === 0) {
		Log.info("ISOFile", "No sample in track, cannot seek! Using time "+Log.getDurationString(0, 1) +" and offset: "+0);
		return { offset: 0, time: 0 };
	}

	for (j = 0; j < trak.samples.length; j++) {
		sample = trak.samples[j];
		if (j === 0) {
			seek_sample_num = 0;
			timescale = sample.timescale;
		} else if (sample.cts > time * sample.timescale) {
			seek_sample_num = j-1;
			break;
		}
		if (useRap && sample.is_sync) {
			rap_seek_sample_num = j;
		}
	}
	if (useRap) {
		seek_sample_num = rap_seek_sample_num;
	}
	time = trak.samples[seek_sample_num].cts;
	trak.nextSample = seek_sample_num;
	while (trak.samples[seek_sample_num].alreadyRead === trak.samples[seek_sample_num].size) {
		// No remaining samples to look for, all are downloaded.
		if (!trak.samples[seek_sample_num + 1]) {
			break;
		}
		seek_sample_num++;
	}
	seek_offset = trak.samples[seek_sample_num].offset+trak.samples[seek_sample_num].alreadyRead;
	Log.info("ISOFile", "Seeking to "+(useRap ? "RAP": "")+" sample #"+trak.nextSample+" on track "+trak.tkhd.track_id+", time "+Log.getDurationString(time, timescale) +" and offset: "+seek_offset);
	return { offset: seek_offset, time: time/timescale };
}

/* Finds the byte offset in the file corresponding to the given time or to the time of the previous RAP */
ISOFile.prototype.seek = function(time, useRap) {
	var moov = this.moov;
	var trak;
	var trak_seek_info;
	var i;
	var seek_info = { offset: Infinity, time: Infinity };
	if (!this.moov) {
		throw "Cannot seek: moov not received!";
	} else {
		for (i = 0; i<moov.traks.length; i++) {
			trak = moov.traks[i];
			trak_seek_info = this.seekTrack(time, useRap, trak);
			if (trak_seek_info.offset < seek_info.offset) {
				seek_info.offset = trak_seek_info.offset;
			}
			if (trak_seek_info.time < seek_info.time) {
				seek_info.time = trak_seek_info.time;
			}
		}
		Log.info("ISOFile", "Seeking at time "+Log.getDurationString(seek_info.time, 1)+" needs a buffer with a fileStart position of "+seek_info.offset);
		if (seek_info.offset === Infinity) {
			/* No sample info, in all tracks, cannot seek */
			seek_info = { offset: this.nextParsePosition, time: 0 };
		} else {
			/* check if the seek position is already in some buffer and
			 in that case return the end of that buffer (or of the last contiguous buffer) */
			/* TODO: Should wait until append operations are done */
			seek_info.offset = this.stream.getEndFilePositionAfter(seek_info.offset);
		}
		Log.info("ISOFile", "Adjusted seek position (after checking data already in buffer): "+seek_info.offset);
		return seek_info;
	}
}

ISOFile.prototype.equal = function(b) {
	var box_index = 0;
	while (box_index < this.boxes.length && box_index < b.boxes.length) {
		var a_box = this.boxes[box_index];
		var b_box = b.boxes[box_index];
		if (!BoxParser.boxEqual(a_box, b_box)) {
			return false;
		}
		box_index++;
	}
	return true;
}

if (typeof exports !== 'undefined') {
	exports.ISOFile = ISOFile;
}
// file:src/isofile-advanced-parsing.js
/* position in the current buffer of the beginning of the last box parsed */
ISOFile.prototype.lastBoxStartPosition = 0;
/* indicator if the parsing is stuck in the middle of an mdat box */
ISOFile.prototype.parsingMdat = null;
/* next file position that the parser needs:
    - 0 until the first buffer (i.e. fileStart ===0) has been received 
    - otherwise, the next box start until the moov box has been parsed
    - otherwise, the position of the next sample to fetch
 */
ISOFile.prototype.nextParsePosition = 0;
/* keep mdat data */
ISOFile.prototype.discardMdatData = false;

ISOFile.prototype.processIncompleteBox = function(ret) {
	var box;
	var merged;
	var found;
	
	/* we did not have enough bytes in the current buffer to parse the entire box */
	if (ret.type === "mdat") { 
		/* we had enough bytes to get its type and size and it's an 'mdat' */
		
		/* special handling for mdat boxes, since we don't actually need to parse it linearly 
		   we create the box */
		box = new BoxParser[ret.type+"Box"](ret.size);	
		this.parsingMdat = box;
		this.boxes.push(box);
		this.mdats.push(box);			
		box.start = ret.start;
		box.hdr_size = ret.hdr_size;
		this.stream.addUsedBytes(box.hdr_size);

		/* indicate that the parsing should start from the end of the box */
		this.lastBoxStartPosition = box.start + box.size;
 		/* let's see if we have the end of the box in the other buffers */
		found = this.stream.seek(box.start + box.size, false, this.discardMdatData);
		if (found) {
			/* found the end of the box */
			this.parsingMdat = null;
			/* let's see if we can parse more in this buffer */
			return true;
		} else {
			/* 'mdat' end not found in the existing buffers */
			/* determine the next position in the file to start parsing from */
			if (!this.moovStartFound) {
				/* moov not find yet, 
				   the file probably has 'mdat' at the beginning, and 'moov' at the end, 
				   indicate that the downloader should not try to download those bytes now */
				this.nextParsePosition = box.start + box.size;
			} else {
				/* we have the start of the moov box, 
				   the next bytes should try to complete the current 'mdat' */
				this.nextParsePosition = this.stream.findEndContiguousBuf();
			}
			/* not much we can do, wait for more buffers to arrive */
			return false;
		}
	} else {
		/* box is incomplete, we may not even know its type */
		if (ret.type === "moov") { 
			/* the incomplete box is a 'moov' box */
			this.moovStartFound = true;
			if (this.mdats.length === 0) {
				this.isProgressive = true;
			}
		}
		/* either it's not an mdat box (and we need to parse it, we cannot skip it)
		   (TODO: we could skip 'free' boxes ...)
			   or we did not have enough data to parse the type and size of the box, 
		   we try to concatenate the current buffer with the next buffer to restart parsing */
		merged = (this.stream.mergeNextBuffer ? this.stream.mergeNextBuffer() : false);
		if (merged) {
			/* The next buffer was contiguous, the merging succeeded,
			   we can now continue parsing, 
			   the next best position to parse is at the end of this new buffer */
			this.nextParsePosition = this.stream.getEndPosition();
			return true;
		} else {
			/* we cannot concatenate existing buffers because they are not contiguous or because there is no additional buffer */
			/* The next best position to parse is still at the end of this old buffer */
			if (!ret.type) {
				/* There were not enough bytes in the buffer to parse the box type and length,
				   the next fetch should retrieve those missing bytes, i.e. the next bytes after this buffer */
				this.nextParsePosition = this.stream.getEndPosition();
			} else {
				/* we had enough bytes to parse size and type of the incomplete box
				   if we haven't found yet the moov box, skip this one and try the next one 
				   if we have found the moov box, let's continue linear parsing */
				if (this.moovStartFound) {
					this.nextParsePosition = this.stream.getEndPosition();
				} else {
					this.nextParsePosition = this.stream.getPosition() + ret.size;
				}
			}
			return false;
		}
	}
}

ISOFile.prototype.hasIncompleteMdat = function () {
	return (this.parsingMdat !== null);
}

ISOFile.prototype.processIncompleteMdat = function () {
	var box;
	var found;
	
	/* we are in the parsing of an incomplete mdat box */
	box = this.parsingMdat;

	found = this.stream.seek(box.start + box.size, false, this.discardMdatData);
	if (found) {
		Log.debug("ISOFile", "Found 'mdat' end in buffered data");
		/* the end of the mdat has been found */ 
		this.parsingMdat = null;
		/* we can parse more in this buffer */
		return true;
	} else {
		/* we don't have the end of this mdat yet, 
		   indicate that the next byte to fetch is the end of the buffers we have so far, 
		   return and wait for more buffer to come */
		this.nextParsePosition = this.stream.findEndContiguousBuf();
		return false;
	}
}

ISOFile.prototype.restoreParsePosition = function() {
	/* Reposition at the start position of the previous box not entirely parsed */
	return this.stream.seek(this.lastBoxStartPosition, true, this.discardMdatData);
}

ISOFile.prototype.saveParsePosition = function() {
	/* remember the position of the box start in case we need to roll back (if the box is incomplete) */
	this.lastBoxStartPosition = this.stream.getPosition();	
}

ISOFile.prototype.updateUsedBytes = function(box, ret) {
	if (this.stream.addUsedBytes) {
		if (box.type === "mdat") {
			/* for an mdat box, only its header is considered used, other bytes will be used when sample data is requested */
			this.stream.addUsedBytes(box.hdr_size);
			if (this.discardMdatData) {
				this.stream.addUsedBytes(box.size-box.hdr_size);
			}
		} else {
			/* for all other boxes, the entire box data is considered used */
			this.stream.addUsedBytes(box.size);
		}	
	}
}
// file:src/isofile-advanced-creation.js
ISOFile.prototype.add = BoxParser.Box.prototype.add;
ISOFile.prototype.addBox = BoxParser.Box.prototype.addBox;

ISOFile.prototype.init = function (_options) {
	var options = _options || {}; 
	var ftyp = this.add("ftyp").set("major_brand", (options.brands && options.brands[0]) || "iso4")
							   .set("minor_version", 0)
							   .set("compatible_brands", options.brands || ["iso4"]);
	var moov = this.add("moov");
	moov.add("mvhd").set("timescale", options.timescale || 600)
					.set("rate", options.rate || 1)
					.set("creation_time", 0)
					.set("modification_time", 0)
					.set("duration", options.duration || 0)
					.set("volume", 1)
					.set("matrix", [ 0, 0, 0, 0, 0, 0, 0, 0, 0])
					.set("next_track_id", 1);
	moov.add("mvex");
	return this;
}

ISOFile.prototype.addTrack = function (_options) {
	if (!this.moov) {
		this.init(_options);
	}

	var options = _options || {}; 
	options.width = options.width || 320;
	options.height = options.height || 320;
	options.id = options.id || this.moov.mvhd.next_track_id;
	options.type = options.type || "avc1";

	var trak = this.moov.add("trak");
	this.moov.mvhd.next_track_id = options.id+1;
	trak.add("tkhd").set("flags",BoxParser.TKHD_FLAG_ENABLED | 
								 BoxParser.TKHD_FLAG_IN_MOVIE | 
								 BoxParser.TKHD_FLAG_IN_PREVIEW)
					.set("creation_time",0)
					.set("modification_time", 0)
					.set("track_id", options.id)
					.set("duration", options.duration || 0)
					.set("layer", options.layer || 0)
					.set("alternate_group", 0)
					.set("volume", 1)
					.set("matrix", [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ])
					.set("width", options.width)
					.set("height", options.height);

	var mdia = trak.add("mdia");
	mdia.add("mdhd").set("creation_time", 0)
					.set("modification_time", 0)
					.set("timescale", options.timescale || 1)
					.set("duration", options.media_duration || 0)
					.set("language", options.language || 0);

	mdia.add("hdlr").set("handler", options.hdlr || "vide")
					.set("name", options.name || "Track created with MP4Box.js");

	mdia.add("elng").set("extended_language", options.language || "fr-FR");

	var minf = mdia.add("minf");
	if (BoxParser[options.type+"SampleEntry"] === undefined) return;
	var sample_description_entry = new BoxParser[options.type+"SampleEntry"]();
	sample_description_entry.data_reference_index = 1;
	var media_type = "";
	for (var mediaType in BoxParser.sampleEntryCodes) {
		var codes = BoxParser.sampleEntryCodes[mediaType];
		for (var i = 0; i < codes.length; i++) {
			if (codes.indexOf(options.type) > -1) {
				media_type = mediaType;
				break;
			}
		}
	}
	switch(media_type) {
		case "Visual":
			minf.add("vmhd").set("graphicsmode",0).set("opcolor", [ 0, 0, 0 ]);
			sample_description_entry.set("width", options.width)
						.set("height", options.height)
						.set("horizresolution", 0x48<<16)
						.set("vertresolution", 0x48<<16)
						.set("frame_count", 1)
						.set("compressorname", options.type+" Compressor")
						.set("depth", 0x18);
		// sample_description_entry.add("avcC").set("SPS", [])
		// 						.set("PPS", [])
		// 						.set("configurationVersion", 1)
		// 						.set("AVCProfileIndication",0)
		// 						.set("profile_compatibility", 0)
		// 						.set("AVCLevelIndication" ,0)
		// 						.set("lengthSizeMinusOne", 0);
			break;
		case "Audio":
			minf.add("smhd").set("balance", options.balance || 0);
			sample_description_entry.set("channel_count", options.channel_count || 2)
						.set("samplesize", options.samplesize || 16)
						.set("samplerate", options.samplerate || 1<<16);
			break;
		case "Hint":
			minf.add("hmhd"); // TODO: add properties
			break;
		case "Subtitle":
			minf.add("sthd");
			switch (options.type) {
				case "stpp":
					sample_description_entry.set("namespace", options.namespace || "nonamespace")
								.set("schema_location", options.schema_location || "")
								.set("auxiliary_mime_types", options.auxiliary_mime_types || "");
					break;
			}
			break;
		case "Metadata":
			minf.add("nmhd");
			break;
		case "System":
			minf.add("nmhd");
			break;
		default:
			minf.add("nmhd");
			break;
	}
	if (options.description) {
		sample_description_entry.addBox(options.description);
	}
	if (options.description_boxes) {
		options.description_boxes.forEach(function (b) {
			sample_description_entry.addBox(b);
		});
	}
	minf.add("dinf").add("dref").addEntry((new BoxParser["url Box"]()).set("flags", 0x1));
	var stbl = minf.add("stbl");
	stbl.add("stsd").addEntry(sample_description_entry);
	stbl.add("stts").set("sample_counts", [])
					.set("sample_deltas", []);
	stbl.add("stsc").set("first_chunk", [])
					.set("samples_per_chunk", [])
					.set("sample_description_index", []);
	stbl.add("stco").set("chunk_offsets", []);
	stbl.add("stsz").set("sample_sizes", []);

	this.moov.mvex.add("trex").set("track_id", options.id)
							  .set("default_sample_description_index", options.default_sample_description_index || 1)
							  .set("default_sample_duration", options.default_sample_duration || 0)
							  .set("default_sample_size", options.default_sample_size || 0)
							  .set("default_sample_flags", options.default_sample_flags || 0);
	this.buildTrakSampleLists(trak);
	return options.id;
}

BoxParser.Box.prototype.computeSize = function(stream_) {
	var stream = stream_ || new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	this.write(stream);
}

ISOFile.prototype.addSample = function (track_id, data, _options) {
	var options = _options || {};
	var sample = {};
	var trak = this.getTrackById(track_id);
	if (trak === null) return;
    sample.number = trak.samples.length;
	sample.track_id = trak.tkhd.track_id;
	sample.timescale = trak.mdia.mdhd.timescale;
	sample.description_index = (options.sample_description_index ? options.sample_description_index - 1: 0);
	sample.description = trak.mdia.minf.stbl.stsd.entries[sample.description_index];
	sample.data = data;
	sample.size = data.length;
	sample.alreadyRead = sample.size;
	sample.duration = options.duration || 1;
	sample.cts = options.cts || 0;
	sample.dts = options.dts || 0;
	sample.is_sync = options.is_sync || false;
	sample.is_leading = options.is_leading || 0;
	sample.depends_on = options.depends_on || 0;
	sample.is_depended_on = options.is_depended_on || 0;
	sample.has_redundancy = options.has_redundancy || 0;
	sample.degradation_priority = options.degradation_priority || 0;
	sample.offset = 0;
	sample.subsamples = options.subsamples;
	trak.samples.push(sample);
	trak.samples_size += sample.size;
	trak.samples_duration += sample.duration;

	this.processSamples();
	
	var moof = ISOFile.createSingleSampleMoof(sample);
	this.addBox(moof);
	moof.computeSize();
	/* adjusting the data_offset now that the moof size is known*/
	moof.trafs[0].truns[0].data_offset = moof.size+8; //8 is mdat header
	this.add("mdat").data = data;
	return sample;
}

ISOFile.createSingleSampleMoof = function(sample) {
	var moof = new BoxParser.moofBox();
	moof.add("mfhd").set("sequence_number", this.nextMoofNumber);
	this.nextMoofNumber++;
	var traf = moof.add("traf");
	traf.add("tfhd").set("track_id", sample.track_id)
					.set("flags", BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF);
	traf.add("tfdt").set("baseMediaDecodeTime", sample.dts);
	traf.add("trun").set("flags", BoxParser.TRUN_FLAGS_DATA_OFFSET | BoxParser.TRUN_FLAGS_DURATION | 
				 				  BoxParser.TRUN_FLAGS_SIZE | BoxParser.TRUN_FLAGS_FLAGS | 
				 				  BoxParser.TRUN_FLAGS_CTS_OFFSET)
					.set("data_offset",0)
					.set("first_sample_flags",0)
					.set("sample_count",1)
					.set("sample_duration",[sample.duration])
					.set("sample_size",[sample.size])
					.set("sample_flags",[0])
					.set("sample_composition_time_offset", [sample.cts - sample.dts]);
	return moof;
}

// file:src/isofile-sample-processing.js
/* Index of the last moof box received */
ISOFile.prototype.lastMoofIndex = 0;

/* size of the buffers allocated for samples */
ISOFile.prototype.samplesDataSize = 0;

/* Resets all sample tables */
ISOFile.prototype.resetTables = function () {
	var i;
	var trak, stco, stsc, stsz, stts, ctts, stss;
	this.initial_duration = this.moov.mvhd.duration;
	this.moov.mvhd.duration = 0;
	for (i = 0; i < this.moov.traks.length; i++) {
		trak = this.moov.traks[i];
		trak.tkhd.duration = 0;
		trak.mdia.mdhd.duration = 0;
		stco = trak.mdia.minf.stbl.stco || trak.mdia.minf.stbl.co64;
		stco.chunk_offsets = [];
		stsc = trak.mdia.minf.stbl.stsc;
		stsc.first_chunk = [];
		stsc.samples_per_chunk = [];
		stsc.sample_description_index = [];
		stsz = trak.mdia.minf.stbl.stsz || trak.mdia.minf.stbl.stz2;
		stsz.sample_sizes = [];
		stts = trak.mdia.minf.stbl.stts;
		stts.sample_counts = [];
		stts.sample_deltas = [];
		ctts = trak.mdia.minf.stbl.ctts;
		if (ctts) {
			ctts.sample_counts = [];
			ctts.sample_offsets = [];
		}
		stss = trak.mdia.minf.stbl.stss;
		var k = trak.mdia.minf.stbl.boxes.indexOf(stss);
		if (k != -1) trak.mdia.minf.stbl.boxes[k] = null;
	}
}

ISOFile.initSampleGroups = function(trak, traf, sbgps, trak_sgpds, traf_sgpds) {
	var l;
	var k;
	var sample_groups_info;
	var sample_group_info;
	var sample_group_key;
	function SampleGroupInfo(_type, _parameter, _sbgp) {
		this.grouping_type = _type;
		this.grouping_type_parameter = _parameter;
		this.sbgp = _sbgp;
		this.last_sample_in_run = -1;
		this.entry_index = -1;		
	}
	if (traf) {
		traf.sample_groups_info = [];
	} 
	if (!trak.sample_groups_info) {
		trak.sample_groups_info = [];
	}
	for (k = 0; k < sbgps.length; k++) {
		sample_group_key = sbgps[k].grouping_type +"/"+ sbgps[k].grouping_type_parameter;
		sample_group_info = new SampleGroupInfo(sbgps[k].grouping_type, sbgps[k].grouping_type_parameter, sbgps[k]);
		if (traf) {
			traf.sample_groups_info[sample_group_key] = sample_group_info;
		}
		if (!trak.sample_groups_info[sample_group_key]) {
			trak.sample_groups_info[sample_group_key] = sample_group_info;
		}
		for (l=0; l <trak_sgpds.length; l++) {
			if (trak_sgpds[l].grouping_type === sbgps[k].grouping_type) {
				sample_group_info.description = trak_sgpds[l];
				sample_group_info.description.used = true;
			}
		}
		if (traf_sgpds) {
			for (l=0; l <traf_sgpds.length; l++) {
				if (traf_sgpds[l].grouping_type === sbgps[k].grouping_type) {
					sample_group_info.fragment_description = traf_sgpds[l];
					sample_group_info.fragment_description.used = true;
					sample_group_info.is_fragment = true;
				}
			}			
		}
	}
	if (!traf) {
		for (k = 0; k < trak_sgpds.length; k++) {
			if (!trak_sgpds[k].used && trak_sgpds[k].version >= 2) {
				sample_group_key = trak_sgpds[k].grouping_type +"/0";
				sample_group_info = new SampleGroupInfo(trak_sgpds[k].grouping_type, 0);
				if (!trak.sample_groups_info[sample_group_key]) {
					trak.sample_groups_info[sample_group_key] = sample_group_info;
				}
			}
		}
	} else {
		if (traf_sgpds) {
			for (k = 0; k < traf_sgpds.length; k++) {
				if (!traf_sgpds[k].used && traf_sgpds[k].version >= 2) {
					sample_group_key = traf_sgpds[k].grouping_type +"/0";
					sample_group_info = new SampleGroupInfo(traf_sgpds[k].grouping_type, 0);
					sample_group_info.is_fragment = true;
					if (!traf.sample_groups_info[sample_group_key]) {
						traf.sample_groups_info[sample_group_key] = sample_group_info;
					}
				}
			}
		}
	}
}

ISOFile.setSampleGroupProperties = function(trak, sample, sample_number, sample_groups_info) {
	var k;
	var index;
	sample.sample_groups = [];
	for (k in sample_groups_info) {
		sample.sample_groups[k] = {};
		sample.sample_groups[k].grouping_type = sample_groups_info[k].grouping_type;
		sample.sample_groups[k].grouping_type_parameter = sample_groups_info[k].grouping_type_parameter;
		if (sample_number >= sample_groups_info[k].last_sample_in_run) {
			if (sample_groups_info[k].last_sample_in_run < 0) {
				sample_groups_info[k].last_sample_in_run = 0;
			}
			sample_groups_info[k].entry_index++;	
			if (sample_groups_info[k].entry_index <= sample_groups_info[k].sbgp.entries.length - 1) {
				sample_groups_info[k].last_sample_in_run += sample_groups_info[k].sbgp.entries[sample_groups_info[k].entry_index].sample_count;
			}
		}
		if (sample_groups_info[k].entry_index <= sample_groups_info[k].sbgp.entries.length - 1) {
			sample.sample_groups[k].group_description_index = sample_groups_info[k].sbgp.entries[sample_groups_info[k].entry_index].group_description_index;
		} else {
			sample.sample_groups[k].group_description_index = -1; // special value for not defined
		}
		if (sample.sample_groups[k].group_description_index !== 0) {
			var description;
			if (sample_groups_info[k].fragment_description) {
				description = sample_groups_info[k].fragment_description;
			} else {
				description = sample_groups_info[k].description;
			}
			if (sample.sample_groups[k].group_description_index > 0) {
				if (sample.sample_groups[k].group_description_index > 65535) {
					index = (sample.sample_groups[k].group_description_index >> 16)-1;
				} else {
					index = sample.sample_groups[k].group_description_index-1;
				}
				if (description && index >= 0) {
					sample.sample_groups[k].description = description.entries[index];
				}
			} else {
				if (description && description.version >= 2) {
					if (description.default_group_description_index > 0) {								
						sample.sample_groups[k].description = description.entries[description.default_group_description_index-1];
					}
				}
			}
		}
	}
}

ISOFile.process_sdtp = function (sdtp, sample, number) {
	if (!sample) {
		return;
	}
	if (sdtp) {
		sample.is_leading = sdtp.is_leading[number];
		sample.depends_on = sdtp.sample_depends_on[number];
		sample.is_depended_on = sdtp.sample_is_depended_on[number];
		sample.has_redundancy = sdtp.sample_has_redundancy[number];
	} else {
		sample.is_leading = 0;
		sample.depends_on = 0;
		sample.is_depended_on = 0
		sample.has_redundancy = 0;
	}	
}

/* Build initial sample list from  sample tables */
ISOFile.prototype.buildSampleLists = function() {	
	var i;
	var trak;
	for (i = 0; i < this.moov.traks.length; i++) {
		trak = this.moov.traks[i];
		this.buildTrakSampleLists(trak);
	}
}

ISOFile.prototype.buildTrakSampleLists = function(trak) {	
	var j, k;
	var stco, stsc, stsz, stts, ctts, stss, stsd, subs, sbgps, sgpds, stdp;
	var chunk_run_index, chunk_index, last_chunk_in_run, offset_in_chunk, last_sample_in_chunk;
	var last_sample_in_stts_run, stts_run_index, last_sample_in_ctts_run, ctts_run_index, last_stss_index, last_subs_index, subs_entry_index, last_subs_sample_index;

	trak.samples = [];
	trak.samples_duration = 0;
	trak.samples_size = 0;
	stco = trak.mdia.minf.stbl.stco || trak.mdia.minf.stbl.co64;
	stsc = trak.mdia.minf.stbl.stsc;
	stsz = trak.mdia.minf.stbl.stsz || trak.mdia.minf.stbl.stz2;
	stts = trak.mdia.minf.stbl.stts;
	ctts = trak.mdia.minf.stbl.ctts;
	stss = trak.mdia.minf.stbl.stss;
	stsd = trak.mdia.minf.stbl.stsd;
	subs = trak.mdia.minf.stbl.subs;
	stdp = trak.mdia.minf.stbl.stdp;
	sbgps = trak.mdia.minf.stbl.sbgps;
	sgpds = trak.mdia.minf.stbl.sgpds;
	
	last_sample_in_stts_run = -1;
	stts_run_index = -1;
	last_sample_in_ctts_run = -1;
	ctts_run_index = -1;
	last_stss_index = 0;
	subs_entry_index = 0;
	last_subs_sample_index = 0;		

	ISOFile.initSampleGroups(trak, null, sbgps, sgpds);

	if (typeof stsz === "undefined") {
		return;
	}

	/* we build the samples one by one and compute their properties */
	for (j = 0; j < stsz.sample_sizes.length; j++) {
		var sample = {};
		sample.number = j;
		sample.track_id = trak.tkhd.track_id;
		sample.timescale = trak.mdia.mdhd.timescale;
		sample.alreadyRead = 0;
		trak.samples[j] = sample;
		/* size can be known directly */
		sample.size = stsz.sample_sizes[j];
		trak.samples_size += sample.size;
		/* computing chunk-based properties (offset, sample description index)*/
		if (j === 0) {				
			chunk_index = 1; /* the first sample is in the first chunk (chunk indexes are 1-based) */
			chunk_run_index = 0; /* the first chunk is the first entry in the first_chunk table */
			sample.chunk_index = chunk_index;
			sample.chunk_run_index = chunk_run_index;
			last_sample_in_chunk = stsc.samples_per_chunk[chunk_run_index];
			offset_in_chunk = 0;

			/* Is there another entry in the first_chunk table ? */
			if (chunk_run_index + 1 < stsc.first_chunk.length) {
				/* The last chunk in the run is the chunk before the next first chunk */
				last_chunk_in_run = stsc.first_chunk[chunk_run_index+1]-1; 	
			} else {
				/* There is only one entry in the table, it is valid for all future chunks*/
				last_chunk_in_run = Infinity;
			}
		} else {
			if (j < last_sample_in_chunk) {
				/* the sample is still in the current chunk */
				sample.chunk_index = chunk_index;
				sample.chunk_run_index = chunk_run_index;
			} else {
				/* the sample is in the next chunk */
				chunk_index++;
				sample.chunk_index = chunk_index;
				/* reset the accumulated offset in the chunk */
				offset_in_chunk = 0;
				if (chunk_index <= last_chunk_in_run) {
					/* stay in the same entry of the first_chunk table */
					/* chunk_run_index unmodified */
				} else {
					chunk_run_index++;
					/* Is there another entry in the first_chunk table ? */
					if (chunk_run_index + 1 < stsc.first_chunk.length) {
						/* The last chunk in the run is the chunk before the next first chunk */
						last_chunk_in_run = stsc.first_chunk[chunk_run_index+1]-1; 	
					} else {
						/* There is only one entry in the table, it is valid for all future chunks*/
						last_chunk_in_run = Infinity;
					}
					
				}
				sample.chunk_run_index = chunk_run_index;
				last_sample_in_chunk += stsc.samples_per_chunk[chunk_run_index];
			}
		}

		sample.description_index = stsc.sample_description_index[sample.chunk_run_index]-1;
		sample.description = stsd.entries[sample.description_index];
		sample.offset = stco.chunk_offsets[sample.chunk_index-1] + offset_in_chunk; /* chunk indexes are 1-based */
		offset_in_chunk += sample.size;

		/* setting dts, cts, duration and rap flags */
		if (j > last_sample_in_stts_run) {
			stts_run_index++;
			if (last_sample_in_stts_run < 0) {
				last_sample_in_stts_run = 0;
			}
			last_sample_in_stts_run += stts.sample_counts[stts_run_index];				
		}
		if (j > 0) {
			trak.samples[j-1].duration = stts.sample_deltas[stts_run_index];
			trak.samples_duration += trak.samples[j-1].duration;
			sample.dts = trak.samples[j-1].dts + trak.samples[j-1].duration;
		} else {
			sample.dts = 0;
		}
		if (ctts) {
			if (j >= last_sample_in_ctts_run) {
				ctts_run_index++;
				if (last_sample_in_ctts_run < 0) {
					last_sample_in_ctts_run = 0;
				}
				last_sample_in_ctts_run += ctts.sample_counts[ctts_run_index];				
			}
			sample.cts = trak.samples[j].dts + ctts.sample_offsets[ctts_run_index];
		} else {
			sample.cts = sample.dts;
		}
		if (stss) {
			if (j == stss.sample_numbers[last_stss_index] - 1) { // sample numbers are 1-based
				sample.is_sync = true;
				last_stss_index++;
			} else {
				sample.is_sync = false;				
				sample.degradation_priority = 0;
			}
			if (subs) {
				if (subs.entries[subs_entry_index].sample_delta + last_subs_sample_index == j+1) {
					sample.subsamples = subs.entries[subs_entry_index].subsamples;
					last_subs_sample_index += subs.entries[subs_entry_index].sample_delta;
					subs_entry_index++;
				}
			}
		} else {
			sample.is_sync = true;
		}
		ISOFile.process_sdtp(trak.mdia.minf.stbl.sdtp, sample, sample.number);
		if (stdp) {
			sample.degradation_priority = stdp.priority[j];
		} else {
			sample.degradation_priority = 0;
		}
		if (subs) {
			if (subs.entries[subs_entry_index].sample_delta + last_subs_sample_index == j) {
				sample.subsamples = subs.entries[subs_entry_index].subsamples;
				last_subs_sample_index += subs.entries[subs_entry_index].sample_delta;
			}
		}
		if (sbgps.length > 0 || sgpds.length > 0) {
			ISOFile.setSampleGroupProperties(trak, sample, j, trak.sample_groups_info);
		}
	}
	if (j>0) {
		trak.samples[j-1].duration = Math.max(trak.mdia.mdhd.duration - trak.samples[j-1].dts, 0);
		trak.samples_duration += trak.samples[j-1].duration;
	}
}

/* Update sample list when new 'moof' boxes are received */
ISOFile.prototype.updateSampleLists = function() {	
	var i, j, k;
	var default_sample_description_index, default_sample_duration, default_sample_size, default_sample_flags;
	var last_run_position;
	var box, moof, traf, trak, trex;
	var sample;
	var sample_flags;
	
	if (this.moov === undefined) {
		return;
	}
	/* if the input file is fragmented and fetched in multiple downloads, we need to update the list of samples */
	while (this.lastMoofIndex < this.moofs.length) {
		box = this.moofs[this.lastMoofIndex];
		this.lastMoofIndex++;
		if (box.type == "moof") {
			moof = box;
			for (i = 0; i < moof.trafs.length; i++) {
				traf = moof.trafs[i];
				trak = this.getTrackById(traf.tfhd.track_id);
				trex = this.getTrexById(traf.tfhd.track_id);
				if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC) {
					default_sample_description_index = traf.tfhd.default_sample_description_index;
				} else {
					default_sample_description_index = (trex ? trex.default_sample_description_index: 1);
				}
				if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR) {
					default_sample_duration = traf.tfhd.default_sample_duration;
				} else {
					default_sample_duration = (trex ? trex.default_sample_duration : 0);
				}
				if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE) {
					default_sample_size = traf.tfhd.default_sample_size;
				} else {
					default_sample_size = (trex ? trex.default_sample_size : 0);
				}
				if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS) {
					default_sample_flags = traf.tfhd.default_sample_flags;
				} else {
					default_sample_flags = (trex ? trex.default_sample_flags : 0);
				}
				traf.sample_number = 0;
				/* process sample groups */
				if (traf.sbgps.length > 0) {
					ISOFile.initSampleGroups(trak, traf, traf.sbgps, trak.mdia.minf.stbl.sgpds, traf.sgpds);
				}
				for (j = 0; j < traf.truns.length; j++) {
					var trun = traf.truns[j];
					for (k = 0; k < trun.sample_count; k++) {
						sample = {};
						sample.moof_number = this.lastMoofIndex;
						sample.number_in_traf = traf.sample_number;
						traf.sample_number++;
			            sample.number = trak.samples.length;
						traf.first_sample_index = trak.samples.length;
						trak.samples.push(sample);
						sample.track_id = trak.tkhd.track_id;
						sample.timescale = trak.mdia.mdhd.timescale;
						sample.description_index = default_sample_description_index-1;
						sample.description = trak.mdia.minf.stbl.stsd.entries[sample.description_index];
						sample.size = default_sample_size;
						if (trun.flags & BoxParser.TRUN_FLAGS_SIZE) {
							sample.size = trun.sample_size[k];
						}
						trak.samples_size += sample.size;
						sample.duration = default_sample_duration;
						if (trun.flags & BoxParser.TRUN_FLAGS_DURATION) {
							sample.duration = trun.sample_duration[k];
						}
						trak.samples_duration += sample.duration;
						if (trak.first_traf_merged || k > 0) {
							sample.dts = trak.samples[trak.samples.length-2].dts+trak.samples[trak.samples.length-2].duration;
						} else {
							if (traf.tfdt) {
								sample.dts = traf.tfdt.baseMediaDecodeTime;
							} else {
								sample.dts = 0;
							}
							trak.first_traf_merged = true;
						}
						sample.cts = sample.dts;
						if (trun.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
							sample.cts = sample.dts + trun.sample_composition_time_offset[k];
						}
						sample_flags = default_sample_flags;
						if (trun.flags & BoxParser.TRUN_FLAGS_FLAGS) {
							sample_flags = trun.sample_flags[k];
						} else if (k === 0 && (trun.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG)) {
							sample_flags = trun.first_sample_flags;
						}
						sample.is_sync = ((sample_flags >> 16 & 0x1) ? false : true);
						sample.is_leading = (sample_flags >> 26 & 0x3);
						sample.depends_on = (sample_flags >> 24 & 0x3);
						sample.is_depended_on = (sample_flags >> 22 & 0x3);
						sample.has_redundancy = (sample_flags >> 20 & 0x3);
						sample.degradation_priority = (sample_flags & 0xFFFF);
						//ISOFile.process_sdtp(traf.sdtp, sample, sample.number_in_traf);
						var bdop = (traf.tfhd.flags & BoxParser.TFHD_FLAG_BASE_DATA_OFFSET) ? true : false;
						var dbim = (traf.tfhd.flags & BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF) ? true : false;
						var dop = (trun.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) ? true : false;
						var bdo = 0;
						if (!bdop) {
							if (!dbim) {
								if (j === 0) { // the first track in the movie fragment
									bdo = moof.start; // the position of the first byte of the enclosing Movie Fragment Box
								} else {
									bdo = last_run_position; // end of the data defined by the preceding *track* (irrespective of the track id) fragment in the moof
								}
							} else {
								bdo = moof.start;
							}
						} else {
							bdo = traf.tfhd.base_data_offset;
						}
						if (j === 0 && k === 0) {
							if (dop) {
								sample.offset = bdo + trun.data_offset; // If the data-offset is present, it is relative to the base-data-offset established in the track fragment header
							} else {
								sample.offset = bdo; // the data for this run starts the base-data-offset defined by the track fragment header
							}
						} else {
							sample.offset = last_run_position; // this run starts immediately after the data of the previous run
						}
						last_run_position = sample.offset + sample.size;
						if (traf.sbgps.length > 0 || traf.sgpds.length > 0 ||
							trak.mdia.minf.stbl.sbgps.length > 0 || trak.mdia.minf.stbl.sgpds.length > 0) {
							ISOFile.setSampleGroupProperties(trak, sample, sample.number_in_traf, traf.sample_groups_info);
						}
					}
				}
				if (traf.subs) {
					trak.has_fragment_subsamples = true;
					var sample_index = traf.first_sample_index;
					for (j = 0; j < traf.subs.entries.length; j++) {
						sample_index += traf.subs.entries[j].sample_delta;
						sample = trak.samples[sample_index-1];
						sample.subsamples = traf.subs.entries[j].subsamples;
					}					
				}
			}
		}
	}	
}

/* Try to get sample data for a given sample:
   returns null if not found
   returns the same sample if already requested
 */
ISOFile.prototype.getSample = function(trak, sampleNum) {	
	var buffer;
	var sample = trak.samples[sampleNum];
	
	if (!this.moov) {
		return null;
	}

	if (!sample.data) {
		/* Not yet fetched */
		sample.data = new Uint8Array(sample.size);
		sample.alreadyRead = 0;
		this.samplesDataSize += sample.size;
		Log.debug("ISOFile", "Allocating sample #"+sampleNum+" on track #"+trak.tkhd.track_id+" of size "+sample.size+" (total: "+this.samplesDataSize+")");
	} else if (sample.alreadyRead == sample.size) {
		/* Already fetched entirely */
		return sample;
	}

	/* The sample has only been partially fetched, we need to check in all buffers */
	var index =	this.stream.findPosition(true, sample.offset + sample.alreadyRead, false);
	if (index > -1) {
		buffer = this.stream.buffers[index];
		var lengthAfterStart = buffer.byteLength - (sample.offset + sample.alreadyRead - buffer.fileStart);
		if (sample.size - sample.alreadyRead <= lengthAfterStart) {
			/* the (rest of the) sample is entirely contained in this buffer */

			Log.debug("ISOFile","Getting sample #"+sampleNum+" data (alreadyRead: "+sample.alreadyRead+" offset: "+
				(sample.offset+sample.alreadyRead - buffer.fileStart)+" read size: "+(sample.size - sample.alreadyRead)+" full size: "+sample.size+")");

			DataStream.memcpy(sample.data.buffer, sample.alreadyRead, 
			                  buffer, sample.offset+sample.alreadyRead - buffer.fileStart, sample.size - sample.alreadyRead);

			/* update the number of bytes used in this buffer and check if it needs to be removed */
			buffer.usedBytes += sample.size - sample.alreadyRead;
			this.stream.logBufferLevel();

			sample.alreadyRead = sample.size;

			return sample;
		} else {
			/* the sample does not end in this buffer */				
			
			Log.debug("ISOFile","Getting sample #"+sampleNum+" partial data (alreadyRead: "+sample.alreadyRead+" offset: "+
				(sample.offset+sample.alreadyRead - buffer.fileStart)+" read size: "+lengthAfterStart+" full size: "+sample.size+")");
			
			DataStream.memcpy(sample.data.buffer, sample.alreadyRead, 
			                  buffer, sample.offset+sample.alreadyRead - buffer.fileStart, lengthAfterStart);
			sample.alreadyRead += lengthAfterStart;

			/* update the number of bytes used in this buffer and check if it needs to be removed */
			buffer.usedBytes += lengthAfterStart;
			this.stream.logBufferLevel();
			return null;
		}
	} else {
		return null;
	}
}

/* Release the memory used to store the data of the sample */
ISOFile.prototype.releaseSample = function(trak, sampleNum) {	
	var sample = trak.samples[sampleNum];
	if (sample.data) {
		this.samplesDataSize -= sample.size;
		sample.data = null;
		sample.alreadyRead = 0;
		return sample.size;
	} else {
		return 0;
	}
}

ISOFile.prototype.getAllocatedSampleDataSize = function() {
	return this.samplesDataSize;
}

/* Builds the MIME Type 'codecs' sub-parameters for the whole file */
ISOFile.prototype.getCodecs = function() {	
	var i;
	var codecs = "";
	for (i = 0; i < this.moov.traks.length; i++) {
		var trak = this.moov.traks[i];
		if (i>0) {
			codecs+=","; 
		}
		codecs += trak.mdia.minf.stbl.stsd.entries[0].getCodec();		
	}
	return codecs;
}

/* Helper function */
ISOFile.prototype.getTrexById = function(id) {	
	var i;
	if (!this.moov || !this.moov.mvex) return null;
	for (i = 0; i < this.moov.mvex.trexs.length; i++) {
		var trex = this.moov.mvex.trexs[i];
		if (trex.track_id == id) return trex;
	}
	return null;
}

/* Helper function */
ISOFile.prototype.getTrackById = function(id) {
	if (this.moov === undefined) {
		return null;
	}
	for (var j = 0; j < this.moov.traks.length; j++) {
		var trak = this.moov.traks[j];
		if (trak.tkhd.track_id == id) return trak;
	}
	return null;
}
// file:src/isofile-item-processing.js
ISOFile.prototype.items = [];
/* size of the buffers allocated for samples */
ISOFile.prototype.itemsDataSize = 0;

ISOFile.prototype.flattenItemInfo = function() {	
	var items = this.items;
	var i, j;
	var item;
	var meta = this.meta;
	if (meta === null || meta === undefined) return;
	if (meta.hdlr === undefined) return;
	if (meta.iinf === undefined) return;
	for (i = 0; i < meta.iinf.item_infos.length; i++) {
		item = {};
		item.id = meta.iinf.item_infos[i].item_ID;
		items[item.id] = item;
		item.ref_to = [];
		item.name = meta.iinf.item_infos[i].item_name;
		if (meta.iinf.item_infos[i].protection_index > 0) {
			item.protection = meta.ipro.protections[meta.iinf.item_infos[i].protection_index-1];
		}
		if (meta.iinf.item_infos[i].item_type) {
			item.type = meta.iinf.item_infos[i].item_type;
		} else {
			item.type = "mime";
		}
		item.content_type = meta.iinf.item_infos[i].content_type;
		item.content_encoding = meta.iinf.item_infos[i].content_encoding;
	}
	if (meta.iloc) {
		for(i = 0; i < meta.iloc.items.length; i++) {
			var offset;
			var itemloc = meta.iloc.items[i];
			item = items[itemloc.item_ID];
			if (itemloc.data_reference_index !== 0) {
				Log.warn("Item storage with reference to other files: not supported");
				item.source = meta.dinf.boxes[itemloc.data_reference_index-1];
			}
			switch(itemloc.construction_method) {
				case 0: // offset into the file referenced by the data reference index
				break;
				case 1: // offset into the idat box of this meta box
				Log.warn("Item storage with construction_method : not supported");
				break;
				case 2: // offset into another item
				Log.warn("Item storage with construction_method : not supported");
				break;
			}
			item.extents = [];
			item.size = 0;
			for (j = 0; j < itemloc.extents.length; j++) {
				item.extents[j] = {};
				item.extents[j].offset = itemloc.extents[j].extent_offset + itemloc.base_offset;
				item.extents[j].length = itemloc.extents[j].extent_length;
				item.extents[j].alreadyRead = 0;
				item.size += item.extents[j].length;
			}
		}
	}
	if (meta.pitm) {
		items[meta.pitm.item_id].primary = true;
	}
	if (meta.iref) {
		for (i=0; i <meta.iref.references.length; i++) {
			var ref = meta.iref.references[i];
			for (j=0; j<ref.references.length; j++) {
				items[ref.from_item_ID].ref_to.push({type: ref.type, id: ref.references[j]});
			}
		}
	}
	if (meta.iprp) {
		for (var k = 0; k < meta.iprp.ipmas.length; k++) {
			var ipma = meta.iprp.ipmas[k];
			for (i = 0; i < ipma.associations.length; i++) {
				var association = ipma.associations[i];
				item = items[association.id];
				if (item.properties === undefined) {
					item.properties = {};
					item.properties.boxes = [];
				}
				for (j = 0; j < association.props.length; j++) {
					var propEntry = association.props[j];
					if (propEntry.property_index > 0) {
						var propbox = meta.iprp.ipco.boxes[propEntry.property_index-1];
						item.properties[propbox.type] = propbox;
						item.properties.boxes.push(propbox);
					}
				}
			}
		}
	}
}

ISOFile.prototype.getItem = function(item_id) {	
	var buffer;
	var item;
	
	if (!this.meta) {
		return null;
	}

 	item = this.items[item_id];
	if (!item.data && item.size) {
		/* Not yet fetched */
		item.data = new Uint8Array(item.size);
		item.alreadyRead = 0;
		this.itemsDataSize += item.size;
		Log.debug("ISOFile", "Allocating item #"+item_id+" of size "+item.size+" (total: "+this.itemsDataSize+")");
	} else if (item.alreadyRead === item.size) {
		/* Already fetched entirely */
		return item;
	}

	/* The item has only been partially fetched, we need to check in all buffers to find the remaining extents*/

	for (var i = 0; i < item.extents.length; i++) {
		var extent = item.extents[i];
		if (extent.alreadyRead === extent.length) {
			continue;
		} else {
			var index =	this.stream.findPosition(true, extent.offset + extent.alreadyRead, false);
			if (index > -1) {
				buffer = this.stream.buffers[index];
				var lengthAfterStart = buffer.byteLength - (extent.offset + extent.alreadyRead - buffer.fileStart);
				if (extent.length - extent.alreadyRead <= lengthAfterStart) {
					/* the (rest of the) extent is entirely contained in this buffer */

					Log.debug("ISOFile","Getting item #"+item_id+" extent #"+i+" data (alreadyRead: "+extent.alreadyRead+
						" offset: "+(extent.offset+extent.alreadyRead - buffer.fileStart)+" read size: "+(extent.length - extent.alreadyRead)+
						" full extent size: "+extent.length+" full item size: "+item.size+")");

					DataStream.memcpy(item.data.buffer, item.alreadyRead, 
					                  buffer, extent.offset+extent.alreadyRead - buffer.fileStart, extent.length - extent.alreadyRead);

					/* update the number of bytes used in this buffer and check if it needs to be removed */
					buffer.usedBytes += extent.length - extent.alreadyRead;
					this.stream.logBufferLevel();

					item.alreadyRead += (extent.length - extent.alreadyRead);
					extent.alreadyRead = extent.length;
				} else {
					/* the sample does not end in this buffer */

					Log.debug("ISOFile","Getting item #"+item_id+" extent #"+i+" partial data (alreadyRead: "+extent.alreadyRead+" offset: "+
						(extent.offset+extent.alreadyRead - buffer.fileStart)+" read size: "+lengthAfterStart+
						" full extent size: "+extent.length+" full item size: "+item.size+")");

					DataStream.memcpy(item.data.buffer, item.alreadyRead, 
					                  buffer, extent.offset+extent.alreadyRead - buffer.fileStart, lengthAfterStart);
					extent.alreadyRead += lengthAfterStart;
					item.alreadyRead += lengthAfterStart;

					/* update the number of bytes used in this buffer and check if it needs to be removed */
					buffer.usedBytes += lengthAfterStart;
					this.stream.logBufferLevel();
					return null;
				}
			} else {
				return null;
			}
		}
	}
	if (item.alreadyRead === item.size) {
		/* fetched entirely */
		return item;
	} else {
		return null;
	}
}

/* Release the memory used to store the data of the item */
ISOFile.prototype.releaseItem = function(item_id) {	
	var item = this.items[item_id];
	if (item.data) {
		this.itemsDataSize -= item.size;
		item.data = null;
		item.alreadyRead = 0;
		for (var i = 0; i < item.extents.length; i++) {
			var extent = item.extents[i];
			extent.alreadyRead = 0;
		}
		return item.size;
	} else {
		return 0;
	}
}


ISOFile.prototype.processItems = function(callback) {
	for(var i in this.items) {
		var item = this.items[i];
		this.getItem(item.id);
		if (callback && !item.sent) {
			callback(item);
			item.sent = true;
			item.data = null;
		}
	}
}

ISOFile.prototype.hasItem = function(name) {
	for(var i in this.items) {
		var item = this.items[i];
		if (item.name === name) {
			return item.id;
		}
	}
	return -1;
}

ISOFile.prototype.getMetaHandler = function() {
	if (!this.meta) {
		return null;
	} else {
		return this.meta.hdlr.handler;		
	}
}

ISOFile.prototype.getPrimaryItem = function() {
	if (!this.meta || !this.meta.pitm) {
		return null;
	} else {
		return this.getItem(this.meta.pitm.item_id);
	}
}

ISOFile.prototype.itemToFragmentedTrackFile = function(_options) {
	var options = _options || {};
	var item = null;
	if (options.itemId) {
		item = this.getItem(options.itemId);
	} else {
		item = this.getPrimaryItem();
	}
	if (item == null) return null;

	var file = new ISOFile();
	file.discardMdatData = false;
	// assuming the track type is the same as the item type
	var trackOptions = { type: item.type, description_boxes: item.properties.boxes};
	if (item.properties.ispe) {
		trackOptions.width = item.properties.ispe.image_width;
		trackOptions.height = item.properties.ispe.image_height;
	}
	var trackId = file.addTrack(trackOptions);
	if (trackId) {
		file.addSample(trackId, item.data);
		return file;
	} else {
		return null;
	}
}

// file:src/isofile-write.js
/* Rewrite the entire file */
ISOFile.prototype.write = function(outstream) {
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(outstream);
	}
}

ISOFile.prototype.createFragment = function(track_id, sampleNumber, stream_) {
	var trak = this.getTrackById(track_id);
	var sample = this.getSample(trak, sampleNumber);
	if (sample == null) {
		sample = trak.samples[sampleNumber];
		if (this.nextSeekPosition) {
			this.nextSeekPosition = Math.min(sample.offset+sample.alreadyRead,this.nextSeekPosition);
		} else {
			this.nextSeekPosition = trak.samples[sampleNumber].offset+sample.alreadyRead;
		}
		return null;
	}
	
	var stream = stream_ || new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;

	var moof = ISOFile.createSingleSampleMoof(sample);
	moof.write(stream);

	/* adjusting the data_offset now that the moof size is known*/
	moof.trafs[0].truns[0].data_offset = moof.size+8; //8 is mdat header
	Log.debug("MP4Box", "Adjusting data_offset with new value "+moof.trafs[0].truns[0].data_offset);
	stream.adjustUint32(moof.trafs[0].truns[0].data_offset_position, moof.trafs[0].truns[0].data_offset);
		
	var mdat = new BoxParser.mdatBox();
	mdat.data = sample.data;
	mdat.write(stream);
	return stream;
}

/* Modify the file and create the initialization segment */
ISOFile.writeInitializationSegment = function(ftyp, moov, total_duration, sample_duration) {
	var i;
	var index;
	var mehd;
	var trex;
	var box;
	Log.debug("ISOFile", "Generating initialization segment");

	var stream = new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	ftyp.write(stream);
	
	/* we can now create the new mvex box */
	var mvex = moov.add("mvex");
	if (total_duration) {
		mvex.add("mehd").set("fragment_duration", total_duration);
	}
	for (i = 0; i < moov.traks.length; i++) {
		mvex.add("trex").set("track_id", moov.traks[i].tkhd.track_id)
						.set("default_sample_description_index", 1)
						.set("default_sample_duration", sample_duration)
						.set("default_sample_size", 0)
						.set("default_sample_flags", 1<<16)
	}
	moov.write(stream);

	return stream.buffer;

}

ISOFile.prototype.save = function(name) {
	var stream = new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	this.write(stream);
	stream.save(name);	
}

ISOFile.prototype.getBuffer = function() {
	var stream = new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	this.write(stream);
	return stream.buffer;
}

ISOFile.prototype.initializeSegmentation = function() {
	var i;
	var j;
	var box;
	var initSegs;
	var trak;
	var seg;
	if (this.onSegment === null) {
		Log.warn("MP4Box", "No segmentation callback set!");
	}
	if (!this.isFragmentationInitialized) {
		this.isFragmentationInitialized = true;		
		this.nextMoofNumber = 0;
		this.resetTables();
	}	
	initSegs = [];	
	for (i = 0; i < this.fragmentedTracks.length; i++) {
		var moov = new BoxParser.moovBox();
		moov.mvhd = this.moov.mvhd;
	    moov.boxes.push(moov.mvhd);
		trak = this.getTrackById(this.fragmentedTracks[i].id);
		moov.boxes.push(trak);
		moov.traks.push(trak);
		seg = {};
		seg.id = trak.tkhd.track_id;
		seg.user = this.fragmentedTracks[i].user;
		seg.buffer = ISOFile.writeInitializationSegment(this.ftyp, moov, (this.moov.mvex && this.moov.mvex.mehd ? this.moov.mvex.mehd.fragment_duration: undefined), (this.moov.traks[i].samples.length>0 ? this.moov.traks[i].samples[0].duration: 0));
		initSegs.push(seg);
	}
	return initSegs;
}

// file:src/box-print.js
/* 
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
BoxParser.Box.prototype.printHeader = function(output) {
	this.size += 8;
	if (this.size > MAX_SIZE) {
		this.size += 8;
	}
	if (this.type === "uuid") {
		this.size += 16;
	}
	output.log(output.indent+"size:"+this.size);
	output.log(output.indent+"type:"+this.type);
}

BoxParser.FullBox.prototype.printHeader = function(output) {
	this.size += 4;
	BoxParser.Box.prototype.printHeader.call(this, output);
	output.log(output.indent+"version:"+this.version);
	output.log(output.indent+"flags:"+this.flags);
}

BoxParser.Box.prototype.print = function(output) {
	this.printHeader(output);
}

BoxParser.ContainerBox.prototype.print = function(output) {
	this.printHeader(output);
	for (var i=0; i<this.boxes.length; i++) {
		if (this.boxes[i]) {
			var prev_indent = output.indent;
			output.indent += " ";
			this.boxes[i].print(output);
			output.indent = prev_indent;
		}
	}
}

ISOFile.prototype.print = function(output) {
	output.indent = "";
	for (var i=0; i<this.boxes.length; i++) {
		if (this.boxes[i]) {
			this.boxes[i].print(output);
		}
	}	
}

BoxParser.mvhdBox.prototype.print = function(output) {
	BoxParser.FullBox.prototype.printHeader.call(this, output);
	output.log(output.indent+"creation_time: "+this.creation_time);
	output.log(output.indent+"modification_time: "+this.modification_time);
	output.log(output.indent+"timescale: "+this.timescale);
	output.log(output.indent+"duration: "+this.duration);
	output.log(output.indent+"rate: "+this.rate);
	output.log(output.indent+"volume: "+(this.volume>>8));
	output.log(output.indent+"matrix: "+this.matrix.join(", "));
	output.log(output.indent+"next_track_id: "+this.next_track_id);
}

BoxParser.tkhdBox.prototype.print = function(output) {
	BoxParser.FullBox.prototype.printHeader.call(this, output);
	output.log(output.indent+"creation_time: "+this.creation_time);
	output.log(output.indent+"modification_time: "+this.modification_time);
	output.log(output.indent+"track_id: "+this.track_id);
	output.log(output.indent+"duration: "+this.duration);
	output.log(output.indent+"volume: "+(this.volume>>8));
	output.log(output.indent+"matrix: "+this.matrix.join(", "));
	output.log(output.indent+"layer: "+this.layer);
	output.log(output.indent+"alternate_group: "+this.alternate_group);
	output.log(output.indent+"width: "+this.width);
	output.log(output.indent+"height: "+this.height);
}// file:src/mp4box.js
/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var MP4Box = {};

MP4Box.createFile = function (_keepMdatData, _stream) {
	/* Boolean indicating if bytes containing media data should be kept in memory */
	var keepMdatData = (_keepMdatData !== undefined ? _keepMdatData : true);
	var file = new ISOFile(_stream);
	file.discardMdatData = (keepMdatData ? false : true);
	return file;
}

if (typeof exports !== 'undefined') {
	exports.createFile = MP4Box.createFile;
}

var $jscomp=$jscomp||{};$jscomp.scope={};$jscomp.ASSUME_ES5=!1;$jscomp.ASSUME_NO_NATIVE_MAP=!1;$jscomp.ASSUME_NO_NATIVE_SET=!1;$jscomp.defineProperty=$jscomp.ASSUME_ES5||"function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value)};$jscomp.getGlobal=function(a){return"undefined"!=typeof window&&window===a?a:"undefined"!=typeof global&&null!=global?global:a};$jscomp.global=$jscomp.getGlobal(this);$jscomp.SYMBOL_PREFIX="jscomp_symbol_";
$jscomp.initSymbol=function(){$jscomp.initSymbol=function(){};$jscomp.global.Symbol||($jscomp.global.Symbol=$jscomp.Symbol)};$jscomp.Symbol=function(){var a=0;return function(b){return $jscomp.SYMBOL_PREFIX+(b||"")+a++}}();
$jscomp.initSymbolIterator=function(){$jscomp.initSymbol();var a=$jscomp.global.Symbol.iterator;a||(a=$jscomp.global.Symbol.iterator=$jscomp.global.Symbol("iterator"));"function"!=typeof Array.prototype[a]&&$jscomp.defineProperty(Array.prototype,a,{configurable:!0,writable:!0,value:function(){return $jscomp.arrayIterator(this)}});$jscomp.initSymbolIterator=function(){}};$jscomp.arrayIterator=function(a){var b=0;return $jscomp.iteratorPrototype(function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}})};
$jscomp.iteratorPrototype=function(a){$jscomp.initSymbolIterator();a={next:a};a[$jscomp.global.Symbol.iterator]=function(){return this};return a};$jscomp.makeIterator=function(a){$jscomp.initSymbolIterator();var b=a[Symbol.iterator];return b?b.call(a):$jscomp.arrayIterator(a)};
$jscomp.polyfill=function(a,b,c,d){if(b){c=$jscomp.global;a=a.split(".");for(d=0;d<a.length-1;d++){var e=a[d];e in c||(c[e]={});c=c[e]}a=a[a.length-1];d=c[a];b=b(d);b!=d&&null!=b&&$jscomp.defineProperty(c,a,{configurable:!0,writable:!0,value:b})}};$jscomp.FORCE_POLYFILL_PROMISE=!1;
$jscomp.polyfill("Promise",function(a){function b(){this.batch_=null}function c(a){return a instanceof e?a:new e(function(b,c){b(a)})}if(a&&!$jscomp.FORCE_POLYFILL_PROMISE)return a;b.prototype.asyncExecute=function(a){null==this.batch_&&(this.batch_=[],this.asyncExecuteBatch_());this.batch_.push(a);return this};b.prototype.asyncExecuteBatch_=function(){var a=this;this.asyncExecuteFunction(function(){a.executeBatch_()})};var d=$jscomp.global.setTimeout;b.prototype.asyncExecuteFunction=function(a){d(a,
0)};b.prototype.executeBatch_=function(){for(;this.batch_&&this.batch_.length;){var a=this.batch_;this.batch_=[];for(var b=0;b<a.length;++b){var c=a[b];a[b]=null;try{c()}catch(l){this.asyncThrow_(l)}}}this.batch_=null};b.prototype.asyncThrow_=function(a){this.asyncExecuteFunction(function(){throw a;})};var e=function(a){this.state_=0;this.result_=void 0;this.onSettledCallbacks_=[];var b=this.createResolveAndReject_();try{a(b.resolve,b.reject)}catch(k){b.reject(k)}};e.prototype.createResolveAndReject_=
function(){function a(a){return function(d){c||(c=!0,a.call(b,d))}}var b=this,c=!1;return{resolve:a(this.resolveTo_),reject:a(this.reject_)}};e.prototype.resolveTo_=function(a){if(a===this)this.reject_(new TypeError("A Promise cannot resolve to itself"));else if(a instanceof e)this.settleSameAsPromise_(a);else{a:switch(typeof a){case "object":var b=null!=a;break a;case "function":b=!0;break a;default:b=!1}b?this.resolveToNonPromiseObj_(a):this.fulfill_(a)}};e.prototype.resolveToNonPromiseObj_=function(a){var b=
void 0;try{b=a.then}catch(k){this.reject_(k);return}"function"==typeof b?this.settleSameAsThenable_(b,a):this.fulfill_(a)};e.prototype.reject_=function(a){this.settle_(2,a)};e.prototype.fulfill_=function(a){this.settle_(1,a)};e.prototype.settle_=function(a,b){if(0!=this.state_)throw Error("Cannot settle("+a+", "+b+"): Promise already settled in state"+this.state_);this.state_=a;this.result_=b;this.executeOnSettledCallbacks_()};e.prototype.executeOnSettledCallbacks_=function(){if(null!=this.onSettledCallbacks_){for(var a=
0;a<this.onSettledCallbacks_.length;++a)f.asyncExecute(this.onSettledCallbacks_[a]);this.onSettledCallbacks_=null}};var f=new b;e.prototype.settleSameAsPromise_=function(a){var b=this.createResolveAndReject_();a.callWhenSettled_(b.resolve,b.reject)};e.prototype.settleSameAsThenable_=function(a,b){var c=this.createResolveAndReject_();try{a.call(b,c.resolve,c.reject)}catch(l){c.reject(l)}};e.prototype.then=function(a,b){function c(a,b){return"function"==typeof a?function(b){try{d(a(b))}catch(u){f(u)}}:
b}var d,f,g=new e(function(a,b){d=a;f=b});this.callWhenSettled_(c(a,d),c(b,f));return g};e.prototype["catch"]=function(a){return this.then(void 0,a)};e.prototype.callWhenSettled_=function(a,b){function c(){switch(d.state_){case 1:a(d.result_);break;case 2:b(d.result_);break;default:throw Error("Unexpected state: "+d.state_);}}var d=this;null==this.onSettledCallbacks_?f.asyncExecute(c):this.onSettledCallbacks_.push(c)};e.resolve=c;e.reject=function(a){return new e(function(b,c){c(a)})};e.race=function(a){return new e(function(b,
d){for(var e=$jscomp.makeIterator(a),f=e.next();!f.done;f=e.next())c(f.value).callWhenSettled_(b,d)})};e.all=function(a){var b=$jscomp.makeIterator(a),d=b.next();return d.done?c([]):new e(function(a,e){function f(b){return function(c){g[b]=c;h--;0==h&&a(g)}}var g=[],h=0;do g.push(void 0),h++,c(d.value).callWhenSettled_(f(g.length-1),e),d=b.next();while(!d.done)})};return e},"es6","es3");
$jscomp.polyfill("Promise.prototype.finally",function(a){return a?a:function(a){return this.then(function(b){return Promise.resolve(a()).then(function(){return b})},function(b){return Promise.resolve(a()).then(function(){throw b;})})}},"es8","es3");$jscomp.asyncExecutePromiseGenerator=function(a){function b(b){return a.next(b)}function c(b){return a["throw"](b)}return new Promise(function(d,e){function f(a){a.done?d(a.value):Promise.resolve(a.value).then(b,c).then(f,e)}f(a.next())})};
$jscomp.asyncExecutePromiseGeneratorFunction=function(a){return $jscomp.asyncExecutePromiseGenerator(a())};$jscomp.arrayFromIterator=function(a){for(var b,c=[];!(b=a.next()).done;)c.push(b.value);return c};$jscomp.objectCreate=$jscomp.ASSUME_ES5||"function"==typeof Object.create?Object.create:function(a){var b=function(){};b.prototype=a;return new b};$jscomp.underscoreProtoCanBeSet=function(){var a={a:!0},b={};try{return b.__proto__=a,b.a}catch(c){}return!1};
$jscomp.setPrototypeOf="function"==typeof Object.setPrototypeOf?Object.setPrototypeOf:$jscomp.underscoreProtoCanBeSet()?function(a,b){a.__proto__=b;if(a.__proto__!==b)throw new TypeError(a+" is not extensible");return a}:null;
$jscomp.inherits=function(a,b){a.prototype=$jscomp.objectCreate(b.prototype);a.prototype.constructor=a;if($jscomp.setPrototypeOf){var c=$jscomp.setPrototypeOf;c(a,b)}else for(c in b)if("prototype"!=c)if(Object.defineProperties){var d=Object.getOwnPropertyDescriptor(b,c);d&&Object.defineProperty(a,c,d)}else a[c]=b[c];a.superClass_=b.prototype};$jscomp.arrayFromIterable=function(a){return a instanceof Array?a:$jscomp.arrayFromIterator($jscomp.makeIterator(a))};$jscomp.generator={};
$jscomp.generator.ensureIteratorResultIsObject_=function(a){if(!(a instanceof Object))throw new TypeError("Iterator result "+a+" is not an object");};$jscomp.generator.Context=function(){this.isRunning_=!1;this.yieldAllIterator_=null;this.yieldResult=void 0;this.nextAddress=1;this.finallyAddress_=this.catchAddress_=0;this.finallyContexts_=this.abruptCompletion_=null};
$jscomp.generator.Context.prototype.start_=function(){if(this.isRunning_)throw new TypeError("Generator is already running");this.isRunning_=!0};$jscomp.generator.Context.prototype.stop_=function(){this.isRunning_=!1};$jscomp.generator.Context.prototype.jumpToErrorHandler_=function(){this.nextAddress=this.catchAddress_||this.finallyAddress_};$jscomp.generator.Context.prototype.next_=function(a){this.yieldResult=a};
$jscomp.generator.Context.prototype.throw_=function(a){this.abruptCompletion_={exception:a,isException:!0};this.jumpToErrorHandler_()};$jscomp.generator.Context.prototype["return"]=function(a){this.abruptCompletion_={"return":a};this.nextAddress=this.finallyAddress_};$jscomp.generator.Context.prototype.jumpThroughFinallyBlocks=function(a){this.abruptCompletion_={jumpTo:a};this.nextAddress=this.finallyAddress_};$jscomp.generator.Context.prototype.yield=function(a,b){this.nextAddress=b;return{value:a}};
$jscomp.generator.Context.prototype.yieldAll=function(a,b){var c=$jscomp.makeIterator(a),d=c.next();$jscomp.generator.ensureIteratorResultIsObject_(d);if(d.done)this.yieldResult=d.value,this.nextAddress=b;else return this.yieldAllIterator_=c,this.yield(d.value,b)};$jscomp.generator.Context.prototype.jumpTo=function(a){this.nextAddress=a};$jscomp.generator.Context.prototype.jumpToEnd=function(){this.nextAddress=0};
$jscomp.generator.Context.prototype.setCatchFinallyBlocks=function(a,b){this.catchAddress_=a;void 0!=b&&(this.finallyAddress_=b)};$jscomp.generator.Context.prototype.setFinallyBlock=function(a){this.catchAddress_=0;this.finallyAddress_=a||0};$jscomp.generator.Context.prototype.leaveTryBlock=function(a,b){this.nextAddress=a;this.catchAddress_=b||0};
$jscomp.generator.Context.prototype.enterCatchBlock=function(a){this.catchAddress_=a||0;a=this.abruptCompletion_.exception;this.abruptCompletion_=null;return a};$jscomp.generator.Context.prototype.enterFinallyBlock=function(a,b,c){c?this.finallyContexts_[c]=this.abruptCompletion_:this.finallyContexts_=[this.abruptCompletion_];this.catchAddress_=a||0;this.finallyAddress_=b||0};
$jscomp.generator.Context.prototype.leaveFinallyBlock=function(a,b){var c=this.finallyContexts_.splice(b||0)[0];if(c=this.abruptCompletion_=this.abruptCompletion_||c){if(c.isException)return this.jumpToErrorHandler_();void 0!=c.jumpTo&&this.finallyAddress_<c.jumpTo?(this.nextAddress=c.jumpTo,this.abruptCompletion_=null):this.nextAddress=this.finallyAddress_}else this.nextAddress=a};$jscomp.generator.Context.prototype.forIn=function(a){return new $jscomp.generator.Context.PropertyIterator(a)};
$jscomp.generator.Context.PropertyIterator=function(a){this.object_=a;this.properties_=[];for(var b in a)this.properties_.push(b);this.properties_.reverse()};$jscomp.generator.Context.PropertyIterator.prototype.getNext=function(){for(;0<this.properties_.length;){var a=this.properties_.pop();if(a in this.object_)return a}return null};$jscomp.generator.Engine_=function(a){this.context_=new $jscomp.generator.Context;this.program_=a};
$jscomp.generator.Engine_.prototype.next_=function(a){this.context_.start_();if(this.context_.yieldAllIterator_)return this.yieldAllStep_(this.context_.yieldAllIterator_.next,a,this.context_.next_);this.context_.next_(a);return this.nextStep_()};
$jscomp.generator.Engine_.prototype.return_=function(a){this.context_.start_();var b=this.context_.yieldAllIterator_;if(b)return this.yieldAllStep_("return"in b?b["return"]:function(a){return{value:a,done:!0}},a,this.context_["return"]);this.context_["return"](a);return this.nextStep_()};
$jscomp.generator.Engine_.prototype.throw_=function(a){this.context_.start_();if(this.context_.yieldAllIterator_)return this.yieldAllStep_(this.context_.yieldAllIterator_["throw"],a,this.context_.next_);this.context_.throw_(a);return this.nextStep_()};
$jscomp.generator.Engine_.prototype.yieldAllStep_=function(a,b,c){try{var d=a.call(this.context_.yieldAllIterator_,b);$jscomp.generator.ensureIteratorResultIsObject_(d);if(!d.done)return this.context_.stop_(),d;var e=d.value}catch(f){return this.context_.yieldAllIterator_=null,this.context_.throw_(f),this.nextStep_()}this.context_.yieldAllIterator_=null;c.call(this.context_,e);return this.nextStep_()};
$jscomp.generator.Engine_.prototype.nextStep_=function(){for(;this.context_.nextAddress;)try{var a=this.program_(this.context_);if(a)return this.context_.stop_(),{value:a.value,done:!1}}catch(b){this.context_.yieldResult=void 0,this.context_.throw_(b)}this.context_.stop_();if(this.context_.abruptCompletion_){a=this.context_.abruptCompletion_;this.context_.abruptCompletion_=null;if(a.isException)throw a.exception;return{value:a["return"],done:!0}}return{value:void 0,done:!0}};
$jscomp.generator.Generator_=function(a){this.next=function(b){return a.next_(b)};this["throw"]=function(b){return a.throw_(b)};this["return"]=function(b){return a.return_(b)};$jscomp.initSymbolIterator();this[Symbol.iterator]=function(){return this}};$jscomp.generator.createGenerator=function(a,b){$jscomp.generator.Generator_.prototype=a.prototype;return new $jscomp.generator.Generator_(new $jscomp.generator.Engine_(b))};
$jscomp.checkEs6ConformanceViaProxy=function(){try{var a={},b=Object.create(new $jscomp.global.Proxy(a,{get:function(c,d,e){return c==a&&"q"==d&&e==b}}));return!0===b.q}catch(c){return!1}};$jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS=!1;$jscomp.ES6_CONFORMANCE=$jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS&&$jscomp.checkEs6ConformanceViaProxy();$jscomp.owns=function(a,b){return Object.prototype.hasOwnProperty.call(a,b)};
$jscomp.polyfill("WeakMap",function(a){function b(){if(!a||!Object.seal)return!1;try{var b=Object.seal({}),c=Object.seal({}),d=new a([[b,2],[c,3]]);if(2!=d.get(b)||3!=d.get(c))return!1;d["delete"](b);d.set(c,4);return!d.has(b)&&4==d.get(c)}catch(m){return!1}}function c(a){$jscomp.owns(a,e)||$jscomp.defineProperty(a,e,{value:{}})}function d(a){var b=Object[a];b&&(Object[a]=function(a){c(a);return b(a)})}if($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS){if(a&&$jscomp.ES6_CONFORMANCE)return a}else if(b())return a;
var e="$jscomp_hidden_"+Math.random();d("freeze");d("preventExtensions");d("seal");var f=0,g=function(a){this.id_=(f+=Math.random()+1).toString();if(a){$jscomp.initSymbol();$jscomp.initSymbolIterator();a=$jscomp.makeIterator(a);for(var b;!(b=a.next()).done;)b=b.value,this.set(b[0],b[1])}};g.prototype.set=function(a,b){c(a);if(!$jscomp.owns(a,e))throw Error("WeakMap key fail: "+a);a[e][this.id_]=b;return this};g.prototype.get=function(a){return $jscomp.owns(a,e)?a[e][this.id_]:void 0};g.prototype.has=
function(a){return $jscomp.owns(a,e)&&$jscomp.owns(a[e],this.id_)};g.prototype["delete"]=function(a){return $jscomp.owns(a,e)&&$jscomp.owns(a[e],this.id_)?delete a[e][this.id_]:!1};return g},"es6","es3");$jscomp.MapEntry=function(){};
$jscomp.polyfill("Map",function(a){function b(){if($jscomp.ASSUME_NO_NATIVE_MAP||!a||"function"!=typeof a||!a.prototype.entries||"function"!=typeof Object.seal)return!1;try{var b=Object.seal({x:4}),c=new a($jscomp.makeIterator([[b,"s"]]));if("s"!=c.get(b)||1!=c.size||c.get({x:4})||c.set({x:4},"t")!=c||2!=c.size)return!1;var d=c.entries(),e=d.next();if(e.done||e.value[0]!=b||"s"!=e.value[1])return!1;e=d.next();return e.done||4!=e.value[0].x||"t"!=e.value[1]||!d.next().done?!1:!0}catch(q){return!1}}
if($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS){if(a&&$jscomp.ES6_CONFORMANCE)return a}else if(b())return a;$jscomp.initSymbol();$jscomp.initSymbolIterator();var c=new WeakMap,d=function(a){this.data_={};this.head_=g();this.size=0;if(a){a=$jscomp.makeIterator(a);for(var b;!(b=a.next()).done;)b=b.value,this.set(b[0],b[1])}};d.prototype.set=function(a,b){var c=e(this,a);c.list||(c.list=this.data_[c.id]=[]);c.entry?c.entry.value=b:(c.entry={next:this.head_,previous:this.head_.previous,head:this.head_,
key:a,value:b},c.list.push(c.entry),this.head_.previous.next=c.entry,this.head_.previous=c.entry,this.size++);return this};d.prototype["delete"]=function(a){a=e(this,a);return a.entry&&a.list?(a.list.splice(a.index,1),a.list.length||delete this.data_[a.id],a.entry.previous.next=a.entry.next,a.entry.next.previous=a.entry.previous,a.entry.head=null,this.size--,!0):!1};d.prototype.clear=function(){this.data_={};this.head_=this.head_.previous=g();this.size=0};d.prototype.has=function(a){return!!e(this,
a).entry};d.prototype.get=function(a){return(a=e(this,a).entry)&&a.value};d.prototype.entries=function(){return f(this,function(a){return[a.key,a.value]})};d.prototype.keys=function(){return f(this,function(a){return a.key})};d.prototype.values=function(){return f(this,function(a){return a.value})};d.prototype.forEach=function(a,b){for(var c=this.entries(),d;!(d=c.next()).done;)d=d.value,a.call(b,d[1],d[0],this)};d.prototype[Symbol.iterator]=d.prototype.entries;var e=function(a,b){var d=b&&typeof b;
"object"==d||"function"==d?c.has(b)?d=c.get(b):(d=""+ ++h,c.set(b,d)):d="p_"+b;var e=a.data_[d];if(e&&$jscomp.owns(a.data_,d))for(var f=0;f<e.length;f++){var g=e[f];if(b!==b&&g.key!==g.key||b===g.key)return{id:d,list:e,index:f,entry:g}}return{id:d,list:e,index:-1,entry:void 0}},f=function(a,b){var c=a.head_;return $jscomp.iteratorPrototype(function(){if(c){for(;c.head!=a.head_;)c=c.previous;for(;c.next!=c.head;)return c=c.next,{done:!1,value:b(c)};c=null}return{done:!0,value:void 0}})},g=function(){var a=
{};return a.previous=a.next=a.head=a},h=0;return d},"es6","es3");
$jscomp.polyfill("Set",function(a){function b(){if($jscomp.ASSUME_NO_NATIVE_SET||!a||"function"!=typeof a||!a.prototype.entries||"function"!=typeof Object.seal)return!1;try{var b=Object.seal({x:4}),c=new a($jscomp.makeIterator([b]));if(!c.has(b)||1!=c.size||c.add(b)!=c||1!=c.size||c.add({x:4})!=c||2!=c.size)return!1;var f=c.entries(),g=f.next();if(g.done||g.value[0]!=b||g.value[1]!=b)return!1;g=f.next();return g.done||g.value[0]==b||4!=g.value[0].x||g.value[1]!=g.value[0]?!1:f.next().done}catch(h){return!1}}
if($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS){if(a&&$jscomp.ES6_CONFORMANCE)return a}else if(b())return a;$jscomp.initSymbol();$jscomp.initSymbolIterator();var c=function(a){this.map_=new Map;if(a){a=$jscomp.makeIterator(a);for(var b;!(b=a.next()).done;)this.add(b.value)}this.size=this.map_.size};c.prototype.add=function(a){this.map_.set(a,a);this.size=this.map_.size;return this};c.prototype["delete"]=function(a){a=this.map_["delete"](a);this.size=this.map_.size;return a};c.prototype.clear=function(){this.map_.clear();
this.size=0};c.prototype.has=function(a){return this.map_.has(a)};c.prototype.entries=function(){return this.map_.entries()};c.prototype.values=function(){return this.map_.values()};c.prototype.keys=c.prototype.values;c.prototype[Symbol.iterator]=c.prototype.values;c.prototype.forEach=function(a,b){var c=this;this.map_.forEach(function(d){return a.call(b,d,d,c)})};return c},"es6","es3");
$jscomp.findInternal=function(a,b,c){a instanceof String&&(a=String(a));for(var d=a.length,e=0;e<d;e++){var f=a[e];if(b.call(c,f,e,a))return{i:e,v:f}}return{i:-1,v:void 0}};$jscomp.polyfill("Array.prototype.findIndex",function(a){return a?a:function(a,c){return $jscomp.findInternal(this,a,c).i}},"es6","es3");
$jscomp.iteratorFromArray=function(a,b){$jscomp.initSymbolIterator();a instanceof String&&(a+="");var c=0,d={next:function(){if(c<a.length){var e=c++;return{value:b(e,a[e]),done:!1}}d.next=function(){return{done:!0,value:void 0}};return d.next()}};d[Symbol.iterator]=function(){return d};return d};$jscomp.polyfill("Array.prototype.keys",function(a){return a?a:function(){return $jscomp.iteratorFromArray(this,function(a){return a})}},"es6","es3");
$jscomp.polyfill("Object.is",function(a){return a?a:function(a,c){return a===c?0!==a||1/a===1/c:a!==a&&c!==c}},"es6","es3");$jscomp.polyfill("Array.prototype.includes",function(a){return a?a:function(a,c){var b=this;b instanceof String&&(b=String(b));var e=b.length,f=c||0;for(0>f&&(f=Math.max(f+e,0));f<e;f++){var g=b[f];if(g===a||Object.is(g,a))return!0}return!1}},"es7","es3");
$jscomp.checkStringArgs=function(a,b,c){if(null==a)throw new TypeError("The 'this' value for String.prototype."+c+" must not be null or undefined");if(b instanceof RegExp)throw new TypeError("First argument to String.prototype."+c+" must not be a regular expression");return a+""};$jscomp.polyfill("String.prototype.includes",function(a){return a?a:function(a,c){return-1!==$jscomp.checkStringArgs(this,a,"includes").indexOf(a,c||0)}},"es6","es3");
$jscomp.polyfill("Array.from",function(a){return a?a:function(a,c,d){$jscomp.initSymbolIterator();c=null!=c?c:function(a){return a};var b=[],f=a[Symbol.iterator];if("function"==typeof f)for(a=f.call(a);!(f=a.next()).done;)b.push(c.call(d,f.value));else{f=a.length;for(var g=0;g<f;g++)b.push(c.call(d,a[g]))}return b}},"es6","es3");
$jscomp.polyfill("String.prototype.startsWith",function(a){return a?a:function(a,c){var b=$jscomp.checkStringArgs(this,a,"startsWith");a+="";for(var e=b.length,f=a.length,g=Math.max(0,Math.min(c|0,b.length)),h=0;h<f&&g<e;)if(b[g++]!=a[h++])return!1;return h>=f}},"es6","es3");$jscomp.polyfill("Array.prototype.find",function(a){return a?a:function(a,c){return $jscomp.findInternal(this,a,c).v}},"es6","es3");var COMPILED=!0,goog=goog||{};goog.global=this;goog.isDef=function(a){return void 0!==a};
goog.exportPath_=function(a,b,c){a=a.split(".");c=c||goog.global;a[0]in c||!c.execScript||c.execScript("var "+a[0]);for(var d;a.length&&(d=a.shift());)!a.length&&goog.isDef(b)?c[d]=b:c=c[d]?c[d]:c[d]={}};
goog.define=function(a,b){var c=b;COMPILED||(goog.global.CLOSURE_UNCOMPILED_DEFINES&&Object.prototype.hasOwnProperty.call(goog.global.CLOSURE_UNCOMPILED_DEFINES,a)?c=goog.global.CLOSURE_UNCOMPILED_DEFINES[a]:goog.global.CLOSURE_DEFINES&&Object.prototype.hasOwnProperty.call(goog.global.CLOSURE_DEFINES,a)&&(c=goog.global.CLOSURE_DEFINES[a]));goog.exportPath_(a,c)};goog.DEBUG=!0;goog.LOCALE="en";goog.TRUSTED_SITE=!0;goog.STRICT_MODE_COMPATIBLE=!0;
goog.provide=function(a){if(!COMPILED){if(goog.isProvided_(a))throw Error('Namespace "'+a+'" already declared.');delete goog.implicitNamespaces_[a];for(var b=a;(b=b.substring(0,b.lastIndexOf(".")))&&!goog.getObjectByName(b);)goog.implicitNamespaces_[b]=!0}goog.exportPath_(a)};goog.forwardDeclare=function(a){};COMPILED||(goog.isProvided_=function(a){return!goog.implicitNamespaces_[a]&&goog.isDefAndNotNull(goog.getObjectByName(a))},goog.implicitNamespaces_={});
goog.getObjectByName=function(a,b){for(var c=a.split("."),d=b||goog.global,e;e=c.shift();)if(goog.isDefAndNotNull(d[e]))d=d[e];else return null;return d};goog.globalize=function(a,b){b=b||goog.global;for(var c in a)b[c]=a[c]};goog.addDependency=function(a,b,c){if(goog.DEPENDENCIES_ENABLED){var d;a=a.replace(/\\/g,"/");for(var e=goog.dependencies_,f=0;d=b[f];f++)e.nameToPath[d]=a;for(d=0;b=c[d];d++)a in e.requires||(e.requires[a]={}),e.requires[a][b]=!0}};goog.ENABLE_DEBUG_LOADER=!1;
goog.logToConsole_=function(a){goog.global.console&&goog.global.console.error(a)};goog.require=function(a){if(!COMPILED){if(goog.isProvided_(a))return null;if(goog.ENABLE_DEBUG_LOADER){var b=goog.getPathFromDeps_(a);if(b)return goog.included_[b]=!0,goog.writeScripts_(),null}a="goog.require could not find: "+a;goog.logToConsole_(a);throw Error(a);}};goog.basePath="";goog.global.CLOSURE_NO_DEPS=!0;goog.DEPENDENCIES_ENABLED=!COMPILED&&goog.ENABLE_DEBUG_LOADER;
goog.DEPENDENCIES_ENABLED&&(goog.included_={},goog.dependencies_={nameToPath:{},requires:{},visited:{},written:{}},goog.inHtmlDocument_=function(){var a=goog.global.document;return"undefined"!=typeof a&&"write"in a},goog.findBasePath_=function(){if(goog.global.CLOSURE_BASE_PATH)goog.basePath=goog.global.CLOSURE_BASE_PATH;else if(goog.inHtmlDocument_())for(var a=goog.global.document.getElementsByTagName("script"),b=a.length-1;0<=b;--b){var c=a[b].src,d=c.lastIndexOf("?");d=-1==d?c.length:d;if("base.js"==
c.substr(d-7,7)){goog.basePath=c.substr(0,d-7);break}}},goog.importScript_=function(a,b){(goog.global.CLOSURE_IMPORT_SCRIPT||goog.writeScriptTag_)(a,b)&&(goog.dependencies_.written[a]=!0)},goog.writeScriptTag_=function(a,b){if(goog.inHtmlDocument_()){var c=goog.global.document;if("complete"==c.readyState){if(/\bdeps.js$/.test(a))return!1;throw Error('Cannot write "'+a+'" after document load');}void 0===b?c.write('<script type="text/javascript" src="'+a+'">\x3c/script>'):c.write('<script type="text/javascript">'+
b+"\x3c/script>");return!0}return!1},goog.writeScripts_=function(){function a(e){if(!(e in d.written)){if(!(e in d.visited)&&(d.visited[e]=!0,e in d.requires))for(var f in d.requires[e])if(!goog.isProvided_(f))if(f in d.nameToPath)a(d.nameToPath[f]);else throw Error("Undefined nameToPath for "+f);e in c||(c[e]=!0,b.push(e))}}var b=[],c={},d=goog.dependencies_;for(f in goog.included_)d.written[f]||a(f);for(var e=0;e<b.length;e++){var f=b[e];goog.dependencies_.written[f]=!0}for(e=0;e<b.length;e++)(f=
b[e])&&goog.importScript_(goog.basePath+f)},goog.getPathFromDeps_=function(a){return a in goog.dependencies_.nameToPath?goog.dependencies_.nameToPath[a]:null},goog.findBasePath_(),goog.global.CLOSURE_NO_DEPS||goog.importScript_(goog.basePath+"deps.js"));goog.isDefAndNotNull=function(a){return null!=a};goog.isString=function(a){return"string"==typeof a};goog.exportSymbol=function(a,b,c){goog.exportPath_(a,b,c)};goog.exportProperty=function(a,b,c){a[b]=c};
goog.inherits=function(a,b){function c(){}c.prototype=b.prototype;a.superClass_=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.base=function(a,c,f){var d=Array.prototype.slice.call(arguments,2);return b.prototype[c].apply(a,d)}};COMPILED||(goog.global.COMPILED=COMPILED);/*

 Copyright 2016 Google Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
goog.asserts={};goog.asserts.ENABLE_ASSERTS=!0;goog.asserts.assert=function(){};goog.asserts.patchAssert_=function(){var a=console.assert;a?a.bind||(console.assert=function(){a.apply(console,arguments)}):console.assert=function(){}};goog.asserts.ENABLE_ASSERTS&&(goog.asserts.patchAssert_(),goog.asserts.assert=console.assert.bind(console));var shaka={abr:{}};shaka.abr.Ewma=function(a){goog.asserts.assert(0<a,"expected halfLife to be positive");this.alpha_=Math.exp(Math.log(.5)/a);this.totalWeight_=this.estimate_=0};shaka.abr.Ewma.prototype.sample=function(a,b){var c=Math.pow(this.alpha_,a);c=b*(1-c)+c*this.estimate_;isNaN(c)||(this.estimate_=c,this.totalWeight_+=a)};shaka.abr.Ewma.prototype.getEstimate=function(){return this.estimate_/(1-Math.pow(this.alpha_,this.totalWeight_))};shaka.abr.EwmaBandwidthEstimator=function(){this.fast_=new shaka.abr.Ewma(2);this.slow_=new shaka.abr.Ewma(5);this.bytesSampled_=0;this.minTotalBytes_=128E3;this.minBytes_=16E3};shaka.abr.EwmaBandwidthEstimator.prototype.sample=function(a,b){if(!(b<this.minBytes_)){var c=8E3*b/a,d=a/1E3;this.bytesSampled_+=b;this.fast_.sample(d,c);this.slow_.sample(d,c)}};
shaka.abr.EwmaBandwidthEstimator.prototype.getBandwidthEstimate=function(a){return this.bytesSampled_<this.minTotalBytes_?a:Math.min(this.fast_.getEstimate(),this.slow_.getEstimate())};shaka.abr.EwmaBandwidthEstimator.prototype.hasGoodEstimate=function(){return this.bytesSampled_>=this.minTotalBytes_};shaka.log={};shaka.log.Level={NONE:0,ERROR:1,WARNING:2,INFO:3,DEBUG:4,V1:5,V2:6};shaka.log.MAX_LOG_LEVEL=4;shaka.log.alwaysError=function(){};shaka.log.alwaysWarn=function(){};shaka.log.error=function(a){for(var b=[],c=0;c<arguments.length;++c)b[c-0]=arguments[c];(c=window.__unsafeShakaLogger)&&c.apply(null,["error"].concat($jscomp.arrayFromIterable(b)))};shaka.log.warning=function(a){for(var b=[],c=0;c<arguments.length;++c)b[c-0]=arguments[c];(c=window.__unsafeShakaLogger)&&c.apply(null,["warning"].concat($jscomp.arrayFromIterable(b)))};
shaka.log.info=function(a){for(var b=[],c=0;c<arguments.length;++c)b[c-0]=arguments[c];(c=window.__unsafeShakaLogger)&&c.apply(null,["warning"].concat($jscomp.arrayFromIterable(b)))};shaka.log.debug=function(a){for(var b=[],c=0;c<arguments.length;++c)b[c-0]=arguments[c];(c=window.__unsafeShakaLogger)&&c.apply(null,["debug"].concat($jscomp.arrayFromIterable(b)))};shaka.log.v1=function(a){for(var b=[],c=0;c<arguments.length;++c)b[c-0]=arguments[c];(c=window.__unsafeShakaLogger)&&c.apply(null,["v1"].concat($jscomp.arrayFromIterable(b)))};
shaka.log.v2=function(a){for(var b=[],c=0;c<arguments.length;++c)b[c-0]=arguments[c];(c=window.__unsafeShakaLogger)&&c.apply(null,["v2"].concat($jscomp.arrayFromIterable(b)))};
window.console&&window.console.log.bind&&(shaka.log.alwaysWarn=console.warn.bind(console),shaka.log.alwaysError=console.error.bind(console),goog.DEBUG?(shaka.log.setLevel=function(a){var b=function(){},c=shaka.log,d=shaka.log.Level;shaka.log.currentLevel=a;c.error=a>=d.ERROR?console.error.bind(console):b;c.warning=a>=d.WARNING?console.warn.bind(console):b;c.info=a>=d.INFO?console.info.bind(console):b;c.debug=a>=d.DEBUG?console.log.bind(console):b;c.v1=a>=d.V1?console.debug.bind(console):b;c.v2=a>=
d.V2?console.debug.bind(console):b},shaka.log.setLevel(shaka.log.MAX_LOG_LEVEL)):(shaka.log.MAX_LOG_LEVEL>=shaka.log.Level.ERROR&&(shaka.log.error=console.error.bind(console)),shaka.log.MAX_LOG_LEVEL>=shaka.log.Level.WARNING&&(shaka.log.warning=console.warn.bind(console)),shaka.log.MAX_LOG_LEVEL>=shaka.log.Level.INFO&&(shaka.log.info=console.info.bind(console)),shaka.log.MAX_LOG_LEVEL>=shaka.log.Level.DEBUG&&(shaka.log.debug=console.log.bind(console)),shaka.log.MAX_LOG_LEVEL>=shaka.log.Level.V1&&
(shaka.log.v1=console.debug.bind(console)),shaka.log.MAX_LOG_LEVEL>=shaka.log.Level.V2&&(shaka.log.v2=console.debug.bind(console))));goog.uri={};goog.uri.utils={};goog.uri.utils.splitRe_=/^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#(.*))?$/;goog.uri.utils.ComponentIndex={SCHEME:1,USER_INFO:2,DOMAIN:3,PORT:4,PATH:5,QUERY_DATA:6,FRAGMENT:7};goog.uri.utils.split=function(a){return a.match(goog.uri.utils.splitRe_)};goog.Uri=function(a){var b;a instanceof goog.Uri?(this.setScheme(a.getScheme()),this.setUserInfo(a.getUserInfo()),this.setDomain(a.getDomain()),this.setPort(a.getPort()),this.setPath(a.getPath()),this.setQueryData(a.getQueryData().clone()),this.setFragment(a.getFragment())):a&&(b=goog.uri.utils.split(String(a)))?(this.setScheme(b[goog.uri.utils.ComponentIndex.SCHEME]||"",!0),this.setUserInfo(b[goog.uri.utils.ComponentIndex.USER_INFO]||"",!0),this.setDomain(b[goog.uri.utils.ComponentIndex.DOMAIN]||
"",!0),this.setPort(b[goog.uri.utils.ComponentIndex.PORT]),this.setPath(b[goog.uri.utils.ComponentIndex.PATH]||"",!0),this.setQueryData(b[goog.uri.utils.ComponentIndex.QUERY_DATA]||"",!0),this.setFragment(b[goog.uri.utils.ComponentIndex.FRAGMENT]||"",!0)):this.queryData_=new goog.Uri.QueryData(null,null)};goog.Uri.prototype.scheme_="";goog.Uri.prototype.userInfo_="";goog.Uri.prototype.domain_="";goog.Uri.prototype.port_=null;goog.Uri.prototype.path_="";goog.Uri.prototype.fragment_="";
goog.Uri.prototype.toString=function(){var a=[],b=this.getScheme();b&&a.push(goog.Uri.encodeSpecialChars_(b,goog.Uri.reDisallowedInSchemeOrUserInfo_,!0),":");if(b=this.getDomain()){a.push("//");var c=this.getUserInfo();c&&a.push(goog.Uri.encodeSpecialChars_(c,goog.Uri.reDisallowedInSchemeOrUserInfo_,!0),"@");a.push(goog.Uri.removeDoubleEncoding_(encodeURIComponent(b)));b=this.getPort();null!=b&&a.push(":",String(b))}if(b=this.getPath())this.hasDomain()&&"/"!=b.charAt(0)&&a.push("/"),a.push(goog.Uri.encodeSpecialChars_(b,
"/"==b.charAt(0)?goog.Uri.reDisallowedInAbsolutePath_:goog.Uri.reDisallowedInRelativePath_,!0));(b=this.getEncodedQuery())&&a.push("?",b);(b=this.getFragment())&&a.push("#",goog.Uri.encodeSpecialChars_(b,goog.Uri.reDisallowedInFragment_));return a.join("")};
goog.Uri.prototype.resolve=function(a){var b=this.clone();"data"===b.scheme_&&(b=new goog.Uri);var c=a.hasScheme();c?b.setScheme(a.getScheme()):c=a.hasUserInfo();c?b.setUserInfo(a.getUserInfo()):c=a.hasDomain();c?b.setDomain(a.getDomain()):c=a.hasPort();var d=a.getPath();if(c)b.setPort(a.getPort());else if(c=a.hasPath()){if("/"!=d.charAt(0))if(this.hasDomain()&&!this.hasPath())d="/"+d;else{var e=b.getPath().lastIndexOf("/");-1!=e&&(d=b.getPath().substr(0,e+1)+d)}d=goog.Uri.removeDotSegments(d)}c?
b.setPath(d):c=a.hasQuery();c?b.setQueryData(a.getQueryData().clone()):c=a.hasFragment();c&&b.setFragment(a.getFragment());return b};goog.Uri.prototype.clone=function(){return new goog.Uri(this)};goog.Uri.prototype.getScheme=function(){return this.scheme_};goog.Uri.prototype.setScheme=function(a,b){if(this.scheme_=b?goog.Uri.decodeOrEmpty_(a,!0):a)this.scheme_=this.scheme_.replace(/:$/,"");return this};goog.Uri.prototype.hasScheme=function(){return!!this.scheme_};goog.Uri.prototype.getUserInfo=function(){return this.userInfo_};
goog.Uri.prototype.setUserInfo=function(a,b){this.userInfo_=b?goog.Uri.decodeOrEmpty_(a):a;return this};goog.Uri.prototype.hasUserInfo=function(){return!!this.userInfo_};goog.Uri.prototype.getDomain=function(){return this.domain_};goog.Uri.prototype.setDomain=function(a,b){this.domain_=b?goog.Uri.decodeOrEmpty_(a,!0):a;return this};goog.Uri.prototype.hasDomain=function(){return!!this.domain_};goog.Uri.prototype.getPort=function(){return this.port_};
goog.Uri.prototype.setPort=function(a){if(a){a=Number(a);if(isNaN(a)||0>a)throw Error("Bad port number "+a);this.port_=a}else this.port_=null;return this};goog.Uri.prototype.hasPort=function(){return null!=this.port_};goog.Uri.prototype.getPath=function(){return this.path_};goog.Uri.prototype.setPath=function(a,b){this.path_=b?goog.Uri.decodeOrEmpty_(a,!0):a;return this};goog.Uri.prototype.hasPath=function(){return!!this.path_};goog.Uri.prototype.hasQuery=function(){return""!==this.queryData_.toString()};
goog.Uri.prototype.setQueryData=function(a,b){a instanceof goog.Uri.QueryData?this.queryData_=a:(b||(a=goog.Uri.encodeSpecialChars_(a,goog.Uri.reDisallowedInQuery_)),this.queryData_=new goog.Uri.QueryData(a,null));return this};goog.Uri.prototype.getEncodedQuery=function(){return this.queryData_.toString()};goog.Uri.prototype.getDecodedQuery=function(){return this.queryData_.toDecodedString()};goog.Uri.prototype.getQueryData=function(){return this.queryData_};goog.Uri.prototype.getFragment=function(){return this.fragment_};
goog.Uri.prototype.setFragment=function(a,b){this.fragment_=b?goog.Uri.decodeOrEmpty_(a):a;return this};goog.Uri.prototype.hasFragment=function(){return!!this.fragment_};
goog.Uri.removeDotSegments=function(a){if(".."==a||"."==a)return"";if(-1==a.indexOf("./")&&-1==a.indexOf("/."))return a;var b=0==a.lastIndexOf("/",0);a=a.split("/");for(var c=[],d=0;d<a.length;){var e=a[d++];"."==e?b&&d==a.length&&c.push(""):".."==e?((1<c.length||1==c.length&&""!=c[0])&&c.pop(),b&&d==a.length&&c.push("")):(c.push(e),b=!0)}return c.join("/")};goog.Uri.decodeOrEmpty_=function(a,b){return a?b?decodeURI(a):decodeURIComponent(a):""};
goog.Uri.encodeSpecialChars_=function(a,b,c){return goog.isString(a)?(a=encodeURI(a).replace(b,goog.Uri.encodeChar_),c&&(a=goog.Uri.removeDoubleEncoding_(a)),a):null};goog.Uri.encodeChar_=function(a){a=a.charCodeAt(0);return"%"+(a>>4&15).toString(16)+(a&15).toString(16)};goog.Uri.removeDoubleEncoding_=function(a){return a.replace(/%25([0-9a-fA-F]{2})/g,"%$1")};goog.Uri.reDisallowedInSchemeOrUserInfo_=/[#\/\?@]/g;goog.Uri.reDisallowedInRelativePath_=/[#\?:]/g;goog.Uri.reDisallowedInAbsolutePath_=/[#\?]/g;
goog.Uri.reDisallowedInQuery_=/[#\?@]/g;goog.Uri.reDisallowedInFragment_=/#/g;goog.Uri.QueryData=function(a,b){this.encodedQuery_=a||null};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_=function(){if(!this.keyMap_&&(this.keyMap_={},this.count_=0,this.encodedQuery_))for(var a=this.encodedQuery_.split("&"),b=0;b<a.length;b++){var c=a[b].indexOf("="),d=null;if(0<=c){var e=a[b].substring(0,c);d=a[b].substring(c+1)}else e=a[b];e=decodeURIComponent(e.replace(/\+/g," "));d=d||"";this.add(e,decodeURIComponent(d.replace(/\+/g," ")))}};goog.Uri.QueryData.prototype.keyMap_=null;goog.Uri.QueryData.prototype.count_=null;
goog.Uri.QueryData.prototype.getCount=function(){this.ensureKeyMapInitialized_();return this.count_};goog.Uri.QueryData.prototype.add=function(a,b){this.ensureKeyMapInitialized_();this.encodedQuery_=null;var c=this.keyMap_.hasOwnProperty(a)&&this.keyMap_[a];c||(this.keyMap_[a]=c=[]);c.push(b);this.count_++;return this};
goog.Uri.QueryData.prototype.toString=function(){if(this.encodedQuery_)return this.encodedQuery_;if(!this.keyMap_)return"";var a=[],b;for(b in this.keyMap_)for(var c=encodeURIComponent(b),d=this.keyMap_[b],e=0;e<d.length;e++){var f=c;""!==d[e]&&(f+="="+encodeURIComponent(d[e]));a.push(f)}return this.encodedQuery_=a.join("&")};goog.Uri.QueryData.prototype.toDecodedString=function(){return goog.Uri.decodeOrEmpty_(this.toString())};
goog.Uri.QueryData.prototype.clone=function(){var a=new goog.Uri.QueryData;a.encodedQuery_=this.encodedQuery_;if(this.keyMap_){var b={},c;for(c in this.keyMap_)b[c]=this.keyMap_[c].concat();a.keyMap_=b;a.count_=this.count_}return a};shaka.util={};shaka.util.DelayedTick=function(a){this.onTick_=a;this.cancelPending_=null};shaka.util.DelayedTick.prototype.tickAfter=function(a){var b=this;this.stop();var c=!0,d=null;this.cancelPending_=function(){window.clearTimeout(d);c=!1};d=window.setTimeout(function(){if(c)b.onTick_()},1E3*a);return this};shaka.util.DelayedTick.prototype.stop=function(){this.cancelPending_&&(this.cancelPending_(),this.cancelPending_=null)};shaka.util.Timer=function(a){this.onTick_=a;this.ticker_=null};goog.exportSymbol("shaka.util.Timer",shaka.util.Timer);shaka.util.Timer.prototype.tickNow=function(){this.stop();this.onTick_();return this};goog.exportProperty(shaka.util.Timer.prototype,"tickNow",shaka.util.Timer.prototype.tickNow);shaka.util.Timer.prototype.tickAfter=function(a){var b=this;this.stop();this.ticker_=(new shaka.util.DelayedTick(function(){b.onTick_()})).tickAfter(a);return this};
goog.exportProperty(shaka.util.Timer.prototype,"tickAfter",shaka.util.Timer.prototype.tickAfter);shaka.util.Timer.prototype.tickEvery=function(a){var b=this;this.stop();this.ticker_=(new shaka.util.DelayedTick(function(){b.ticker_.tickAfter(a);b.onTick_()})).tickAfter(a);return this};goog.exportProperty(shaka.util.Timer.prototype,"tickEvery",shaka.util.Timer.prototype.tickEvery);shaka.util.Timer.prototype.stop=function(){this.ticker_&&(this.ticker_.stop(),this.ticker_=null)};
goog.exportProperty(shaka.util.Timer.prototype,"stop",shaka.util.Timer.prototype.stop);shaka.net={};
shaka.net.Backoff=function(a,b){b=void 0===b?!1:b;var c=shaka.net.Backoff.defaultRetryParameters();this.maxAttempts_=null==a.maxAttempts?c.maxAttempts:a.maxAttempts;goog.asserts.assert(1<=this.maxAttempts_,"maxAttempts should be >= 1");this.baseDelay_=null==a.baseDelay?c.baseDelay:a.baseDelay;goog.asserts.assert(0<=this.baseDelay_,"baseDelay should be >= 0");this.fuzzFactor_=null==a.fuzzFactor?c.fuzzFactor:a.fuzzFactor;goog.asserts.assert(0<=this.fuzzFactor_,"fuzzFactor should be >= 0");this.backoffFactor_=
null==a.backoffFactor?c.backoffFactor:a.backoffFactor;goog.asserts.assert(0<=this.backoffFactor_,"backoffFactor should be >= 0");this.numAttempts_=0;this.nextUnfuzzedDelay_=this.baseDelay_;if(this.autoReset_=b)goog.asserts.assert(2<=this.maxAttempts_,"maxAttempts must be >= 2 for autoReset == true"),this.numAttempts_=1};
shaka.net.Backoff.prototype.attempt=function(){var a=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function c(){var d,e;return $jscomp.generator.createGenerator(c,function(c){switch(c.nextAddress){case 1:if(a.numAttempts_>=a.maxAttempts_)if(a.autoReset_)a.reset_();else return c["return"](Promise.reject());d=a.numAttempts_;a.numAttempts_++;if(0==d)return goog.asserts.assert(!a.autoReset_,"Failed to delay with auto-reset!"),c["return"]();e=shaka.net.Backoff.fuzz_(a.nextUnfuzzedDelay_,a.fuzzFactor_);
return c.yield(new Promise(function(a){shaka.net.Backoff.defer(e,a)}),2);case 2:a.nextUnfuzzedDelay_*=a.backoffFactor_,c.jumpToEnd()}})})};shaka.net.Backoff.defaultRetryParameters=function(){return{maxAttempts:2,baseDelay:1E3,backoffFactor:2,fuzzFactor:.5,timeout:0}};shaka.net.Backoff.fuzz_=function(a,b){return a*(1+(2*Math.random()-1)*b)};
shaka.net.Backoff.prototype.reset_=function(){goog.asserts.assert(this.autoReset_,"Should only be used for auto-reset!");this.numAttempts_=1;this.nextUnfuzzedDelay_=this.baseDelay_};shaka.net.Backoff.defer=function(a,b){(new shaka.util.Timer(b)).tickAfter(a/1E3)};shaka.util.Error=function(a,b,c,d){for(var e=[],f=3;f<arguments.length;++f)e[f-3]=arguments[f];this.severity=a;this.category=b;this.code=c;this.data=e;this.handled=!1;if(goog.DEBUG){f=e="UNKNOWN";for(var g in shaka.util.Error.Category)shaka.util.Error.Category[g]==this.category&&(e=g);for(var h in shaka.util.Error.Code)shaka.util.Error.Code[h]==this.code&&(f=h);this.message="Shaka Error "+e+"."+f+" ("+this.data.toString()+")";if(shaka.util.Error.createStack)try{throw Error(this.message);}catch(k){this.stack=
k.stack}}};goog.exportSymbol("shaka.util.Error",shaka.util.Error);shaka.util.Error.prototype.toString=function(){return"shaka.util.Error "+JSON.stringify(this,null,"  ")};goog.DEBUG&&(shaka.util.Error.createStack=!0);shaka.util.Error.Severity={RECOVERABLE:1,CRITICAL:2};goog.exportProperty(shaka.util.Error,"Severity",shaka.util.Error.Severity);shaka.util.Error.Category={NETWORK:1,TEXT:2,MEDIA:3,MANIFEST:4,STREAMING:5,DRM:6,PLAYER:7,CAST:8,STORAGE:9};
goog.exportProperty(shaka.util.Error,"Category",shaka.util.Error.Category);
shaka.util.Error.Code={UNSUPPORTED_SCHEME:1E3,BAD_HTTP_STATUS:1001,HTTP_ERROR:1002,TIMEOUT:1003,MALFORMED_DATA_URI:1004,UNKNOWN_DATA_URI_ENCODING:1005,REQUEST_FILTER_ERROR:1006,RESPONSE_FILTER_ERROR:1007,MALFORMED_TEST_URI:1008,UNEXPECTED_TEST_REQUEST:1009,INVALID_TEXT_HEADER:2E3,INVALID_TEXT_CUE:2001,UNABLE_TO_DETECT_ENCODING:2003,BAD_ENCODING:2004,INVALID_XML:2005,INVALID_MP4_TTML:2007,INVALID_MP4_VTT:2008,UNABLE_TO_EXTRACT_CUE_START_TIME:2009,BUFFER_READ_OUT_OF_BOUNDS:3E3,JS_INTEGER_OVERFLOW:3001,
EBML_OVERFLOW:3002,EBML_BAD_FLOATING_POINT_SIZE:3003,MP4_SIDX_WRONG_BOX_TYPE:3004,MP4_SIDX_INVALID_TIMESCALE:3005,MP4_SIDX_TYPE_NOT_SUPPORTED:3006,WEBM_CUES_ELEMENT_MISSING:3007,WEBM_EBML_HEADER_ELEMENT_MISSING:3008,WEBM_SEGMENT_ELEMENT_MISSING:3009,WEBM_INFO_ELEMENT_MISSING:3010,WEBM_DURATION_ELEMENT_MISSING:3011,WEBM_CUE_TRACK_POSITIONS_ELEMENT_MISSING:3012,WEBM_CUE_TIME_ELEMENT_MISSING:3013,MEDIA_SOURCE_OPERATION_FAILED:3014,MEDIA_SOURCE_OPERATION_THREW:3015,VIDEO_ERROR:3016,QUOTA_EXCEEDED_ERROR:3017,
TRANSMUXING_FAILED:3018,UNABLE_TO_GUESS_MANIFEST_TYPE:4E3,DASH_INVALID_XML:4001,DASH_NO_SEGMENT_INFO:4002,DASH_EMPTY_ADAPTATION_SET:4003,DASH_EMPTY_PERIOD:4004,DASH_WEBM_MISSING_INIT:4005,DASH_UNSUPPORTED_CONTAINER:4006,DASH_PSSH_BAD_ENCODING:4007,DASH_NO_COMMON_KEY_SYSTEM:4008,DASH_MULTIPLE_KEY_IDS_NOT_SUPPORTED:4009,DASH_CONFLICTING_KEY_IDS:4010,UNPLAYABLE_PERIOD:4011,RESTRICTIONS_CANNOT_BE_MET:4012,NO_PERIODS:4014,HLS_PLAYLIST_HEADER_MISSING:4015,INVALID_HLS_TAG:4016,HLS_INVALID_PLAYLIST_HIERARCHY:4017,
DASH_DUPLICATE_REPRESENTATION_ID:4018,HLS_MULTIPLE_MEDIA_INIT_SECTIONS_FOUND:4020,HLS_COULD_NOT_GUESS_MIME_TYPE:4021,HLS_MASTER_PLAYLIST_NOT_PROVIDED:4022,HLS_REQUIRED_ATTRIBUTE_MISSING:4023,HLS_REQUIRED_TAG_MISSING:4024,HLS_COULD_NOT_GUESS_CODECS:4025,HLS_KEYFORMATS_NOT_SUPPORTED:4026,DASH_UNSUPPORTED_XLINK_ACTUATE:4027,DASH_XLINK_DEPTH_LIMIT:4028,HLS_COULD_NOT_PARSE_SEGMENT_START_TIME:4030,CONTENT_UNSUPPORTED_BY_BROWSER:4032,CANNOT_ADD_EXTERNAL_TEXT_TO_LIVE_STREAM:4033,HLS_AES_128_ENCRYPTION_NOT_SUPPORTED:4034,
INVALID_STREAMS_CHOSEN:5005,NO_RECOGNIZED_KEY_SYSTEMS:6E3,REQUESTED_KEY_SYSTEM_CONFIG_UNAVAILABLE:6001,FAILED_TO_CREATE_CDM:6002,FAILED_TO_ATTACH_TO_VIDEO:6003,INVALID_SERVER_CERTIFICATE:6004,FAILED_TO_CREATE_SESSION:6005,FAILED_TO_GENERATE_LICENSE_REQUEST:6006,LICENSE_REQUEST_FAILED:6007,LICENSE_RESPONSE_REJECTED:6008,ENCRYPTED_CONTENT_WITHOUT_DRM_INFO:6010,NO_LICENSE_SERVER_GIVEN:6012,OFFLINE_SESSION_REMOVED:6013,EXPIRED:6014,SERVER_CERTIFICATE_REQUIRED:6015,INIT_DATA_TRANSFORM_ERROR:6016,LOAD_INTERRUPTED:7E3,
OPERATION_ABORTED:7001,NO_VIDEO_ELEMENT:7002,CAST_API_UNAVAILABLE:8E3,NO_CAST_RECEIVERS:8001,ALREADY_CASTING:8002,UNEXPECTED_CAST_ERROR:8003,CAST_CANCELED_BY_USER:8004,CAST_CONNECTION_TIMED_OUT:8005,CAST_RECEIVER_APP_UNAVAILABLE:8006,CAST_RECEIVER_APP_ID_MISSING:8007,STORAGE_NOT_SUPPORTED:9E3,INDEXED_DB_ERROR:9001,DEPRECATED_OPERATION_ABORTED:9002,REQUESTED_ITEM_NOT_FOUND:9003,MALFORMED_OFFLINE_URI:9004,CANNOT_STORE_LIVE_OFFLINE:9005,STORE_ALREADY_IN_PROGRESS:9006,NO_INIT_DATA_FOR_OFFLINE:9007,LOCAL_PLAYER_INSTANCE_REQUIRED:9008,
NEW_KEY_OPERATION_NOT_SUPPORTED:9011,KEY_NOT_FOUND:9012,MISSING_STORAGE_CELL:9013};goog.exportProperty(shaka.util.Error,"Code",shaka.util.Error.Code);shaka.util.PublicPromise=function(){var a,b,c=new Promise(function(c,e){a=c;b=e});c.resolve=a;c.reject=b;return c};shaka.util.PublicPromise.prototype.resolve=function(a){};shaka.util.PublicPromise.prototype.reject=function(a){};shaka.util.AbortableOperation=function(a,b){this.promise=a;this.onAbort_=b;this.aborted_=!1};goog.exportSymbol("shaka.util.AbortableOperation",shaka.util.AbortableOperation);shaka.util.AbortableOperation.failed=function(a){return new shaka.util.AbortableOperation(Promise.reject(a),function(){return Promise.resolve()})};goog.exportProperty(shaka.util.AbortableOperation,"failed",shaka.util.AbortableOperation.failed);
shaka.util.AbortableOperation.aborted=function(){var a=Promise.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.PLAYER,shaka.util.Error.Code.OPERATION_ABORTED));a["catch"](function(){});return new shaka.util.AbortableOperation(a,function(){return Promise.resolve()})};goog.exportProperty(shaka.util.AbortableOperation,"aborted",shaka.util.AbortableOperation.aborted);
shaka.util.AbortableOperation.completed=function(a){return new shaka.util.AbortableOperation(Promise.resolve(a),function(){return Promise.resolve()})};goog.exportProperty(shaka.util.AbortableOperation,"completed",shaka.util.AbortableOperation.completed);shaka.util.AbortableOperation.notAbortable=function(a){return new shaka.util.AbortableOperation(a,function(){return a["catch"](function(){})})};goog.exportProperty(shaka.util.AbortableOperation,"notAbortable",shaka.util.AbortableOperation.notAbortable);
shaka.util.AbortableOperation.prototype.abort=function(){this.aborted_=!0;return this.onAbort_()};goog.exportProperty(shaka.util.AbortableOperation.prototype,"abort",shaka.util.AbortableOperation.prototype.abort);shaka.util.AbortableOperation.all=function(a){return new shaka.util.AbortableOperation(Promise.all(a.map(function(a){return a.promise})),function(){return Promise.all(a.map(function(a){return a.abort()}))})};goog.exportProperty(shaka.util.AbortableOperation,"all",shaka.util.AbortableOperation.all);
shaka.util.AbortableOperation.prototype["finally"]=function(a){this.promise.then(function(b){return a(!0)},function(b){return a(!1)});return this};goog.exportProperty(shaka.util.AbortableOperation.prototype,"finally",shaka.util.AbortableOperation.prototype["finally"]);
shaka.util.AbortableOperation.prototype.chain=function(a,b){var c=this,d=new shaka.util.PublicPromise,e=function(){d.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.PLAYER,shaka.util.Error.Code.OPERATION_ABORTED));return c.abort()};this.promise.then(function(b){c.aborted_?d.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.PLAYER,shaka.util.Error.Code.OPERATION_ABORTED)):a?e=shaka.util.AbortableOperation.wrapChainCallback_(a,
b,d):d.resolve(b)},function(a){b?e=shaka.util.AbortableOperation.wrapChainCallback_(b,a,d):d.reject(a)});return new shaka.util.AbortableOperation(d,function(){return e()})};goog.exportProperty(shaka.util.AbortableOperation.prototype,"chain",shaka.util.AbortableOperation.prototype.chain);
shaka.util.AbortableOperation.wrapChainCallback_=function(a,b,c){try{var d=a(b);if(d&&d.promise&&d.abort)return c.resolve(d.promise),function(){return d.abort()};c.resolve(d);return function(){return Promise.resolve(d).then(function(){})["catch"](function(){})}}catch(e){return c.reject(e),function(){return Promise.resolve()}}};shaka.util.FakeEvent=function(a,b){b=void 0===b?{}:b;for(var c in b)this[c]=b[c];this.defaultPrevented=this.cancelable=this.bubbles=!1;this.timeStamp=window.performance&&window.performance.now?window.performance.now():Date.now();this.type=a;this.isTrusted=!1;this.target=this.currentTarget=null;this.stopped=!1};shaka.util.FakeEvent.prototype.preventDefault=function(){this.cancelable&&(this.defaultPrevented=!0)};shaka.util.FakeEvent.prototype.stopImmediatePropagation=function(){this.stopped=!0};
shaka.util.FakeEvent.prototype.stopPropagation=function(){};shaka.util.MultiMap=function(){this.map_={}};shaka.util.MultiMap.prototype.push=function(a,b){this.map_.hasOwnProperty(a)?this.map_[a].push(b):this.map_[a]=[b]};shaka.util.MultiMap.prototype.get=function(a){return(a=this.map_[a])?a.slice():null};shaka.util.MultiMap.prototype.getAll=function(){var a=[],b;for(b in this.map_)a.push.apply(a,this.map_[b]);return a};shaka.util.MultiMap.prototype.remove=function(a,b){var c=this.map_[a];if(c)for(var d=0;d<c.length;++d)c[d]==b&&(c.splice(d,1),--d)};
shaka.util.MultiMap.prototype.clear=function(){this.map_={}};shaka.util.MultiMap.prototype.forEach=function(a){for(var b in this.map_)a(b,this.map_[b])};shaka.util.FakeEventTarget=function(){this.listeners_=new shaka.util.MultiMap;this.dispatchTarget=this};shaka.util.FakeEventTarget.prototype.addEventListener=function(a,b,c){this.listeners_.push(a,b)};shaka.util.FakeEventTarget.prototype.removeEventListener=function(a,b,c){this.listeners_.remove(a,b)};
shaka.util.FakeEventTarget.prototype.dispatchEvent=function(a){goog.asserts.assert(a instanceof shaka.util.FakeEvent,"FakeEventTarget can only dispatch FakeEvents!");for(var b=this.listeners_.get(a.type)||[],c=0;c<b.length;++c){a.target=this.dispatchTarget;a.currentTarget=this.dispatchTarget;var d=b[c];try{d.handleEvent?d.handleEvent(a):d.call(this,a)}catch(e){shaka.log.error("Uncaught exception in event handler",e,e?e.message:null,e?e.stack:null)}if(a.stopped)break}return a.defaultPrevented};shaka.util.IDestroyable=function(){};shaka.util.IDestroyable.prototype.destroy=function(){};shaka.util.ObjectUtils=function(){};shaka.util.ObjectUtils.cloneObject=function(a){var b=new Set,c=function(a){switch(typeof a){case "undefined":case "boolean":case "number":case "string":case "symbol":case "function":return a;default:if(!a||a.buffer&&a.buffer.constructor==ArrayBuffer)return a;if(b.has(a))return null;var d=a.constructor==Array;if(a.constructor!=Object&&!d)return null;b.add(a);var f=d?[]:{},g;for(g in a)f[g]=c(a[g]);d&&(f.length=a.length);return f}};return c(a)};shaka.util.ArrayUtils={};shaka.util.ArrayUtils.defaultEquals=function(a,b){return"number"===typeof a&&"number"===typeof b&&isNaN(a)&&isNaN(b)?!0:a===b};shaka.util.ArrayUtils.remove=function(a,b){var c=a.indexOf(b);-1<c&&a.splice(c,1)};shaka.util.ArrayUtils.count=function(a,b){var c=0;a.forEach(function(a){c+=b(a)?1:0});return c};
shaka.util.ArrayUtils.hasSameElements=function(a,b,c){c||(c=shaka.util.ArrayUtils.defaultEquals);if(a.length!=b.length)return!1;b=b.slice();var d={};a=$jscomp.makeIterator(a);for(var e=a.next();!e.done;d={item:d.item},e=a.next()){d.item=e.value;e=b.findIndex(function(a){return function(b){return c(a.item,b)}}(d));if(-1==e)return!1;b[e]=b[b.length-1];b.pop()}return 0==b.length};shaka.util.OperationManager=function(){this.operations_=[]};shaka.util.OperationManager.prototype.manage=function(a){var b=this;this.operations_.push(a["finally"](function(){shaka.util.ArrayUtils.remove(b.operations_,a)}))};shaka.util.OperationManager.prototype.destroy=function(){var a=[];this.operations_.forEach(function(b){b.promise["catch"](function(){});a.push(b.abort())});this.operations_=[];return Promise.all(a)};shaka.net.NetworkingEngine=function(a){shaka.util.FakeEventTarget.call(this);this.destroyed_=!1;this.operationManager_=new shaka.util.OperationManager;this.requestFilters_=new Set;this.responseFilters_=new Set;this.onProgressUpdated_=a||null};goog.inherits(shaka.net.NetworkingEngine,shaka.util.FakeEventTarget);goog.exportSymbol("shaka.net.NetworkingEngine",shaka.net.NetworkingEngine);shaka.net.NetworkingEngine.RequestType={MANIFEST:0,SEGMENT:1,LICENSE:2,APP:3,TIMING:4};
goog.exportProperty(shaka.net.NetworkingEngine,"RequestType",shaka.net.NetworkingEngine.RequestType);shaka.net.NetworkingEngine.PluginPriority={FALLBACK:1,PREFERRED:2,APPLICATION:3};goog.exportProperty(shaka.net.NetworkingEngine,"PluginPriority",shaka.net.NetworkingEngine.PluginPriority);shaka.net.NetworkingEngine.schemes_={};
shaka.net.NetworkingEngine.registerScheme=function(a,b,c){goog.asserts.assert(void 0==c||0<c,"explicit priority must be > 0");c=c||shaka.net.NetworkingEngine.PluginPriority.APPLICATION;var d=shaka.net.NetworkingEngine.schemes_[a];if(!d||c>=d.priority)shaka.net.NetworkingEngine.schemes_[a]={priority:c,plugin:b}};goog.exportProperty(shaka.net.NetworkingEngine,"registerScheme",shaka.net.NetworkingEngine.registerScheme);shaka.net.NetworkingEngine.unregisterScheme=function(a){delete shaka.net.NetworkingEngine.schemes_[a]};
goog.exportProperty(shaka.net.NetworkingEngine,"unregisterScheme",shaka.net.NetworkingEngine.unregisterScheme);shaka.net.NetworkingEngine.prototype.registerRequestFilter=function(a){this.requestFilters_.add(a)};goog.exportProperty(shaka.net.NetworkingEngine.prototype,"registerRequestFilter",shaka.net.NetworkingEngine.prototype.registerRequestFilter);shaka.net.NetworkingEngine.prototype.unregisterRequestFilter=function(a){this.requestFilters_["delete"](a)};
goog.exportProperty(shaka.net.NetworkingEngine.prototype,"unregisterRequestFilter",shaka.net.NetworkingEngine.prototype.unregisterRequestFilter);shaka.net.NetworkingEngine.prototype.clearAllRequestFilters=function(){this.requestFilters_.clear()};goog.exportProperty(shaka.net.NetworkingEngine.prototype,"clearAllRequestFilters",shaka.net.NetworkingEngine.prototype.clearAllRequestFilters);shaka.net.NetworkingEngine.prototype.registerResponseFilter=function(a){this.responseFilters_.add(a)};
goog.exportProperty(shaka.net.NetworkingEngine.prototype,"registerResponseFilter",shaka.net.NetworkingEngine.prototype.registerResponseFilter);shaka.net.NetworkingEngine.prototype.unregisterResponseFilter=function(a){this.responseFilters_["delete"](a)};goog.exportProperty(shaka.net.NetworkingEngine.prototype,"unregisterResponseFilter",shaka.net.NetworkingEngine.prototype.unregisterResponseFilter);shaka.net.NetworkingEngine.prototype.clearAllResponseFilters=function(){this.responseFilters_.clear()};
goog.exportProperty(shaka.net.NetworkingEngine.prototype,"clearAllResponseFilters",shaka.net.NetworkingEngine.prototype.clearAllResponseFilters);shaka.net.NetworkingEngine.defaultRetryParameters=shaka.net.Backoff.defaultRetryParameters;shaka.net.NetworkingEngine.makeRequest=function(a,b){return{uris:a,method:"GET",body:null,headers:{},allowCrossSiteCredentials:!1,retryParameters:b,licenseRequestType:null,sessionId:null,loadedBytes:0}};
shaka.net.NetworkingEngine.prototype.destroy=function(){this.destroyed_=!0;this.requestFilters_.clear();this.responseFilters_.clear();return this.operationManager_.destroy()};goog.exportProperty(shaka.net.NetworkingEngine.prototype,"destroy",shaka.net.NetworkingEngine.prototype.destroy);
shaka.net.NetworkingEngine.prototype.request=function(a,b,c){var d=this,e=shaka.util.ObjectUtils,f=new shaka.net.NetworkingEngine.NumBytesRemainingClass;if(this.destroyed_)return e=Promise.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.PLAYER,shaka.util.Error.Code.OPERATION_ABORTED)),e["catch"](function(){}),new shaka.net.NetworkingEngine.PendingRequest(e,function(){return Promise.resolve()},f);goog.asserts.assert(b.uris&&b.uris.length,"Request without URIs!");
b.method=b.method||"GET";b.headers=b.headers||{};b.retryParameters=b.retryParameters?e.cloneObject(b.retryParameters):shaka.net.NetworkingEngine.defaultRetryParameters();b.uris=e.cloneObject(b.uris);e=this.filterRequest_(a,b);var g=e.chain(function(){return d.makeRequestWithRetry_(a,b,f,c)}),h=g.chain(function(b){return d.filterResponse_(a,b)}),k=Date.now(),l=0;e.promise.then(function(){l=Date.now()-k},function(){});var m=0;g.promise.then(function(){m=Date.now()},function(){});e=h.chain(function(b){var e=
Date.now()-m,f=b.response;f.timeMs+=l;f.timeMs+=e;b.gotProgress||!d.onProgressUpdated_||f.fromCache||a!=shaka.net.NetworkingEngine.RequestType.SEGMENT||(d.onProgressUpdated_(f.timeMs,f.data.byteLength),c&&c(f.timeMs,f.data.byteLength,0,f.data));return f},function(a){a&&(goog.asserts.assert(a instanceof shaka.util.Error,"Wrong error type"),a.severity=shaka.util.Error.Severity.CRITICAL);throw a;});e=new shaka.net.NetworkingEngine.PendingRequest(e.promise,e.onAbort_,f);this.operationManager_.manage(e);
return e};goog.exportProperty(shaka.net.NetworkingEngine.prototype,"request",shaka.net.NetworkingEngine.prototype.request);
shaka.net.NetworkingEngine.prototype.filterRequest_=function(a,b){for(var c=shaka.util.AbortableOperation.completed(void 0),d={},e=$jscomp.makeIterator(this.requestFilters_),f=e.next();!f.done;d={requestFilter:d.requestFilter},f=e.next())d.requestFilter=f.value,c=c.chain(function(c){return function(){return c.requestFilter(a,b)}}(d));return c.chain(void 0,function(a){if(a&&a.code==shaka.util.Error.Code.OPERATION_ABORTED)throw a;throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.NETWORK,
shaka.util.Error.Code.REQUEST_FILTER_ERROR,a);})};shaka.net.NetworkingEngine.prototype.makeRequestWithRetry_=function(a,b,c,d){var e=new shaka.net.Backoff(b.retryParameters,!1);return this.send_(a,b,e,0,null,c,d)};
shaka.net.NetworkingEngine.prototype.send_=function(a,b,c,d,e,f,g){var h=this,k=new goog.Uri(b.uris[d]),l=k.getScheme(),m=!1;l||(l=shaka.net.NetworkingEngine.getLocationProtocol_(),goog.asserts.assert(":"==l[l.length-1],"location.protocol expected to end with a colon!"),l=l.slice(0,-1),k.setScheme(l),b.uris[d]=k.toString());var n=(l=shaka.net.NetworkingEngine.schemes_[l])?l.plugin:null;if(!n)return shaka.util.AbortableOperation.failed(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.NETWORK,
shaka.util.Error.Code.UNSUPPORTED_SCHEME,k));var q;return shaka.util.AbortableOperation.notAbortable(c.attempt()).chain(function(){if(h.destroyed_)return shaka.util.AbortableOperation.aborted();q=Date.now();var c=shaka.net.NetworkingEngine.RequestType.SEGMENT;0<b.loadedBytes&&(b.headers.Range="bytes="+b.loadedBytes+"-");return n(b.uris[d],b,a,function(d,e,k,l){h.onProgressUpdated_&&a==c&&(h.onProgressUpdated_(d,e),m=!0,f.setBytes(k),g&&(b.loadedBytes+=e,g(d,e,k,l)))})}).chain(function(a){void 0==
a.timeMs&&(a.timeMs=Date.now()-q);return{response:a,gotProgress:m}},function(k){if(k&&k.code==shaka.util.Error.Code.OPERATION_ABORTED)throw k;if(h.destroyed_)return shaka.util.AbortableOperation.aborted();if(k&&k.severity==shaka.util.Error.Severity.RECOVERABLE){var l=new shaka.util.FakeEvent("retry",{error:k instanceof shaka.util.Error?k:null});h.dispatchEvent(l);d=(d+1)%b.uris.length;return h.send_(a,b,c,d,k,f,g)}throw k||e;})};
shaka.net.NetworkingEngine.prototype.filterResponse_=function(a,b){for(var c=shaka.util.AbortableOperation.completed(void 0),d=$jscomp.makeIterator(this.responseFilters_),e=d.next();!e.done;e=d.next())c=c.chain(e.value.bind(null,a,b.response));return c.chain(function(){return b},function(a){if(a&&a.code==shaka.util.Error.Code.OPERATION_ABORTED)throw a;var b=shaka.util.Error.Severity.CRITICAL;a instanceof shaka.util.Error&&(b=a.severity);throw new shaka.util.Error(b,shaka.util.Error.Category.NETWORK,
shaka.util.Error.Code.RESPONSE_FILTER_ERROR,a);})};shaka.net.NetworkingEngine.getLocationProtocol_=function(){return location.protocol};shaka.net.NetworkingEngine.NumBytesRemainingClass=function(){this.bytesToLoad_=0};goog.exportProperty(shaka.net.NetworkingEngine,"NumBytesRemainingClass",shaka.net.NetworkingEngine.NumBytesRemainingClass);shaka.net.NetworkingEngine.NumBytesRemainingClass.prototype.setBytes=function(a){this.bytesToLoad_=a};
shaka.net.NetworkingEngine.NumBytesRemainingClass.prototype.getBytes=function(){return this.bytesToLoad_};shaka.net.NetworkingEngine.PendingRequest=function(a,b,c){shaka.util.AbortableOperation.call(this,a,b);this.bytesRemaining_=c};$jscomp.inherits(shaka.net.NetworkingEngine.PendingRequest,shaka.util.AbortableOperation);goog.exportProperty(shaka.net.NetworkingEngine,"PendingRequest",shaka.net.NetworkingEngine.PendingRequest);shaka.net.NetworkingEngine.PendingRequest.wrapChainCallback_=shaka.util.AbortableOperation.wrapChainCallback_;
shaka.net.NetworkingEngine.PendingRequest.all=shaka.util.AbortableOperation.all;goog.exportProperty(shaka.net.NetworkingEngine.PendingRequest,"all",shaka.net.NetworkingEngine.PendingRequest.all);shaka.net.NetworkingEngine.PendingRequest.notAbortable=shaka.util.AbortableOperation.notAbortable;goog.exportProperty(shaka.net.NetworkingEngine.PendingRequest,"notAbortable",shaka.net.NetworkingEngine.PendingRequest.notAbortable);shaka.net.NetworkingEngine.PendingRequest.completed=shaka.util.AbortableOperation.completed;
goog.exportProperty(shaka.net.NetworkingEngine.PendingRequest,"completed",shaka.net.NetworkingEngine.PendingRequest.completed);shaka.net.NetworkingEngine.PendingRequest.aborted=shaka.util.AbortableOperation.aborted;goog.exportProperty(shaka.net.NetworkingEngine.PendingRequest,"aborted",shaka.net.NetworkingEngine.PendingRequest.aborted);shaka.net.NetworkingEngine.PendingRequest.failed=shaka.util.AbortableOperation.failed;goog.exportProperty(shaka.net.NetworkingEngine.PendingRequest,"failed",shaka.net.NetworkingEngine.PendingRequest.failed);
shaka.net.NetworkingEngine.PendingRequest.prototype.getBytesRemaining=function(){return this.bytesRemaining_.getBytes()};shaka.util.IReleasable=function(){};goog.exportSymbol("shaka.util.IReleasable",shaka.util.IReleasable);shaka.util.IReleasable.prototype.release=function(){};shaka.util.EventManager=function(){this.bindingMap_=new shaka.util.MultiMap};goog.exportSymbol("shaka.util.EventManager",shaka.util.EventManager);shaka.util.EventManager.prototype.release=function(){this.removeAll();this.bindingMap_=null};goog.exportProperty(shaka.util.EventManager.prototype,"release",shaka.util.EventManager.prototype.release);shaka.util.EventManager.prototype.listen=function(a,b,c,d){this.bindingMap_&&(a=new shaka.util.EventManager.Binding_(a,b,c,d),this.bindingMap_.push(b,a))};
goog.exportProperty(shaka.util.EventManager.prototype,"listen",shaka.util.EventManager.prototype.listen);shaka.util.EventManager.prototype.listenOnce=function(a,b,c,d){var e=this,f=function(d){e.unlisten(a,b,f);c(d)};this.listen(a,b,f,d)};goog.exportProperty(shaka.util.EventManager.prototype,"listenOnce",shaka.util.EventManager.prototype.listenOnce);
shaka.util.EventManager.prototype.unlisten=function(a,b,c){if(this.bindingMap_){var d=this.bindingMap_.get(b)||[];d=$jscomp.makeIterator(d);for(var e=d.next();!e.done;e=d.next())e=e.value,e.target!=a||c!=e.listener&&c||(e.unlisten(),this.bindingMap_.remove(b,e))}};goog.exportProperty(shaka.util.EventManager.prototype,"unlisten",shaka.util.EventManager.prototype.unlisten);
shaka.util.EventManager.prototype.removeAll=function(){if(this.bindingMap_){var a=this.bindingMap_.getAll();a=$jscomp.makeIterator(a);for(var b=a.next();!b.done;b=a.next())b.value.unlisten();this.bindingMap_.clear()}};goog.exportProperty(shaka.util.EventManager.prototype,"removeAll",shaka.util.EventManager.prototype.removeAll);
shaka.util.EventManager.Binding_=function(a,b,c,d){this.target=a;this.type=b;this.listener=c;this.options=shaka.util.EventManager.Binding_.convertOptions_(a,d);this.target.addEventListener(b,c,this.options)};shaka.util.EventManager.Binding_.prototype.unlisten=function(){goog.asserts.assert(this.target,"Missing target");this.target.removeEventListener(this.type,this.listener,this.options);this.listener=this.target=null;this.options=!1};
goog.exportProperty(shaka.util.EventManager.Binding_.prototype,"unlisten",shaka.util.EventManager.Binding_.prototype.unlisten);shaka.util.EventManager.Binding_.convertOptions_=function(a,b){if(void 0==b)return!1;if("boolean"==typeof b)return b;var c=new Set(["passive","capture"]),d=Object.keys(b).filter(function(a){return!c.has(a)});goog.asserts.assert(0==d.length,"Unsupported flag(s) to addEventListener: "+d.join(","));return shaka.util.EventManager.Binding_.doesSupportObject_(a)?b:b.capture||!1};
shaka.util.EventManager.Binding_.doesSupportObject_=function(a){var b=shaka.util.EventManager.Binding_.supportsObject_;if(void 0==b){b=!1;try{var c={},d={get:function(){b=!0;return!1}};Object.defineProperty(c,"passive",d);Object.defineProperty(c,"capture",d);d=function(){};a.addEventListener("test",d,c);a.removeEventListener("test",d,c)}catch(e){b=!1}shaka.util.EventManager.Binding_.supportsObject_=b}return b||!1};shaka.util.EventManager.Binding_.supportsObject_=void 0;shaka.util.FairPlayUtils=function(){};shaka.util.FairPlayUtils.defaultGetContentId=function(a){a=new Uint8Array(a);if((new DataView(a.buffer,a.byteOffset,a.byteLength)).getUint32(0,!0)+4!=a.byteLength)throw new RangeError("Malformed FairPlay init data");a=shaka.util.StringUtils.fromUTF16(a.subarray(4),!0);return(new goog.Uri(a)).getDomain()};goog.exportSymbol("shaka.util.FairPlayUtils.defaultGetContentId",shaka.util.FairPlayUtils.defaultGetContentId);
shaka.util.FairPlayUtils.initDataTransform=function(a,b,c){if(!c||!c.byteLength)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.SERVER_CERTIFICATE_REQUIRED);b="string"==typeof b?new Uint8Array(shaka.util.StringUtils.toUTF16(b,!0)):new Uint8Array(b);var d=new Uint8Array(8+a.byteLength+b.byteLength+c.byteLength),e=0,f=function(a){d.set(a,e);e+=a.byteLength},g=function(a){(new DataView(d.buffer)).setUint32(e,a.byteLength,!0);e+=4;f(a)};
f(new Uint8Array(a));g(b);g(new Uint8Array(c));return d};goog.exportSymbol("shaka.util.FairPlayUtils.initDataTransform",shaka.util.FairPlayUtils.initDataTransform);shaka.util.Iterables=function(){};shaka.util.Iterables.map=function(a,b){for(var c=[],d=$jscomp.makeIterator(a),e=d.next();!e.done;e=d.next())c.push(b(e.value));return c};shaka.util.Iterables.every=function(a,b){for(var c=$jscomp.makeIterator(a),d=c.next();!d.done;d=c.next())if(!b(d.value))return!1;return!0};shaka.util.Iterables.some=function(a,b){for(var c=$jscomp.makeIterator(a),d=c.next();!d.done;d=c.next())if(b(d.value))return!0;return!1};
shaka.util.Iterables.filter=function(a,b){for(var c=[],d=$jscomp.makeIterator(a),e=d.next();!e.done;e=d.next())e=e.value,b(e)&&c.push(e);return c};shaka.util.MapUtils={};shaka.util.MapUtils.asMap=function(a){var b=new Map;Object.keys(a).forEach(function(c){b.set(c,a[c])});return b};shaka.util.MapUtils.asObject=function(a){var b={};a.forEach(function(a,d){b[d]=a});return b};shaka.util.MimeUtils=function(){};shaka.util.MimeUtils.getFullType=function(a,b){var c=a;b&&(c+='; codecs="'+b+'"');return c};shaka.util.MimeUtils.getExtendedType=function(a){var b=[a.mimeType];shaka.util.MimeUtils.EXTENDED_MIME_PARAMETERS_.forEach(function(c,d){var e=a[d];e&&b.push(c+'="'+e+'"')});return b.join(";")};shaka.util.MimeUtils.splitCodecs=function(a){return a.split(",")};shaka.util.MimeUtils.getCodecBase=function(a){return shaka.util.MimeUtils.getCodecParts_(a)[0]};
shaka.util.MimeUtils.getCodecParts_=function(a){var b=a.split(".");a=b[0];b.pop();b=b.join(".");return[a,b]};shaka.util.MimeUtils.EXTENDED_MIME_PARAMETERS_=(new Map).set("codecs","codecs").set("frameRate","framerate").set("bandwidth","bitrate").set("width","width").set("height","height").set("channelsCount","channels");shaka.util.MimeUtils.CLOSED_CAPTION_MIMETYPE="application/cea-608";shaka.util.Platform=function(){};shaka.util.Platform.supportsMediaSource=function(){return window.MediaSource&&MediaSource.isTypeSupported?!0:!1};shaka.util.Platform.supportsMediaType=function(a){return""!=shaka.util.Platform.anyMediaElement_().canPlayType(a)};shaka.util.Platform.isEdge=function(){return shaka.util.Platform.userAgentContains_("Edge/")};shaka.util.Platform.isIE=function(){return shaka.util.Platform.userAgentContains_("Trident/")};shaka.util.Platform.isTizen=function(){return shaka.util.Platform.userAgentContains_("Tizen")};
shaka.util.Platform.isTizen3=function(){return shaka.util.Platform.userAgentContains_("Tizen 3")};shaka.util.Platform.isWebOS=function(){return shaka.util.Platform.userAgentContains_("Web0S")};shaka.util.Platform.isChromecast=function(){return shaka.util.Platform.userAgentContains_("CrKey")};shaka.util.Platform.isChrome=function(){return shaka.util.Platform.userAgentContains_("Chrome")&&!shaka.util.Platform.isEdge()};shaka.util.Platform.isApple=function(){return!!navigator.vendor&&navigator.vendor.includes("Apple")};
shaka.util.Platform.isMobile=function(){return/(?:iPhone|iPad|iPod|Android)/.test(navigator.userAgent)};shaka.util.Platform.userAgentContains_=function(a){return(navigator.userAgent||"").includes(a)};
shaka.util.Platform.anyMediaElement_=function(){var a=shaka.util.Platform;if(a.cachedMediaElement_)return a.cachedMediaElement_;a.cacheExpirationTimer_||(a.cacheExpirationTimer_=new shaka.util.Timer(function(){a.cachedMediaElement_=null}));a.cachedMediaElement_=document.querySelector("video")||document.querySelector("audio");a.cachedMediaElement_||(a.cachedMediaElement_=document.createElement("video"));a.cacheExpirationTimer_.tickAfter(1);return a.cachedMediaElement_};
shaka.util.Platform.cacheExpirationTimer_=null;shaka.util.Platform.cachedMediaElement_=null;shaka.util.StringUtils={};shaka.util.StringUtils.fromUTF8=function(a){if(!a)return"";a=new Uint8Array(a);239==a[0]&&187==a[1]&&191==a[2]&&(a=a.subarray(3));a=shaka.util.StringUtils.fromCharCode(a);a=escape(a);try{return decodeURIComponent(a)}catch(b){throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.BAD_ENCODING);}};goog.exportSymbol("shaka.util.StringUtils.fromUTF8",shaka.util.StringUtils.fromUTF8);
shaka.util.StringUtils.fromUTF16=function(a,b,c){if(!a)return"";if(!c&&0!=a.byteLength%2)throw shaka.log.error("Data has an incorrect length, must be even."),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.BAD_ENCODING);if(a instanceof ArrayBuffer)var d=a;else c=new Uint8Array(a.byteLength),c.set(new Uint8Array(a)),d=c.buffer;a=Math.floor(a.byteLength/2);c=new Uint16Array(a);d=new DataView(d);for(var e=0;e<a;e++)c[e]=d.getUint16(2*e,b);
return shaka.util.StringUtils.fromCharCode(c)};goog.exportSymbol("shaka.util.StringUtils.fromUTF16",shaka.util.StringUtils.fromUTF16);
shaka.util.StringUtils.fromBytesAutoDetect=function(a){var b=shaka.util.StringUtils,c=new Uint8Array(a);if(239==c[0]&&187==c[1]&&191==c[2])return b.fromUTF8(c);if(254==c[0]&&255==c[1])return b.fromUTF16(c.subarray(2),!1);if(255==c[0]&&254==c[1])return b.fromUTF16(c.subarray(2),!0);var d=function(a,b){return a.byteLength<=b||32<=a[b]&&126>=a[b]}.bind(null,c);shaka.log.debug("Unable to find byte-order-mark, making an educated guess.");if(0==c[0]&&0==c[2])return b.fromUTF16(a,!1);if(0==c[1]&&0==c[3])return b.fromUTF16(a,
!0);if(d(0)&&d(1)&&d(2)&&d(3))return b.fromUTF8(a);throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.UNABLE_TO_DETECT_ENCODING);};goog.exportSymbol("shaka.util.StringUtils.fromBytesAutoDetect",shaka.util.StringUtils.fromBytesAutoDetect);shaka.util.StringUtils.toUTF8=function(a){a=encodeURIComponent(a);a=unescape(a);for(var b=new Uint8Array(a.length),c=0;c<a.length;++c)b[c]=a.charCodeAt(c);return b.buffer};
goog.exportSymbol("shaka.util.StringUtils.toUTF8",shaka.util.StringUtils.toUTF8);shaka.util.StringUtils.toUTF16=function(a,b){for(var c=new Uint8Array(2*a.length),d=new DataView(c.buffer),e=0;e<a.length;++e){var f=a.charCodeAt(e);d.setUint16(2*e,f,b)}return c.buffer};goog.exportSymbol("shaka.util.StringUtils.toUTF16",shaka.util.StringUtils.toUTF16);
shaka.util.StringUtils.fromCharCode=function(a){if(!shaka.util.StringUtils.fromCharCodeImpl_)for(var b=function(a){try{var b=new Uint8Array(a),c=String.fromCharCode.apply(String,$jscomp.arrayFromIterable(b));goog.asserts.assert(c,"Should get value");return!0}catch(g){return!1}},c={size:65536};0<c.size;c={size:c.size},c.size/=2)if(b(c.size)){shaka.util.StringUtils.fromCharCodeImpl_=function(a){return function(b){for(var c="",d=0;d<b.length;d+=a.size){var e=b.subarray(d,d+a.size);c+=String.fromCharCode.apply(String,
$jscomp.arrayFromIterable(e))}return c}}(c);break}goog.asserts.assert(shaka.util.StringUtils.fromCharCodeImpl_,"Unable to create a fromCharCode method");return shaka.util.StringUtils.fromCharCodeImpl_(a)};shaka.util.StringUtils.fromCharCodeImpl_=null;shaka.util.Uint8ArrayUtils={};shaka.util.Uint8ArrayUtils.toBase64=function(a,b){var c=shaka.util.StringUtils.fromCharCode(a);b=void 0==b?!0:b;c=window.btoa(c).replace(/\+/g,"-").replace(/\//g,"_");return b?c:c.replace(/=*$/,"")};goog.exportSymbol("shaka.util.Uint8ArrayUtils.toBase64",shaka.util.Uint8ArrayUtils.toBase64);shaka.util.Uint8ArrayUtils.fromBase64=function(a){a=window.atob(a.replace(/-/g,"+").replace(/_/g,"/"));for(var b=new Uint8Array(a.length),c=0;c<a.length;++c)b[c]=a.charCodeAt(c);return b};
goog.exportSymbol("shaka.util.Uint8ArrayUtils.fromBase64",shaka.util.Uint8ArrayUtils.fromBase64);shaka.util.Uint8ArrayUtils.fromHex=function(a){for(var b=new Uint8Array(a.length/2),c=0;c<a.length;c+=2)b[c/2]=window.parseInt(a.substr(c,2),16);return b};goog.exportSymbol("shaka.util.Uint8ArrayUtils.fromHex",shaka.util.Uint8ArrayUtils.fromHex);shaka.util.Uint8ArrayUtils.toHex=function(a){for(var b="",c=0;c<a.length;++c){var d=a[c].toString(16);1==d.length&&(d="0"+d);b+=d}return b};
goog.exportSymbol("shaka.util.Uint8ArrayUtils.toHex",shaka.util.Uint8ArrayUtils.toHex);shaka.util.Uint8ArrayUtils.equal=function(a,b){if(!a&&!b)return!0;if(!a||!b||a.length!=b.length)return!1;for(var c=0;c<a.length;++c)if(a[c]!=b[c])return!1;return!0};goog.exportSymbol("shaka.util.Uint8ArrayUtils.equal",shaka.util.Uint8ArrayUtils.equal);
shaka.util.Uint8ArrayUtils.concat=function(a){for(var b=[],c=0;c<arguments.length;++c)b[c-0]=arguments[c];for(var d=c=0;d<b.length;++d)c+=b[d].length;c=new Uint8Array(c);for(var e=d=0;e<b.length;++e)c.set(b[e],d),d+=b[e].length;return c};goog.exportSymbol("shaka.util.Uint8ArrayUtils.concat",shaka.util.Uint8ArrayUtils.concat);shaka.media={};
shaka.media.DrmEngine=function(a){var b=this;this.playerInterface_=a;this.supportedTypes_=new Set;this.video_=this.mediaKeys_=null;this.initialized_=!1;this.currentDrmInfo_=null;this.eventManager_=new shaka.util.EventManager;this.activeSessions_=new Map;this.offlineSessionIds_=[];this.allSessionsLoaded_=new shaka.util.PublicPromise;this.config_=null;this.onError_=function(c){b.allSessionsLoaded_.reject(c);a.onError(c)};this.keyStatusByKeyId_=new Map;this.announcedKeyStatusByKeyId_=new Map;this.keyStatusTimer_=
new shaka.util.Timer(function(){return b.processKeyStatusChanges_()});this.isDestroying_=!1;this.finishedDestroyingPromise_=new shaka.util.PublicPromise;this.usePersistentLicenses_=!1;this.mediaKeyMessageEvents_=[];this.initialRequestsSent_=!1;this.expirationTimer_=(new shaka.util.Timer(function(){b.pollExpiration_()})).tickEvery(1);this.allSessionsLoaded_["catch"](function(){})};
shaka.media.DrmEngine.prototype.destroy=function(){var a=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function c(){return $jscomp.generator.createGenerator(c,function(c){switch(c.nextAddress){case 1:if(a.isDestroying_)return c.yield(a.finishedDestroyingPromise_,0);a.isDestroying_=!0;return c.yield(a.destroyNow_(),4);case 4:a.finishedDestroyingPromise_.resolve(),c.jumpTo(0)}})})};
shaka.media.DrmEngine.prototype.destroyNow_=function(){var a=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function c(){var d;return $jscomp.generator.createGenerator(c,function(c){switch(c.nextAddress){case 1:return a.eventManager_.release(),a.eventManager_=null,a.allSessionsLoaded_.reject(),a.expirationTimer_.stop(),a.expirationTimer_=null,a.keyStatusTimer_.stop(),a.keyStatusTimer_=null,d=Array.from(a.activeSessions_.keys()),a.activeSessions_.clear(),c.yield(Promise.all(d.map(function(a){return Promise.resolve().then(function(){return $jscomp.asyncExecutePromiseGeneratorFunction(function h(){return $jscomp.generator.createGenerator(h,
function(c){switch(c.nextAddress){case 1:return shaka.log.v1("Closing session",a.sessionId),c.setCatchFinallyBlocks(2),c.yield(shaka.media.DrmEngine.closeSession_(a),4);case 4:c.leaveTryBlock(0);break;case 2:c.enterCatchBlock(),c.jumpToEnd()}})})})})),2);case 2:if(!a.video_){c.jumpTo(3);break}goog.asserts.assert(!a.video_.src,"video src must be removed first!");c.setCatchFinallyBlocks(4);return c.yield(a.video_.setMediaKeys(null),6);case 6:c.leaveTryBlock(5);break;case 4:c.enterCatchBlock();case 5:a.video_=
null;case 3:a.currentDrmInfo_=null,a.supportedTypes_.clear(),a.mediaKeys_=null,a.offlineSessionIds_=[],a.config_=null,a.onError_=null,a.playerInterface_=null,c.jumpToEnd()}})})};shaka.media.DrmEngine.prototype.configure=function(a){this.config_=a};shaka.media.DrmEngine.prototype.initForStorage=function(a,b){this.offlineSessionIds_=[];this.usePersistentLicenses_=b;return this.init_(a)};
shaka.media.DrmEngine.prototype.initForPlayback=function(a,b){this.offlineSessionIds_=b;this.usePersistentLicenses_=0<b.length;return this.init_(a)};
shaka.media.DrmEngine.prototype.initForRemoval=function(a,b,c,d,e){var f=new Map;f.set(a,{audioCapabilities:d,videoCapabilities:e,distinctiveIdentifier:"optional",persistentState:"required",sessionTypes:["persistent-license"],label:a,drmInfos:[{keySystem:a,licenseServerUri:b,distinctiveIdentifierRequired:!1,persistentStateRequired:!0,audioRobustness:"",videoRobustness:"",serverCertificate:c,initData:null,keyIds:null}]});return this.queryMediaKeys_(f)};
shaka.media.DrmEngine.prototype.init_=function(a){goog.asserts.assert(this.config_,"DrmEngine configure() must be called before init()!");var b=a.some(function(a){return 0<a.drmInfos.length});if(!b){var c=shaka.util.MapUtils.asMap(this.config_.servers);shaka.media.DrmEngine.replaceDrmInfo_(a,c)}var d=this.configureClearKey_();if(d){var e=$jscomp.makeIterator(a);for(c=e.next();!c.done;c=e.next())c.value.drmInfos=[d]}d=$jscomp.makeIterator(a);for(c=d.next();!c.done;c=d.next())for(c=$jscomp.makeIterator(c.value.drmInfos),
e=c.next();!e.done;e=c.next())shaka.media.DrmEngine.fillInDrmInfoDefaults_(e.value,shaka.util.MapUtils.asMap(this.config_.servers),shaka.util.MapUtils.asMap(this.config_.advanced||{}));a=this.prepareMediaKeyConfigsForVariants_(a);if(!a.size)return this.initialized_=!0,Promise.resolve();a=this.queryMediaKeys_(a);return b?a:a["catch"](function(){})};
shaka.media.DrmEngine.prototype.attach=function(a){var b=this;if(!this.mediaKeys_)return this.eventManager_.listenOnce(a,"encrypted",function(a){b.onError_(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.ENCRYPTED_CONTENT_WITHOUT_DRM_INFO))}),Promise.resolve();this.video_=a;this.eventManager_.listenOnce(this.video_,"play",function(){return b.onPlay_()});a=this.video_.setMediaKeys(this.mediaKeys_);a=a["catch"](function(a){return Promise.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,
shaka.util.Error.Category.DRM,shaka.util.Error.Code.FAILED_TO_ATTACH_TO_VIDEO,a.message))});var c=this.setServerCertificate();return Promise.all([a,c]).then(function(){if(b.isDestroying_)return Promise.reject();b.createOrLoad();b.currentDrmInfo_.initData.length||b.offlineSessionIds_.length||b.eventManager_.listen(b.video_,"encrypted",function(a){return b.newInitData(a.initDataType,new Uint8Array(a.initData))})})["catch"](function(a){if(!b.isDestroying_)return Promise.reject(a)})};
shaka.media.DrmEngine.prototype.setServerCertificate=function(){var a=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function c(){var d,e;return $jscomp.generator.createGenerator(c,function(c){switch(c.nextAddress){case 1:goog.asserts.assert(a.initialized_,"Must call init() before setServerCertificate");if(!(a.mediaKeys_&&a.currentDrmInfo_&&a.currentDrmInfo_.serverCertificate&&a.currentDrmInfo_.serverCertificate.length)){c.jumpTo(0);break}c.setCatchFinallyBlocks(3);return c.yield(a.mediaKeys_.setServerCertificate(a.currentDrmInfo_.serverCertificate),
5);case 5:(d=c.yieldResult)||shaka.log.warning("Server certificates are not supported by the key system.  The server certificate has been ignored.");c.leaveTryBlock(0);break;case 3:return e=c.enterCatchBlock(),c["return"](Promise.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.INVALID_SERVER_CERTIFICATE,e.message)))}})})};
shaka.media.DrmEngine.prototype.removeSession=function(a){var b=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function d(){var e,f,g;return $jscomp.generator.createGenerator(d,function(d){switch(d.nextAddress){case 1:return goog.asserts.assert(b.mediaKeys_,"Must call init() before removeSession"),d.yield(b.loadOfflineSession_(a),2);case 2:e=d.yieldResult;if(!e)return shaka.log.v2("Ignoring attempt to remove missing session",a),d["return"]();f=[];if(g=b.activeSessions_.get(e))g.updatePromise=
new shaka.util.PublicPromise,f.push(g.updatePromise);shaka.log.v2("Attempting to remove session",a);f.push(e.remove());return d.yield(Promise.all(f),0)}})})};
shaka.media.DrmEngine.prototype.createOrLoad=function(){var a=this,b=this.currentDrmInfo_?this.currentDrmInfo_.initData:[];b.forEach(function(b){return a.createTemporarySession_(b.initDataType,b.initData)});this.offlineSessionIds_.forEach(function(b){return a.loadOfflineSession_(b)});b.length||this.offlineSessionIds_.length||this.allSessionsLoaded_.resolve();return this.allSessionsLoaded_};
shaka.media.DrmEngine.prototype.newInitData=function(a,b){var c=shaka.util.Uint8ArrayUtils,d=this.activeSessions_.values();d=$jscomp.makeIterator(d);for(var e=d.next();!e.done;e=d.next())if(c.equal(b,e.value.initData)){shaka.log.debug("Ignoring duplicate init data.");return}this.createTemporarySession_(a,b)};shaka.media.DrmEngine.prototype.initialized=function(){return this.initialized_};
shaka.media.DrmEngine.prototype.keySystem=function(){return this.currentDrmInfo_?this.currentDrmInfo_.keySystem:""};shaka.media.DrmEngine.prototype.willSupport=function(a){return shaka.util.Platform.isEdge()?!0:this.supportedTypes_.has(a)};shaka.media.DrmEngine.prototype.getSessionIds=function(){var a=this.activeSessions_.keys();a=shaka.util.Iterables.map(a,function(a){return a.sessionId});return Array.from(a)};
shaka.media.DrmEngine.prototype.getExpiration=function(){var a=Infinity,b=this.activeSessions_.keys();b=$jscomp.makeIterator(b);for(var c=b.next();!c.done;c=b.next())c=c.value,isNaN(c.expiration)||(a=Math.min(a,c.expiration));return a};shaka.media.DrmEngine.prototype.getDrmInfo=function(){return this.currentDrmInfo_};shaka.media.DrmEngine.prototype.getKeyStatuses=function(){return shaka.util.MapUtils.asObject(this.announcedKeyStatusByKeyId_)};
shaka.media.DrmEngine.prototype.prepareMediaKeyConfigsForVariants_=function(a){for(var b=new Set,c=$jscomp.makeIterator(a),d=c.next();!d.done;d=c.next()){var e=$jscomp.makeIterator(d.value.drmInfos);for(d=e.next();!d.done;d=e.next())b.add(d.value)}c=$jscomp.makeIterator(b);for(d=c.next();!d.done;d=c.next())shaka.media.DrmEngine.fillInDrmInfoDefaults_(d.value,shaka.util.MapUtils.asMap(this.config_.servers),shaka.util.MapUtils.asMap(this.config_.advanced||{}));e=this.usePersistentLicenses_?"required":
"optional";var f=this.usePersistentLicenses_?["persistent-license"]:["temporary"];c=new Map;b=$jscomp.makeIterator(b);for(d=b.next();!d.done;d=b.next())d=d.value,c.set(d.keySystem,{audioCapabilities:[],videoCapabilities:[],distinctiveIdentifier:"optional",persistentState:e,sessionTypes:f,label:d.keySystem,drmInfos:[]});a=$jscomp.makeIterator(a);for(d=a.next();!d.done;d=a.next()){d=d.value;b=d.audio;e=d.video;f=b?shaka.util.MimeUtils.getFullType(b.mimeType,b.codecs):"";var g=e?shaka.util.MimeUtils.getFullType(e.mimeType,
e.codecs):"",h=$jscomp.makeIterator(d.drmInfos);for(d=h.next();!d.done;d=h.next()){d=d.value;var k=c.get(d.keySystem);goog.asserts.assert(k,"Any missing configs should have be filled in before.");k.drmInfos.push(d);d.distinctiveIdentifierRequired&&(k.distinctiveIdentifier="required");d.persistentStateRequired&&(k.persistentState="required");b&&k.audioCapabilities.push({robustness:d.audioRobustness||"",contentType:f});e&&k.videoCapabilities.push({robustness:d.videoRobustness||"",contentType:g})}}return c};
shaka.media.DrmEngine.prototype.queryMediaKeys_=function(a){if(1==a.size&&a.has(""))return Promise.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.NO_RECOGNIZED_KEY_SYSTEMS));for(var b=$jscomp.makeIterator(a.values()),c=b.next();!c.done;c=b.next())c=c.value,0==c.audioCapabilities.length&&delete c.audioCapabilities,0==c.videoCapabilities.length&&delete c.videoCapabilities;var d=b=new shaka.util.PublicPromise;[!0,!1].forEach(function(b){var c=
this;a.forEach(function(a,e){a.drmInfos.some(function(a){return!!a.licenseServerUri})==b&&(d=d["catch"](function(){if(!this.isDestroying_)return navigator.requestMediaKeySystemAccess(e,[a])}.bind(c)))})}.bind(this));d=d["catch"](function(){return Promise.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.REQUESTED_KEY_SYSTEM_CONFIG_UNAVAILABLE))});d=d.then(function(b){if(this.isDestroying_)return Promise.reject();this.supportedTypes_.clear();
var c=b.getConfiguration(),d=c.videoCapabilities||[],e=$jscomp.makeIterator(c.audioCapabilities||[]);for(c=e.next();!c.done;c=e.next())this.supportedTypes_.add(c.value.contentType);d=$jscomp.makeIterator(d);for(c=d.next();!c.done;c=d.next())this.supportedTypes_.add(c.value.contentType);goog.asserts.assert(this.supportedTypes_.size,"We should get at least one supported MIME type");this.currentDrmInfo_=shaka.media.DrmEngine.createDrmInfoFor_(b.keySystem,a.get(b.keySystem));return this.currentDrmInfo_.licenseServerUri?
b.createMediaKeys():Promise.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.NO_LICENSE_SERVER_GIVEN,this.currentDrmInfo_.keySystem))}.bind(this)).then(function(a){if(this.isDestroying_)return Promise.reject();shaka.log.info("Created MediaKeys object for key system",this.currentDrmInfo_.keySystem);this.mediaKeys_=a;this.initialized_=!0}.bind(this))["catch"](function(a){if(!this.isDestroying_)return this.currentDrmInfo_=null,this.supportedTypes_.clear(),
a instanceof shaka.util.Error?Promise.reject(a):Promise.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.FAILED_TO_CREATE_CDM,a.message))}.bind(this));b.reject();return d};
shaka.media.DrmEngine.prototype.configureClearKey_=function(){var a=shaka.util.MapUtils.asMap(this.config_.clearKeys);if(0==a.size)return null;var b=shaka.util.StringUtils,c=shaka.util.Uint8ArrayUtils,d=[],e=[];a.forEach(function(a,b){var f=c.fromHex(b),g=c.fromHex(a);f={kty:"oct",kid:c.toBase64(f,!1),k:c.toBase64(g,!1)};d.push(f);e.push(f.kid)});a=JSON.stringify({keys:d});var f=JSON.stringify({kids:e});b=[{initData:new Uint8Array(b.toUTF8(f)),initDataType:"keyids"}];return{keySystem:"org.w3.clearkey",
licenseServerUri:"data:application/json;base64,"+window.btoa(a),distinctiveIdentifierRequired:!1,persistentStateRequired:!1,audioRobustness:"",videoRobustness:"",serverCertificate:null,initData:b,keyIds:[]}};
shaka.media.DrmEngine.prototype.loadOfflineSession_=function(a){try{shaka.log.v1("Attempting to load an offline session",a);var b=this.mediaKeys_.createSession("persistent-license")}catch(e){var c=new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.FAILED_TO_CREATE_SESSION,e.message);this.onError_(c);return Promise.reject(c)}this.eventManager_.listen(b,"message",this.onSessionMessage_.bind(this));this.eventManager_.listen(b,"keystatuseschange",
this.onKeyStatusesChange_.bind(this));var d={initData:null,loaded:!1,oldExpiration:Infinity,updatePromise:null};this.activeSessions_.set(b,d);return b.load(a).then(function(c){if(this.isDestroying_)return Promise.reject();shaka.log.v2("Loaded offline session",a,c);if(c)return d.loaded=!0,this.areAllSessionsLoaded_()&&this.allSessionsLoaded_.resolve(),b;this.activeSessions_["delete"](b);this.onError_(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.OFFLINE_SESSION_REMOVED))}.bind(this),
function(a){this.isDestroying_||(this.activeSessions_["delete"](b),this.onError_(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.FAILED_TO_CREATE_SESSION,a.message)))}.bind(this))};
shaka.media.DrmEngine.prototype.createTemporarySession_=function(a,b){var c=this;try{if(this.usePersistentLicenses_){shaka.log.v1("Creating new persistent session");var d=this.mediaKeys_.createSession("persistent-license")}else shaka.log.v1("Creating new temporary session"),d=this.mediaKeys_.createSession()}catch(g){this.onError_(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.FAILED_TO_CREATE_SESSION,g.message));return}this.eventManager_.listen(d,
"message",this.onSessionMessage_.bind(this));this.eventManager_.listen(d,"keystatuseschange",this.onKeyStatusesChange_.bind(this));this.activeSessions_.set(d,{initData:b,loaded:!1,oldExpiration:Infinity,updatePromise:null});try{if(this.config_.initDataTransform)b=this.config_.initDataTransform(b);else if(this.keySystem().startsWith("com.apple.fps")){var e=this.currentDrmInfo_.serverCertificate,f=shaka.util.FairPlayUtils.defaultGetContentId(b);b=shaka.util.FairPlayUtils.initDataTransform(b,f,e)}}catch(g){e=
g;g instanceof shaka.util.Error||(e=new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.INIT_DATA_TRANSFORM_ERROR,g));this.onError_(e);return}d.generateRequest(a,b.buffer)["catch"](function(a){if(!c.isDestroying_){c.activeSessions_["delete"](d);if(a.errorCode&&a.errorCode.systemCode){var b=a.errorCode.systemCode;0>b&&(b+=Math.pow(2,32));b="0x"+b.toString(16)}c.onError_(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,
shaka.util.Error.Code.FAILED_TO_GENERATE_LICENSE_REQUEST,a.message,a,b))}})};shaka.media.DrmEngine.prototype.onSessionMessage_=function(a){this.delayLicenseRequest_()?this.mediaKeyMessageEvents_.push(a):this.sendLicenseRequest_(a)};shaka.media.DrmEngine.prototype.delayLicenseRequest_=function(){return this.config_.delayLicenseRequestUntilPlayed&&this.video_.paused&&!this.initialRequestsSent_};
shaka.media.DrmEngine.prototype.sendLicenseRequest_=function(a){var b=a.target;shaka.log.v2("Sending license request for session",b.sessionId);var c=this.activeSessions_.get(b),d=this.currentDrmInfo_.licenseServerUri,e=this.config_.advanced[this.currentDrmInfo_.keySystem];"individualization-request"==a.messageType&&e&&e.individualizationServer&&(d=e.individualizationServer);e=shaka.net.NetworkingEngine.RequestType.LICENSE;d=shaka.net.NetworkingEngine.makeRequest([d],this.config_.retryParameters);
d.body=a.message;d.method="POST";d.licenseRequestType=a.messageType;d.sessionId=b.sessionId;"com.microsoft.playready"!=this.currentDrmInfo_.keySystem&&"com.chromecast.playready"!=this.currentDrmInfo_.keySystem||this.unpackPlayReadyRequest_(d);this.currentDrmInfo_.keySystem.startsWith("com.apple.fps")&&this.config_.fairPlayTransform&&this.formatFairPlayRequest_(d);this.playerInterface_.netEngine.request(e,d).promise.then(function(a){if(this.isDestroying_)return Promise.reject();this.currentDrmInfo_.keySystem.startsWith("com.apple.fps")&&
this.config_.fairPlayTransform&&this.parseFairPlayResponse_(a);return b.update(a.data).then(function(){var a=this,b=new shaka.util.FakeEvent("drmsessionupdate");this.playerInterface_.onEvent(b);c&&(c.updatePromise&&c.updatePromise.resolve(),(new shaka.util.Timer(function(){c.loaded=!0;a.areAllSessionsLoaded_()&&a.allSessionsLoaded_.resolve()})).tickAfter(shaka.media.DrmEngine.SESSION_LOAD_TIMEOUT_))}.bind(this))}.bind(this),function(a){this.isDestroying_||(goog.asserts.assert(a instanceof shaka.util.Error,
"Wrong NetworkingEngine error type!"),a=new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.LICENSE_REQUEST_FAILED,a),this.onError_(a),c&&c.updatePromise&&c.updatePromise.reject(a))}.bind(this))["catch"](function(a){this.isDestroying_||(a=new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.LICENSE_RESPONSE_REJECTED,a.message),this.onError_(a),c&&c.updatePromise&&c.updatePromise.reject(a))}.bind(this))};
shaka.media.DrmEngine.prototype.unpackPlayReadyRequest_=function(a){var b=shaka.util.StringUtils.fromUTF16(a.body,!0,!0);if(b.includes("PlayReadyKeyMessage")){shaka.log.debug("Unwrapping PlayReady request.");b=(new DOMParser).parseFromString(b,"application/xml");for(var c=b.getElementsByTagName("HttpHeader"),d=0;d<c.length;++d){var e=c[d].querySelector("name"),f=c[d].querySelector("value");goog.asserts.assert(e&&f,"Malformed PlayReady headers!");a.headers[e.textContent]=f.textContent}b=b.querySelector("Challenge");
goog.asserts.assert(b,"Malformed PlayReady challenge!");goog.asserts.assert("base64encoded"==b.getAttribute("encoding"),"Unexpected PlayReady challenge encoding!");a.body=shaka.util.Uint8ArrayUtils.fromBase64(b.textContent).buffer}else shaka.log.debug("PlayReady request is already unwrapped."),a.headers["Content-Type"]="text/xml; charset=utf-8"};
shaka.media.DrmEngine.prototype.formatFairPlayRequest_=function(a){var b=new Uint8Array(a.body);b=shaka.util.Uint8ArrayUtils.toBase64(b);a.headers["Content-Type"]="application/x-www-form-urlencoded";a.body=shaka.util.StringUtils.toUTF8("spc="+b)};shaka.media.DrmEngine.prototype.parseFairPlayResponse_=function(a){try{var b=shaka.util.StringUtils.fromUTF8(a.data)}catch(c){return}b=b.trim();"<ckc>"===b.substr(0,5)&&"</ckc>"===b.substr(-6)&&(b=b.slice(5,-6));try{b=JSON.parse(b).ckc}catch(c){}a.data=shaka.util.Uint8ArrayUtils.fromBase64(b).buffer};
shaka.media.DrmEngine.prototype.onKeyStatusesChange_=function(a){a=a.target;shaka.log.v2("Key status changed for session",a.sessionId);var b=this.activeSessions_.get(a),c=!1;a.keyStatuses.forEach(function(a,d){if("string"==typeof d){var e=d;d=a;a=e}if("com.microsoft.playready"==this.currentDrmInfo_.keySystem&&16==d.byteLength&&!shaka.util.Platform.isTizen()){e=new DataView(d);var f=e.getUint32(0,!0),k=e.getUint16(4,!0),l=e.getUint16(6,!0);e.setUint32(0,f,!1);e.setUint16(4,k,!1);e.setUint16(6,l,!1)}"com.microsoft.playready"==
this.currentDrmInfo_.keySystem&&"status-pending"==a&&(a="usable");"status-pending"!=a&&(b.loaded=!0);b||goog.asserts.assert("usable"!=a,"Usable keys found in closed session");"expired"==a&&(c=!0);e=shaka.util.Uint8ArrayUtils.toHex(new Uint8Array(d));this.keyStatusByKeyId_.set(e,a)}.bind(this));var d=a.expiration-Date.now();(0>d||c&&1E3>d)&&b&&!b.updatePromise&&(shaka.log.debug("Session has expired",a.sessionId),this.activeSessions_["delete"](a),a.close()["catch"](function(){}));this.areAllSessionsLoaded_()&&
(this.allSessionsLoaded_.resolve(),this.keyStatusTimer_.tickAfter(shaka.media.DrmEngine.KEY_STATUS_BATCH_TIME_))};
shaka.media.DrmEngine.prototype.processKeyStatusChanges_=function(){var a=this.keyStatusByKeyId_,b=this.announcedKeyStatusByKeyId_;b.clear();a.forEach(function(a,d){return b.set(d,a)});a=Array.from(b.values());if(a.length&&a.every(function(a){return"expired"==a}))this.onError_(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.DRM,shaka.util.Error.Code.EXPIRED));this.playerInterface_.onKeyStatus(shaka.util.MapUtils.asObject(b))};
shaka.media.DrmEngine.isBrowserSupported=function(){return!!window.MediaKeys&&!!window.navigator&&!!window.navigator.requestMediaKeySystemAccess&&!!window.MediaKeySystemAccess&&!!window.MediaKeySystemAccess.prototype.getConfiguration};
shaka.media.DrmEngine.probeSupport=function(){goog.asserts.assert(shaka.media.DrmEngine.isBrowserSupported(),"Must have basic EME support");var a=[{contentType:'video/mp4; codecs="avc1.42E01E"'},{contentType:'video/webm; codecs="vp8"'}],b=[{videoCapabilities:a,persistentState:"required",sessionTypes:["persistent-license"]},{videoCapabilities:a}],c=new Map,d=function(a){return $jscomp.asyncExecutePromiseGeneratorFunction(function g(){var d,e,l;return $jscomp.generator.createGenerator(g,function(g){switch(g.nextAddress){case 1:return g.setCatchFinallyBlocks(2),
g.yield(navigator.requestMediaKeySystemAccess(a,b),4);case 4:return d=g.yieldResult,l=(e=d.getConfiguration().sessionTypes)?e.includes("persistent-license"):!1,shaka.util.Platform.isTizen3()&&(l=!1),c.set(a,{persistentState:l}),g.yield(d.createMediaKeys(),5);case 5:g.leaveTryBlock(0);break;case 2:g.enterCatchBlock(),c.set(a,null),g.jumpToEnd()}})})};a="org.w3.clearkey com.widevine.alpha com.microsoft.playready com.apple.fps.3_0 com.apple.fps.2_0 com.apple.fps.1_0 com.apple.fps com.adobe.primetime".split(" ").map(function(a){return d(a)});
return Promise.all(a).then(function(){return shaka.util.MapUtils.asObject(c)})};shaka.media.DrmEngine.prototype.onPlay_=function(){for(var a=0;a<this.mediaKeyMessageEvents_.length;a++)this.sendLicenseRequest_(this.mediaKeyMessageEvents_[a]);this.initialRequestsSent_=!0;this.mediaKeyMessageEvents_=[]};
shaka.media.DrmEngine.prototype.supportsVariant=function(a){var b=a.audio,c=a.video;if(b&&b.encrypted&&(b=shaka.util.MimeUtils.getFullType(b.mimeType,b.codecs),!this.willSupport(b))||c&&c.encrypted&&(c=shaka.util.MimeUtils.getFullType(c.mimeType,c.codecs),!this.willSupport(c)))return!1;var d=this.keySystem();return 0==a.drmInfos.length||a.drmInfos.some(function(a){return a.keySystem==d})};
shaka.media.DrmEngine.areDrmCompatible=function(a,b){return a.length&&b.length?0<shaka.media.DrmEngine.getCommonDrmInfos(a,b).length:!0};
shaka.media.DrmEngine.getCommonDrmInfos=function(a,b){if(!a.length)return b;if(!b.length)return a;for(var c=[],d=0;d<a.length;d++)for(var e=0;e<b.length;e++)if(a[d].keySystem==b[e].keySystem){var f=a[d];e=b[e];var g=[];g=g.concat(f.initData||[]);g=g.concat(e.initData||[]);var h=[];h=h.concat(f.keyIds);h=h.concat(e.keyIds);c.push({keySystem:f.keySystem,licenseServerUri:f.licenseServerUri||e.licenseServerUri,distinctiveIdentifierRequired:f.distinctiveIdentifierRequired||e.distinctiveIdentifierRequired,
persistentStateRequired:f.persistentStateRequired||e.persistentStateRequired,videoRobustness:f.videoRobustness||e.videoRobustness,audioRobustness:f.audioRobustness||e.audioRobustness,serverCertificate:f.serverCertificate||e.serverCertificate,initData:g,keyIds:h});break}return c};
shaka.media.DrmEngine.prototype.pollExpiration_=function(){var a=this;this.activeSessions_.forEach(function(b,c){var d=b.oldExpiration,e=c.expiration;isNaN(e)&&(e=Infinity);e!=d&&(a.playerInterface_.onExpirationUpdated(c.sessionId,e),b.oldExpiration=e)})};shaka.media.DrmEngine.prototype.areAllSessionsLoaded_=function(){var a=this.activeSessions_.values();return shaka.util.Iterables.every(a,function(a){return a.loaded})};
shaka.media.DrmEngine.replaceDrmInfo_=function(a,b){var c=[];b.forEach(function(a,b){c.push({keySystem:b,licenseServerUri:a,distinctiveIdentifierRequired:!1,persistentStateRequired:!1,audioRobustness:"",videoRobustness:"",serverCertificate:null,initData:[],keyIds:[]})});for(var d=$jscomp.makeIterator(a),e=d.next();!e.done;e=d.next())e.value.drmInfos=c};
shaka.media.DrmEngine.createDrmInfoFor_=function(a,b){var c=[],d=[],e=[],f=[];shaka.media.DrmEngine.processDrmInfos_(b.drmInfos,c,d,e,f);1<d.length&&shaka.log.warning("Multiple unique server certificates found! Only the first will be used.");1<c.length&&shaka.log.warning("Multiple unique license server URIs found! Only the first will be used.");return{keySystem:a,licenseServerUri:c[0],distinctiveIdentifierRequired:"required"==b.distinctiveIdentifier,persistentStateRequired:"required"==b.persistentState,
audioRobustness:b.audioCapabilities?b.audioCapabilities[0].robustness:"",videoRobustness:b.videoCapabilities?b.videoCapabilities[0].robustness:"",serverCertificate:d[0],initData:e,keyIds:f}};
shaka.media.DrmEngine.processDrmInfos_=function(a,b,c,d,e){a.forEach(function(a){var f=shaka.util.Uint8ArrayUtils;b.includes(a.licenseServerUri)||b.push(a.licenseServerUri);a.serverCertificate&&(c.some(function(b){return f.equal(b,a.serverCertificate)})||c.push(a.serverCertificate));a.initData&&a.initData.forEach(function(a){d.some(function(b){b=b.keyId&&b.keyId==a.keyId?!0:b.initDataType==a.initDataType&&shaka.util.Uint8ArrayUtils.equal(b.initData,a.initData);return b})||d.push(a)});if(a.keyIds)for(var h=
0;h<a.keyIds.length;++h)e.includes(a.keyIds[h])||e.push(a.keyIds[h])})};
shaka.media.DrmEngine.fillInDrmInfoDefaults_=function(a,b,c){if(a.keySystem&&("org.w3.clearkey"!=a.keySystem||!a.licenseServerUri)){b.size&&(b=b.get(a.keySystem)||"",a.licenseServerUri=b);a.keyIds||(a.keyIds=[]);if(c=c.get(a.keySystem))a.distinctiveIdentifierRequired||(a.distinctiveIdentifierRequired=c.distinctiveIdentifierRequired),a.persistentStateRequired||(a.persistentStateRequired=c.persistentStateRequired),a.videoRobustness||(a.videoRobustness=c.videoRobustness),a.audioRobustness||(a.audioRobustness=
c.audioRobustness),a.serverCertificate||(a.serverCertificate=c.serverCertificate);window.cast&&window.cast.__platform__&&"com.microsoft.playready"==a.keySystem&&(a.keySystem="com.chromecast.playready")}};
shaka.media.DrmEngine.closeSession_=function(a){return $jscomp.asyncExecutePromiseGeneratorFunction(function c(){var d,e,f;return $jscomp.generator.createGenerator(c,function(c){switch(c.nextAddress){case 1:return d=shaka.media.DrmEngine,e=new Promise(function(a){(new shaka.util.Timer(a)).tickAfter(d.CLOSE_TIMEOUT_)}),c.yield(Promise.race([a.close().then(function(){return!0}),e.then(function(){return!1})]),2);case 2:(f=c.yieldResult)||shaka.log.warning("Timeout waiting for session close"),c.jumpToEnd()}})})};
shaka.media.DrmEngine.CLOSE_TIMEOUT_=1;shaka.media.DrmEngine.SESSION_LOAD_TIMEOUT_=5;shaka.media.DrmEngine.KEY_STATUS_BATCH_TIME_=.5;shaka.media.IClosedCaptionParser=function(){};shaka.media.IClosedCaptionParser.prototype.init=function(a){};shaka.media.IClosedCaptionParser.prototype.parseFrom=function(a,b){};shaka.media.IClosedCaptionParser.prototype.reset=function(){};shaka.media.MuxJSClosedCaptionParser=function(){this.muxCaptionParser_=new muxjs.mp4.CaptionParser;this.videoTrackIds_=[];this.timescales_={}};
shaka.media.MuxJSClosedCaptionParser.prototype.init=function(a){var b=muxjs.mp4.probe;a=new Uint8Array(a);this.videoTrackIds_=b.videoTrackIds(a);this.timescales_=b.timescale(a);this.muxCaptionParser_.init()};shaka.media.MuxJSClosedCaptionParser.prototype.parseFrom=function(a,b){var c=new Uint8Array(a);(c=this.muxCaptionParser_.parse(c,this.videoTrackIds_,this.timescales_))&&c.captions&&b(c.captions);this.muxCaptionParser_.clearParsedCaptions()};
shaka.media.MuxJSClosedCaptionParser.prototype.reset=function(){this.muxCaptionParser_.resetCaptionStream()};shaka.media.MuxJSClosedCaptionParser.isSupported=function(){return!!window.muxjs};shaka.media.NoopCaptionParser=function(){};shaka.media.NoopCaptionParser.prototype.init=function(a){};shaka.media.NoopCaptionParser.prototype.parseFrom=function(a,b){};shaka.media.NoopCaptionParser.prototype.reset=function(){};shaka.media.TimeRangesUtils={};shaka.media.TimeRangesUtils.bufferStart=function(a){return!a||1==a.length&&1E-6>a.end(0)-a.start(0)?null:1==a.length&&0>a.start(0)?0:a.length?a.start(0):null};shaka.media.TimeRangesUtils.bufferEnd=function(a){return!a||1==a.length&&1E-6>a.end(0)-a.start(0)?null:a.length?a.end(a.length-1):null};shaka.media.TimeRangesUtils.isBuffered=function(a,b,c){c=void 0===c?0:c;return!a||!a.length||1==a.length&&1E-6>a.end(0)-a.start(0)||b>a.end(a.length-1)?!1:b+c>=a.start(0)};
shaka.media.TimeRangesUtils.bufferedAheadOf=function(a,b){if(!a||!a.length||1==a.length&&1E-6>a.end(0)-a.start(0))return 0;for(var c=0,d=a.length-1;0<=d&&a.end(d)>b;--d)c+=a.end(d)-Math.max(a.start(d),b);return c};shaka.media.TimeRangesUtils.getGapIndex=function(a,b){var c=shaka.util.Platform;if(!a||!a.length||1==a.length&&1E-6>a.end(0)-a.start(0))return null;c=c.isEdge()||c.isIE()||c.isTizen()||c.isChromecast()?.5:.1;for(var d=0;d<a.length;d++)if(a.start(d)>b&&(0==d||a.end(d-1)-b<=c))return d;return null};
shaka.media.TimeRangesUtils.getBufferedInfo=function(a){if(!a)return[];for(var b=[],c=0;c<a.length;c++)b.push({start:a.start(c),end:a.end(c)});return b};shaka.util.Functional={};shaka.util.Functional.createFallbackPromiseChain=function(a,b){return a.reduce(function(a,b,e){return b["catch"](a.bind(null,e))}.bind(null,b),Promise.reject())};shaka.util.Functional.collapseArrays=function(a,b){return a.concat(b)};shaka.util.Functional.noop=function(){};shaka.util.Functional.isNotNull=function(a){return null!=a};shaka.util.ManifestParserUtils={};shaka.util.ManifestParserUtils.resolveUris=function(a,b){var c=shaka.util.Functional;if(0==b.length)return a;var d=b.map(function(a){return new goog.Uri(a)});return a.map(function(a){return new goog.Uri(a)}).map(function(a){return d.map(a.resolve.bind(a))}).reduce(c.collapseArrays,[]).map(function(a){return a.toString()})};
shaka.util.ManifestParserUtils.createDrmInfo=function(a,b){return{keySystem:a,licenseServerUri:"",distinctiveIdentifierRequired:!1,persistentStateRequired:!1,audioRobustness:"",videoRobustness:"",serverCertificate:null,initData:b||[],keyIds:[]}};shaka.util.ManifestParserUtils.ContentType={VIDEO:"video",AUDIO:"audio",TEXT:"text",APPLICATION:"application"};shaka.util.ManifestParserUtils.TextStreamKind={SUBTITLE:"subtitle",CLOSED_CAPTION:"caption"};
shaka.util.ManifestParserUtils.GAP_OVERLAP_TOLERANCE_SECONDS=1/15;shaka.media.Transmuxer=function(){this.muxTransmuxer_=new muxjs.mp4.Transmuxer({keepOriginalTimestamps:!0});this.transmuxPromise_=null;this.transmuxedData_=[];this.captions_=[];this.isTransmuxing_=!1;this.muxTransmuxer_.on("data",this.onTransmuxed_.bind(this));this.muxTransmuxer_.on("done",this.onTransmuxDone_.bind(this))};shaka.media.Transmuxer.prototype.destroy=function(){this.muxTransmuxer_.dispose();this.muxTransmuxer_=null;return Promise.resolve()};
shaka.media.Transmuxer.isSupported=function(a,b){if(!window.muxjs||!shaka.media.Transmuxer.isTsContainer(a))return!1;var c=shaka.media.Transmuxer.convertTsCodecs;if(b)return MediaSource.isTypeSupported(c(b,a));var d=shaka.util.ManifestParserUtils.ContentType;return MediaSource.isTypeSupported(c(d.AUDIO,a))||MediaSource.isTypeSupported(c(d.VIDEO,a))};shaka.media.Transmuxer.isTsContainer=function(a){return"mp2t"==a.toLowerCase().split(";")[0].split("/")[1]};
shaka.media.Transmuxer.convertTsCodecs=function(a,b){var c=shaka.util.ManifestParserUtils.ContentType,d=b.replace(/mp2t/i,"mp4");a==c.AUDIO&&(d=d.replace("video","audio"));if(c=/avc1\.(66|77|100)\.(\d+)/.exec(d)){var e="avc1.",f=c[1];"66"==f?e+="4200":"77"==f?e+="4d00":(goog.asserts.assert("100"==f,"Legacy avc1 parsing code out of sync with regex!"),e+="6400");f=Number(c[2]);goog.asserts.assert(256>f,"Invalid legacy avc1 level number!");e+=(f>>4).toString(16);e+=(f&15).toString(16);d=d.replace(c[0],
e)}return d};
shaka.media.Transmuxer.prototype.transmux=function(a){goog.asserts.assert(!this.isTransmuxing_,"No transmuxing should be in progress.");this.isTransmuxing_=!0;this.transmuxPromise_=new shaka.util.PublicPromise;this.transmuxedData_=[];this.captions_=[];a=new Uint8Array(a);this.muxTransmuxer_.push(a);this.muxTransmuxer_.flush();this.isTransmuxing_&&this.transmuxPromise_.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.TRANSMUXING_FAILED));return this.transmuxPromise_};
shaka.media.Transmuxer.prototype.onTransmuxed_=function(a){this.captions_=a.captions;var b=new Uint8Array(a.data.byteLength+a.initSegment.byteLength);b.set(a.initSegment,0);b.set(a.data,a.initSegment.byteLength);this.transmuxedData_.push(b)};shaka.media.Transmuxer.prototype.onTransmuxDone_=function(){var a={data:shaka.util.Uint8ArrayUtils.concat.apply(null,this.transmuxedData_),captions:this.captions_};this.transmuxPromise_.resolve(a);this.isTransmuxing_=!1};shaka.text={};
shaka.text.Cue=function(a,b,c){var d=shaka.text.Cue;this.startTime=a;this.direction=d.direction.HORIZONTAL_LEFT_TO_RIGHT;this.endTime=b;this.payload=c;this.region=new shaka.text.CueRegion;this.position=null;this.positionAlign=d.positionAlign.AUTO;this.size=100;this.textAlign=d.textAlign.CENTER;this.writingMode=d.writingMode.HORIZONTAL_TOP_TO_BOTTOM;this.lineInterpretation=d.lineInterpretation.LINE_NUMBER;this.line=null;this.lineHeight="";this.lineAlign=d.lineAlign.START;this.displayAlign=d.displayAlign.AFTER;
this.fontSize=this.backgroundImage=this.backgroundColor=this.color="";this.fontWeight=d.fontWeight.NORMAL;this.fontStyle=d.fontStyle.NORMAL;this.fontFamily="";this.textDecoration=[];this.wrapLine=!0;this.id=""};goog.exportSymbol("shaka.text.Cue",shaka.text.Cue);shaka.text.Cue.positionAlign={LEFT:"line-left",RIGHT:"line-right",CENTER:"center",AUTO:"auto"};goog.exportProperty(shaka.text.Cue,"positionAlign",shaka.text.Cue.positionAlign);
shaka.text.Cue.textAlign={LEFT:"left",RIGHT:"right",CENTER:"center",START:"start",END:"end"};goog.exportProperty(shaka.text.Cue,"textAlign",shaka.text.Cue.textAlign);shaka.text.Cue.displayAlign={BEFORE:"before",CENTER:"center",AFTER:"after"};goog.exportProperty(shaka.text.Cue,"displayAlign",shaka.text.Cue.displayAlign);shaka.text.Cue.direction={HORIZONTAL_LEFT_TO_RIGHT:"ltr",HORIZONTAL_RIGHT_TO_LEFT:"rtl"};goog.exportProperty(shaka.text.Cue,"direction",shaka.text.Cue.direction);
shaka.text.Cue.writingMode={HORIZONTAL_TOP_TO_BOTTOM:"horizontal-tb",VERTICAL_LEFT_TO_RIGHT:"vertical-lr",VERTICAL_RIGHT_TO_LEFT:"vertical-rl"};goog.exportProperty(shaka.text.Cue,"writingMode",shaka.text.Cue.writingMode);shaka.text.Cue.lineInterpretation={LINE_NUMBER:0,PERCENTAGE:1};goog.exportProperty(shaka.text.Cue,"lineInterpretation",shaka.text.Cue.lineInterpretation);shaka.text.Cue.lineAlign={CENTER:"center",START:"start",END:"end"};goog.exportProperty(shaka.text.Cue,"lineAlign",shaka.text.Cue.lineAlign);
shaka.text.Cue.fontWeight={NORMAL:400,BOLD:700};goog.exportProperty(shaka.text.Cue,"fontWeight",shaka.text.Cue.fontWeight);shaka.text.Cue.fontStyle={NORMAL:"normal",ITALIC:"italic",OBLIQUE:"oblique"};goog.exportProperty(shaka.text.Cue,"fontStyle",shaka.text.Cue.fontStyle);shaka.text.Cue.textDecoration={UNDERLINE:"underline",LINE_THROUGH:"lineThrough",OVERLINE:"overline"};goog.exportProperty(shaka.text.Cue,"textDecoration",shaka.text.Cue.textDecoration);
shaka.text.CueRegion=function(){var a=shaka.text.CueRegion;this.id="";this.regionAnchorY=this.regionAnchorX=this.viewportAnchorY=this.viewportAnchorX=0;this.height=this.width=100;this.viewportAnchorUnits=this.widthUnits=this.heightUnits=a.units.PERCENTAGE;this.scroll=a.scrollMode.NONE};goog.exportSymbol("shaka.text.CueRegion",shaka.text.CueRegion);shaka.text.CueRegion.units={PX:0,PERCENTAGE:1,LINES:2};goog.exportProperty(shaka.text.CueRegion,"units",shaka.text.CueRegion.units);
shaka.text.CueRegion.scrollMode={NONE:"",UP:"up"};goog.exportProperty(shaka.text.CueRegion,"scrollMode",shaka.text.CueRegion.scrollMode);shaka.text.TextEngine=function(a){this.parser_=null;this.displayer_=a;this.appendWindowStart_=this.timestampOffset_=0;this.appendWindowEnd_=Infinity;this.bufferEnd_=this.bufferStart_=null;this.selectedClosedCaptionId_="";this.closedCaptionsMap_=new Map};shaka.text.TextEngine.parserMap_={};shaka.text.TextEngine.registerParser=function(a,b){shaka.text.TextEngine.parserMap_[a]=b};goog.exportSymbol("shaka.text.TextEngine.registerParser",shaka.text.TextEngine.registerParser);
shaka.text.TextEngine.unregisterParser=function(a){delete shaka.text.TextEngine.parserMap_[a]};goog.exportSymbol("shaka.text.TextEngine.unregisterParser",shaka.text.TextEngine.unregisterParser);shaka.text.TextEngine.isTypeSupported=function(a){return shaka.text.TextEngine.parserMap_[a]||window.muxjs&&a==shaka.util.MimeUtils.CLOSED_CAPTION_MIMETYPE?!0:!1};shaka.text.TextEngine.prototype.destroy=function(){this.displayer_=this.parser_=null;this.closedCaptionsMap_.clear();return Promise.resolve()};
shaka.text.TextEngine.prototype.setDisplayer=function(a){this.displayer_=a};shaka.text.TextEngine.prototype.initParser=function(a){a!=shaka.util.MimeUtils.CLOSED_CAPTION_MIMETYPE&&(a=shaka.text.TextEngine.parserMap_[a],goog.asserts.assert(a,"Text type negotiation should have happened already"),this.parser_=new a)};
shaka.text.TextEngine.prototype.getStartTime=function(a){goog.asserts.assert(this.parser_,"The parser should already be initialized");var b={periodStart:0,segmentStart:null,segmentEnd:0};try{return this.parser_.parseMedia(new Uint8Array(a),b)[0].startTime}catch(c){throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.UNABLE_TO_EXTRACT_CUE_START_TIME,c);}};
shaka.text.TextEngine.prototype.appendBuffer=function(a,b,c){goog.asserts.assert(this.parser_,"The parser should already be initialized");return Promise.resolve().then(function(){if(this.parser_&&this.displayer_)if(null==b||null==c)this.parser_.parseInit(new Uint8Array(a));else{var d={periodStart:this.timestampOffset_,segmentStart:b,segmentEnd:c};d=this.parser_.parseMedia(new Uint8Array(a),d).filter(function(a){return a.startTime>=this.appendWindowStart_&&a.startTime<this.appendWindowEnd_}.bind(this));
this.displayer_.append(d);null==this.bufferStart_?this.bufferStart_=Math.max(b,this.appendWindowStart_):(goog.asserts.assert(null!=this.bufferEnd_,"There should already be a buffered range end."),goog.asserts.assert(1>=b-this.bufferEnd_,"There should not be a gap in text references >1s"));this.bufferEnd_=Math.min(c,this.appendWindowEnd_)}}.bind(this))};
shaka.text.TextEngine.prototype.remove=function(a,b){return Promise.resolve().then(function(){this.displayer_&&this.displayer_.remove(a,b)&&(null==this.bufferStart_?goog.asserts.assert(null==this.bufferEnd_,"end must be null if startTime is null"):(goog.asserts.assert(null!=this.bufferEnd_,"end must be non-null if startTime is non-null"),b<=this.bufferStart_||a>=this.bufferEnd_||(a<=this.bufferStart_&&b>=this.bufferEnd_?this.bufferStart_=this.bufferEnd_=null:a<=this.bufferStart_&&b<this.bufferEnd_?
this.bufferStart_=b:a>this.bufferStart_&&b>=this.bufferEnd_?this.bufferEnd_=a:goog.asserts.assert(!1,"removal from the middle is not supported by TextEngine"))))}.bind(this))};shaka.text.TextEngine.prototype.setTimestampOffset=function(a){this.timestampOffset_=a};shaka.text.TextEngine.prototype.setAppendWindow=function(a,b){this.appendWindowStart_=a;this.appendWindowEnd_=b};shaka.text.TextEngine.prototype.bufferStart=function(){return this.bufferStart_};shaka.text.TextEngine.prototype.bufferEnd=function(){return this.bufferEnd_};
shaka.text.TextEngine.prototype.isBuffered=function(a){return null==this.bufferStart_||null==this.bufferEnd_?!1:a>=this.bufferStart_&&a<this.bufferEnd_};shaka.text.TextEngine.prototype.bufferedAheadOf=function(a){if(null==this.bufferEnd_||this.bufferEnd_<a)return 0;goog.asserts.assert(null!=this.bufferStart_,"start should not be null if end is not null");return this.bufferEnd_-Math.max(a,this.bufferStart_)};shaka.text.TextEngine.prototype.appendCues=function(a){this.displayer_.append(a)};
goog.exportProperty(shaka.text.TextEngine.prototype,"appendCues",shaka.text.TextEngine.prototype.appendCues);shaka.text.TextEngine.prototype.setSelectedClosedCaptionId=function(a,b){this.selectedClosedCaptionId_=a;var c=this.closedCaptionsMap_.get(a);if(c)for(var d=$jscomp.makeIterator(c.keys()),e=d.next();!e.done;e=d.next())if(e=c.get(e.value))e=e.filter(function(a){return a.endTime<=b}),this.displayer_.append(e)};goog.exportProperty(shaka.text.TextEngine.prototype,"setSelectedClosedCaptionId",shaka.text.TextEngine.prototype.setSelectedClosedCaptionId);
shaka.text.TextEngine.prototype.storeAndAppendClosedCaptions=function(a,b,c,d){var e=b+" "+c,f=new Map;a=$jscomp.makeIterator(a);for(var g=a.next();!g.done;g=a.next()){var h=g.value;g=h.stream;f.has(g)||f.set(g,new Map);f.get(g).has(e)||f.get(g).set(e,[]);h.startTime+=d;h.endTime+=d;h.startTime>=this.appendWindowStart_&&h.startTime<this.appendWindowEnd_&&(h=new shaka.text.Cue(h.startTime,h.endTime,h.text),f.get(g).get(e).push(h),g==this.selectedClosedCaptionId_&&this.displayer_.append([h]))}d=$jscomp.makeIterator(f.keys());
for(e=d.next();!e.done;e=d.next())for(e=e.value,this.closedCaptionsMap_.has(e)||this.closedCaptionsMap_.set(e,new Map),a=$jscomp.makeIterator(f.get(e).keys()),g=a.next();!g.done;g=a.next())g=g.value,h=f.get(e).get(g),this.closedCaptionsMap_.get(e).set(g,h);this.bufferStart_=null==this.bufferStart_?Math.max(b,this.appendWindowStart_):Math.min(this.bufferStart_,Math.max(b,this.appendWindowStart_));this.bufferEnd_=Math.max(this.bufferEnd_,Math.min(c,this.appendWindowEnd_))};
shaka.text.TextEngine.prototype.getNumberOfClosedCaptionChannels=function(){return this.closedCaptionsMap_.size};shaka.text.TextEngine.prototype.getNumberOfClosedCaptionsInChannel=function(a){return(a=this.closedCaptionsMap_.get(a))?a.size:0};shaka.media.MediaSourceEngine=function(a,b,c){this.video_=a;this.textDisplayer_=c;this.sourceBuffers_={};this.textEngine_=null;this.queues_={};this.eventManager_=new shaka.util.EventManager;this.destroyed_=!1;this.transmuxers_={};this.captionParser_=b;this.mediaSourceOpen_=new shaka.util.PublicPromise;this.mediaSource_=this.createMediaSource(this.mediaSourceOpen_)};shaka.media.MediaSourceEngine.createObjectURL=window.URL.createObjectURL;
shaka.media.MediaSourceEngine.prototype.createMediaSource=function(a){var b=new MediaSource;this.eventManager_.listenOnce(b,"sourceopen",a.resolve);this.video_.src=shaka.media.MediaSourceEngine.createObjectURL(b);return b};
shaka.media.MediaSourceEngine.isStreamSupported=function(a){var b=shaka.util.MimeUtils.getFullType(a.mimeType,a.codecs),c=shaka.util.MimeUtils.getExtendedType(a);return shaka.text.TextEngine.isTypeSupported(b)||MediaSource.isTypeSupported(c)||shaka.media.Transmuxer.isSupported(b,a.type)};
shaka.media.MediaSourceEngine.probeSupport=function(){for(var a={},b=$jscomp.makeIterator('video/mp4; codecs="avc1.42E01E",video/mp4; codecs="avc3.42E01E",video/mp4; codecs="hev1.1.6.L93.90",video/mp4; codecs="hvc1.1.6.L93.90",video/mp4; codecs="hev1.2.4.L153.B0"; eotf="smpte2084",video/mp4; codecs="hvc1.2.4.L153.B0"; eotf="smpte2084",video/mp4; codecs="vp9",video/mp4; codecs="vp09.00.10.08",audio/mp4; codecs="mp4a.40.2",audio/mp4; codecs="ac-3",audio/mp4; codecs="ec-3",audio/mp4; codecs="opus",audio/mp4; codecs="flac",video/webm; codecs="vp8",video/webm; codecs="vp9",video/webm; codecs="vp09.00.10.08",audio/webm; codecs="vorbis",audio/webm; codecs="opus",video/mp2t; codecs="avc1.42E01E",video/mp2t; codecs="avc3.42E01E",video/mp2t; codecs="hvc1.1.6.L93.90",video/mp2t; codecs="mp4a.40.2",video/mp2t; codecs="ac-3",video/mp2t; codecs="ec-3",text/vtt,application/mp4; codecs="wvtt",application/ttml+xml,application/mp4; codecs="stpp"'.split(",")),c=
b.next();!c.done;c=b.next()){c=c.value;shaka.util.Platform.supportsMediaSource()?shaka.text.TextEngine.isTypeSupported(c)?a[c]=!0:a[c]=MediaSource.isTypeSupported(c)||shaka.media.Transmuxer.isSupported(c):a[c]=shaka.util.Platform.supportsMediaType(c);var d=c.split(";")[0];a[d]=a[d]||a[c]}return a};
shaka.media.MediaSourceEngine.prototype.destroy=function(){var a=this,b=shaka.util.Functional;this.destroyed_=!0;var c=[],d;for(d in this.queues_){var e=this.queues_[d],f=e[0];this.queues_[d]=e.slice(0,1);f&&c.push(f.p["catch"](b.noop));for(f=1;f<e.length;++f)e[f].p.reject()}this.textEngine_&&c.push(this.textEngine_.destroy());this.textDisplayer_&&c.push(this.textDisplayer_.destroy());for(var g in this.transmuxers_)c.push(this.transmuxers_[g].destroy());return Promise.all(c).then(function(){a.eventManager_&&
(a.eventManager_.release(),a.eventManager_=null);a.video_&&(a.video_.removeAttribute("src"),a.video_.load(),a.video_=null);a.mediaSource_=null;a.textEngine_=null;a.textDisplayer_=null;a.sourceBuffers_={};a.transmuxers_={};a.captionParser_=null;if(goog.DEBUG)for(var b in a.queues_)goog.asserts.assert(0==a.queues_[b].length,b+" queue should be empty after destroy!");a.queues_={}})};shaka.media.MediaSourceEngine.prototype.open=function(){return this.mediaSourceOpen_};
shaka.media.MediaSourceEngine.prototype.init=function(a,b){var c=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function e(){var f;return $jscomp.generator.createGenerator(e,function(e){switch(e.nextAddress){case 1:return f=shaka.util.ManifestParserUtils.ContentType,e.yield(c.mediaSourceOpen_,2);case 2:a.forEach(function(a,e){goog.asserts.assert(shaka.media.MediaSourceEngine.isStreamSupported(a),"Type negotiation should happen before MediaSourceEngine.init!");var g=shaka.util.MimeUtils.getFullType(a.mimeType,
a.codecs);e==f.TEXT?c.reinitText(g):(!b&&MediaSource.isTypeSupported(g)||!shaka.media.Transmuxer.isSupported(g,e)||(c.transmuxers_[e]=new shaka.media.Transmuxer,g=shaka.media.Transmuxer.convertTsCodecs(e,g)),g=c.mediaSource_.addSourceBuffer(g),c.eventManager_.listen(g,"error",c.onError_.bind(c,e)),c.eventManager_.listen(g,"updateend",c.onUpdateEnd_.bind(c,e)),c.sourceBuffers_[e]=g,c.queues_[e]=[])}),e.jumpToEnd()}})})};
shaka.media.MediaSourceEngine.prototype.reinitText=function(a){this.textEngine_||(this.textEngine_=new shaka.text.TextEngine(this.textDisplayer_));this.textEngine_.initParser(a)};shaka.media.MediaSourceEngine.prototype.ended=function(){return this.mediaSource_?"ended"==this.mediaSource_.readyState:!0};shaka.media.MediaSourceEngine.prototype.bufferStart=function(a){return a==shaka.util.ManifestParserUtils.ContentType.TEXT?this.textEngine_.bufferStart():shaka.media.TimeRangesUtils.bufferStart(this.getBuffered_(a))};
shaka.media.MediaSourceEngine.prototype.bufferEnd=function(a){return a==shaka.util.ManifestParserUtils.ContentType.TEXT?this.textEngine_.bufferEnd():shaka.media.TimeRangesUtils.bufferEnd(this.getBuffered_(a))};shaka.media.MediaSourceEngine.prototype.isBuffered=function(a,b,c){if(a==shaka.util.ManifestParserUtils.ContentType.TEXT)return this.textEngine_.isBuffered(b);a=this.getBuffered_(a);return shaka.media.TimeRangesUtils.isBuffered(a,b,c)};
shaka.media.MediaSourceEngine.prototype.bufferedAheadOf=function(a,b){if(a==shaka.util.ManifestParserUtils.ContentType.TEXT)return this.textEngine_.bufferedAheadOf(b);var c=this.getBuffered_(a);return shaka.media.TimeRangesUtils.bufferedAheadOf(c,b)};
shaka.media.MediaSourceEngine.prototype.getBufferedInfo=function(a){var b=shaka.util.ManifestParserUtils.ContentType,c=shaka.media.TimeRangesUtils.getBufferedInfo;a.total=c(this.video_.buffered);a.audio=c(this.getBuffered_(b.AUDIO));a.video=c(this.getBuffered_(b.VIDEO));a.text=[];this.textEngine_&&(b=this.textEngine_.bufferStart(),c=this.textEngine_.bufferEnd(),null!=b&&null!=c&&a.text.push({start:b,end:c}))};
shaka.media.MediaSourceEngine.prototype.getBuffered_=function(a){try{return this.sourceBuffers_[a].buffered}catch(b){return a in this.sourceBuffers_&&shaka.log.error("failed to get buffered range for "+a,b),null}};
shaka.media.MediaSourceEngine.prototype.appendBuffer=function(a,b,c,d,e){var f=this,g=shaka.util.ManifestParserUtils.ContentType;if(a==g.TEXT)return this.textEngine_.appendBuffer(b,c,d);if(this.transmuxers_[a])return this.transmuxers_[a].transmux(b).then(function(b){this.textEngine_||this.reinitText("text/vtt");b.captions&&this.textEngine_.storeAndAppendClosedCaptions(b.captions,c,d,this.sourceBuffers_[g.VIDEO].timestampOffset);return this.enqueueOperation_(a,this.append_.bind(this,a,b.data.buffer))}.bind(this));
e&&window.muxjs&&(this.textEngine_||this.reinitText("text/vtt"),null==c&&null==d?this.captionParser_.init(b):this.captionParser_.parseFrom(b,function(a){a.length&&f.textEngine_.storeAndAppendClosedCaptions(a,c,d,f.sourceBuffers_[g.VIDEO].timestampOffset)}));return this.enqueueOperation_(a,this.append_.bind(this,a,b))};
shaka.media.MediaSourceEngine.prototype.setSelectedClosedCaptionId=function(a){var b=this.bufferEnd(shaka.util.ManifestParserUtils.ContentType.VIDEO)||0;this.textEngine_.setSelectedClosedCaptionId(a,b)};
shaka.media.MediaSourceEngine.prototype.remove=function(a,b,c){goog.asserts.assert(c<Number.MAX_VALUE,"remove() with MAX_VALUE or Infinity is not IE-compatible!");return a==shaka.util.ManifestParserUtils.ContentType.TEXT?this.textEngine_.remove(b,c):this.enqueueOperation_(a,this.remove_.bind(this,a,b,c))};
shaka.media.MediaSourceEngine.prototype.clear=function(a){if(a==shaka.util.ManifestParserUtils.ContentType.TEXT){if(!this.textEngine_)return Promise.resolve();this.captionParser_.reset();return this.textEngine_.remove(0,Infinity)}return this.enqueueOperation_(a,this.remove_.bind(this,a,0,this.mediaSource_.duration))};shaka.media.MediaSourceEngine.prototype.flush=function(a){return a==shaka.util.ManifestParserUtils.ContentType.TEXT?Promise.resolve():this.enqueueOperation_(a,this.flush_.bind(this,a))};
shaka.media.MediaSourceEngine.prototype.setStreamProperties=function(a,b,c,d){return a==shaka.util.ManifestParserUtils.ContentType.TEXT?(this.textEngine_.setTimestampOffset(b),this.textEngine_.setAppendWindow(c,d),Promise.resolve()):Promise.all([this.enqueueOperation_(a,this.abort_.bind(this,a)),this.enqueueOperation_(a,this.setTimestampOffset_.bind(this,a,b)),this.enqueueOperation_(a,this.setAppendWindow_.bind(this,a,c,d))])};
shaka.media.MediaSourceEngine.prototype.endOfStream=function(a){return this.enqueueBlockingOperation_(function(){this.ended()||(a?this.mediaSource_.endOfStream(a):this.mediaSource_.endOfStream())}.bind(this))};
shaka.media.MediaSourceEngine.prototype.setDuration=function(a){goog.asserts.assert(isNaN(this.mediaSource_.duration)||this.mediaSource_.duration<=a,"duration cannot decrease: "+this.mediaSource_.duration+" -> "+a);return this.enqueueBlockingOperation_(function(){this.mediaSource_.duration=a}.bind(this))};shaka.media.MediaSourceEngine.prototype.getDuration=function(){return this.mediaSource_.duration};shaka.media.MediaSourceEngine.prototype.append_=function(a,b){this.sourceBuffers_[a].appendBuffer(b)};
shaka.media.MediaSourceEngine.prototype.remove_=function(a,b,c){if(c<=b)this.onUpdateEnd_(a);else this.sourceBuffers_[a].remove(b,c)};shaka.media.MediaSourceEngine.prototype.abort_=function(a){var b=this.sourceBuffers_[a].appendWindowStart,c=this.sourceBuffers_[a].appendWindowEnd;this.sourceBuffers_[a].abort();this.sourceBuffers_[a].appendWindowStart=b;this.sourceBuffers_[a].appendWindowEnd=c;this.onUpdateEnd_(a)};
shaka.media.MediaSourceEngine.prototype.flush_=function(a){goog.asserts.assert(0==this.video_.buffered.length,"MediaSourceEngine.flush_ should only be used after clearing all data!");this.video_.currentTime-=.001;this.onUpdateEnd_(a)};shaka.media.MediaSourceEngine.prototype.setTimestampOffset_=function(a,b){0>b&&(b+=.001);this.sourceBuffers_[a].timestampOffset=b;this.onUpdateEnd_(a)};
shaka.media.MediaSourceEngine.prototype.setAppendWindow_=function(a,b,c){this.sourceBuffers_[a].appendWindowStart=0;this.sourceBuffers_[a].appendWindowEnd=c;this.sourceBuffers_[a].appendWindowStart=b;this.onUpdateEnd_(a)};
shaka.media.MediaSourceEngine.prototype.onError_=function(a,b){var c=this.queues_[a][0];goog.asserts.assert(c,"Spurious error event!");goog.asserts.assert(!this.sourceBuffers_[a].updating,"SourceBuffer should not be updating on error!");c.p.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.MEDIA_SOURCE_OPERATION_FAILED,this.video_.error?this.video_.error.code:0))};
shaka.media.MediaSourceEngine.prototype.onUpdateEnd_=function(a){var b=this.queues_[a][0];goog.asserts.assert(b,"Spurious updateend event!");b&&(goog.asserts.assert(!this.sourceBuffers_[a].updating,"SourceBuffer should not be updating on updateend!"),b.p.resolve(),this.popFromQueue_(a))};
shaka.media.MediaSourceEngine.prototype.enqueueOperation_=function(a,b){if(this.destroyed_)return Promise.reject();var c={start:b,p:new shaka.util.PublicPromise};this.queues_[a].push(c);if(1==this.queues_[a].length)try{c.start()}catch(d){"QuotaExceededError"==d.name?c.p.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.QUOTA_EXCEEDED_ERROR,a)):c.p.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,
shaka.util.Error.Code.MEDIA_SOURCE_OPERATION_THREW,d)),this.popFromQueue_(a)}return c.p};
shaka.media.MediaSourceEngine.prototype.enqueueBlockingOperation_=function(a){if(this.destroyed_)return Promise.reject();var b=[],c;for(c in this.sourceBuffers_){var d=new shaka.util.PublicPromise,e={start:function(a){a.resolve()}.bind(null,d),p:d};this.queues_[c].push(e);b.push(d);1==this.queues_[c].length&&e.start()}return Promise.all(b).then(function(){if(goog.DEBUG)for(var b in this.sourceBuffers_)goog.asserts.assert(0==this.sourceBuffers_[b].updating,"SourceBuffers should not be updating after a blocking op!");
try{a()}catch(k){var c=Promise.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.MEDIA_SOURCE_OPERATION_THREW,k))}for(var d in this.sourceBuffers_)this.popFromQueue_(d);return c}.bind(this),function(a){goog.asserts.assert(this.destroyed_,"Should be destroyed by now");if(goog.DEBUG)for(var c in this.sourceBuffers_)this.queues_[c].length&&(goog.asserts.assert(1==this.queues_[c].length,"Should be at most one item in queue!"),goog.asserts.assert(b.includes(this.queues_[c][0].p),
"The item in queue should be one of our waiters!"),this.queues_[c].shift());throw a;}.bind(this))};shaka.media.MediaSourceEngine.prototype.popFromQueue_=function(a){this.queues_[a].shift();var b=this.queues_[a][0];if(b)try{b.start()}catch(c){b.p.reject(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.MEDIA_SOURCE_OPERATION_THREW,c)),this.popFromQueue_(a)}};
shaka.media.MediaSourceEngine.prototype.getTextDisplayer=function(){goog.asserts.assert(this.textDisplayer_,"TextDisplayer should only be null when this is destroyed");return this.textDisplayer_};shaka.media.MediaSourceEngine.prototype.setTextDisplayer=function(a){var b=this.textDisplayer_;this.textDisplayer_=a;b&&(a.setTextVisibility(b.isTextVisible()),b.destroy());this.textEngine_&&this.textEngine_.setDisplayer(a)};shaka.util.LanguageUtils=function(){};shaka.util.LanguageUtils.areLocaleCompatible=function(a,b){var c=shaka.util.LanguageUtils;a=c.normalize(a);b=c.normalize(b);return a==b};shaka.util.LanguageUtils.areLanguageCompatible=function(a,b){var c=shaka.util.LanguageUtils;a=c.normalize(a);b=c.normalize(b);var d=c.disassembleLocale_(a);c=c.disassembleLocale_(b);return d[0]==c[0]};
shaka.util.LanguageUtils.isParentOf=function(a,b){var c=shaka.util.LanguageUtils;a=c.normalize(a);b=c.normalize(b);var d=c.disassembleLocale_(a);c=c.disassembleLocale_(b);return d[0]==c[0]&&1==d.length&&2==c.length};shaka.util.LanguageUtils.isSiblingOf=function(a,b){var c=shaka.util.LanguageUtils;a=c.normalize(a);b=c.normalize(b);var d=c.disassembleLocale_(a);c=c.disassembleLocale_(b);return 2==d.length&&2==c.length&&d[0]==c[0]};
shaka.util.LanguageUtils.normalize=function(a){var b=shaka.util.LanguageUtils;a=a.split("-");a=$jscomp.makeIterator(a);var c=a.next().value;c=void 0===c?"":c;var d=a.next().value;d=void 0===d?"":d;a=$jscomp.arrayFromIterator(a);c=c.toLowerCase();c=b.isoMap_.get(c)||c;d=d.toUpperCase();return[d?c+"-"+d:c].concat($jscomp.arrayFromIterable(a)).join("-")};shaka.util.LanguageUtils.areSiblings=function(a,b){var c=shaka.util.LanguageUtils,d=c.getBase(a);c=c.getBase(b);return a!=d&&b!=c&&d==c};
shaka.util.LanguageUtils.getBase=function(a){var b=shaka.util.LanguageUtils,c=a.indexOf("-");a=0<=c?a.substring(0,c):a;a=a.toLowerCase();return a=b.isoMap_.get(a)||a};shaka.util.LanguageUtils.getLocaleForText=function(a){var b=shaka.util.LanguageUtils;goog.asserts.assert(a.type==shaka.util.ManifestParserUtils.ContentType.TEXT,"Can only get language from text streams");return b.normalize(a.language||"und")};
shaka.util.LanguageUtils.getLocaleForVariant=function(a){var b=shaka.util.LanguageUtils;return a.language?b.normalize(a.language):a.audio&&a.audio.language?b.normalize(a.audio.language):a.video&&a.video.language?b.normalize(a.video.language):"und"};
shaka.util.LanguageUtils.findClosestLocale=function(a,b){for(var c=shaka.util.LanguageUtils,d=c.normalize(a),e=new Set,f=$jscomp.makeIterator(b),g=f.next();!g.done;g=f.next())e.add(c.normalize(g.value));f=$jscomp.makeIterator(e);for(g=f.next();!g.done;g=f.next())if(g=g.value,g==d)return g;f=$jscomp.makeIterator(e);for(g=f.next();!g.done;g=f.next())if(g=g.value,c.isParentOf(g,d))return g;f=$jscomp.makeIterator(e);for(g=f.next();!g.done;g=f.next())if(g=g.value,c.isSiblingOf(g,d))return g;e=$jscomp.makeIterator(e);
for(g=e.next();!g.done;g=e.next())if(g=g.value,c.isParentOf(d,g))return g;return null};shaka.util.LanguageUtils.disassembleLocale_=function(a){var b=a.split("-");goog.asserts.assert(2>=b.length,["Locales should not have more than 2 components. ",a," has too many components."].join());return b};
shaka.util.LanguageUtils.isoMap_=new Map([["aar","aa"],["abk","ab"],["afr","af"],["aka","ak"],["alb","sq"],["amh","am"],["ara","ar"],["arg","an"],["arm","hy"],["asm","as"],["ava","av"],["ave","ae"],["aym","ay"],["aze","az"],["bak","ba"],["bam","bm"],["baq","eu"],["bel","be"],["ben","bn"],["bih","bh"],["bis","bi"],["bod","bo"],["bos","bs"],["bre","br"],["bul","bg"],["bur","my"],["cat","ca"],["ces","cs"],["cha","ch"],["che","ce"],["chi","zh"],["chu","cu"],["chv","cv"],["cor","kw"],["cos","co"],["cre",
"cr"],["cym","cy"],["cze","cs"],["dan","da"],["deu","de"],["div","dv"],["dut","nl"],["dzo","dz"],["ell","el"],["eng","en"],["epo","eo"],["est","et"],["eus","eu"],["ewe","ee"],["fao","fo"],["fas","fa"],["fij","fj"],["fin","fi"],["fra","fr"],["fre","fr"],["fry","fy"],["ful","ff"],["geo","ka"],["ger","de"],["gla","gd"],["gle","ga"],["glg","gl"],["glv","gv"],["gre","el"],["grn","gn"],["guj","gu"],["hat","ht"],["hau","ha"],["heb","he"],["her","hz"],["hin","hi"],["hmo","ho"],["hrv","hr"],["hun","hu"],["hye",
"hy"],["ibo","ig"],["ice","is"],["ido","io"],["iii","ii"],["iku","iu"],["ile","ie"],["ina","ia"],["ind","id"],["ipk","ik"],["isl","is"],["ita","it"],["jav","jv"],["jpn","ja"],["kal","kl"],["kan","kn"],["kas","ks"],["kat","ka"],["kau","kr"],["kaz","kk"],["khm","km"],["kik","ki"],["kin","rw"],["kir","ky"],["kom","kv"],["kon","kg"],["kor","ko"],["kua","kj"],["kur","ku"],["lao","lo"],["lat","la"],["lav","lv"],["lim","li"],["lin","ln"],["lit","lt"],["ltz","lb"],["lub","lu"],["lug","lg"],["mac","mk"],["mah",
"mh"],["mal","ml"],["mao","mi"],["mar","mr"],["may","ms"],["mkd","mk"],["mlg","mg"],["mlt","mt"],["mon","mn"],["mri","mi"],["msa","ms"],["mya","my"],["nau","na"],["nav","nv"],["nbl","nr"],["nde","nd"],["ndo","ng"],["nep","ne"],["nld","nl"],["nno","nn"],["nob","nb"],["nor","no"],["nya","ny"],["oci","oc"],["oji","oj"],["ori","or"],["orm","om"],["oss","os"],["pan","pa"],["per","fa"],["pli","pi"],["pol","pl"],["por","pt"],["pus","ps"],["que","qu"],["roh","rm"],["ron","ro"],["rum","ro"],["run","rn"],["rus",
"ru"],["sag","sg"],["san","sa"],["sin","si"],["slk","sk"],["slo","sk"],["slv","sl"],["sme","se"],["smo","sm"],["sna","sn"],["snd","sd"],["som","so"],["sot","st"],["spa","es"],["sqi","sq"],["srd","sc"],["srp","sr"],["ssw","ss"],["sun","su"],["swa","sw"],["swe","sv"],["tah","ty"],["tam","ta"],["tat","tt"],["tel","te"],["tgk","tg"],["tgl","tl"],["tha","th"],["tib","bo"],["tir","ti"],["ton","to"],["tsn","tn"],["tso","ts"],["tuk","tk"],["tur","tr"],["twi","tw"],["uig","ug"],["ukr","uk"],["urd","ur"],["uzb",
"uz"],["ven","ve"],["vie","vi"],["vol","vo"],["wel","cy"],["wln","wa"],["wol","wo"],["xho","xh"],["yid","yi"],["yor","yo"],["zha","za"],["zho","zh"],["zul","zu"]]);shaka.util.StreamUtils={};shaka.util.StreamUtils.meetsRestrictions=function(a,b,c){var d=function(a,b,c){return a>=b&&a<=c},e=a.video;return e&&e.width&&e.height&&!(d(e.width,b.minWidth,Math.min(b.maxWidth,c.width))&&d(e.height,b.minHeight,Math.min(b.maxHeight,c.height))&&d(e.width*e.height,b.minPixels,b.maxPixels))||!d(a.bandwidth,b.minBandwidth,b.maxBandwidth)?!1:!0};
shaka.util.StreamUtils.applyRestrictions=function(a,b,c){var d=!1;a.forEach(function(a){var e=a.allowedByApplication;a.allowedByApplication=shaka.util.StreamUtils.meetsRestrictions(a,b,c);e!=a.allowedByApplication&&(d=!0)});return d};
shaka.util.StreamUtils.filterNewPeriod=function(a,b,c,d){var e=shaka.util.StreamUtils;b&&goog.asserts.assert(e.isAudio(b),"Audio streams must have the audio type.");c&&goog.asserts.assert(e.isVideo(c),"Video streams must have the video type.");d.variants=d.variants.filter(function(d){if(a&&a.initialized()&&!a.supportsVariant(d))return shaka.log.debug("Dropping variant - not compatible with key system",d),!1;var f=d.audio;d=d.video;return f&&!shaka.media.MediaSourceEngine.isStreamSupported(f)?(shaka.log.debug("Dropping variant - audio not compatible with platform",
e.getStreamSummaryString_(f)),!1):d&&!shaka.media.MediaSourceEngine.isStreamSupported(d)?(shaka.log.debug("Dropping variant - video not compatible with platform",e.getStreamSummaryString_(d)),!1):f&&b&&!e.areStreamsCompatible_(f,b)?(shaka.log.debug("Droping variant - not compatible with active audio","active audio",e.getStreamSummaryString_(b),"variant.audio",e.getStreamSummaryString_(f)),!1):d&&c&&!e.areStreamsCompatible_(d,c)?(shaka.log.debug("Droping variant - not compatible with active video",
"active video",e.getStreamSummaryString_(c),"variant.video",e.getStreamSummaryString_(d)),!1):!0});d.textStreams=d.textStreams.filter(function(a){var b=shaka.util.MimeUtils.getFullType(a.mimeType,a.codecs);(b=shaka.text.TextEngine.isTypeSupported(b))||shaka.log.debug("Dropping text stream. Is not supported by the platform.",a);return b})};shaka.util.StreamUtils.areStreamsCompatible_=function(a,b){return a.mimeType!=b.mimeType||a.codecs.split(".")[0]!=b.codecs.split(".")[0]?!1:!0};
shaka.util.StreamUtils.variantToTrack=function(a){var b=a.audio,c=a.video,d=b?b.codecs:null,e=c?c.codecs:null,f=[];e&&f.push(e);d&&f.push(d);var g=[];c&&g.push(c.mimeType);b&&g.push(b.mimeType);g=g[0]||null;var h=[];b&&h.push(b.kind);c&&h.push(c.kind);h=h[0]||null;var k=new Set;b&&b.roles.forEach(function(a){return k.add(a)});c&&c.roles.forEach(function(a){return k.add(a)});a={id:a.id,active:!1,type:"variant",bandwidth:a.bandwidth,language:a.language,label:null,kind:h,width:null,height:null,frameRate:null,
mimeType:g,codecs:f.join(", "),audioCodec:d,videoCodec:e,primary:a.primary,roles:Array.from(k),audioRoles:null,videoId:null,audioId:null,channelsCount:null,audioBandwidth:null,videoBandwidth:null,originalVideoId:null,originalAudioId:null,originalTextId:null};c&&(a.videoId=c.id,a.originalVideoId=c.originalId,a.width=c.width||null,a.height=c.height||null,a.frameRate=c.frameRate||null,a.videoBandwidth=c.bandwidth||null);b&&(a.audioId=b.id,a.originalAudioId=b.originalId,a.channelsCount=b.channelsCount,
a.audioBandwidth=b.bandwidth||null,a.label=b.label,a.audioRoles=b.roles);return a};
shaka.util.StreamUtils.textStreamToTrack=function(a){return{id:a.id,active:!1,type:shaka.util.ManifestParserUtils.ContentType.TEXT,bandwidth:0,language:a.language,label:a.label,kind:a.kind||null,width:null,height:null,frameRate:null,mimeType:a.mimeType,codecs:a.codecs||null,audioCodec:null,videoCodec:null,primary:a.primary,roles:a.roles,audioRoles:null,videoId:null,audioId:null,channelsCount:null,audioBandwidth:null,videoBandwidth:null,originalVideoId:null,originalAudioId:null,originalTextId:a.originalId}};
shaka.util.StreamUtils.html5TrackId=function(a){a.__shaka_id||(a.__shaka_id=shaka.util.StreamUtils.nextTrackId_++);return a.__shaka_id};shaka.util.StreamUtils.nextTrackId_=0;shaka.util.StreamUtils.html5TextTrackToTrack=function(a){var b=shaka.util.MimeUtils.CLOSED_CAPTION_MIMETYPE,c=shaka.util.StreamUtils.html5TrackToGenericShakaTrack_(a);c.active="disabled"!=a.mode;c.type="text";c.originalTextId=a.id;"captions"==a.kind&&(c.mimeType=b);return c};
shaka.util.StreamUtils.html5AudioTrackToTrack=function(a){var b=shaka.util.StreamUtils.html5TrackToGenericShakaTrack_(a);b.active=a.enabled;b.type="variant";b.originalAudioId=a.id;"main"==a.kind?(b.primary=!0,b.roles=["main"],b.audioRoles=["main"]):b.audioRoles=[];return b};
shaka.util.StreamUtils.html5TrackToGenericShakaTrack_=function(a){return{id:shaka.util.StreamUtils.html5TrackId(a),active:!1,type:"",bandwidth:0,language:shaka.util.LanguageUtils.normalize(a.language),label:a.label,kind:a.kind,width:null,height:null,frameRate:null,mimeType:null,codecs:null,audioCodec:null,videoCodec:null,primary:!1,roles:[],audioRoles:null,videoId:null,audioId:null,channelsCount:null,audioBandwidth:null,videoBandwidth:null,originalVideoId:null,originalAudioId:null,originalTextId:null}};
shaka.util.StreamUtils.isPlayable=function(a){return a.allowedByApplication&&a.allowedByKeySystem};shaka.util.StreamUtils.getPlayableVariants=function(a){return a.filter(function(a){return shaka.util.StreamUtils.isPlayable(a)})};
shaka.util.StreamUtils.filterVariantsByAudioChannelCount=function(a,b){var c=a.filter(function(a){return a.audio&&a.audio.channelsCount}),d=new Map;c=$jscomp.makeIterator(c);for(var e=c.next();!e.done;e=c.next()){e=e.value;var f=e.audio.channelsCount;goog.asserts.assert(null!=f,"Must have count after filtering!");d.has(f)||d.set(f,[]);d.get(f).push(e)}c=Array.from(d.keys());if(0==c.length)return a;e=c.filter(function(a){return a<=b});return e.length?d.get(Math.max.apply(null,e)):d.get(Math.min.apply(null,
c))};
shaka.util.StreamUtils.filterStreamsByLanguageAndRole=function(a,b,c){var d=shaka.util.LanguageUtils,e=a,f=a.filter(function(a){return a.primary});f.length&&(e=f);var g=e.length?e[0].language:"";e=e.filter(function(a){return a.language==g});if(b){var h=d.findClosestLocale(d.normalize(b),a.map(function(a){return a.language}));h&&(e=a.filter(function(a){return d.normalize(a.language)==h}))}if(c){a=shaka.util.StreamUtils.filterTextStreamsByRole_(e,c);if(a.length)return a;shaka.log.warning("No exact match for the text role could be found.")}else if(a=e.filter(function(a){return 0==
a.roles.length}),a.length)return a;a=e.map(function(a){return a.roles}).reduce(shaka.util.Functional.collapseArrays,[]);return a.length?shaka.util.StreamUtils.filterTextStreamsByRole_(e,a[0]):e};shaka.util.StreamUtils.filterTextStreamsByRole_=function(a,b){return a.filter(function(a){return a.roles.includes(b)})};
shaka.util.StreamUtils.getVariantByStreams=function(a,b,c){a&&goog.asserts.assert(shaka.util.StreamUtils.isAudio(a),"Audio streams must have the audio type.");b&&goog.asserts.assert(shaka.util.StreamUtils.isVideo(b),"Video streams must have the video type.");for(var d=0;d<c.length;d++)if(c[d].audio==a&&c[d].video==b)return c[d];return null};shaka.util.StreamUtils.isAudio=function(a){return a.type==shaka.util.ManifestParserUtils.ContentType.AUDIO};
shaka.util.StreamUtils.isVideo=function(a){return a.type==shaka.util.ManifestParserUtils.ContentType.VIDEO};shaka.util.StreamUtils.getVariantStreams=function(a){var b=[];a.audio&&b.push(a.audio);a.video&&b.push(a.video);return b};
shaka.util.StreamUtils.getStreamSummaryString_=function(a){return shaka.util.StreamUtils.isAudio(a)?"type=audio codecs="+a.codecs+" bandwidth="+a.bandwidth+" channelsCount="+a.channelsCount:shaka.util.StreamUtils.isVideo(a)?"type=video codecs="+a.codecs+" bandwidth="+a.bandwidth+" frameRate="+a.frameRate+" width="+a.width+" height="+a.height:"unexpected stream type"};shaka.abr.SimpleAbrManager=function(){this.switch_=null;this.enabled_=!1;this.bandwidthEstimator_=new shaka.abr.EwmaBandwidthEstimator;this.variants_=[];this.startupComplete_=!1;this.config_=this.lastTimeChosenMs_=null};goog.exportSymbol("shaka.abr.SimpleAbrManager",shaka.abr.SimpleAbrManager);shaka.abr.SimpleAbrManager.prototype.stop=function(){this.switch_=null;this.enabled_=!1;this.variants_=[];this.lastTimeChosenMs_=null};goog.exportProperty(shaka.abr.SimpleAbrManager.prototype,"stop",shaka.abr.SimpleAbrManager.prototype.stop);
shaka.abr.SimpleAbrManager.prototype.init=function(a){this.switch_=a};goog.exportProperty(shaka.abr.SimpleAbrManager.prototype,"init",shaka.abr.SimpleAbrManager.prototype.init);
shaka.abr.SimpleAbrManager.prototype.chooseVariant=function(){var a=shaka.abr.SimpleAbrManager,b=a.filterAndSortVariants_(this.config_.restrictions,this.variants_),c=this.bandwidthEstimator_.getBandwidthEstimate(this.config_.defaultBandwidthEstimate);this.variants_.length&&!b.length&&(shaka.log.warning("No variants met the ABR restrictions. Choosing a variant by lowest bandwidth."),b=a.filterAndSortVariants_(null,this.variants_),b=[b[0]]);a=b[0]||null;for(var d=0;d<b.length;++d){var e=b[d],f=e.bandwidth/
this.config_.bandwidthDowngradeTarget,g=(b[d+1]||{bandwidth:Infinity}).bandwidth/this.config_.bandwidthUpgradeTarget;shaka.log.v2("Bandwidth ranges:",(e.bandwidth/1E6).toFixed(3),(f/1E6).toFixed(3),(g/1E6).toFixed(3));c>=f&&c<=g&&(a=e)}this.lastTimeChosenMs_=Date.now();return a};goog.exportProperty(shaka.abr.SimpleAbrManager.prototype,"chooseVariant",shaka.abr.SimpleAbrManager.prototype.chooseVariant);shaka.abr.SimpleAbrManager.prototype.enable=function(){this.enabled_=!0};
goog.exportProperty(shaka.abr.SimpleAbrManager.prototype,"enable",shaka.abr.SimpleAbrManager.prototype.enable);shaka.abr.SimpleAbrManager.prototype.disable=function(){this.enabled_=!1};goog.exportProperty(shaka.abr.SimpleAbrManager.prototype,"disable",shaka.abr.SimpleAbrManager.prototype.disable);
shaka.abr.SimpleAbrManager.prototype.segmentDownloaded=function(a,b){shaka.log.v2("Segment downloaded:","deltaTimeMs="+a,"numBytes="+b,"lastTimeChosenMs="+this.lastTimeChosenMs_,"enabled="+this.enabled_);goog.asserts.assert(0<=a,"expected a non-negative duration");this.bandwidthEstimator_.sample(a,b);null!=this.lastTimeChosenMs_&&this.enabled_&&this.suggestStreams_()};goog.exportProperty(shaka.abr.SimpleAbrManager.prototype,"segmentDownloaded",shaka.abr.SimpleAbrManager.prototype.segmentDownloaded);
shaka.abr.SimpleAbrManager.prototype.getBandwidthEstimate=function(){return this.bandwidthEstimator_.getBandwidthEstimate(this.config_.defaultBandwidthEstimate)};goog.exportProperty(shaka.abr.SimpleAbrManager.prototype,"getBandwidthEstimate",shaka.abr.SimpleAbrManager.prototype.getBandwidthEstimate);shaka.abr.SimpleAbrManager.prototype.setVariants=function(a){this.variants_=a};goog.exportProperty(shaka.abr.SimpleAbrManager.prototype,"setVariants",shaka.abr.SimpleAbrManager.prototype.setVariants);
shaka.abr.SimpleAbrManager.prototype.configure=function(a){this.config_=a};goog.exportProperty(shaka.abr.SimpleAbrManager.prototype,"configure",shaka.abr.SimpleAbrManager.prototype.configure);
shaka.abr.SimpleAbrManager.prototype.suggestStreams_=function(){shaka.log.v2("Suggesting Streams...");goog.asserts.assert(null!=this.lastTimeChosenMs_,"lastTimeChosenMs_ should not be null");if(!this.startupComplete_){if(!this.bandwidthEstimator_.hasGoodEstimate()){shaka.log.v2("Still waiting for a good estimate...");return}this.startupComplete_=!0}else if(Date.now()-this.lastTimeChosenMs_<1E3*this.config_.switchInterval){shaka.log.v2("Still within switch interval...");return}var a=this.chooseVariant(),
b=this.bandwidthEstimator_.getBandwidthEstimate(this.config_.defaultBandwidthEstimate);shaka.log.debug("Calling switch_(), bandwidth="+Math.round(b/1E3)+" kbps");this.switch_(a)};shaka.abr.SimpleAbrManager.filterAndSortVariants_=function(a,b){a&&(b=b.filter(function(b){goog.asserts.assert(a,"Restrictions should exist!");return shaka.util.StreamUtils.meetsRestrictions(b,a,{width:Infinity,height:Infinity})}));return b.sort(function(a,b){return a.bandwidth-b.bandwidth})};shaka.util.DataViewReader=function(a,b){this.dataView_=a;this.littleEndian_=b==shaka.util.DataViewReader.Endianness.LITTLE_ENDIAN;this.position_=0};goog.exportSymbol("shaka.util.DataViewReader",shaka.util.DataViewReader);shaka.util.DataViewReader.Endianness={BIG_ENDIAN:0,LITTLE_ENDIAN:1};goog.exportProperty(shaka.util.DataViewReader,"Endianness",shaka.util.DataViewReader.Endianness);shaka.util.DataViewReader.prototype.hasMoreData=function(){return this.position_<this.dataView_.byteLength};
goog.exportProperty(shaka.util.DataViewReader.prototype,"hasMoreData",shaka.util.DataViewReader.prototype.hasMoreData);shaka.util.DataViewReader.prototype.getPosition=function(){return this.position_};goog.exportProperty(shaka.util.DataViewReader.prototype,"getPosition",shaka.util.DataViewReader.prototype.getPosition);shaka.util.DataViewReader.prototype.getLength=function(){return this.dataView_.byteLength};goog.exportProperty(shaka.util.DataViewReader.prototype,"getLength",shaka.util.DataViewReader.prototype.getLength);
shaka.util.DataViewReader.prototype.readUint8=function(){try{var a=this.dataView_.getUint8(this.position_);this.position_+=1;return a}catch(b){this.throwOutOfBounds_()}};goog.exportProperty(shaka.util.DataViewReader.prototype,"readUint8",shaka.util.DataViewReader.prototype.readUint8);shaka.util.DataViewReader.prototype.readUint16=function(){try{var a=this.dataView_.getUint16(this.position_,this.littleEndian_);this.position_+=2;return a}catch(b){this.throwOutOfBounds_()}};
goog.exportProperty(shaka.util.DataViewReader.prototype,"readUint16",shaka.util.DataViewReader.prototype.readUint16);shaka.util.DataViewReader.prototype.readUint32=function(){try{var a=this.dataView_.getUint32(this.position_,this.littleEndian_);this.position_+=4;return a}catch(b){this.throwOutOfBounds_()}};goog.exportProperty(shaka.util.DataViewReader.prototype,"readUint32",shaka.util.DataViewReader.prototype.readUint32);
shaka.util.DataViewReader.prototype.readInt32=function(){try{var a=this.dataView_.getInt32(this.position_,this.littleEndian_);this.position_+=4;return a}catch(b){this.throwOutOfBounds_()}};goog.exportProperty(shaka.util.DataViewReader.prototype,"readInt32",shaka.util.DataViewReader.prototype.readInt32);
shaka.util.DataViewReader.prototype.readUint64=function(){try{if(this.littleEndian_){var a=this.dataView_.getUint32(this.position_,!0);var b=this.dataView_.getUint32(this.position_+4,!0)}else b=this.dataView_.getUint32(this.position_,!1),a=this.dataView_.getUint32(this.position_+4,!1)}catch(c){this.throwOutOfBounds_()}if(2097151<b)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.JS_INTEGER_OVERFLOW);this.position_+=8;return b*Math.pow(2,
32)+a};goog.exportProperty(shaka.util.DataViewReader.prototype,"readUint64",shaka.util.DataViewReader.prototype.readUint64);shaka.util.DataViewReader.prototype.readBytes=function(a){goog.asserts.assert(0<=a,"Bad call to DataViewReader.readBytes");this.position_+a>this.dataView_.byteLength&&this.throwOutOfBounds_();var b=new Uint8Array(this.dataView_.buffer,this.dataView_.byteOffset+this.position_,a);this.position_+=a;return new Uint8Array(b)};
goog.exportProperty(shaka.util.DataViewReader.prototype,"readBytes",shaka.util.DataViewReader.prototype.readBytes);shaka.util.DataViewReader.prototype.skip=function(a){goog.asserts.assert(0<=a,"Bad call to DataViewReader.skip");this.position_+a>this.dataView_.byteLength&&this.throwOutOfBounds_();this.position_+=a};goog.exportProperty(shaka.util.DataViewReader.prototype,"skip",shaka.util.DataViewReader.prototype.skip);
shaka.util.DataViewReader.prototype.rewind=function(a){goog.asserts.assert(0<=a,"Bad call to DataViewReader.rewind");this.position_<a&&this.throwOutOfBounds_();this.position_-=a};goog.exportProperty(shaka.util.DataViewReader.prototype,"rewind",shaka.util.DataViewReader.prototype.rewind);shaka.util.DataViewReader.prototype.seek=function(a){goog.asserts.assert(0<=a,"Bad call to DataViewReader.seek");(0>a||a>this.dataView_.byteLength)&&this.throwOutOfBounds_();this.position_=a};
goog.exportProperty(shaka.util.DataViewReader.prototype,"seek",shaka.util.DataViewReader.prototype.seek);shaka.util.DataViewReader.prototype.readTerminatedString=function(){for(var a=this.position_;this.hasMoreData()&&0!=this.dataView_.getUint8(this.position_);)this.position_+=1;a=new Uint8Array(this.dataView_.buffer,this.dataView_.byteOffset+a,this.position_-a);this.position_+=1;return shaka.util.StringUtils.fromUTF8(a)};
goog.exportProperty(shaka.util.DataViewReader.prototype,"readTerminatedString",shaka.util.DataViewReader.prototype.readTerminatedString);shaka.util.DataViewReader.prototype.throwOutOfBounds_=function(){throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.BUFFER_READ_OUT_OF_BOUNDS);};shaka.util.Mp4Parser=function(){this.headers_=[];this.boxDefinitions_=[];this.done_=!1};goog.exportSymbol("shaka.util.Mp4Parser",shaka.util.Mp4Parser);shaka.util.Mp4Parser.BoxType_={BASIC_BOX:0,FULL_BOX:1};shaka.util.Mp4Parser.prototype.box=function(a,b){var c=shaka.util.Mp4Parser.typeFromString_(a);this.headers_[c]=shaka.util.Mp4Parser.BoxType_.BASIC_BOX;this.boxDefinitions_[c]=b;return this};goog.exportProperty(shaka.util.Mp4Parser.prototype,"box",shaka.util.Mp4Parser.prototype.box);
shaka.util.Mp4Parser.prototype.fullBox=function(a,b){var c=shaka.util.Mp4Parser.typeFromString_(a);this.headers_[c]=shaka.util.Mp4Parser.BoxType_.FULL_BOX;this.boxDefinitions_[c]=b;return this};goog.exportProperty(shaka.util.Mp4Parser.prototype,"fullBox",shaka.util.Mp4Parser.prototype.fullBox);shaka.util.Mp4Parser.prototype.stop=function(){this.done_=!0};goog.exportProperty(shaka.util.Mp4Parser.prototype,"stop",shaka.util.Mp4Parser.prototype.stop);
shaka.util.Mp4Parser.prototype.parse=function(a,b){var c=new Uint8Array(a);c=new shaka.util.DataViewReader(new DataView(c.buffer,c.byteOffset,c.byteLength),shaka.util.DataViewReader.Endianness.BIG_ENDIAN);for(this.done_=!1;c.hasMoreData()&&!this.done_;)this.parseNext(0,c,b)};goog.exportProperty(shaka.util.Mp4Parser.prototype,"parse",shaka.util.Mp4Parser.prototype.parse);
shaka.util.Mp4Parser.prototype.parseNext=function(a,b,c){var d=b.getPosition(),e=b.readUint32(),f=b.readUint32(),g=shaka.util.Mp4Parser.typeToString(f);shaka.log.v2("Parsing MP4 box",g);switch(e){case 0:e=b.getLength()-d;break;case 1:e=b.readUint64()}if(g=this.boxDefinitions_[f]){var h=null,k=null;this.headers_[f]==shaka.util.Mp4Parser.BoxType_.FULL_BOX&&(k=b.readUint32(),h=k>>>24,k&=16777215);f=d+e;c&&f>b.getLength()&&(f=b.getLength());f-=b.getPosition();b=0<f?b.readBytes(f):new Uint8Array(0);b=
new shaka.util.DataViewReader(new DataView(b.buffer,b.byteOffset,b.byteLength),shaka.util.DataViewReader.Endianness.BIG_ENDIAN);g({parser:this,partialOkay:c||!1,version:h,flags:k,reader:b,size:e,start:d+a})}else a=Math.min(d+e-b.getPosition(),b.getLength()-b.getPosition()),b.skip(a)};goog.exportProperty(shaka.util.Mp4Parser.prototype,"parseNext",shaka.util.Mp4Parser.prototype.parseNext);
shaka.util.Mp4Parser.children=function(a){for(;a.reader.hasMoreData()&&!a.parser.done_;)a.parser.parseNext(a.start,a.reader,a.partialOkay)};goog.exportProperty(shaka.util.Mp4Parser,"children",shaka.util.Mp4Parser.children);shaka.util.Mp4Parser.sampleDescription=function(a){for(var b=a.reader.readUint32();0<b&&!a.parser.done_;--b)a.parser.parseNext(a.start,a.reader,a.partialOkay)};goog.exportProperty(shaka.util.Mp4Parser,"sampleDescription",shaka.util.Mp4Parser.sampleDescription);
shaka.util.Mp4Parser.allData=function(a){return function(b){var c=b.reader.getLength()-b.reader.getPosition();a(b.reader.readBytes(c))}};goog.exportProperty(shaka.util.Mp4Parser,"allData",shaka.util.Mp4Parser.allData);shaka.util.Mp4Parser.typeFromString_=function(a){goog.asserts.assert(4==a.length,"Mp4 box names must be 4 characters long");for(var b=0,c=0;c<a.length;c++)b=b<<8|a.charCodeAt(c);return b};
shaka.util.Mp4Parser.typeToString=function(a){return String.fromCharCode(a>>24&255,a>>16&255,a>>8&255,a&255)};goog.exportProperty(shaka.util.Mp4Parser,"typeToString",shaka.util.Mp4Parser.typeToString);shaka.util.Pssh=function(a){this.systemIds=[];this.cencKeyIds=[];this.dataBoundaries=[];(new shaka.util.Mp4Parser).fullBox("pssh",this.parseBox_.bind(this)).parse(a.buffer);0==this.dataBoundaries.length&&shaka.log.warning("No pssh box found!")};
shaka.util.Pssh.prototype.parseBox_=function(a){goog.asserts.assert(null!=a.version,"PSSH boxes are full boxes and must have a valid version");goog.asserts.assert(null!=a.flags,"PSSH boxes are full boxes and must have a valid flag");if(1<a.version)shaka.log.warning("Unrecognized PSSH version found!");else{var b=shaka.util.Uint8ArrayUtils.toHex(a.reader.readBytes(16)),c=[];if(0<a.version)for(var d=a.reader.readUint32(),e=0;e<d;++e){var f=shaka.util.Uint8ArrayUtils.toHex(a.reader.readBytes(16));c.push(f)}d=
a.reader.readUint32();a.reader.skip(d);this.cencKeyIds.push.apply(this.cencKeyIds,c);this.systemIds.push(b);this.dataBoundaries.push({start:a.start,end:a.start+a.size-1});a.reader.getPosition()!=a.reader.getLength()&&shaka.log.warning("Mismatch between box size and data size!")}};
shaka.util.Pssh.createPssh=function(a,b){var c=a.length,d=12+b.length+4+c,e=new ArrayBuffer(d),f=new Uint8Array(e);e=new DataView(e);var g=0;e.setUint32(g,d);g+=4;e.setUint32(g,1886614376);g+=4;e.setUint32(g,0);g+=4;f.set(b,g);g+=b.length;e.setUint32(g,c);g+=4;f.set(a,g);goog.asserts.assert(g+c===d,"MS PRO invalid length.");return f};shaka.util.XmlUtils={};shaka.util.XmlUtils.findChild=function(a,b){var c=shaka.util.XmlUtils.findChildren(a,b);return 1!=c.length?null:c[0]};shaka.util.XmlUtils.findChildNS=function(a,b,c){a=shaka.util.XmlUtils.findChildrenNS(a,b,c);return 1!=a.length?null:a[0]};shaka.util.XmlUtils.findChildren=function(a,b){return Array.prototype.filter.call(a.childNodes,function(a){return a instanceof Element&&a.tagName==b})};
shaka.util.XmlUtils.findChildrenNS=function(a,b,c){return Array.prototype.filter.call(a.childNodes,function(a){return a instanceof Element&&a.localName==c&&a.namespaceURI==b})};shaka.util.XmlUtils.getAttributeNS=function(a,b,c){return a.hasAttributeNS(b,c)?a.getAttributeNS(b,c):null};shaka.util.XmlUtils.getContents=function(a){return Array.prototype.every.call(a.childNodes,function(a){return a.nodeType==Node.TEXT_NODE||a.nodeType==Node.CDATA_SECTION_NODE})?a.textContent.trim():null};
shaka.util.XmlUtils.parseAttr=function(a,b,c,d){d=void 0===d?null:d;var e=null;a=a.getAttribute(b);null!=a&&(e=c(a));return null==e?d:e};shaka.util.XmlUtils.parseDate=function(a){if(!a)return null;/^\d+-\d+-\d+T\d+:\d+:\d+(\.\d+)?$/.test(a)&&(a+="Z");a=Date.parse(a);return isNaN(a)?null:Math.floor(a/1E3)};
shaka.util.XmlUtils.parseDuration=function(a){if(!a)return null;var b=/^P(?:([0-9]*)Y)?(?:([0-9]*)M)?(?:([0-9]*)D)?(?:T(?:([0-9]*)H)?(?:([0-9]*)M)?(?:([0-9.]*)S)?)?$/.exec(a);if(!b)return shaka.log.warning("Invalid duration string:",a),null;a=31536E3*Number(b[1]||null)+2592E3*Number(b[2]||null)+86400*Number(b[3]||null)+3600*Number(b[4]||null)+60*Number(b[5]||null)+Number(b[6]||null);return isFinite(a)?a:null};
shaka.util.XmlUtils.parseRange=function(a){var b=/([0-9]+)-([0-9]+)/.exec(a);if(!b)return null;a=Number(b[1]);if(!isFinite(a))return null;b=Number(b[2]);return isFinite(b)?{start:a,end:b}:null};shaka.util.XmlUtils.parseInt=function(a){a=Number(a);return 0===a%1?a:null};shaka.util.XmlUtils.parsePositiveInt=function(a){a=Number(a);return 0===a%1&&0<a?a:null};shaka.util.XmlUtils.parseNonNegativeInt=function(a){a=Number(a);return 0===a%1&&0<=a?a:null};
shaka.util.XmlUtils.parseFloat=function(a){a=Number(a);return isNaN(a)?null:a};shaka.util.XmlUtils.evalDivision=function(a){var b;a=(b=a.match(/^(\d+)\/(\d+)$/))?Number(b[1])/Number(b[2]):Number(a);return isNaN(a)?null:a};shaka.util.XmlUtils.parseXmlString=function(a,b){var c=new DOMParser;try{var d=c.parseFromString(a,"text/xml")}catch(f){}if(d&&d.documentElement.tagName==b)var e=d.documentElement;return e&&0<e.getElementsByTagName("parsererror").length?null:e};
shaka.util.XmlUtils.parseXml=function(a,b){try{var c=shaka.util.StringUtils.fromUTF8(a);return shaka.util.XmlUtils.parseXmlString(c,b)}catch(d){}};shaka.dash={};shaka.dash.ContentProtection={};shaka.dash.ContentProtection.defaultKeySystems_=(new Map).set("urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b","org.w3.clearkey").set("urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed","com.widevine.alpha").set("urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95","com.microsoft.playready").set("urn:uuid:f239e769-efa3-4850-9c16-a903c6932efb","com.adobe.primetime");shaka.dash.ContentProtection.MP4Protection_="urn:mpeg:dash:mp4protection:2011";
shaka.dash.ContentProtection.CencNamespaceUri_="urn:mpeg:cenc:2013";
shaka.dash.ContentProtection.parseFromAdaptationSet=function(a,b,c){var d=shaka.dash.ContentProtection,e=shaka.util.ManifestParserUtils,f=d.parseElements_(a),g=null;a=[];var h=[],k=new Set(f.map(function(a){return a.keyId}));k["delete"](null);if(1<k.size)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_CONFLICTING_KEY_IDS);c||(h=f.filter(function(a){return a.schemeUri==d.MP4Protection_?(goog.asserts.assert(!a.init||a.init.length,
"Init data must be null or non-empty."),g=a.init||g,!1):!0}),h.length&&(a=d.convertElements_(g,b,h),0==a.length&&(a=[e.createDrmInfo("",g)])));if(f.length&&(c||!h.length))for(a=[],b=$jscomp.makeIterator(d.defaultKeySystems_.values()),c=b.next();!c.done;c=b.next())c=c.value,"org.w3.clearkey"!=c&&(c=e.createDrmInfo(c,g),a.push(c));if(e=Array.from(k)[0]||null)for(k=$jscomp.makeIterator(a),b=k.next();!b.done;b=k.next())for(b=$jscomp.makeIterator(b.value.initData),c=b.next();!c.done;c=b.next())c.value.keyId=
e;return{defaultKeyId:e,defaultInit:g,drmInfos:a,firstRepresentation:!0}};
shaka.dash.ContentProtection.parseFromRepresentation=function(a,b,c,d){var e=shaka.dash.ContentProtection.parseFromAdaptationSet(a,b,d);if(c.firstRepresentation){a=1==c.drmInfos.length&&!c.drmInfos[0].keySystem;b=0==e.drmInfos.length;if(0==c.drmInfos.length||a&&!b)c.drmInfos=e.drmInfos;c.firstRepresentation=!1}else if(0<e.drmInfos.length&&(c.drmInfos=c.drmInfos.filter(function(a){return e.drmInfos.some(function(b){return b.keySystem==a.keySystem})}),0==c.drmInfos.length))throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,
shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_NO_COMMON_KEY_SYSTEM);return e.defaultKeyId||c.defaultKeyId};shaka.dash.ContentProtection.getWidevineLicenseUrl=function(a){return(a=shaka.util.XmlUtils.findChildNS(a.node,"urn:microsoft","laurl"))?a.getAttribute("licenseUrl")||"":""};shaka.dash.ContentProtection.PLAYREADY_RECORD_TYPES={RIGHTS_MANAGEMENT:1,RESERVED:2,EMBEDDED_LICENSE:3};
shaka.dash.ContentProtection.parseMsProRecords_=function(a,b){for(var c=[],d=new DataView(a);b<a.byteLength-1;){var e=d.getUint16(b,!0);b+=2;var f=d.getUint16(b,!0);b+=2;goog.asserts.assert(0===(f&1),"expected byteLength to be an even number");var g=new Uint8Array(a,b,f);c.push({type:e,value:g});b+=f}return c};
shaka.dash.ContentProtection.parseMsPro_=function(a){var b=0,c=(new DataView(a)).getUint32(b,!0);b+=4;return c!==a.byteLength?(shaka.log.warning("PlayReady Object with invalid length encountered."),[]):shaka.dash.ContentProtection.parseMsProRecords_(a,b+2)};shaka.dash.ContentProtection.getLaurl_=function(a){return(a=a.querySelector("DATA > LA_URL"))?a.textContent:""};
shaka.dash.ContentProtection.getPlayReadyLicenseUrl=function(a){var b=shaka.util.XmlUtils.findChildNS(a.node,"urn:microsoft:playready","pro");if(!b)return"";a=shaka.dash.ContentProtection;var c=a.PLAYREADY_RECORD_TYPES;b=shaka.util.Uint8ArrayUtils.fromBase64(b.textContent);b=a.parseMsPro_(b.buffer).filter(function(a){return a.type===c.RIGHTS_MANAGEMENT})[0];if(!b)return"";b=shaka.util.StringUtils.fromUTF16(b.value,!0);return(b=shaka.util.XmlUtils.parseXmlString(b,"WRMHEADER"))?a.getLaurl_(b):""};
shaka.dash.ContentProtection.getInitDataFromPro_=function(a){var b=shaka.util.XmlUtils.findChildNS(a.node,"urn:microsoft:playready","pro");if(!b)return null;b=shaka.util.Uint8ArrayUtils.fromBase64(b.textContent);var c=new Uint8Array([154,4,240,121,152,64,66,134,171,146,230,91,224,136,95,149]);return[{initData:shaka.util.Pssh.createPssh(b,c),initDataType:"cenc",keyId:a.keyId}]};
shaka.dash.ContentProtection.convertElements_=function(a,b,c){var d=shaka.dash.ContentProtection,e=shaka.util.ManifestParserUtils,f=d.defaultKeySystems_,g=d.licenseUrlParsers_,h=[];c=$jscomp.makeIterator(c);for(var k=c.next();!k.done;k=c.next()){k=k.value;var l=f.get(k.schemeUri);if(l){goog.asserts.assert(!k.init||k.init.length,"Init data must be null or non-empty.");var m=d.getInitDataFromPro_(k);m=e.createDrmInfo(l,k.init||a||m);if(l=g.get(l))m.licenseServerUri=l(k);h.push(m)}else for(goog.asserts.assert(b,
"ContentProtection callback is required"),k=b(k.node)||[],k=$jscomp.makeIterator(k),l=k.next();!l.done;l=k.next())h.push(l.value)}return h};shaka.dash.ContentProtection.licenseUrlParsers_=(new Map).set("com.widevine.alpha",shaka.dash.ContentProtection.getWidevineLicenseUrl).set("com.microsoft.playready",shaka.dash.ContentProtection.getPlayReadyLicenseUrl);
shaka.dash.ContentProtection.parseElements_=function(a){var b=[];a=$jscomp.makeIterator(a);for(var c=a.next();!c.done;c=a.next())(c=shaka.dash.ContentProtection.parseElement_(c.value))&&b.push(c);return b};
shaka.dash.ContentProtection.parseElement_=function(a){var b=shaka.dash.ContentProtection.CencNamespaceUri_,c=a.getAttribute("schemeIdUri"),d=shaka.util.XmlUtils.getAttributeNS(a,b,"default_KID");b=shaka.util.XmlUtils.findChildrenNS(a,b,"pssh").map(shaka.util.XmlUtils.getContents);if(!c)return shaka.log.error("Missing required schemeIdUri attribute on","ContentProtection element",a),null;c=c.toLowerCase();if(d&&(d=d.replace(/-/g,"").toLowerCase(),d.includes(" ")))throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,
shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_MULTIPLE_KEY_IDS_NOT_SUPPORTED);var e=[];try{e=b.map(function(a){return{initDataType:"cenc",initData:shaka.util.Uint8ArrayUtils.fromBase64(a),keyId:null}})}catch(f){throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_PSSH_BAD_ENCODING);}return{node:a,schemeUri:c,keyId:d,init:0<e.length?e:null}};shaka.dash.MpdUtils={};shaka.dash.MpdUtils.XlinkNamespaceUri_="http://www.w3.org/1999/xlink";
shaka.dash.MpdUtils.fillUriTemplate=function(a,b,c,d,e){var f={RepresentationID:b,Number:c,Bandwidth:d,Time:e};return a.replace(/\$(RepresentationID|Number|Bandwidth|Time)?(?:%0([0-9]+)([diouxX]))?\$/g,function(b,c,d,e){if("$$"==b)return"$";var g=f[c];goog.asserts.assert(void 0!==g,"Unrecognized identifier");if(null==g)return shaka.log.warning("URL template does not have an available substitution for identifier",'"'+c+'":',a),b;"RepresentationID"==c&&d&&(shaka.log.warning("URL template should not contain a width specifier for identifier",
'"RepresentationID":',a),d=void 0);"Time"==c&&(goog.asserts.assert(.2>Math.abs(g-Math.round(g)),"Calculated $Time$ values must be close to integers"),g=Math.round(g));switch(e){case void 0:case "d":case "i":case "u":b=g.toString();break;case "o":b=g.toString(8);break;case "x":b=g.toString(16);break;case "X":b=g.toString(16).toUpperCase();break;default:goog.asserts.assert(!1,"Unhandled format specifier"),b=g.toString()}d=window.parseInt(d,10)||1;return Array(Math.max(0,d-b.length)+1).join("0")+b})};
shaka.dash.MpdUtils.createTimeline=function(a,b,c,d){goog.asserts.assert(0<b&&Infinity>b,"timescale must be a positive, finite integer");goog.asserts.assert(0<d,"period duration must be a positive integer");var e=shaka.util.XmlUtils;a=e.findChildren(a,"S");for(var f=[],g=0,h=0;h<a.length;++h){var k=a[h],l=e.parseAttr(k,"t",e.parseNonNegativeInt),m=e.parseAttr(k,"d",e.parseNonNegativeInt),n=e.parseAttr(k,"r",e.parseInt);null!=l&&(l-=c);if(!m){shaka.log.warning('"S" element must have a duration:','ignoring the remaining "S" elements.',
k);break}l=null!=l?l:g;n=n||0;if(0>n)if(h+1<a.length){n=e.parseAttr(a[h+1],"t",e.parseNonNegativeInt);if(null==n){shaka.log.warning('An "S" element cannot have a negative repeat','if the next "S" element does not have a valid start time:','ignoring the remaining "S" elements.',k);break}else if(l>=n){shaka.log.warning('An "S" element cannot have a negative repeat','if its start time exceeds the next "S" element\'s start time:','ignoring the remaining "S" elements.',k);break}n=Math.ceil((n-l)/m)-1}else{if(Infinity==
d){shaka.log.warning('The last "S" element cannot have a negative repeat',"if the Period has an infinite duration:",'ignoring the last "S" element.',k);break}else if(l/b>=d){shaka.log.warning('The last "S" element cannot have a negative repeat',"if its start time exceeds the Period's duration:",'igoring the last "S" element.',k);break}n=Math.ceil((d*b-l)/m)-1}0<f.length&&l!=g&&(Math.abs((l-g)/b)>=shaka.util.ManifestParserUtils.GAP_OVERLAP_TOLERANCE_SECONDS&&shaka.log.warning("SegmentTimeline contains a large gap/overlap:",
"the content may have errors in it.",k),f[f.length-1].end=l/b);for(k=0;k<=n;++k)g=l+m,f.push({start:l/b,end:g/b,unscaledStart:l}),l=g}return f};
shaka.dash.MpdUtils.parseSegmentInfo=function(a,b){goog.asserts.assert(b(a.representation),"There must be at least one element of the given type.");var c=shaka.dash.MpdUtils,d=shaka.util.XmlUtils,e=c.inheritAttribute(a,b,"timescale"),f=1;e&&(f=d.parsePositiveInt(e)||1);e=c.inheritAttribute(a,b,"duration");(e=d.parsePositiveInt(e||""))&&(e/=f);var g=c.inheritAttribute(a,b,"startNumber"),h=Number(c.inheritAttribute(a,b,"presentationTimeOffset"))||0;d=d.parseNonNegativeInt(g||"");if(null==g||null==d)d=
1;g=c.inheritChild(a,b,"SegmentTimeline");var k=null;g&&(k=c.createTimeline(g,f,h,a.periodInfo.duration||Infinity));return{timescale:f,segmentDuration:e,startNumber:d,scaledPresentationTimeOffset:h/f||0,unscaledPresentationTimeOffset:h,timeline:k}};
shaka.dash.MpdUtils.inheritAttribute=function(a,b,c){var d=shaka.util.Functional;goog.asserts.assert(b(a.representation),"There must be at least one element of the given type");return[b(a.representation),b(a.adaptationSet),b(a.period)].filter(d.isNotNull).map(function(a){return a.getAttribute(c)}).reduce(function(a,b){return a||b})};
shaka.dash.MpdUtils.inheritChild=function(a,b,c){var d=shaka.util.Functional;goog.asserts.assert(b(a.representation),"There must be at least one element of the given type");a=[b(a.representation),b(a.adaptationSet),b(a.period)].filter(d.isNotNull);var e=shaka.util.XmlUtils;return a.map(function(a){return e.findChild(a,c)}).reduce(function(a,b){return a||b})};
shaka.dash.MpdUtils.handleXlinkInElement_=function(a,b,c,d,e,f){var g=shaka.util.XmlUtils,h=shaka.util.Error,k=shaka.util.ManifestParserUtils,l=shaka.dash.MpdUtils.XlinkNamespaceUri_,m=g.getAttributeNS(a,l,"href");g=g.getAttributeNS(a,l,"actuate")||"onRequest";for(var n=0;n<a.attributes.length;n++){var q=a.attributes[n];q.namespaceURI==l&&(a.removeAttributeNS(q.namespaceURI,q.localName),--n)}if(5<=f)return shaka.util.AbortableOperation.failed(new h(h.Severity.CRITICAL,h.Category.MANIFEST,h.Code.DASH_XLINK_DEPTH_LIMIT));
if("onLoad"!=g)return shaka.util.AbortableOperation.failed(new h(h.Severity.CRITICAL,h.Category.MANIFEST,h.Code.DASH_UNSUPPORTED_XLINK_ACTUATE));var p=k.resolveUris([d],[m]);d=shaka.net.NetworkingEngine.RequestType.MANIFEST;k=shaka.net.NetworkingEngine.makeRequest(p,b);d=e.request(d,k);goog.asserts.assert(d instanceof shaka.util.AbortableOperation,"Unexpected implementation of IAbortableOperation!");return d.chain(function(d){d=shaka.util.XmlUtils.parseXml(d.data,a.tagName);if(!d)return shaka.util.AbortableOperation.failed(new h(h.Severity.CRITICAL,
h.Category.MANIFEST,h.Code.DASH_INVALID_XML,m));for(;a.childNodes.length;)a.removeChild(a.childNodes[0]);for(;d.childNodes.length;){var g=d.childNodes[0];d.removeChild(g);a.appendChild(g)}for(g=0;g<d.attributes.length;g++){var k=d.attributes[g].nodeName,l=d.getAttribute(k);a.setAttribute(k,l)}return shaka.dash.MpdUtils.processXlinks(a,b,c,p[0],e,f+1)})};
shaka.dash.MpdUtils.processXlinks=function(a,b,c,d,e,f){f=void 0===f?0:f;var g=shaka.dash.MpdUtils,h=shaka.util.XmlUtils,k=g.XlinkNamespaceUri_;if(h.getAttributeNS(a,k,"href"))return h=g.handleXlinkInElement_(a,b,c,d,e,f),c&&(h=h.chain(void 0,function(h){return g.processXlinks(a,b,c,d,e,f)})),h;for(var l=[],m=0;m<a.childNodes.length;m++){var n=a.childNodes[m];n instanceof Element&&("urn:mpeg:dash:resolve-to-zero:2013"==h.getAttributeNS(n,k,"href")?(a.removeChild(n),--m):"SegmentTimeline"!=n.tagName&&
l.push(shaka.dash.MpdUtils.processXlinks(n,b,c,d,e,f)))}return shaka.util.AbortableOperation.all(l).chain(function(){return a})};shaka.media.InitSegmentReference=function(a,b,c){this.getUris=a;this.startByte=b;this.endByte=c;this.data=null};goog.exportSymbol("shaka.media.InitSegmentReference",shaka.media.InitSegmentReference);shaka.media.InitSegmentReference.prototype.createUris=function(){return this.getUris()};goog.exportProperty(shaka.media.InitSegmentReference.prototype,"createUris",shaka.media.InitSegmentReference.prototype.createUris);shaka.media.InitSegmentReference.prototype.getStartByte=function(){return this.startByte};
goog.exportProperty(shaka.media.InitSegmentReference.prototype,"getStartByte",shaka.media.InitSegmentReference.prototype.getStartByte);shaka.media.InitSegmentReference.prototype.getEndByte=function(){return this.endByte};goog.exportProperty(shaka.media.InitSegmentReference.prototype,"getEndByte",shaka.media.InitSegmentReference.prototype.getEndByte);shaka.media.InitSegmentReference.prototype.getSize=function(){return this.endByte?this.endByte-this.startByte:null};
shaka.media.SegmentReference=function(a,b,c,d,e,f){goog.asserts.assert(b<c,"startTime must be less than endTime");goog.asserts.assert(e<f||null==f,"startByte must be < endByte");this.position=a;this.startTime=b;this.endTime=c;this.getUris=d;this.startByte=e;this.endByte=f};goog.exportSymbol("shaka.media.SegmentReference",shaka.media.SegmentReference);shaka.media.SegmentReference.prototype.getPosition=function(){return this.position};
goog.exportProperty(shaka.media.SegmentReference.prototype,"getPosition",shaka.media.SegmentReference.prototype.getPosition);shaka.media.SegmentReference.prototype.getStartTime=function(){return this.startTime};goog.exportProperty(shaka.media.SegmentReference.prototype,"getStartTime",shaka.media.SegmentReference.prototype.getStartTime);shaka.media.SegmentReference.prototype.getEndTime=function(){return this.endTime};goog.exportProperty(shaka.media.SegmentReference.prototype,"getEndTime",shaka.media.SegmentReference.prototype.getEndTime);
shaka.media.SegmentReference.prototype.createUris=function(){return this.getUris()};goog.exportProperty(shaka.media.SegmentReference.prototype,"createUris",shaka.media.SegmentReference.prototype.createUris);shaka.media.SegmentReference.prototype.getStartByte=function(){return this.startByte};goog.exportProperty(shaka.media.SegmentReference.prototype,"getStartByte",shaka.media.SegmentReference.prototype.getStartByte);shaka.media.SegmentReference.prototype.getEndByte=function(){return this.endByte};
goog.exportProperty(shaka.media.SegmentReference.prototype,"getEndByte",shaka.media.SegmentReference.prototype.getEndByte);shaka.media.SegmentReference.prototype.getSize=function(){return this.endByte?this.endByte-this.startByte:null};shaka.media.Mp4SegmentIndexParser=function(a,b,c,d){var e=shaka.media.Mp4SegmentIndexParser,f,g=(new shaka.util.Mp4Parser).fullBox("sidx",function(a){f=e.parseSIDX_(b,d,c,a)});a&&g.parse(a);if(f)return f;shaka.log.error('Invalid box type, expected "sidx".');throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.MP4_SIDX_WRONG_BOX_TYPE);};
shaka.media.Mp4SegmentIndexParser.parseSIDX_=function(a,b,c,d){goog.asserts.assert(null!=d.version,"SIDX is a full box and should have a valid version.");var e=[];d.reader.skip(4);var f=d.reader.readUint32();if(0==f)throw shaka.log.error("Invalid timescale."),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.MP4_SIDX_INVALID_TIMESCALE);if(0==d.version){var g=d.reader.readUint32();var h=d.reader.readUint32()}else g=d.reader.readUint64(),h=
d.reader.readUint64();d.reader.skip(2);var k=d.reader.readUint16();a=a+d.size+h;for(h=0;h<k;h++){var l=d.reader.readUint32(),m=(l&2147483648)>>>31;l&=2147483647;var n=d.reader.readUint32();d.reader.skip(4);if(1==m)throw shaka.log.error("Heirarchical SIDXs are not supported."),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.MP4_SIDX_TYPE_NOT_SUPPORTED);e.push(new shaka.media.SegmentReference(e.length,g/f-b,(g+n)/f-b,function(){return c},
a,a+l-1));g+=n;a+=l}d.parser.stop();return e};shaka.media.SegmentIndex=function(a){goog.DEBUG&&shaka.media.SegmentIndex.assertCorrectReferences_(a);this.references_=a};goog.exportSymbol("shaka.media.SegmentIndex",shaka.media.SegmentIndex);shaka.media.SegmentIndex.prototype.destroy=function(){this.references_=null;return Promise.resolve()};goog.exportProperty(shaka.media.SegmentIndex.prototype,"destroy",shaka.media.SegmentIndex.prototype.destroy);
shaka.media.SegmentIndex.prototype.find=function(a){for(var b=this.references_.length-1;0<=b;--b){var c=this.references_[b];if(a>=c.startTime&&a<c.endTime)return c.position}return this.references_.length&&a<this.references_[0].startTime?this.references_[0].position:null};goog.exportProperty(shaka.media.SegmentIndex.prototype,"find",shaka.media.SegmentIndex.prototype.find);
shaka.media.SegmentIndex.prototype.get=function(a){if(0==this.references_.length)return null;a-=this.references_[0].position;return 0>a||a>=this.references_.length?null:this.references_[a]};goog.exportProperty(shaka.media.SegmentIndex.prototype,"get",shaka.media.SegmentIndex.prototype.get);shaka.media.SegmentIndex.prototype.offset=function(a){for(var b=0;b<this.references_.length;++b)this.references_[b].startTime+=a,this.references_[b].endTime+=a};
goog.exportProperty(shaka.media.SegmentIndex.prototype,"offset",shaka.media.SegmentIndex.prototype.offset);
shaka.media.SegmentIndex.prototype.merge=function(a){goog.DEBUG&&shaka.media.SegmentIndex.assertCorrectReferences_(a);for(var b=[],c=0,d=0;c<this.references_.length&&d<a.length;){var e=this.references_[c],f=a[d];e.startTime<f.startTime?(b.push(e),c++):(e.startTime>f.startTime?0==c?b.push(f):shaka.log.warning("Refusing to rewrite original references on update!"):(.1<Math.abs(e.endTime-f.endTime)?(goog.asserts.assert(f.endTime>e.endTime&&c==this.references_.length-1&&d==a.length-1,"This should be an update of the last segment in a period"),
e=new shaka.media.SegmentReference(e.position,f.startTime,f.endTime,f.getUris,f.startByte,f.endByte),b.push(e)):b.push(e),c++),d++)}for(;c<this.references_.length;)b.push(this.references_[c++]);if(b.length)for(c=b[b.length-1].position+1;d<a.length;)e=a[d++],e=new shaka.media.SegmentReference(c++,e.startTime,e.endTime,e.getUris,e.startByte,e.endByte),b.push(e);else b=a;goog.DEBUG&&shaka.media.SegmentIndex.assertCorrectReferences_(b);this.references_=b};
goog.exportProperty(shaka.media.SegmentIndex.prototype,"merge",shaka.media.SegmentIndex.prototype.merge);shaka.media.SegmentIndex.prototype.replace=function(a){goog.DEBUG&&shaka.media.SegmentIndex.assertCorrectReferences_(a);this.references_=a};shaka.media.SegmentIndex.prototype.evict=function(a){for(var b=0;b<this.references_.length;++b)if(this.references_[b].endTime>a){this.references_.splice(0,b);return}this.references_=[]};goog.exportProperty(shaka.media.SegmentIndex.prototype,"evict",shaka.media.SegmentIndex.prototype.evict);
shaka.media.SegmentIndex.prototype.fit=function(a){goog.asserts.assert(null!=a,"Period duration must be known for static content!");for(goog.asserts.assert(Infinity!=a,"Period duration must be finite for static content!");this.references_.length;)if(this.references_[this.references_.length-1].startTime>=a)this.references_.pop();else break;for(;this.references_.length;)if(0>=this.references_[0].endTime)this.references_.shift();else break;if(0!=this.references_.length){var b=this.references_[this.references_.length-
1];this.references_[this.references_.length-1]=new shaka.media.SegmentReference(b.position,b.startTime,a,b.getUris,b.startByte,b.endByte)}};goog.DEBUG&&(shaka.media.SegmentIndex.assertCorrectReferences_=function(a){goog.asserts.assert(a.every(function(b,c){if(0==c)return!0;var d=a[c-1];return b.position!=d.position+1?!1:d.startTime<b.startTime?!0:d.startTime>b.startTime?!1:d.endTime<=b.endTime?!0:!1}),"SegmentReferences are incorrect")});shaka.util.EbmlParser=function(a){this.dataView_=a;this.reader_=new shaka.util.DataViewReader(a,shaka.util.DataViewReader.Endianness.BIG_ENDIAN);shaka.util.EbmlParser.DYNAMIC_SIZES||(shaka.util.EbmlParser.DYNAMIC_SIZES=[new Uint8Array([255]),new Uint8Array([127,255]),new Uint8Array([63,255,255]),new Uint8Array([31,255,255,255]),new Uint8Array([15,255,255,255,255]),new Uint8Array([7,255,255,255,255,255]),new Uint8Array([3,255,255,255,255,255,255]),new Uint8Array([1,255,255,255,255,255,255,255])])};
shaka.util.EbmlParser.prototype.hasMoreData=function(){return this.reader_.hasMoreData()};
shaka.util.EbmlParser.prototype.parseElement=function(){var a=this.parseId_(),b=this.parseVint_();b=shaka.util.EbmlParser.isDynamicSizeValue_(b)?this.dataView_.byteLength-this.reader_.getPosition():shaka.util.EbmlParser.getVintValue_(b);b=this.reader_.getPosition()+b<=this.dataView_.byteLength?b:this.dataView_.byteLength-this.reader_.getPosition();var c=new DataView(this.dataView_.buffer,this.dataView_.byteOffset+this.reader_.getPosition(),b);this.reader_.skip(b);return new shaka.util.EbmlElement(a,
c)};shaka.util.EbmlParser.prototype.parseId_=function(){var a=this.parseVint_();if(7<a.length)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.EBML_OVERFLOW);for(var b=0,c=0;c<a.length;c++)b=256*b+a[c];return b};
shaka.util.EbmlParser.prototype.parseVint_=function(){var a=this.reader_.readUint8(),b;for(b=1;8>=b&&!(a&1<<8-b);b++);if(8<b)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.EBML_OVERFLOW);var c=new Uint8Array(b);c[0]=a;for(a=1;a<b;a++)c[a]=this.reader_.readUint8();return c};
shaka.util.EbmlParser.getVintValue_=function(a){if(8==a.length&&a[1]&224)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.JS_INTEGER_OVERFLOW);for(var b=a[0]&(1<<8-a.length)-1,c=1;c<a.length;c++)b=256*b+a[c];return b};shaka.util.EbmlParser.isDynamicSizeValue_=function(a){for(var b=shaka.util.EbmlParser,c=shaka.util.Uint8ArrayUtils.equal,d=0;d<b.DYNAMIC_SIZES.length;d++)if(c(a,b.DYNAMIC_SIZES[d]))return!0;return!1};
shaka.util.EbmlElement=function(a,b){this.id=a;this.dataView_=b};shaka.util.EbmlElement.prototype.getOffset=function(){return this.dataView_.byteOffset};shaka.util.EbmlElement.prototype.createParser=function(){return new shaka.util.EbmlParser(this.dataView_)};
shaka.util.EbmlElement.prototype.getUint=function(){if(8<this.dataView_.byteLength)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.EBML_OVERFLOW);if(8==this.dataView_.byteLength&&this.dataView_.getUint8(0)&224)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.JS_INTEGER_OVERFLOW);for(var a=0,b=0;b<this.dataView_.byteLength;b++){var c=this.dataView_.getUint8(b);a=256*
a+c}return a};shaka.util.EbmlElement.prototype.getFloat=function(){if(4==this.dataView_.byteLength)return this.dataView_.getFloat32(0);if(8==this.dataView_.byteLength)return this.dataView_.getFloat64(0);throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.EBML_BAD_FLOATING_POINT_SIZE);};shaka.media.WebmSegmentIndexParser=function(){};shaka.media.WebmSegmentIndexParser.EBML_ID=440786851;shaka.media.WebmSegmentIndexParser.SEGMENT_ID=408125543;shaka.media.WebmSegmentIndexParser.INFO_ID=357149030;shaka.media.WebmSegmentIndexParser.TIMECODE_SCALE_ID=2807729;shaka.media.WebmSegmentIndexParser.DURATION_ID=17545;shaka.media.WebmSegmentIndexParser.CUES_ID=475249515;shaka.media.WebmSegmentIndexParser.CUE_POINT_ID=187;shaka.media.WebmSegmentIndexParser.CUE_TIME_ID=179;
shaka.media.WebmSegmentIndexParser.CUE_TRACK_POSITIONS_ID=183;shaka.media.WebmSegmentIndexParser.CUE_CLUSTER_POSITION=241;
shaka.media.WebmSegmentIndexParser.prototype.parse=function(a,b,c,d){b=this.parseWebmContainer_(b);a=(new shaka.util.EbmlParser(new DataView(a))).parseElement();if(a.id!=shaka.media.WebmSegmentIndexParser.CUES_ID)throw shaka.log.error("Not a Cues element."),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.WEBM_CUES_ELEMENT_MISSING);return this.parseCues_(a,b.segmentOffset,b.timecodeScale,b.duration,c,d)};
shaka.media.WebmSegmentIndexParser.prototype.parseWebmContainer_=function(a){a=new shaka.util.EbmlParser(new DataView(a));if(a.parseElement().id!=shaka.media.WebmSegmentIndexParser.EBML_ID)throw shaka.log.error("Not an EBML element."),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.WEBM_EBML_HEADER_ELEMENT_MISSING);var b=a.parseElement();if(b.id!=shaka.media.WebmSegmentIndexParser.SEGMENT_ID)throw shaka.log.error("Not a Segment element."),
new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.WEBM_SEGMENT_ELEMENT_MISSING);a=b.getOffset();b=this.parseSegment_(b);return{segmentOffset:a,timecodeScale:b.timecodeScale,duration:b.duration}};
shaka.media.WebmSegmentIndexParser.prototype.parseSegment_=function(a){a=a.createParser();for(var b=null;a.hasMoreData();){var c=a.parseElement();if(c.id==shaka.media.WebmSegmentIndexParser.INFO_ID){b=c;break}}if(!b)throw shaka.log.error("Not an Info element."),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.WEBM_INFO_ELEMENT_MISSING);return this.parseInfo_(b)};
shaka.media.WebmSegmentIndexParser.prototype.parseInfo_=function(a){var b=a.createParser(),c=1E6;for(a=null;b.hasMoreData();){var d=b.parseElement();d.id==shaka.media.WebmSegmentIndexParser.TIMECODE_SCALE_ID?c=d.getUint():d.id==shaka.media.WebmSegmentIndexParser.DURATION_ID&&(a=d.getFloat())}if(null==a)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.WEBM_DURATION_ELEMENT_MISSING);b=c/1E9;return{timecodeScale:b,duration:a*b}};
shaka.media.WebmSegmentIndexParser.prototype.parseCues_=function(a,b,c,d,e,f){var g=[],h=function(){return e};a=a.createParser();for(var k=null,l=null;a.hasMoreData();){var m=a.parseElement();if(m.id==shaka.media.WebmSegmentIndexParser.CUE_POINT_ID){var n=this.parseCuePoint_(m);n&&(m=c*n.unscaledTime,n=b+n.relativeOffset,null!=k&&(goog.asserts.assert(null!=l,"last offset cannot be null"),g.push(new shaka.media.SegmentReference(g.length,k-f,m-f,h,l,n-1))),k=m,l=n)}}null!=k&&(goog.asserts.assert(null!=
l,"last offset cannot be null"),g.push(new shaka.media.SegmentReference(g.length,k-f,d-f,h,l,null)));return g};
shaka.media.WebmSegmentIndexParser.prototype.parseCuePoint_=function(a){var b=a.createParser();a=b.parseElement();if(a.id!=shaka.media.WebmSegmentIndexParser.CUE_TIME_ID)throw shaka.log.warning("Not a CueTime element."),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.WEBM_CUE_TIME_ELEMENT_MISSING);a=a.getUint();b=b.parseElement();if(b.id!=shaka.media.WebmSegmentIndexParser.CUE_TRACK_POSITIONS_ID)throw shaka.log.warning("Not a CueTrackPositions element."),
new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.WEBM_CUE_TRACK_POSITIONS_ELEMENT_MISSING);b=b.createParser();for(var c=0;b.hasMoreData();){var d=b.parseElement();if(d.id==shaka.media.WebmSegmentIndexParser.CUE_CLUSTER_POSITION){c=d.getUint();break}}return{unscaledTime:a,relativeOffset:c}};shaka.dash.SegmentBase={};shaka.dash.SegmentBase.createInitSegment=function(a,b){var c=shaka.util.XmlUtils,d=shaka.util.ManifestParserUtils,e=shaka.dash.MpdUtils.inheritChild(a,b,"Initialization");if(!e)return null;var f=d.resolveUris(a.baseUris.baseUris_,a.representation.baseUris),g=e.getAttribute("sourceURL");g&&(f=d.resolveUris(f,[g]));d=0;g=null;if(c=c.parseAttr(e,"range",c.parseRange))d=c.start,g=c.end;return new shaka.media.InitSegmentReference(function(){return f},d,g)};
shaka.dash.SegmentBase.createStream=function(a,b){goog.asserts.assert(a.representation.segmentBase,"Should only be called with SegmentBase");var c=shaka.dash.MpdUtils,d=shaka.dash.SegmentBase,e=shaka.util.XmlUtils,f=Number(c.inheritAttribute(a,d.fromInheritance_,"presentationTimeOffset"))||0;c=c.inheritAttribute(a,d.fromInheritance_,"timescale");var g=1;c&&(g=e.parsePositiveInt(c)||1);e=f/g||0;f=d.createInitSegment(a,d.fromInheritance_);d=d.createSegmentIndex_(a,b,f,e);return{createSegmentIndex:d.createSegmentIndex,
findSegmentPosition:d.findSegmentPosition,getSegmentReference:d.getSegmentReference,initSegmentReference:f,scaledPresentationTimeOffset:e}};
shaka.dash.SegmentBase.createSegmentIndexFromUris=function(a,b,c,d,e,f,g,h){var k=a.presentationTimeline,l=!a.dynamic||!a.periodInfo.isLastPeriod,m=a.periodInfo.start,n=a.periodInfo.duration,q=b,p=null;return{createSegmentIndex:function(){var a=[q(d,e,f),"webm"==g?q(c.getUris(),c.startByte,c.endByte):null];q=null;return Promise.all(a).then(function(a){var b=a[0];a=a[1]||null;"mp4"==g?b=shaka.media.Mp4SegmentIndexParser(b,e,d,h):(goog.asserts.assert(a,"WebM requires init data"),b=(new shaka.media.WebmSegmentIndexParser).parse(b,
a,d,h));k.notifySegments(b,m);goog.asserts.assert(!p,"Should not call createSegmentIndex twice");p=new shaka.media.SegmentIndex(b);l&&p.fit(n)})},findSegmentPosition:function(a){goog.asserts.assert(p,"Must call createSegmentIndex first");return p.find(a)},getSegmentReference:function(a){goog.asserts.assert(p,"Must call createSegmentIndex first");return p.get(a)}}};shaka.dash.SegmentBase.fromInheritance_=function(a){return a.segmentBase};
shaka.dash.SegmentBase.createSegmentIndex_=function(a,b,c,d){var e=shaka.dash.MpdUtils,f=shaka.dash.SegmentBase,g=shaka.util.XmlUtils,h=shaka.util.ManifestParserUtils,k=shaka.util.ManifestParserUtils.ContentType,l=a.representation.contentType,m=a.representation.mimeType.split("/")[1];if(l!=k.TEXT&&"mp4"!=m&&"webm"!=m)throw shaka.log.error("SegmentBase specifies an unsupported container type.",a.representation),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,
shaka.util.Error.Code.DASH_UNSUPPORTED_CONTAINER);if("webm"==m&&!c)throw shaka.log.error("SegmentBase does not contain sufficient segment information:","the SegmentBase uses a WebM container,","but does not contain an Initialization element.",a.representation),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_WEBM_MISSING_INIT);k=e.inheritChild(a,f.fromInheritance_,"RepresentationIndex");f=e.inheritAttribute(a,f.fromInheritance_,
"indexRange");e=h.resolveUris(a.baseUris.baseUris_,a.representation.baseUris);f=g.parseRange(f||"");k&&((l=k.getAttribute("sourceURL"))&&(e=h.resolveUris(e,[l])),f=g.parseAttr(k,"range",g.parseRange,f));if(!f)throw shaka.log.error("SegmentBase does not contain sufficient segment information:","the SegmentBase does not contain @indexRange","or a RepresentationIndex element.",a.representation),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_NO_SEGMENT_INFO);
return shaka.dash.SegmentBase.createSegmentIndexFromUris(a,b,c,e,f.start,f.end,m,d)};shaka.dash.SegmentList={};
shaka.dash.SegmentList.createStream=function(a,b){goog.asserts.assert(a.representation.segmentList,"Should only be called with SegmentList");var c=shaka.dash.SegmentList,d=shaka.dash.SegmentBase.createInitSegment(a,c.fromInheritance_),e=c.parseSegmentListInfo_(a);c.checkSegmentListInfo_(a,e);var f=null,g=null;a.period.id&&a.representation.id&&(g=a.period.id+","+a.representation.id,f=b[g]);c=c.createSegmentReferences_(a.periodInfo.duration,e.startNumber,a.representation.baseUris,e);f?(f.merge(c),g=
a.presentationTimeline.getSegmentAvailabilityStart(),f.evict(g-a.periodInfo.start)):(a.presentationTimeline.notifySegments(c,a.periodInfo.start),f=new shaka.media.SegmentIndex(c),g&&a.dynamic&&(b[g]=f));a.dynamic&&a.periodInfo.isLastPeriod||f.fit(a.periodInfo.duration);return{createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:f.find.bind(f),getSegmentReference:f.get.bind(f),initSegmentReference:d,scaledPresentationTimeOffset:e.scaledPresentationTimeOffset}};
shaka.dash.SegmentList.fromInheritance_=function(a){return a.segmentList};
shaka.dash.SegmentList.parseSegmentListInfo_=function(a){var b=shaka.dash.SegmentList,c=shaka.dash.MpdUtils,d=b.parseMediaSegments_(a);a=c.parseSegmentInfo(a,b.fromInheritance_);b=a.startNumber;0==b&&(shaka.log.warning("SegmentList@startNumber must be > 0"),b=1);c=0;a.segmentDuration?c=a.segmentDuration*(b-1):a.timeline&&0<a.timeline.length&&(c=a.timeline[0].start);return{segmentDuration:a.segmentDuration,startTime:c,startNumber:b,scaledPresentationTimeOffset:a.scaledPresentationTimeOffset,timeline:a.timeline,
mediaSegments:d}};
shaka.dash.SegmentList.checkSegmentListInfo_=function(a,b){if(!b.segmentDuration&&!b.timeline&&1<b.mediaSegments.length)throw shaka.log.warning("SegmentList does not contain sufficient segment information:","the SegmentList specifies multiple segments,","but does not specify a segment duration or timeline.",a.representation),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_NO_SEGMENT_INFO);if(!b.segmentDuration&&!a.periodInfo.duration&&
!b.timeline&&1==b.mediaSegments.length)throw shaka.log.warning("SegmentList does not contain sufficient segment information:","the SegmentList specifies one segment,","but does not specify a segment duration, period duration,","or timeline.",a.representation),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_NO_SEGMENT_INFO);if(b.timeline&&0==b.timeline.length)throw shaka.log.warning("SegmentList does not contain sufficient segment information:",
"the SegmentList has an empty timeline.",a.representation),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_NO_SEGMENT_INFO);};
shaka.dash.SegmentList.createSegmentReferences_=function(a,b,c,d){var e=shaka.util.ManifestParserUtils,f=d.mediaSegments.length;d.timeline&&d.timeline.length!=d.mediaSegments.length&&(f=Math.min(d.timeline.length,d.mediaSegments.length),shaka.log.warning("The number of items in the segment timeline and the number of segment","URLs do not match, truncating",d.mediaSegments.length,"to",f));for(var g=[],h=d.startTime,k=0;k<f;k++){var l=d.mediaSegments[k],m=e.resolveUris(c,[l.mediaUri]),n=void 0;null!=
d.segmentDuration?n=h+d.segmentDuration:d.timeline?n=d.timeline[k].end:(goog.asserts.assert(1==d.mediaSegments.length&&a,"There should be exactly one segment with a Period duration."),n=h+a);m=function(a){return a}.bind(null,m);g.push(new shaka.media.SegmentReference(k+b,h,n,m,l.start,l.end));h=n}return g};
shaka.dash.SegmentList.parseMediaSegments_=function(a){var b=[a.representation.segmentList,a.adaptationSet.segmentList,a.period.segmentList].filter(shaka.util.Functional.isNotNull),c=shaka.util.XmlUtils;return b.map(function(a){return c.findChildren(a,"SegmentURL")}).reduce(function(a,b){return 0<a.length?a:b}).map(function(b){b.getAttribute("indexRange")&&!a.indexRangeWarningGiven&&(a.indexRangeWarningGiven=!0,shaka.log.warning("We do not support the SegmentURL@indexRange attribute on SegmentList.  We only use the SegmentList@duration attribute or SegmentTimeline, which must be accurate."));
var d=b.getAttribute("media");b=c.parseAttr(b,"mediaRange",c.parseRange,{start:0,end:null});return{mediaUri:d,start:b.start,end:b.end}})};shaka.dash.SegmentTemplate={};
shaka.dash.SegmentTemplate.createStream=function(a,b,c,d){goog.asserts.assert(a.representation.segmentTemplate,"Should only be called with SegmentTemplate");var e=shaka.dash.SegmentTemplate,f=e.createInitSegment_(a),g=e.parseSegmentTemplateInfo_(a);e.checkSegmentTemplateInfo_(a,g);if(g.indexTemplate)a=e.createFromIndexTemplate_(a,b,f,g);else if(g.segmentDuration)d||(a.presentationTimeline.notifyMaxSegmentDuration(g.segmentDuration),a.presentationTimeline.notifyMinSegmentStartTime(a.periodInfo.start)),a=
e.createFromDuration_(a,g);else{d=b=null;a.period.id&&a.representation.id&&(d=a.period.id+","+a.representation.id,b=c[d]);var h=e.createFromTimeline_(a,g);e=!a.dynamic||!a.periodInfo.isLastPeriod;b?(e&&(new shaka.media.SegmentIndex(h)).fit(a.periodInfo.duration),b.merge(h),c=a.presentationTimeline.getSegmentAvailabilityStart(),b.evict(c-a.periodInfo.start)):(a.presentationTimeline.notifySegments(h,a.periodInfo.start),b=new shaka.media.SegmentIndex(h),d&&a.dynamic&&(c[d]=b));e&&b.fit(a.periodInfo.duration);
a={createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:b.find.bind(b),getSegmentReference:b.get.bind(b)}}return{createSegmentIndex:a.createSegmentIndex,findSegmentPosition:a.findSegmentPosition,getSegmentReference:a.getSegmentReference,initSegmentReference:f,scaledPresentationTimeOffset:g.scaledPresentationTimeOffset}};shaka.dash.SegmentTemplate.fromInheritance_=function(a){return a.segmentTemplate};
shaka.dash.SegmentTemplate.parseSegmentTemplateInfo_=function(a){var b=shaka.dash.SegmentTemplate,c=shaka.dash.MpdUtils,d=c.parseSegmentInfo(a,b.fromInheritance_),e=c.inheritAttribute(a,b.fromInheritance_,"media");a=c.inheritAttribute(a,b.fromInheritance_,"index");return{segmentDuration:d.segmentDuration,timescale:d.timescale,startNumber:d.startNumber,scaledPresentationTimeOffset:d.scaledPresentationTimeOffset,unscaledPresentationTimeOffset:d.unscaledPresentationTimeOffset,timeline:d.timeline,mediaTemplate:e,
indexTemplate:a}};
shaka.dash.SegmentTemplate.checkSegmentTemplateInfo_=function(a,b){var c=b.indexTemplate?1:0;c+=b.timeline?1:0;c+=b.segmentDuration?1:0;if(0==c)throw shaka.log.error("SegmentTemplate does not contain any segment information:","the SegmentTemplate must contain either an index URL template","a SegmentTimeline, or a segment duration.",a.representation),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_NO_SEGMENT_INFO);1!=c&&(shaka.log.warning("SegmentTemplate containes multiple segment information sources:",
"the SegmentTemplate should only contain an index URL template,","a SegmentTimeline or a segment duration.",a.representation),b.indexTemplate?(shaka.log.info("Using the index URL template by default."),b.timeline=null):(goog.asserts.assert(b.timeline,"There should be a timeline"),shaka.log.info("Using the SegmentTimeline by default.")),b.segmentDuration=null);if(!b.indexTemplate&&!b.mediaTemplate)throw shaka.log.error("SegmentTemplate does not contain sufficient segment information:","the SegmentTemplate's media URL template is missing.",
a.representation),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_NO_SEGMENT_INFO);};
shaka.dash.SegmentTemplate.createFromIndexTemplate_=function(a,b,c,d){var e=shaka.dash.MpdUtils,f=shaka.util.ManifestParserUtils,g=a.representation.mimeType.split("/")[1];if("mp4"!=g&&"webm"!=g)throw shaka.log.error("SegmentTemplate specifies an unsupported container type.",a.representation),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_UNSUPPORTED_CONTAINER);if("webm"==g&&!c)throw shaka.log.error("SegmentTemplate does not contain sufficient segment information:",
"the SegmentTemplate uses a WebM container,","but does not contain an initialization URL template.",a.representation),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_WEBM_MISSING_INIT);goog.asserts.assert(d.indexTemplate,"must be using index template");e=e.fillUriTemplate(d.indexTemplate,a.representation.id,null,a.bandwidth||null,null);var h=f.resolveUris(a.baseUris.baseUris_,a.representation.baseUris);f=f.resolveUris(h,[e]);return shaka.dash.SegmentBase.createSegmentIndexFromUris(a,
b,c,f,0,null,g,d.scaledPresentationTimeOffset)};
shaka.dash.SegmentTemplate.createFromDuration_=function(a,b){goog.asserts.assert(b.mediaTemplate,"There should be a media template with duration");var c=shaka.dash.MpdUtils,d=shaka.util.ManifestParserUtils,e=a.periodInfo.duration,f=b.segmentDuration,g=b.startNumber,h=b.timescale,k=b.mediaTemplate,l=a.bandwidth||null,m=a.representation.id,n=a.representation;return{createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:function(a){return 0>a||e&&a>=e?null:Math.floor(a/f)},getSegmentReference:function(b){var q=
b*f,r=q+f;e&&(r=Math.min(r,e));return 0>r||e&&q>=e?null:new shaka.media.SegmentReference(b,q,r,function(){var e=d.resolveUris(a.baseUris.baseUris_,n.baseUris),f=c.fillUriTemplate(k,m,b+g,l,q*h);return d.resolveUris(e,[f])},0,null)}}};
shaka.dash.SegmentTemplate.createFromTimeline_=function(a,b){goog.asserts.assert(b.mediaTemplate,"There should be a media template with a timeline");for(var c=shaka.dash.MpdUtils,d=shaka.util.ManifestParserUtils,e=[],f=0;f<b.timeline.length;f++){var g=b.timeline[f].start,h=b.timeline[f].end,k=f+b.startNumber,l=function(a,b,e,f,g,h,k){f=d.resolveUris(f.baseUris_,g);a=c.fillUriTemplate(a,b,h,e,k);return d.resolveUris(f,[a]).map(function(a){return a.toString()})}.bind(null,b.mediaTemplate,a.representation.id,
a.bandwidth||null,a.baseUris,a.representation.baseUris,k,b.timeline[f].unscaledStart+b.unscaledPresentationTimeOffset);e.push(new shaka.media.SegmentReference(k,g,h,l,0,null))}return e};
shaka.dash.SegmentTemplate.createInitSegment_=function(a){var b=shaka.dash.MpdUtils,c=shaka.util.ManifestParserUtils,d=b.inheritAttribute(a,shaka.dash.SegmentTemplate.fromInheritance_,"initialization");if(!d)return null;var e=a.representation.id,f=a.bandwidth||null,g=a.representation;return new shaka.media.InitSegmentReference(function(){goog.asserts.assert(d,"Should have returned earler");var h=b.fillUriTemplate(d,e,null,f,null),k=c.resolveUris(a.baseUris.baseUris_,g.baseUris);return c.resolveUris(k,
[h])},0,null)};shaka.media.ManifestParser={};shaka.media.ManifestParser.parsersByMime={};shaka.media.ManifestParser.parsersByExtension={};shaka.media.ManifestParser.registerParserByExtension=function(a,b){shaka.media.ManifestParser.parsersByExtension[a]=b};goog.exportSymbol("shaka.media.ManifestParser.registerParserByExtension",shaka.media.ManifestParser.registerParserByExtension);shaka.media.ManifestParser.registerParserByMime=function(a,b){shaka.media.ManifestParser.parsersByMime[a]=b};
goog.exportSymbol("shaka.media.ManifestParser.registerParserByMime",shaka.media.ManifestParser.registerParserByMime);
shaka.media.ManifestParser.probeSupport=function(){var a=shaka.media.ManifestParser,b={};if(shaka.util.Platform.supportsMediaSource()){for(var c in a.parsersByMime)b[c]=!0;for(var d in a.parsersByExtension)b[d]=!0}c={mpd:"application/dash+xml",m3u8:"application/x-mpegurl",ism:"application/vnd.ms-sstr+xml"};d=$jscomp.makeIterator(["application/dash+xml","application/x-mpegurl","application/vnd.apple.mpegurl","application/vnd.ms-sstr+xml"]);for(var e=d.next();!e.done;e=d.next())e=e.value,shaka.util.Platform.supportsMediaSource()?
b[e]=!!a.parsersByMime[e]:b[e]=shaka.util.Platform.supportsMediaType(e);for(var f in c)shaka.util.Platform.supportsMediaSource()?b[f]=!!a.parsersByExtension[f]:b[f]=shaka.util.Platform.supportsMediaType(c[f]);return b};
shaka.media.ManifestParser.create=function(a,b,c,d){return $jscomp.asyncExecutePromiseGeneratorFunction(function f(){var g,h;return $jscomp.generator.createGenerator(f,function(f){switch(f.nextAddress){case 1:return f.setCatchFinallyBlocks(2),f.yield(shaka.media.ManifestParser.getFactory_(a,b,c,d),4);case 4:return g=f.yieldResult,f["return"](new g);case 2:throw h=f.enterCatchBlock(),goog.asserts.assert(h instanceof shaka.util.Error,"Incorrect error type"),h.severity=shaka.util.Error.Severity.CRITICAL,
h;}})})};
shaka.media.ManifestParser.getFactory_=function(a,b,c,d){return $jscomp.asyncExecutePromiseGeneratorFunction(function f(){var g,h,k,l,m;return $jscomp.generator.createGenerator(f,function(f){switch(f.nextAddress){case 1:g=shaka.media.ManifestParser;if(d){if(h=g.parsersByMime[d.toLowerCase()])return f["return"](h);shaka.log.warning("Could not determine manifest type using MIME type ",d)}if(k=g.getExtension(a)){if(l=g.parsersByExtension[k])return f["return"](l);shaka.log.warning("Could not determine manifest type for extension ",k)}else shaka.log.warning("Could not find extension for ",
a);if(d){f.jumpTo(2);break}return f.yield(g.getMimeType(a,b,c),3);case 3:if(d=f.yieldResult){if(m=shaka.media.ManifestParser.parsersByMime[d])return f["return"](m);shaka.log.warning("Could not determine manifest type using MIME type",d)}case 2:throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.UNABLE_TO_GUESS_MANIFEST_TYPE,a);}})})};
shaka.media.ManifestParser.getMimeType=function(a,b,c){return $jscomp.asyncExecutePromiseGeneratorFunction(function e(){var f,g,h,k;return $jscomp.generator.createGenerator(e,function(e){switch(e.nextAddress){case 1:return f=shaka.net.NetworkingEngine.RequestType.MANIFEST,g=shaka.net.NetworkingEngine.makeRequest([a],c),g.method="HEAD",e.yield(b.request(f,g).promise,2);case 2:return h=e.yieldResult,k=h.headers["content-type"],e["return"](k?k.toLowerCase():"")}})})};
shaka.media.ManifestParser.getExtension=function(a){a=(new goog.Uri(a)).getPath().split("/").pop().split(".");return 1==a.length?"":a.pop().toLowerCase()};shaka.media.ManifestParser.isSupported=function(a,b){return shaka.util.Platform.supportsMediaSource()?b in shaka.media.ManifestParser.parsersByMime||shaka.media.ManifestParser.getExtension(a)in shaka.media.ManifestParser.parsersByExtension?!0:!1:!1};shaka.media.PresentationTimeline=function(a,b,c){this.presentationStartTime_=a;this.presentationDelay_=b;this.segmentAvailabilityDuration_=this.duration_=Infinity;this.maxSegmentDuration_=1;this.maxSegmentEndTime_=this.minSegmentStartTime_=null;this.clockOffset_=0;this.static_=!0;this.userSeekStart_=0;this.autoCorrectDrift_=void 0===c?!0:c};goog.exportSymbol("shaka.media.PresentationTimeline",shaka.media.PresentationTimeline);shaka.media.PresentationTimeline.prototype.getDuration=function(){return this.duration_};
goog.exportProperty(shaka.media.PresentationTimeline.prototype,"getDuration",shaka.media.PresentationTimeline.prototype.getDuration);shaka.media.PresentationTimeline.prototype.getMaxSegmentDuration=function(){return this.maxSegmentDuration_};shaka.media.PresentationTimeline.prototype.setDuration=function(a){goog.asserts.assert(0<a,"duration must be > 0");this.duration_=a};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"setDuration",shaka.media.PresentationTimeline.prototype.setDuration);
shaka.media.PresentationTimeline.prototype.getPresentationStartTime=function(){return this.presentationStartTime_};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"getPresentationStartTime",shaka.media.PresentationTimeline.prototype.getPresentationStartTime);shaka.media.PresentationTimeline.prototype.setClockOffset=function(a){this.clockOffset_=a};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"setClockOffset",shaka.media.PresentationTimeline.prototype.setClockOffset);
shaka.media.PresentationTimeline.prototype.setStatic=function(a){this.static_=a};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"setStatic",shaka.media.PresentationTimeline.prototype.setStatic);shaka.media.PresentationTimeline.prototype.setSegmentAvailabilityDuration=function(a){goog.asserts.assert(0<=a,"segmentAvailabilityDuration must be >= 0");this.segmentAvailabilityDuration_=a};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"setSegmentAvailabilityDuration",shaka.media.PresentationTimeline.prototype.setSegmentAvailabilityDuration);
shaka.media.PresentationTimeline.prototype.setDelay=function(a){goog.asserts.assert(0<=a,"delay must be >= 0");this.presentationDelay_=a};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"setDelay",shaka.media.PresentationTimeline.prototype.setDelay);shaka.media.PresentationTimeline.prototype.getDelay=function(){return this.presentationDelay_};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"getDelay",shaka.media.PresentationTimeline.prototype.getDelay);
shaka.media.PresentationTimeline.prototype.notifySegments=function(a,b){if(0!=a.length){var c=a[a.length-1].endTime+b;this.notifyMinSegmentStartTime(a[0].startTime+b);this.maxSegmentDuration_=a.reduce(function(a,b){return Math.max(a,b.endTime-b.startTime)},this.maxSegmentDuration_);this.maxSegmentEndTime_=Math.max(this.maxSegmentEndTime_,c);null!=this.presentationStartTime_&&this.autoCorrectDrift_&&(this.presentationStartTime_=(Date.now()+this.clockOffset_)/1E3-this.maxSegmentEndTime_-this.maxSegmentDuration_);
shaka.log.v1("notifySegments:","maxSegmentDuration="+this.maxSegmentDuration_)}};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"notifySegments",shaka.media.PresentationTimeline.prototype.notifySegments);shaka.media.PresentationTimeline.prototype.notifyMinSegmentStartTime=function(a){this.minSegmentStartTime_=null==this.minSegmentStartTime_?a:Math.min(this.minSegmentStartTime_,a)};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"notifyMinSegmentStartTime",shaka.media.PresentationTimeline.prototype.notifyMinSegmentStartTime);
shaka.media.PresentationTimeline.prototype.notifyMaxSegmentDuration=function(a){this.maxSegmentDuration_=Math.max(this.maxSegmentDuration_,a);shaka.log.v1("notifyNewSegmentDuration:","maxSegmentDuration="+this.maxSegmentDuration_)};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"notifyMaxSegmentDuration",shaka.media.PresentationTimeline.prototype.notifyMaxSegmentDuration);
shaka.media.PresentationTimeline.prototype.offset=function(a){null!=this.minSegmentStartTime_&&(this.minSegmentStartTime_+=a);null!=this.maxSegmentEndTime_&&(this.maxSegmentEndTime_+=a)};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"offset",shaka.media.PresentationTimeline.prototype.offset);shaka.media.PresentationTimeline.prototype.isLive=function(){return Infinity==this.duration_&&!this.static_};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"isLive",shaka.media.PresentationTimeline.prototype.isLive);
shaka.media.PresentationTimeline.prototype.isInProgress=function(){return Infinity!=this.duration_&&!this.static_};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"isInProgress",shaka.media.PresentationTimeline.prototype.isInProgress);
shaka.media.PresentationTimeline.prototype.getSegmentAvailabilityStart=function(){goog.asserts.assert(0<=this.segmentAvailabilityDuration_,"The availability duration should be positive");if(Infinity==this.segmentAvailabilityDuration_)return this.userSeekStart_;var a=this.getSegmentAvailabilityEnd()-this.segmentAvailabilityDuration_;return Math.max(this.userSeekStart_,a)};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"getSegmentAvailabilityStart",shaka.media.PresentationTimeline.prototype.getSegmentAvailabilityStart);
shaka.media.PresentationTimeline.prototype.setUserSeekStart=function(a){this.userSeekStart_=a};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"setUserSeekStart",shaka.media.PresentationTimeline.prototype.setUserSeekStart);shaka.media.PresentationTimeline.prototype.getSegmentAvailabilityEnd=function(){return this.isLive()||this.isInProgress()?Math.min(this.getLiveEdge_(),this.duration_):this.duration_};
goog.exportProperty(shaka.media.PresentationTimeline.prototype,"getSegmentAvailabilityEnd",shaka.media.PresentationTimeline.prototype.getSegmentAvailabilityEnd);shaka.media.PresentationTimeline.prototype.getSafeSeekRangeStart=function(a){var b=Math.max(this.minSegmentStartTime_,this.userSeekStart_);if(Infinity==this.segmentAvailabilityDuration_)return b;var c=this.getSegmentAvailabilityEnd()-this.segmentAvailabilityDuration_;a=Math.min(c+a,this.getSeekRangeEnd());return Math.max(b,a)};
goog.exportProperty(shaka.media.PresentationTimeline.prototype,"getSafeSeekRangeStart",shaka.media.PresentationTimeline.prototype.getSafeSeekRangeStart);shaka.media.PresentationTimeline.prototype.getSeekRangeStart=function(){return this.getSafeSeekRangeStart(0)};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"getSeekRangeStart",shaka.media.PresentationTimeline.prototype.getSeekRangeStart);
shaka.media.PresentationTimeline.prototype.getSeekRangeEnd=function(){var a=this.isLive()||this.isInProgress()?this.presentationDelay_:0;return Math.max(0,this.getSegmentAvailabilityEnd()-a)};goog.exportProperty(shaka.media.PresentationTimeline.prototype,"getSeekRangeEnd",shaka.media.PresentationTimeline.prototype.getSeekRangeEnd);shaka.media.PresentationTimeline.prototype.usingPresentationStartTime=function(){return null==this.presentationStartTime_||null!=this.maxSegmentEndTime_?!1:!0};
goog.exportProperty(shaka.media.PresentationTimeline.prototype,"usingPresentationStartTime",shaka.media.PresentationTimeline.prototype.usingPresentationStartTime);shaka.media.PresentationTimeline.prototype.getLiveEdge_=function(){goog.asserts.assert(null!=this.presentationStartTime_,"Cannot compute timeline live edge without start time");var a=(Date.now()+this.clockOffset_)/1E3;return Math.max(0,a-this.maxSegmentDuration_-this.presentationStartTime_)};
goog.DEBUG&&(shaka.media.PresentationTimeline.prototype.assertIsValid=function(){this.isLive()?goog.asserts.assert(null!=this.presentationStartTime_,"Detected as live stream, but does not match our model of live!"):this.isInProgress()?goog.asserts.assert(null!=this.presentationStartTime_&&Infinity==this.segmentAvailabilityDuration_,"Detected as IPR stream, but does not match our model of IPR!"):goog.asserts.assert(Infinity==this.segmentAvailabilityDuration_&&Infinity!=this.duration_&&this.static_,
"Detected as VOD stream, but does not match our model of VOD!")});shaka.util.Networking=function(){};shaka.util.Networking.createSegmentRequest=function(a,b,c,d){a=shaka.net.NetworkingEngine.makeRequest(a,d);if(0!=b||null!=c)a.headers.Range=c?"bytes="+b+"-"+c:"bytes="+b+"-";return a};shaka.dash.DashParser=function(){var a=this;this.playerInterface_=this.config_=null;this.manifestUris_=[];this.manifest_=null;this.periodIds_=[];this.globalId_=1;this.segmentIndexMap_={};this.updatePeriod_=0;this.averageUpdateDuration_=new shaka.abr.Ewma(5);this.updateTimer_=new shaka.util.Timer(function(){a.onUpdate_()});this.operationManager_=new shaka.util.OperationManager};goog.exportSymbol("shaka.dash.DashParser",shaka.dash.DashParser);shaka.dash.DashParser.MIN_UPDATE_PERIOD_=3;
shaka.dash.DashParser.prototype.configure=function(a){goog.asserts.assert(null!=a.dash,"DashManifestConfiguration should not be null!");this.config_=a};
shaka.dash.DashParser.prototype.start=function(a,b){var c=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function e(){var f;return $jscomp.generator.createGenerator(e,function(e){switch(e.nextAddress){case 1:return goog.asserts.assert(c.config_,"Must call configure() before start()!"),c.manifestUris_=[a],c.playerInterface_=b,e.yield(c.requestManifest_(),2);case 2:f=e.yieldResult;c.playerInterface_&&c.setUpdateTimer_(f);if(!c.playerInterface_)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,
shaka.util.Error.Category.PLAYER,shaka.util.Error.Code.OPERATION_ABORTED);goog.asserts.assert(c.manifest_,"Manifest should be non-null!");return e["return"](c.manifest_)}})})};shaka.dash.DashParser.prototype.stop=function(){this.config_=this.playerInterface_=null;this.manifestUris_=[];this.manifest_=null;this.periodIds_=[];this.segmentIndexMap_={};null!=this.updateTimer_&&(this.updateTimer_.stop(),this.updateTimer_=null);return this.operationManager_.destroy()};
shaka.dash.DashParser.prototype.update=function(){this.requestManifest_()["catch"](function(a){if(this.playerInterface_)this.playerInterface_.onError(a)}.bind(this))};shaka.dash.DashParser.prototype.onExpirationUpdated=function(a,b){};
shaka.dash.DashParser.prototype.requestManifest_=function(){var a=this,b=shaka.net.NetworkingEngine.RequestType.MANIFEST,c=shaka.net.NetworkingEngine.makeRequest(this.manifestUris_,this.config_.retryParameters),d=this.playerInterface_.networkingEngine,e=Date.now();b=d.request(b,c);this.operationManager_.manage(b);return b.promise.then(function(b){if(a.playerInterface_)return b.uri&&!a.manifestUris_.includes(b.uri)&&a.manifestUris_.unshift(b.uri),a.parseManifest_(b.data,b.uri)}).then(function(){var b=
(Date.now()-e)/1E3;a.averageUpdateDuration_.sample(1,b);return b})};shaka.dash.DashParser.BaseUrisHolder=function(a){this.baseUris_=a};
shaka.dash.DashParser.prototype.parseManifest_=function(a,b){var c=this,d=shaka.util.Error,e=shaka.dash.MpdUtils,f=shaka.util.XmlUtils.parseXml(a,"MPD");if(!f)throw new d(d.Severity.CRITICAL,d.Category.MANIFEST,d.Code.DASH_INVALID_XML,b);d=e.processXlinks(f,this.config_.retryParameters,this.config_.dash.xlinkFailGracefully,b,this.playerInterface_.networkingEngine);this.operationManager_.manage(d);return d.promise.then(function(a){return c.processManifest_(a,b)})};
shaka.dash.DashParser.prototype.processManifest_=function(a,b){var c=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function e(){var f,g,h,k,l,m,n,q,p,r,u,t,v,x,w,y,C,z,D,A,B,E,H,F,G;return $jscomp.generator.createGenerator(e,function(e){switch(e.nextAddress){case 1:f=shaka.util.Functional;g=shaka.util.XmlUtils;h=[b];k=g.findChildren(a,"Location").map(g.getContents).filter(f.isNotNull);0<k.length&&(l=shaka.util.ManifestParserUtils.resolveUris(h,k),h=c.manifestUris_=l);m=g.findChildren(a,
"BaseURL").map(g.getContents);n=shaka.util.ManifestParserUtils.resolveUris(h,m);q=c.config_.dash.ignoreMinBufferTime;p=0;q||(p=g.parseAttr(a,"minBufferTime",g.parseDuration));c.updatePeriod_=g.parseAttr(a,"minimumUpdatePeriod",g.parseDuration,-1);r=g.parseAttr(a,"availabilityStartTime",g.parseDate);u=g.parseAttr(a,"timeShiftBufferDepth",g.parseDuration);t=g.parseAttr(a,"suggestedPresentationDelay",g.parseDuration);v=g.parseAttr(a,"maxSegmentDuration",g.parseDuration);x=a.getAttribute("type")||"static";
c.manifest_?w=c.manifest_.presentationTimeline:(y=Math.max(c.config_.dash.defaultPresentationDelay,1.5*p),C=null!=t?t:y,w=new shaka.media.PresentationTimeline(r,C,c.config_.dash.autoCorrectDrift));c.manifest_&&c.manifest_.baseUris?(z=c.manifest_.baseUris,z.baseUris_=n):z=new shaka.dash.DashParser.BaseUrisHolder(n);D={dynamic:"static"!=x,presentationTimeline:w,period:null,periodInfo:null,adaptationSet:null,representation:null,bandwidth:0,indexRangeWarningGiven:!1,baseUris:z};A=c.parsePeriods_(D,[""],
a);B=A.duration;E=A.periods;w.setStatic("static"==x);"static"!=x&&A.durationDerivedFromPeriods||w.setDuration(B||Infinity);(H=w.isLive())&&!isNaN(c.config_.availabilityWindowOverride)&&(u=c.config_.availabilityWindowOverride);null==u&&(u=Infinity);w.setSegmentAvailabilityDuration(u);w.notifyMaxSegmentDuration(v||1);goog.DEBUG&&w.assertIsValid();if(c.manifest_){e.jumpTo(0);break}c.manifest_={baseUris:z,presentationTimeline:w,periods:E,offlineSessionIds:[],minBufferTime:p||0};if(!w.usingPresentationStartTime()){e.jumpTo(0);
break}F=g.findChildren(a,"UTCTiming");return e.yield(c.parseUtcTiming_(n,F),4);case 4:G=e.yieldResult;if(!c.playerInterface_)return e["return"]();w.setClockOffset(G);e.jumpToEnd()}})})};
shaka.dash.DashParser.prototype.parsePeriods_=function(a,b,c){var d=shaka.util.XmlUtils,e=d.parseAttr(c,"mediaPresentationDuration",d.parseDuration),f=[],g=0;c=d.findChildren(c,"Period");for(var h=0;h<c.length;h++){var k=c[h];g=d.parseAttr(k,"start",d.parseDuration,g);var l=d.parseAttr(k,"duration",d.parseDuration),m=null;if(h!=c.length-1){var n=d.parseAttr(c[h+1],"start",d.parseDuration);null!=n&&(m=n-g)}else null!=e&&(m=e-g);n=shaka.util.ManifestParserUtils.GAP_OVERLAP_TOLERANCE_SECONDS;m&&l&&Math.abs(m-
l)>n&&shaka.log.warning("There is a gap/overlap between Periods",k);null==m&&(m=l);k=this.parsePeriod_(a,b,{start:g,duration:m,node:k,isLastPeriod:null==m||h==c.length-1});f.push(k);l=a.period.id;goog.asserts.assert(l,"Period IDs should not be null!");this.periodIds_.includes(l)||(this.periodIds_.push(l),this.manifest_&&(this.playerInterface_.filterNewPeriod(k),this.manifest_.periods.push(k)));if(null==m){h!=c.length-1&&shaka.log.warning("Skipping Period",h+1,"and any subsequent Periods:","Period",
h+1,"does not have a valid start time.",f[h+1]);g=null;break}g+=m}null==this.manifest_&&this.playerInterface_.filterAllPeriods(f);return null!=e?(g!=e&&shaka.log.warning("@mediaPresentationDuration does not match the total duration of all","Periods."),{periods:f,duration:e,durationDerivedFromPeriods:!1}):{periods:f,duration:g,durationDerivedFromPeriods:!0}};
shaka.dash.DashParser.prototype.parsePeriod_=function(a,b,c){var d=shaka.util.Functional,e=shaka.util.XmlUtils,f=shaka.util.ManifestParserUtils.ContentType;a.period=this.createFrame_(c.node,null,b);a.periodInfo=c;a.period.id||(shaka.log.info("No Period ID given for Period with start time "+c.start+",  Assigning a default"),a.period.id="__shaka_period_"+c.start);e.findChildren(c.node,"EventStream").forEach(this.parseEventStream_.bind(this,c.start,c.duration));b=e.findChildren(c.node,"AdaptationSet").map(this.parseAdaptationSet_.bind(this,
a)).filter(d.isNotNull);if(a.dynamic){a=[];d=$jscomp.makeIterator(b);for(e=d.next();!e.done;e=d.next()){e=$jscomp.makeIterator(e.value.representationIds);for(var g=e.next();!g.done;g=e.next())a.push(g.value)}d=new Set(a);if(a.length!=d.size)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_DUPLICATE_REPRESENTATION_ID);}var h=b.filter(function(a){return!a.trickModeFor});b.filter(function(a){return a.trickModeFor}).forEach(function(a){var b=
a.streams[0],c=a.trickModeFor;h.forEach(function(a){a.id==c&&a.streams.forEach(function(a){a.trickModeVideo=b})})});a=this.getSetsOfType_(h,f.VIDEO);d=this.getSetsOfType_(h,f.AUDIO);if(!a.length&&!d.length)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_EMPTY_PERIOD);d.length||(d=[null]);a.length||(a=[null]);b=[];for(e=0;e<d.length;e++)for(g=0;g<a.length;g++)this.createVariants_(d[e],a[g],b);f=this.getSetsOfType_(h,f.TEXT);
a=[];for(d=0;d<f.length;d++)a.push.apply(a,f[d].streams);return{startTime:c.start,textStreams:a,variants:b}};shaka.dash.DashParser.prototype.getSetsOfType_=function(a,b){return a.filter(function(a){return a.contentType==b})};
shaka.dash.DashParser.prototype.createVariants_=function(a,b,c){var d=shaka.util.ManifestParserUtils.ContentType;goog.asserts.assert(!a||a.contentType==d.AUDIO,"Audio parameter mismatch!");goog.asserts.assert(!b||b.contentType==d.VIDEO,"Video parameter mismatch!");if(a||b)if(a&&b){if(d=shaka.media.DrmEngine,d.areDrmCompatible(a.drmInfos,b.drmInfos))for(var e=d.getCommonDrmInfos(a.drmInfos,b.drmInfos),f=0;f<a.streams.length;f++)for(var g=0;g<b.streams.length;g++)d=(b.streams[g].bandwidth||0)+(a.streams[f].bandwidth||
0),d={id:this.globalId_++,language:a.language,primary:a.main||b.main,audio:a.streams[f],video:b.streams[g],bandwidth:d,drmInfos:e,allowedByApplication:!0,allowedByKeySystem:!0},c.push(d)}else for(e=a||b,f=0;f<e.streams.length;f++)d=e.streams[f].bandwidth||0,d={id:this.globalId_++,language:e.language||"und",primary:e.main,audio:a?e.streams[f]:null,video:b?e.streams[f]:null,bandwidth:d,drmInfos:e.drmInfos,allowedByApplication:!0,allowedByKeySystem:!0},c.push(d)};
shaka.dash.DashParser.prototype.parseAdaptationSet_=function(a,b){var c=shaka.util.XmlUtils,d=shaka.util.Functional,e=shaka.util.ManifestParserUtils,f=e.ContentType;a.adaptationSet=this.createFrame_(b,a.period,null);var g=!1,h=c.findChildren(b,"Role"),k=h.map(function(a){return a.getAttribute("value")}).filter(d.isNotNull),l=void 0;if(d=a.adaptationSet.contentType==e.ContentType.TEXT)l=e.TextStreamKind.SUBTITLE;for(var m=0;m<h.length;m++){var n=h[m].getAttribute("schemeIdUri");if(null==n||"urn:mpeg:dash:role:2011"==
n)switch(n=h[m].getAttribute("value"),n){case "main":g=!0;break;case "caption":case "subtitle":l=n}}var q=null,p=!1;c.findChildren(b,"EssentialProperty").forEach(function(a){"http://dashif.org/guidelines/trickmode"==a.getAttribute("schemeIdUri")?q=a.getAttribute("value"):p=!0});m=c.findChildren(b,"Accessibility");var r=shaka.util.LanguageUtils,u=new Map;h={};m=$jscomp.makeIterator(m);for(n=m.next();!n.done;h={channelId:h.channelId},n=m.next()){var t=n.value;n=t.getAttribute("schemeIdUri");t=t.getAttribute("value");
"urn:scte:dash:cc:cea-608:2015"==n||"urn:scte:dash:cc:cea-708:2015"==n?(h.channelId=1,null!=t?t.split(";").forEach(function(a){return function(b){if(b.includes("=")){b=b.split("=");var c=b[0].startsWith("CC")?b[0]:"CC"+b[0];b=b[1].split(",")[0].split(":").pop()}else c="CC"+a.channelId,a.channelId+=2;u.set(c,r.normalize(b))}}(h)):u.set("CC1","und")):"urn:mpeg:dash:role:2011"==n&&null!=t&&(k.push(t),"captions"==t&&(l=e.TextStreamKind.CLOSED_CAPTION))}if(p)return null;e=c.findChildren(b,"ContentProtection");
var v=shaka.dash.ContentProtection.parseFromAdaptationSet(e,this.config_.dash.customScheme,this.config_.dash.ignoreDrmInfo);e=shaka.util.LanguageUtils.normalize(b.getAttribute("lang")||"und");h=b.getAttribute("label");c=c.findChildren(b,"Representation");k=c.map(this.parseRepresentation_.bind(this,a,v,l,e,h,g,k,u)).filter(function(a){return!!a});if(0==k.length){if(d)return null;throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.DASH_EMPTY_ADAPTATION_SET);
}a.adaptationSet.contentType&&a.adaptationSet.contentType!=f.APPLICATION||(a.adaptationSet.contentType=shaka.dash.DashParser.guessContentType_(k[0].mimeType,k[0].codecs),k.forEach(function(b){b.type=a.adaptationSet.contentType}));k.forEach(function(a){v.drmInfos.forEach(function(b){a.keyId&&b.keyIds.push(a.keyId)})});f=c.map(function(a){return a.getAttribute("id")}).filter(shaka.util.Functional.isNotNull);return{id:a.adaptationSet.id||"__fake__"+this.globalId_++,contentType:a.adaptationSet.contentType,
language:e,main:g,streams:k,drmInfos:v.drmInfos,trickModeFor:q,representationIds:f}};
shaka.dash.DashParser.prototype.parseRepresentation_=function(a,b,c,d,e,f,g,h,k){var l=shaka.util.XmlUtils,m=shaka.util.ManifestParserUtils.ContentType;a.representation=this.createFrame_(k,a.adaptationSet,null);if(!this.verifyRepresentation_(a.representation))return shaka.log.warning("Skipping Representation",a.representation),null;a.bandwidth=l.parseAttr(k,"bandwidth",l.parsePositiveInt)||0;var n=a.representation.contentType;m=n==m.TEXT||n==m.APPLICATION;try{var q=this.requestInitSegment_.bind(this);
if(a.representation.segmentBase)var p=shaka.dash.SegmentBase.createStream(a,q);else if(a.representation.segmentList)p=shaka.dash.SegmentList.createStream(a,this.segmentIndexMap_);else if(a.representation.segmentTemplate)p=shaka.dash.SegmentTemplate.createStream(a,q,this.segmentIndexMap_,!!this.manifest_);else{goog.asserts.assert(m,"Must have Segment* with non-text streams.");var r=shaka.util.ManifestParserUtils.resolveUris(a.baseUris.baseUris_,a.representation.baseUris),u=a.periodInfo.duration||0;
p={createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:function(a){return 0<=a&&a<u?1:null},getSegmentReference:function(a){return 1!=a?null:new shaka.media.SegmentReference(1,0,u,function(){return r},0,null)},initSegmentReference:null,scaledPresentationTimeOffset:0}}}catch(t){if(m&&t.code==shaka.util.Error.Code.DASH_NO_SEGMENT_INFO)return null;throw t;}k=l.findChildren(k,"ContentProtection");k=shaka.dash.ContentProtection.parseFromRepresentation(k,this.config_.dash.customScheme,
b,this.config_.dash.ignoreDrmInfo);return{id:this.globalId_++,originalId:a.representation.id,createSegmentIndex:p.createSegmentIndex,findSegmentPosition:p.findSegmentPosition,getSegmentReference:p.getSegmentReference,initSegmentReference:p.initSegmentReference,presentationTimeOffset:p.scaledPresentationTimeOffset,mimeType:a.representation.mimeType,codecs:a.representation.codecs,frameRate:a.representation.frameRate,bandwidth:a.bandwidth,width:a.representation.width,height:a.representation.height,kind:c,
encrypted:0<b.drmInfos.length,keyId:k,language:d,label:e,type:a.adaptationSet.contentType,primary:f,trickModeVideo:null,emsgSchemeIdUris:a.representation.emsgSchemeIdUris,roles:g,channelsCount:a.representation.numChannels,closedCaptions:h}};
shaka.dash.DashParser.prototype.onUpdate_=function(){var a=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function c(){var d,e;return $jscomp.generator.createGenerator(c,function(c){switch(c.nextAddress){case 1:return goog.asserts.assert(0<=a.updatePeriod_,"There should be an update period"),shaka.log.info("Updating manifest..."),d=0,c.setCatchFinallyBlocks(2),c.yield(a.requestManifest_(),4);case 4:d=c.yieldResult;c.leaveTryBlock(3);break;case 2:e=c.enterCatchBlock(),goog.asserts.assert(e instanceof
shaka.util.Error,"Should only receive a Shaka error"),a.playerInterface_&&(e.severity=shaka.util.Error.Severity.RECOVERABLE,a.playerInterface_.onError(e));case 3:if(!a.playerInterface_)return c["return"]();a.setUpdateTimer_(d);c.jumpToEnd()}})})};shaka.dash.DashParser.prototype.setUpdateTimer_=function(a){0>this.updatePeriod_||(a=Math.max(shaka.dash.DashParser.MIN_UPDATE_PERIOD_,this.updatePeriod_-a,this.averageUpdateDuration_.getEstimate()),this.updateTimer_.tickAfter(a))};
shaka.dash.DashParser.prototype.createFrame_=function(a,b,c){goog.asserts.assert(b||c,"Must provide either parent or baseUris");var d=shaka.util.ManifestParserUtils,e=shaka.util.XmlUtils;b=b||{contentType:"",mimeType:"",codecs:"",emsgSchemeIdUris:[],frameRate:void 0,numChannels:null};c=c||b.baseUris;var f=e.parseNonNegativeInt,g=e.evalDivision,h=e.findChildren(a,"BaseURL").map(e.getContents),k=a.getAttribute("contentType")||b.contentType,l=a.getAttribute("mimeType")||b.mimeType,m=a.getAttribute("codecs")||
b.codecs;g=e.parseAttr(a,"frameRate",g)||b.frameRate;var n=this.emsgSchemeIdUris_(e.findChildren(a,"InbandEventStream"),b.emsgSchemeIdUris),q=e.findChildren(a,"AudioChannelConfiguration");q=this.parseAudioChannels_(q)||b.numChannels;k||(k=shaka.dash.DashParser.guessContentType_(l,m));return{baseUris:d.resolveUris(c,h),segmentBase:e.findChild(a,"SegmentBase")||b.segmentBase,segmentList:e.findChild(a,"SegmentList")||b.segmentList,segmentTemplate:e.findChild(a,"SegmentTemplate")||b.segmentTemplate,width:e.parseAttr(a,
"width",f)||b.width,height:e.parseAttr(a,"height",f)||b.height,contentType:k,mimeType:l,codecs:m,frameRate:g,emsgSchemeIdUris:n,id:a.getAttribute("id"),numChannels:q}};shaka.dash.DashParser.prototype.emsgSchemeIdUris_=function(a,b){for(var c=b.slice(),d=$jscomp.makeIterator(a),e=d.next();!e.done;e=d.next())e=e.value.getAttribute("schemeIdUri"),c.includes(e)||c.push(e);return c};
shaka.dash.DashParser.prototype.parseAudioChannels_=function(a){for(var b=0;b<a.length;++b){var c=a[b],d=c.getAttribute("schemeIdUri");if(d&&(c=c.getAttribute("value")))switch(d){case "urn:mpeg:dash:outputChannelPositionList:2012":return c.trim().split(/ +/).length;case "urn:mpeg:dash:23003:3:audio_channel_configuration:2011":case "urn:dts:dash:audio_channel_configuration:2012":var e=parseInt(c,10);if(!e){shaka.log.warning("Channel parsing failure! Ignoring scheme and value",d,c);continue}return e;
case "tag:dolby.com,2014:dash:audio_channel_configuration:2011":case "urn:dolby:dash:audio_channel_configuration:2011":e=parseInt(c,16);if(!e){shaka.log.warning("Channel parsing failure! Ignoring scheme and value",d,c);continue}for(a=0;e;)e&1&&++a,e>>=1;return a;default:shaka.log.warning("Unrecognized audio channel scheme:",d,c)}}return null};
shaka.dash.DashParser.prototype.verifyRepresentation_=function(a){var b=shaka.util.ManifestParserUtils.ContentType;var c=a.segmentBase?1:0;c+=a.segmentList?1:0;c+=a.segmentTemplate?1:0;if(0==c){if(a.contentType==b.TEXT||a.contentType==b.APPLICATION)return!0;shaka.log.warning("Representation does not contain a segment information source:","the Representation must contain one of SegmentBase, SegmentList,",'SegmentTemplate, or explicitly indicate that it is "text".',a);return!1}1!=c&&(shaka.log.warning("Representation contains multiple segment information sources:",
"the Representation should only contain one of SegmentBase,","SegmentList, or SegmentTemplate.",a),a.segmentBase?(shaka.log.info("Using SegmentBase by default."),a.segmentList=null):(goog.asserts.assert(a.segmentList,"There should be a SegmentList"),shaka.log.info("Using SegmentList by default.")),a.segmentTemplate=null);return!0};
shaka.dash.DashParser.prototype.requestForTiming_=function(a,b,c){a=shaka.util.ManifestParserUtils.resolveUris(a,[b]);a=shaka.net.NetworkingEngine.makeRequest(a,this.config_.retryParameters);a.method=c;a=this.playerInterface_.networkingEngine.request(shaka.net.NetworkingEngine.RequestType.TIMING,a);this.operationManager_.manage(a);return a.promise.then(function(a){if("HEAD"==c){if(!a.headers||!a.headers.date)return shaka.log.warning("UTC timing response is missing","expected date header"),0;a=a.headers.date}else a=
shaka.util.StringUtils.fromUTF8(a.data);a=Date.parse(a);return isNaN(a)?(shaka.log.warning("Unable to parse date from UTC timing response"),0):a-Date.now()})};
shaka.dash.DashParser.prototype.parseUtcTiming_=function(a,b){var c=b.map(function(a){return{scheme:a.getAttribute("schemeIdUri"),value:a.getAttribute("value")}}),d=this.config_.dash.clockSyncUri;!c.length&&d&&c.push({scheme:"urn:mpeg:dash:utc:http-head:2014",value:d});return shaka.util.Functional.createFallbackPromiseChain(c,function(b){var c=b.scheme;b=b.value;switch(c){case "urn:mpeg:dash:utc:http-head:2014":case "urn:mpeg:dash:utc:http-head:2012":return this.requestForTiming_(a,b,"HEAD");case "urn:mpeg:dash:utc:http-xsdate:2014":case "urn:mpeg:dash:utc:http-iso:2014":case "urn:mpeg:dash:utc:http-xsdate:2012":case "urn:mpeg:dash:utc:http-iso:2012":return this.requestForTiming_(a,
b,"GET");case "urn:mpeg:dash:utc:direct:2014":case "urn:mpeg:dash:utc:direct:2012":return c=Date.parse(b),isNaN(c)?0:c-Date.now();case "urn:mpeg:dash:utc:http-ntp:2014":case "urn:mpeg:dash:utc:ntp:2014":case "urn:mpeg:dash:utc:sntp:2014":return shaka.log.alwaysWarn("NTP UTCTiming scheme is not supported"),Promise.reject();default:return shaka.log.alwaysWarn("Unrecognized scheme in UTCTiming element",c),Promise.reject()}}.bind(this))["catch"](function(){shaka.log.alwaysWarn("A UTCTiming element should always be given in live manifests! This content may not play on clients with bad clocks!");
return 0})};
shaka.dash.DashParser.prototype.parseEventStream_=function(a,b,c){var d=shaka.util.XmlUtils,e=d.parseNonNegativeInt,f=c.getAttribute("schemeIdUri")||"",g=c.getAttribute("value")||"",h=d.parseAttr(c,"timescale",e)||1;d.findChildren(c,"Event").forEach(function(c){var k=d.parseAttr(c,"presentationTime",e)||0,m=d.parseAttr(c,"duration",e)||0;k=k/h+a;m=k+m/h;null!=b&&(k=Math.min(k,a+b),m=Math.min(m,a+b));c={schemeIdUri:f,value:g,startTime:k,endTime:m,id:c.getAttribute("id")||"",eventElement:c};this.playerInterface_.onTimelineRegionAdded(c)}.bind(this))};
shaka.dash.DashParser.prototype.requestInitSegment_=function(a,b,c){var d=shaka.net.NetworkingEngine.RequestType.SEGMENT;a=shaka.util.Networking.createSegmentRequest(a,b,c,this.config_.retryParameters);d=this.playerInterface_.networkingEngine.request(d,a);this.operationManager_.manage(d);return d.promise.then(function(a){return a.data})};
shaka.dash.DashParser.guessContentType_=function(a,b){var c=shaka.util.MimeUtils.getFullType(a,b);return shaka.text.TextEngine.isTypeSupported(c)?shaka.util.ManifestParserUtils.ContentType.TEXT:a.split("/")[0]};shaka.media.ManifestParser.registerParserByExtension("mpd",shaka.dash.DashParser);shaka.media.ManifestParser.registerParserByMime("application/dash+xml",shaka.dash.DashParser);shaka.deprecate={};shaka.deprecate.Version=function(a,b){this.major_=a;this.minor_=b};shaka.deprecate.Version.prototype.major=function(){return this.major_};shaka.deprecate.Version.prototype.minor=function(){return this.minor_};shaka.deprecate.Version.prototype.compareTo=function(a){var b=this.minor_-a.minor_;return this.major_-a.major_||b};shaka.deprecate.Version.prototype.toString=function(){return"v"+this.major_+"."+this.minor_};
shaka.deprecate.Version.parse=function(a){a=a.substring(1).split(".",2);return new shaka.deprecate.Version(Number(a[0]),Number(a[1]))};shaka.deprecate.Enforcer=function(a,b,c){this.libraryVersion_=a;this.onPending_=b;this.onExpired_=c};shaka.deprecate.Enforcer.prototype.enforce=function(a,b,c){(0<a.compareTo(this.libraryVersion_)?this.onPending_:this.onExpired_)(this.libraryVersion_,a,b,c)};shaka.Deprecate=function(){};shaka.Deprecate.init=function(a){goog.asserts.assert(null==shaka.Deprecate.enforcer_,"Deprecate.init should only be called once.");shaka.Deprecate.enforcer_=new shaka.deprecate.Enforcer(shaka.deprecate.Version.parse(a),shaka.Deprecate.onPending_,shaka.Deprecate.onExpired_)};
shaka.Deprecate.deprecateFeature=function(a,b,c,d){var e=shaka.Deprecate.enforcer_;goog.asserts.assert(e,"Missing deprecation enforcer. Was |init| called?");a=new shaka.deprecate.Version(a,b);e.enforce(a,c,d)};shaka.Deprecate.onPending_=function(a,b,c,d){shaka.log.alwaysWarn([c,"has been deprecated and will be removed in",b,". We are currently at version",a,". Additional information:",d].join(" "))};
shaka.Deprecate.onExpired_=function(a,b,c,d){a=[c,"has been deprecated and has been removed in",b,". We are now at version",a,". Additional information:",d].join("");shaka.log.alwaysError(a);goog.asserts.assert(!1,a)};shaka.Deprecate.enforcer_=null;shaka.media.ActiveStreamMap=function(){this.history_=new Map};shaka.media.ActiveStreamMap.prototype.clear=function(){this.history_.clear()};shaka.media.ActiveStreamMap.prototype.useVariant=function(a,b){this.getFrameFor_(a).variant=b};shaka.media.ActiveStreamMap.prototype.useText=function(a,b){this.getFrameFor_(a).text=b};shaka.media.ActiveStreamMap.prototype.getVariant=function(a){return this.getFrameFor_(a).variant};shaka.media.ActiveStreamMap.prototype.getText=function(a){return this.getFrameFor_(a).text};
shaka.media.ActiveStreamMap.prototype.getFrameFor_=function(a){if(!this.history_.has(a)){var b=new shaka.media.ActiveStreamMap.Frame;this.history_.set(a,b)}return this.history_.get(a)};shaka.media.ActiveStreamMap.Frame=function(){this.text=this.variant=null};shaka.media.AdaptationSet=function(a,b){this.root_=a;this.variants_=new Set([a]);b=b||[];for(var c=$jscomp.makeIterator(b),d=c.next();!d.done;d=c.next())this.add(d.value)};shaka.media.AdaptationSet.prototype.add=function(a){if(this.canInclude(a))return this.variants_.add(a),!0;shaka.log.warning("Rejecting variant - not compatible with root.");return!1};shaka.media.AdaptationSet.prototype.canInclude=function(a){return shaka.media.AdaptationSet.areAdaptable(this.root_,a)};
shaka.media.AdaptationSet.areAdaptable=function(a,b){var c=shaka.media.AdaptationSet;if(!!a.audio!=!!b.audio||!!a.video!=!!b.video||a.language!=b.language)return!1;goog.asserts.assert(!!a.audio==!!b.audio,"Both should either have audio or not have audio.");if(a.audio&&b.audio&&!c.areAudiosCompatible_(a.audio,b.audio))return!1;goog.asserts.assert(!!a.video==!!b.video,"Both should either have video or not have video.");return a.video&&b.video&&!c.areVideosCompatible_(a.video,b.video)?!1:!0};
shaka.media.AdaptationSet.prototype.values=function(){return this.variants_.values()};shaka.media.AdaptationSet.areAudiosCompatible_=function(a,b){var c=shaka.media.AdaptationSet;return a.channelsCount==b.channelsCount&&c.canTransitionBetween_(a,b)&&c.areRolesEqual_(a.roles,b.roles)?!0:!1};shaka.media.AdaptationSet.areVideosCompatible_=function(a,b){var c=shaka.media.AdaptationSet;return c.canTransitionBetween_(a,b)&&c.areRolesEqual_(a.roles,b.roles)?!0:!1};
shaka.media.AdaptationSet.canTransitionBetween_=function(a,b){if(a.mimeType!=b.mimeType)return!1;var c=shaka.util.MimeUtils.splitCodecs(a.codecs).map(function(a){return shaka.util.MimeUtils.getCodecBase(a)}),d=shaka.util.MimeUtils.splitCodecs(b.codecs).map(function(a){return shaka.util.MimeUtils.getCodecBase(a)});if(c.length!=d.length)return!1;c.sort();d.sort();for(var e=0;e<c.length;e++)if(c[e]!=d[e])return!1;return!0};
shaka.media.AdaptationSet.areRolesEqual_=function(a,b){var c=new Set(a),d=new Set(b);c["delete"]("main");d["delete"]("main");if(c.size!=d.size)return!1;c=$jscomp.makeIterator(c);for(var e=c.next();!e.done;e=c.next())if(!d.has(e.value))return!1;return!0};shaka.media.AdaptationSetCriteria=function(){};shaka.media.AdaptationSetCriteria.prototype.create=function(a){};shaka.media.ExampleBasedCriteria=function(a){this.example_=a;this.fallback_=new shaka.media.PreferenceBasedCriteria(a.language,"",a.audio&&a.audio.channelsCount?a.audio.channelsCount:0)};
shaka.media.ExampleBasedCriteria.prototype.create=function(a){var b=this,c=a.filter(function(a){return shaka.media.AdaptationSet.areAdaptable(b.example_,a)});return c.length?new shaka.media.AdaptationSet(c[0],c):this.fallback_.create(a)};shaka.media.PreferenceBasedCriteria=function(a,b,c){this.language_=a;this.role_=b;this.channelCount_=c};
shaka.media.PreferenceBasedCriteria.prototype.create=function(a){var b=shaka.media.PreferenceBasedCriteria,c=shaka.util.StreamUtils,d=[];d=b.filterByLanguage_(a,this.language_);var e=a.filter(function(a){return a.primary});d=d.length?d:e.length?e:a;this.role_&&(a=b.filterVariantsByRole_(d,this.role_),a.length?d=a:shaka.log.warning("No exact match for variant role could be found."));this.channelCount_&&(c=c.filterVariantsByAudioChannelCount(d,this.channelCount_),c.length?d=c:shaka.log.warning("No exact match for the channel count could be found."));
c=new shaka.media.AdaptationSet(d[0]);d=$jscomp.makeIterator(d);for(a=d.next();!a.done;a=d.next())a=a.value,c.canInclude(a)&&c.add(a);return c};shaka.media.PreferenceBasedCriteria.filterByLanguage_=function(a,b){var c=shaka.util.LanguageUtils,d=c.normalize(b),e=c.findClosestLocale(d,a.map(function(a){return c.getLocaleForVariant(a)}));return e?a.filter(function(a){return e==c.getLocaleForVariant(a)}):[]};
shaka.media.PreferenceBasedCriteria.filterVariantsByRole_=function(a,b){return a.filter(function(a){var c=a.audio;a=a.video;return c&&0<=c.roles.indexOf(b)||a&&0<=a.roles.indexOf(b)})};shaka.media.BufferingObserver=function(a,b){var c=shaka.media.BufferingObserver.State;this.previousState_=c.SATISFIED;this.thresholds_=(new Map).set(c.SATISFIED,b).set(c.STARVING,a)};shaka.media.BufferingObserver.prototype.update=function(a,b){var c=shaka.media.BufferingObserver.State,d=this.thresholds_.get(this.previousState_),e=this.previousState_;this.previousState_=c=b||a>=d?c.SATISFIED:c.STARVING;return e!=c};shaka.media.BufferingObserver.prototype.setState=function(a){this.previousState_=a};
shaka.media.BufferingObserver.prototype.getState=function(){return this.previousState_};shaka.media.BufferingObserver.State={STARVING:0,SATISFIED:1};shaka.media.StallDetector=function(a,b){this.implementation_=a;this.wasMakingProgress_=a.shouldBeMakingProgress();this.value_=a.getPresentationSeconds();this.lastUpdateSeconds_=a.getWallSeconds();this.stallThresholdSeconds_=b;this.onStall_=function(){}};shaka.media.StallDetector.prototype.release=function(){this.implementation_=null;this.onStall_=function(){}};shaka.media.StallDetector.prototype.onStall=function(a){this.onStall_=a};
shaka.media.StallDetector.prototype.poll=function(){var a=this.implementation_,b=a.shouldBeMakingProgress(),c=a.getPresentationSeconds();a=a.getWallSeconds();if(this.value_!=c||this.wasMakingProgress_!=b)this.lastUpdateSeconds_=a,this.value_=c,this.wasMakingProgress_=b;c=a-this.lastUpdateSeconds_;if(c>=this.stallThresholdSeconds_&&b)this.onStall_(this.value_,c)};shaka.media.StallDetector.Implementation=function(){};shaka.media.StallDetector.Implementation.prototype.shouldBeMakingProgress=function(){};
shaka.media.StallDetector.Implementation.prototype.getPresentationSeconds=function(){};shaka.media.StallDetector.Implementation.prototype.getWallSeconds=function(){};shaka.media.StallDetector.MediaElementImplementation=function(a){this.mediaElement_=a};
shaka.media.StallDetector.MediaElementImplementation.prototype.shouldBeMakingProgress=function(){return this.mediaElement_.paused||0==this.mediaElement_.playbackRate||null==this.mediaElement_.buffered?!1:shaka.media.StallDetector.MediaElementImplementation.hasContentFor_(this.mediaElement_.buffered,this.mediaElement_.currentTime)};shaka.media.StallDetector.MediaElementImplementation.prototype.getPresentationSeconds=function(){return this.mediaElement_.currentTime};
shaka.media.StallDetector.MediaElementImplementation.prototype.getWallSeconds=function(){return Date.now()/1E3};shaka.media.StallDetector.MediaElementImplementation.hasContentFor_=function(a,b){for(var c=0;c<a.length;c++){var d=a.start(c),e=a.end(c);if(!(b<d||b>e-.5))return!0}return!1};shaka.media.GapJumpingController=function(a,b,c,d,e){var f=this;this.video_=a;this.timeline_=b;this.config_=c;this.onEvent_=e;this.eventManager_=new shaka.util.EventManager;this.seekingEventReceived_=!1;this.prevReadyState_=a.readyState;this.didFireLargeGap_=!1;this.stallDetector_=d;this.hadSegmentAppended_=!1;this.eventManager_.listen(a,"waiting",function(){return f.onPollGapJump_()});this.gapJumpTimer_=(new shaka.util.Timer(function(){f.onPollGapJump_()})).tickEvery(.25)};
shaka.media.GapJumpingController.BROWSER_GAP_TOLERANCE=.001;shaka.media.GapJumpingController.prototype.release=function(){this.eventManager_&&(this.eventManager_.release(),this.eventManager_=null);null!=this.gapJumpTimer_&&(this.gapJumpTimer_.stop(),this.gapJumpTimer_=null);this.stallDetector_&&(this.stallDetector_.release(),this.stallDetector_=null);this.video_=this.timeline_=this.onEvent_=null};shaka.media.GapJumpingController.prototype.onSegmentAppended=function(){this.hadSegmentAppended_=!0;this.onPollGapJump_()};
shaka.media.GapJumpingController.prototype.onSeeking=function(){this.seekingEventReceived_=!0;this.didFireLargeGap_=this.hadSegmentAppended_=!1};
shaka.media.GapJumpingController.prototype.onPollGapJump_=function(){if(0!=this.video_.readyState){if(this.video_.seeking){if(!this.seekingEventReceived_)return}else this.seekingEventReceived_=!1;if(!this.video_.paused){this.video_.readyState!=this.prevReadyState_&&(this.didFireLargeGap_=!1,this.prevReadyState_=this.video_.readyState);var a=this.config_.smallGapLimit,b=this.video_.currentTime,c=this.video_.buffered,d=shaka.media.TimeRangesUtils.getGapIndex(c,b);if(null==d)this.stallDetector_&&this.stallDetector_.poll();
else if(0!=d||this.hadSegmentAppended_){var e=c.start(d),f=this.timeline_.getSeekRangeEnd();if(!(e>=f)){f=e-b;a=f<=a;var g=!1;if(!(f<shaka.media.GapJumpingController.BROWSER_GAP_TOLERANCE)){if(!a&&!this.didFireLargeGap_){this.didFireLargeGap_=!0;var h=new shaka.util.FakeEvent("largegap",{currentTime:b,gapSize:f});h.cancelable=!0;this.onEvent_(h);this.config_.jumpLargeGaps&&!h.defaultPrevented?g=!0:shaka.log.info("Ignoring large gap at",b,"size",f)}if(a||g)0==d?shaka.log.info("Jumping forward",f,"seconds because of gap before start time of",
e):shaka.log.info("Jumping forward",f,"seconds because of gap starting at",c.end(d-1),"and ending at",e),this.video_.currentTime=e}}}}}};shaka.media.IPlayheadObserver=function(){};shaka.media.IPlayheadObserver.prototype.poll=function(a,b){};shaka.media.PlayheadObserverManager=function(a){var b=this;this.mediaElement_=a;this.observers_=new Set;this.pollingLoop_=(new shaka.util.Timer(function(){b.pollAllObservers_(!1)})).tickEvery(.25)};shaka.media.PlayheadObserverManager.prototype.release=function(){this.pollingLoop_.stop();for(var a=$jscomp.makeIterator(this.observers_),b=a.next();!b.done;b=a.next())b.value.release();this.observers_.clear()};
shaka.media.PlayheadObserverManager.prototype.manage=function(a){this.observers_.add(a)};shaka.media.PlayheadObserverManager.prototype.notifyOfSeek=function(){this.pollAllObservers_(!0)};shaka.media.PlayheadObserverManager.prototype.pollAllObservers_=function(a){for(var b=$jscomp.makeIterator(this.observers_),c=b.next();!c.done;c=b.next())c.value.poll(this.mediaElement_.currentTime,a)};shaka.util.Periods=function(){};shaka.util.Periods.getAllVariantsFrom=function(a){var b=[];a=$jscomp.makeIterator(a);for(var c=a.next();!c.done;c=a.next()){c=$jscomp.makeIterator(c.value.variants);for(var d=c.next();!d.done;d=c.next())b.push(d.value)}return b};shaka.util.Periods.findPeriodForTime=function(a,b){for(var c=null,d=$jscomp.makeIterator(a),e=d.next();!e.done;e=d.next())e=e.value,b>=e.startTime&&(c=e);return c};shaka.media.PeriodObserver=function(a){this.manifest_=a;this.currentPeriod_=null;this.onChangedPeriods_=function(a){}};shaka.media.PeriodObserver.prototype.release=function(){this.currentPeriod_=this.manifest_=null;this.onChangedPeriods_=function(a){}};shaka.media.PeriodObserver.prototype.poll=function(a,b){var c=this.currentPeriod_,d=this.findCurrentPeriod_(a);if(c!=d)this.onChangedPeriods_(d);this.currentPeriod_=d};
shaka.media.PeriodObserver.prototype.setListeners=function(a){this.onChangedPeriods_=a};shaka.media.PeriodObserver.prototype.findCurrentPeriod_=function(a){var b=this.manifest_.periods;return shaka.util.Periods.findPeriodForTime(b,a)||b[0]};shaka.media.PlayRateController=function(a){var b=this;this.harness_=a;this.isBuffering_=!1;this.rate_=this.harness_.getRate();this.pollRate_=.25;this.timer_=new shaka.util.Timer(function(){b.harness_.movePlayhead(b.rate_*b.pollRate_)})};shaka.media.PlayRateController.prototype.release=function(){this.timer_&&(this.timer_.stop(),this.timer_=null);this.harness_=null};shaka.media.PlayRateController.prototype.setBuffering=function(a){this.isBuffering_=a;this.apply_()};
shaka.media.PlayRateController.prototype.set=function(a){goog.asserts.assert(0!=a,"Should never set rate of 0 explicitly!");this.rate_=a;this.apply_()};shaka.media.PlayRateController.prototype.getActiveRate=function(){return this.calculateCurrentRate_()};shaka.media.PlayRateController.prototype.apply_=function(){this.timer_.stop();var a=this.calculateCurrentRate_();if(0<=a)try{this.applyRate_(a);return}catch(b){}this.timer_.tickEvery(this.pollRate_);this.applyRate_(0)};
shaka.media.PlayRateController.prototype.calculateCurrentRate_=function(){return this.isBuffering_?0:this.rate_};shaka.media.PlayRateController.prototype.applyRate_=function(a){var b=this.harness_.getRate();b!=a&&this.harness_.setRate(a);return b!=a};shaka.media.VideoWrapper=function(a,b,c){this.video_=a;this.onSeek_=b;this.startTime_=c;this.started_=!1;this.eventManager_=new shaka.util.EventManager;this.mover_=new shaka.media.VideoWrapper.PlayheadMover(a,10);0<a.readyState?this.setStartTime_(c):this.delaySetStartTime_(c)};
shaka.media.VideoWrapper.prototype.release=function(){this.eventManager_&&(this.eventManager_.release(),this.eventManager_=null);null!=this.mover_&&(this.mover_.release(),this.mover_=null);this.onSeek_=function(){};this.video_=null};shaka.media.VideoWrapper.prototype.getTime=function(){return this.started_?this.video_.currentTime:this.startTime_};shaka.media.VideoWrapper.prototype.setTime=function(a){0<this.video_.readyState?this.mover_.moveTo(a):this.delaySetStartTime_(a)};
shaka.media.VideoWrapper.prototype.delaySetStartTime_=function(a){var b=this;this.startTime_=a;this.eventManager_.unlisten(this.video_,"loadedmetadata");this.eventManager_.listenOnce(this.video_,"loadedmetadata",function(){b.setStartTime_(a)})};
shaka.media.VideoWrapper.prototype.setStartTime_=function(a){var b=this;.001>Math.abs(this.video_.currentTime-a)?this.startListeningToSeeks_():(this.eventManager_.listenOnce(this.video_,"seeking",function(){b.startListeningToSeeks_()}),this.mover_.moveTo(0==this.video_.currentTime?a:this.video_.currentTime))};
shaka.media.VideoWrapper.prototype.startListeningToSeeks_=function(){var a=this;goog.asserts.assert(0<this.video_.readyState,"The media element should be ready before we listen for seeking.");this.started_=!0;this.eventManager_.listen(this.video_,"seeking",function(){return a.onSeek_()})};shaka.media.VideoWrapper.PlayheadMover=function(a,b){var c=this;this.mediaElement_=a;this.maxAttempts_=b;this.targetTime_=this.originTime_=this.remainingAttempts_=0;this.timer_=new shaka.util.Timer(function(){return c.onTick_()})};
shaka.media.VideoWrapper.PlayheadMover.prototype.release=function(){this.timer_&&(this.timer_.stop(),this.timer_=null);this.mediaElement_=null};shaka.media.VideoWrapper.PlayheadMover.prototype.moveTo=function(a){this.originTime_=this.mediaElement_.currentTime;this.targetTime_=a;this.remainingAttempts_=this.maxAttempts_;this.mediaElement_.currentTime=a;this.timer_.tickEvery(.1)};
shaka.media.VideoWrapper.PlayheadMover.prototype.onTick_=function(){0>=this.remainingAttempts_?(shaka.log.warning(["Failed to move playhead from",this.originTime_,"to",this.targetTime_].join(" ")),this.timer_.stop()):this.mediaElement_.currentTime!=this.originTime_?this.timer_.stop():(this.mediaElement_.currentTime=this.targetTime_,this.remainingAttempts_--)};shaka.media.Playhead=function(){};shaka.media.Playhead.prototype.setStartTime=function(a){};shaka.media.Playhead.prototype.getTime=function(){};shaka.media.Playhead.prototype.notifyOfBufferingChange=function(){};
shaka.media.SrcEqualsPlayhead=function(a){var b=this;this.mediaElement_=a;this.started_=!1;this.startTime_=null;this.eventManager_=new shaka.util.EventManager;a=function(){null==b.startTime_?b.started_=!0:(b.eventManager_.listenOnce(b.mediaElement_,"seeking",function(){b.started_=!0}),b.mediaElement_.currentTime=b.startTime_)};0==this.mediaElement_.readyState?this.eventManager_.listenOnce(this.mediaElement_,"loadedmetadata",a):a()};
shaka.media.SrcEqualsPlayhead.prototype.release=function(){this.eventManager_&&(this.eventManager_.release(),this.eventManager_=null);this.mediaElement_=null};shaka.media.SrcEqualsPlayhead.prototype.setStartTime=function(a){this.startTime_=this.started_?this.startTime_:a};shaka.media.SrcEqualsPlayhead.prototype.getTime=function(){return(this.started_?this.mediaElement_.currentTime:this.startTime_)||0};shaka.media.SrcEqualsPlayhead.prototype.notifyOfBufferingChange=function(){};
shaka.media.MediaSourcePlayhead=function(a,b,c,d,e,f){var g=this;this.minSeekRange_=3;this.mediaElement_=a;this.timeline_=b.presentationTimeline;this.minBufferTime_=b.minBufferTime||0;this.config_=c;this.onSeek_=e;this.lastCorrectiveSeek_=null;this.gapController_=new shaka.media.GapJumpingController(a,b.presentationTimeline,c,this.createStallDetector_(a,c),f);this.videoWrapper_=new shaka.media.VideoWrapper(a,function(){return g.onSeeking_()},this.getStartTime_(d));this.checkWindowTimer_=(new shaka.util.Timer(function(){g.onPollWindow_()})).tickEvery(.25)};
shaka.media.MediaSourcePlayhead.prototype.release=function(){this.videoWrapper_&&(this.videoWrapper_.release(),this.videoWrapper_=null);this.gapController_&&(this.gapController_.release(),this.gapController_=null);this.checkWindowTimer_&&(this.checkWindowTimer_.stop(),this.checkWindowTimer_=null);this.mediaElement_=this.videoWrapper_=this.timeline_=this.config_=null;this.onSeek_=function(){}};shaka.media.MediaSourcePlayhead.prototype.setStartTime=function(a){this.videoWrapper_.setTime(a)};
shaka.media.MediaSourcePlayhead.prototype.getTime=function(){var a=this.videoWrapper_.getTime();return 0<this.mediaElement_.readyState&&!this.mediaElement_.paused?this.clampTime_(a):a};shaka.media.MediaSourcePlayhead.prototype.getStartTime_=function(a){null==a?a=Infinity>this.timeline_.getDuration()?this.timeline_.getSeekRangeStart():this.timeline_.getSeekRangeEnd():0>a&&(a=this.timeline_.getSeekRangeEnd()+a);return this.clampSeekToDuration_(this.clampTime_(a))};
shaka.media.MediaSourcePlayhead.prototype.notifyOfBufferingChange=function(){this.gapController_.onSegmentAppended()};
shaka.media.MediaSourcePlayhead.prototype.onPollWindow_=function(){if(0!=this.mediaElement_.readyState&&!this.mediaElement_.paused){var a=this.mediaElement_.currentTime,b=this.timeline_.getSeekRangeStart(),c=this.timeline_.getSeekRangeEnd();c-b<this.minSeekRange_&&(b=c-this.minSeekRange_);a<b&&(b=this.reposition_(a),shaka.log.info("Jumping forward "+(b-a)+" seconds to catch up with the seek range."),this.mediaElement_.currentTime=b)}};
shaka.media.MediaSourcePlayhead.prototype.onSeeking_=function(){this.gapController_.onSeeking();var a=this.videoWrapper_.getTime(),b=this.reposition_(a);if(Math.abs(b-a)>shaka.media.GapJumpingController.BROWSER_GAP_TOLERANCE){var c=(new Date).getTime()/1E3;if(!this.lastCorrectiveSeek_||this.lastCorrectiveSeek_<c-1){this.lastCorrectiveSeek_=c;this.videoWrapper_.setTime(b);return}}shaka.log.v1("Seek to "+a);this.onSeek_()};
shaka.media.MediaSourcePlayhead.prototype.clampSeekToDuration_=function(a){var b=this.timeline_.getDuration();return a>=b?(goog.asserts.assert(0<=this.config_.durationBackoff,"Duration backoff must be non-negative!"),b-this.config_.durationBackoff):a};
shaka.media.MediaSourcePlayhead.prototype.reposition_=function(a){goog.asserts.assert(this.config_,"Cannot reposition playhead when it has beeen destroyed");var b=shaka.media.TimeRangesUtils.isBuffered.bind(null,this.mediaElement_.buffered),c=Math.max(this.minBufferTime_,this.config_.rebufferingGoal),d=this.config_.safeSeekOffset,e=this.timeline_.getSeekRangeStart(),f=this.timeline_.getSeekRangeEnd(),g=this.timeline_.getDuration();f-e<this.minSeekRange_&&(e=f-this.minSeekRange_);var h=this.timeline_.getSafeSeekRangeStart(c),
k=this.timeline_.getSafeSeekRangeStart(d);c=this.timeline_.getSafeSeekRangeStart(c+d);if(a>=g)return shaka.log.v1("Playhead past duration."),this.clampSeekToDuration_(a);if(a>f)return shaka.log.v1("Playhead past end."),f;if(a<e){if(b(k))return shaka.log.v1("Playhead before start & start is buffered"),k;shaka.log.v1("Playhead before start & start is unbuffered");return c}if(a>=h||b(a))return shaka.log.v1("Playhead in safe region or in buffered region."),a;shaka.log.v1("Playhead outside safe region & in unbuffered region.");
return c};shaka.media.MediaSourcePlayhead.prototype.clampTime_=function(a){var b=this.timeline_.getSeekRangeStart();if(a<b)return b;b=this.timeline_.getSeekRangeEnd();return a>b?b:a};
shaka.media.MediaSourcePlayhead.prototype.createStallDetector_=function(a,b){if(!b.stallEnabled)return null;var c=b.stallThreshold,d=b.stallSkip;c=new shaka.media.StallDetector(new shaka.media.StallDetector.MediaElementImplementation(a),c);c.onStall(function(b,c){shaka.log.debug(["Stall detected at",b,"for",c,"seconds. Seeking forward",d,"seconds."].join(" "));a.currentTime+=d});return c};shaka.media.RegionTimeline=function(){this.onAddRegion_=function(a){};this.regions_=new Set};shaka.media.RegionTimeline.prototype.release=function(){this.onAddRegion_=function(a){};this.regions_.clear()};shaka.media.RegionTimeline.prototype.setListeners=function(a){this.onAddRegion_=a};shaka.media.RegionTimeline.prototype.addRegion=function(a){null==this.findSimilarRegion_(a)&&(this.regions_.add(a),this.onAddRegion_(a))};
shaka.media.RegionTimeline.prototype.findSimilarRegion_=function(a){for(var b=$jscomp.makeIterator(this.regions_),c=b.next();!c.done;c=b.next())if(c=c.value,c.schemeIdUri==a.schemeIdUri&&c.startTime==a.startTime&&c.endTime==a.endTime)return c;return null};shaka.media.RegionTimeline.prototype.regions=function(){return this.regions_};shaka.media.RegionObserver=function(a){var b=this;this.timeline_=a;this.oldPosition_=new Map;this.onEnter_=function(a,b){};this.onExit_=function(a,b){};this.onSkip_=function(a,b){};var c=shaka.media.RegionObserver.RelativePosition_;a=c.BEFORE_THE_REGION;var d=c.IN_THE_REGION;c=c.AFTER_THE_REGION;this.rules_=[{weWere:null,weAre:d,invoke:function(a,c){return b.onEnter_(a,c)}},{weWere:a,weAre:d,invoke:function(a,c){return b.onEnter_(a,c)}},{weWere:c,weAre:d,invoke:function(a,c){return b.onEnter_(a,c)}},
{weWere:d,weAre:a,invoke:function(a,c){return b.onExit_(a,c)}},{weWere:d,weAre:c,invoke:function(a,c){return b.onExit_(a,c)}},{weWere:a,weAre:c,invoke:function(a,c){return b.onSkip_(a,c)}},{weWere:c,weAre:a,invoke:function(a,c){return b.onSkip_(a,c)}}]};shaka.media.RegionObserver.prototype.release=function(){this.timeline_=null;this.oldPosition_.clear();this.onEnter_=function(a,b){};this.onExit_=function(a,b){};this.onSkip_=function(a,b){}};
shaka.media.RegionObserver.prototype.poll=function(a,b){for(var c=shaka.media.RegionObserver,d=$jscomp.makeIterator(this.timeline_.regions()),e=d.next();!e.done;e=d.next()){e=e.value;var f=this.oldPosition_.get(e),g=c.determinePositionRelativeTo_(e,a);this.oldPosition_.set(e,g);for(var h=$jscomp.makeIterator(this.rules_),k=h.next();!k.done;k=h.next())k=k.value,k.weWere==f&&k.weAre==g&&k.invoke(e,b)}};
shaka.media.RegionObserver.prototype.setListeners=function(a,b,c){this.onEnter_=a;this.onExit_=b;this.onSkip_=c};shaka.media.RegionObserver.determinePositionRelativeTo_=function(a,b){var c=shaka.media.RegionObserver.RelativePosition_;return b<a.startTime?c.BEFORE_THE_REGION:b>a.endTime?c.AFTER_THE_REGION:c.IN_THE_REGION};shaka.media.RegionObserver.RelativePosition_={BEFORE_THE_REGION:1,IN_THE_REGION:2,AFTER_THE_REGION:3};shaka.media.StreamingEngine=function(a,b){this.playerInterface_=b;this.manifest_=a;this.config_=null;this.bufferingGoalScale_=1;this.setupPeriodPromise_=Promise.resolve();this.canSwitchPeriod_=[];this.canSwitchStream_=new Map;this.mediaStates_=new Map;this.startupComplete_=!1;this.failureCallbackBackoff_=null;this.unloadingTextStream_=this.destroyed_=this.fatalError_=!1;this.textStreamSequenceId_=0};shaka.media.StreamingEngine.APPEND_WINDOW_START_FUDGE_=.1;
shaka.media.StreamingEngine.APPEND_WINDOW_END_FUDGE_=.01;shaka.media.StreamingEngine.MAX_RUN_AHEAD_SEGMENTS_=1;shaka.media.StreamingEngine.prototype.destroy=function(){for(var a=$jscomp.makeIterator(this.mediaStates_.values()),b=a.next();!b.done;b=a.next())this.cancelUpdate_(b.value);this.mediaStates_.clear();this.canSwitchStream_.clear();this.config_=this.canSwitchPeriod_=this.setupPeriodPromise_=this.manifest_=this.playerInterface_=null;this.destroyed_=!0;return Promise.resolve()};
shaka.media.StreamingEngine.prototype.configure=function(a){this.config_=a;this.failureCallbackBackoff_=new shaka.net.Backoff({maxAttempts:Math.max(a.retryParameters.maxAttempts,2),baseDelay:a.retryParameters.baseDelay,backoffFactor:a.retryParameters.backoffFactor,fuzzFactor:a.retryParameters.fuzzFactor,timeout:0},!0)};
shaka.media.StreamingEngine.prototype.start=function(){var a=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function c(){var d,e,f;return $jscomp.generator.createGenerator(c,function(c){switch(c.nextAddress){case 1:return goog.asserts.assert(a.config_,"StreamingEngine configure() must be called before init()!"),d=a.playerInterface_.getPresentationTime(),e=a.findPeriodForTime_(d),f=a.playerInterface_.onChooseStreams(a.manifest_.periods[e]),f.variant||f.text?c.yield(a.initStreams_(f.variant?
f.variant.audio:null,f.variant?f.variant.video:null,f.text,d),2):(shaka.log.error("init: no Streams chosen"),c["return"](new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.STREAMING,shaka.util.Error.Code.INVALID_STREAMS_CHOSEN)));case 2:if(a.destroyed_)return c["return"]();shaka.log.debug("init: completed initial Stream setup");a.playerInterface_&&a.playerInterface_.onInitialStreamsSetup&&(shaka.log.v1("init: calling onInitialStreamsSetup()..."),a.playerInterface_.onInitialStreamsSetup());
c.jumpToEnd()}})})};shaka.media.StreamingEngine.prototype.getBufferingPeriod=function(){var a=shaka.util.ManifestParserUtils.ContentType,b=this.mediaStates_.get(a.VIDEO);return b?this.manifest_.periods[b.needPeriodIndex]:(a=this.mediaStates_.get(a.AUDIO))?this.manifest_.periods[a.needPeriodIndex]:null};shaka.media.StreamingEngine.prototype.getBufferingAudio=function(){return this.getStream_(shaka.util.ManifestParserUtils.ContentType.AUDIO)};
shaka.media.StreamingEngine.prototype.getBufferingVideo=function(){return this.getStream_(shaka.util.ManifestParserUtils.ContentType.VIDEO)};shaka.media.StreamingEngine.prototype.getBufferingText=function(){return this.getStream_(shaka.util.ManifestParserUtils.ContentType.TEXT)};shaka.media.StreamingEngine.prototype.getStream_=function(a){return(a=this.mediaStates_.get(a))?a.restoreStreamAfterTrickPlay||a.stream:null};
shaka.media.StreamingEngine.prototype.loadNewTextStream=function(a){var b=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function d(){var e,f,g,h,k,l,m,n,q,p;return $jscomp.generator.createGenerator(d,function(d){switch(d.nextAddress){case 1:return e=shaka.util.ManifestParserUtils.ContentType,d.yield(b.playerInterface_.mediaSourceEngine.clear(e.TEXT),2);case 2:return b.textStreamSequenceId_++,b.unloadingTextStream_=!1,f=b.textStreamSequenceId_,g=b.playerInterface_.mediaSourceEngine,h=new Map,
k=new Set,h.set(e.TEXT,a),k.add(a),d.yield(g.init(h,!1),3);case 3:return b.destroyed_?d["return"]():d.yield(b.setupStreams_(k),4);case 4:if(b.destroyed_)return d["return"]();m=(l=b.playerInterface_.mediaSourceEngine.getTextDisplayer().isTextVisible())||b.config_.alwaysStreamText;b.textStreamSequenceId_!=f||b.mediaStates_.has(e.TEXT)||b.unloadingTextStream_||!m||(n=b.playerInterface_.getPresentationTime(),q=b.findPeriodForTime_(n),p=b.createMediaState_(a,q,0),b.mediaStates_.set(e.TEXT,p),b.scheduleUpdate_(p,
0));d.jumpToEnd()}})})};shaka.media.StreamingEngine.prototype.unloadTextStream=function(){var a=shaka.util.ManifestParserUtils.ContentType;this.unloadingTextStream_=!0;var b=this.mediaStates_.get(a.TEXT);b&&(this.cancelUpdate_(b),this.mediaStates_["delete"](a.TEXT))};
shaka.media.StreamingEngine.prototype.setTrickPlay=function(a){var b=this.mediaStates_.get(shaka.util.ManifestParserUtils.ContentType.VIDEO);if(b){var c=b.stream;if(c)if(shaka.log.debug("setTrickPlay",a),a)(a=c.trickModeVideo)&&!b.restoreStreamAfterTrickPlay&&(shaka.log.debug("Engaging trick mode stream",a),this.switchInternal_(a,!1,0,!1),b.restoreStreamAfterTrickPlay=c);else if(c=b.restoreStreamAfterTrickPlay)shaka.log.debug("Restoring non-trick-mode stream",c),b.restoreStreamAfterTrickPlay=null,
this.switchInternal_(c,!0,0,!1)}};shaka.media.StreamingEngine.prototype.switchVariant=function(a,b,c){a.video&&this.switchInternal_(a.video,b,c,!1);a.audio&&this.switchInternal_(a.audio,b,c,!1)};shaka.media.StreamingEngine.prototype.switchTextStream=function(a){var b=shaka.util.ManifestParserUtils.ContentType;goog.asserts.assert(a&&a.type==b.TEXT,"Wrong stream type passed to switchTextStream!");this.switchInternal_(a,!0,0,!1)};
shaka.media.StreamingEngine.prototype.reloadTextStream=function(){var a=this.mediaStates_.get(shaka.util.ManifestParserUtils.ContentType.TEXT);a&&this.switchInternal_(a.stream,!0,0,!0)};
shaka.media.StreamingEngine.prototype.switchInternal_=function(a,b,c,d){var e=this,f=shaka.util.ManifestParserUtils.ContentType,g=this.mediaStates_.get(a.type);if(!g&&a.type==f.TEXT&&this.config_.ignoreTextStreamFailures)this.loadNewTextStream(a);else if(goog.asserts.assert(g,"switch: expected mediaState to exist"),g){var h=this.findPeriodContainingStream_(a),k=Array.from(this.mediaStates_.values()).every(function(a){return a.needPeriodIndex==g.needPeriodIndex});b&&h!=g.needPeriodIndex&&k?(shaka.log.debug("switch: switching to stream in another Period; clearing buffer and changing Periods"),
this.mediaStates_.forEach(function(a){e.forceClearBuffer_(a)})):(g.restoreStreamAfterTrickPlay&&(shaka.log.debug("switch during trick play mode",a),a.trickModeVideo?(g.restoreStreamAfterTrickPlay=a,a=a.trickModeVideo,shaka.log.debug("switch found trick play stream",a)):(g.restoreStreamAfterTrickPlay=null,shaka.log.debug("switch found no special trick play stream"))),k=this.canSwitchPeriod_[h],goog.asserts.assert(k&&k.resolved,"switch: expected Period "+h+" to be ready"),k&&k.resolved&&(k=this.canSwitchStream_.get(a.id),
goog.asserts.assert(k&&k.resolved,"switch: expected Stream "+a.id+" to be ready"),k&&k.resolved&&(g.stream!=a||d?(a.type==f.TEXT&&(d=shaka.util.MimeUtils.getFullType(a.mimeType,a.codecs),this.playerInterface_.mediaSourceEngine.reinitText(d)),g.stream=a,g.needInitSegment=!0,a=shaka.media.StreamingEngine.logPrefix_(g),shaka.log.debug("switch: switching to Stream "+a),a=this.getNewSegment_(g,h),this.shouldAbortCurrentRequest_(g,h)&&(shaka.log.info("Aborting current segment request to switch."),g.operation.abort(),
h=this.manifest_.periods[h],a&&this.playerInterface_.mediaSourceEngine.remove(g.type,a.startTime+h.startTime,a.endTime+h.startTime)),b&&(g.clearingBuffer?g.waitingToFlushBuffer=!0:g.performingUpdate?(g.waitingToClearBuffer=!0,g.clearBufferSafeMargin=c,g.waitingToFlushBuffer=!0):(this.cancelUpdate_(g),this.clearBuffer_(g,!0,c)["catch"](function(a){if(e.playerInterface_)e.playerInterface_.onError(a)})))):(b=shaka.media.StreamingEngine.logPrefix_(g),shaka.log.debug("switch: Stream "+b+" already active")))))}};
shaka.media.StreamingEngine.prototype.getNewSegment_=function(a,b){if(!a.operation)return null;var c=this.playerInterface_.getPresentationTime(),d=this.playerInterface_.mediaSourceEngine.bufferEnd(a.type);return this.getSegmentReferenceNeeded_(a,c,d,b)};
shaka.media.StreamingEngine.prototype.shouldAbortCurrentRequest_=function(a,b){var c=this.getNewSegment_(a,b);if(!c)return!1;var d=c?c.getSize():null,e=this.manifest_.periods[b],f=c.getStartTime()+e.startTime;e=this.playerInterface_.getPresentationTime();if(e>f)return!1;null==d&&(d=(c.getEndTime()-c.getStartTime())*a.stream.bandwidth/8);if(isNaN(d))return!1;(c=a.stream.initSegmentReference)&&(d+=c.getSize()||0);c=this.playerInterface_.getBandwidthEstimate();c=8*d/c;f=this.playerInterface_.mediaSourceEngine.bufferEnd(a.type);
return c<f-e-Math.max(this.manifest_.minBufferTime||0,this.config_.rebufferingGoal)||a.operation.getBytesRemaining()>d?!0:!1};
shaka.media.StreamingEngine.prototype.seeked=function(){var a=this,b=shaka.util.Iterables,c=this.playerInterface_.getPresentationTime(),d=this.config_.smallGapLimit,e=function(b){return a.playerInterface_.mediaSourceEngine.isBuffered(b,c,d)},f=!1,g=this.findPeriodForTime_(c);if(b.every(this.mediaStates_.values(),function(a){return a.needPeriodIndex==g})){b=$jscomp.makeIterator(this.mediaStates_.keys());for(var h=b.next();!h.done;h=b.next())h=h.value,e(h)||(this.forceClearBuffer_(this.mediaStates_.get(h)),
f=!0)}else b.every(this.mediaStates_.keys(),e)||(shaka.log.debug("(all): seeked: unbuffered seek: clearing all buffers"),this.mediaStates_.forEach(function(b){a.forceClearBuffer_(b)}),f=!0);f||shaka.log.debug("(all): seeked: buffered seek: presentationTime="+c)};
shaka.media.StreamingEngine.prototype.forceClearBuffer_=function(a){var b=this,c=shaka.media.StreamingEngine.logPrefix_(a);a.clearingBuffer?shaka.log.debug(c,"clear: already clearing the buffer"):a.waitingToClearBuffer?shaka.log.debug(c,"clear: already waiting"):a.performingUpdate?(shaka.log.debug(c,"clear: currently updating"),a.waitingToClearBuffer=!0,a.clearBufferSafeMargin=0):null==this.playerInterface_.mediaSourceEngine.bufferStart(a.type)?(shaka.log.debug(c,"clear: nothing buffered"),null==
a.updateTimer&&this.scheduleUpdate_(a,0)):(shaka.log.debug(c,"clear: handling right now"),this.cancelUpdate_(a),this.clearBuffer_(a,!1,0)["catch"](function(a){if(b.playerInterface_)b.playerInterface_.onError(a)}))};
shaka.media.StreamingEngine.prototype.initStreams_=function(a,b,c,d){var e=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function g(){var h,k,l,m,n,q,p;return $jscomp.generator.createGenerator(g,function(g){switch(g.nextAddress){case 1:return goog.asserts.assert(e.config_,"StreamingEngine configure() must be called before init()!"),h=e.playerInterface_.getPresentationTime(),k=e.findPeriodForTime_(h),l=shaka.util.ManifestParserUtils.ContentType,m=new Map,n=new Set,a&&(m.set(l.AUDIO,a),n.add(a)),
b&&(m.set(l.VIDEO,b),n.add(b)),c&&(m.set(l.TEXT,c),n.add(c)),q=e.playerInterface_.mediaSourceEngine,p=e.config_.forceTransmuxTS,g.yield(q.init(m,p),2);case 2:if(e.destroyed_)return g["return"]();e.setDuration_();return g.yield(e.setupStreams_(n),3);case 3:if(e.destroyed_)return g["return"]();m.forEach(function(a,b){if(!e.mediaStates_.has(b)){var c=e.createMediaState_(a,k,d);e.mediaStates_.set(b,c);e.scheduleUpdate_(c,0)}});g.jumpToEnd()}})})};
shaka.media.StreamingEngine.prototype.createMediaState_=function(a,b,c){return{stream:a,type:a.type,lastStream:null,lastSegmentReference:null,restoreStreamAfterTrickPlay:null,needInitSegment:!0,needPeriodIndex:b,endOfStream:!1,performingUpdate:!1,updateTimer:null,waitingToClearBuffer:!1,clearBufferSafeMargin:0,waitingToFlushBuffer:!1,clearingBuffer:!1,recovering:!1,hasError:!1,resumeAt:c||0,operation:null}};
shaka.media.StreamingEngine.prototype.setupPeriod_=function(a){var b=this.canSwitchPeriod_[a];if(b)return shaka.log.debug("(all) Period "+a+" is being or has been set up"),goog.asserts.assert(b.promise,"promise must not be null"),b.promise;shaka.log.debug("(all) setting up Period "+a);b={promise:new shaka.util.PublicPromise,resolved:!1};this.canSwitchPeriod_[a]=b;for(var c=new Set,d=$jscomp.makeIterator(this.manifest_.periods[a].variants),e=d.next();!e.done;e=d.next())e=e.value,e.video&&c.add(e.video),
e.video&&e.video.trickModeVideo&&c.add(e.video.trickModeVideo),e.audio&&c.add(e.audio);d=$jscomp.makeIterator(this.manifest_.periods[a].textStreams);for(e=d.next();!e.done;e=d.next())c.add(e.value);this.setupPeriodPromise_=this.setupPeriodPromise_.then(function(){if(!this.destroyed_)return this.setupStreams_(c)}.bind(this)).then(function(){this.destroyed_||(this.canSwitchPeriod_[a].promise.resolve(),this.canSwitchPeriod_[a].resolved=!0,shaka.log.v1("(all) setup Period "+a))}.bind(this))["catch"](function(b){this.destroyed_||
(this.canSwitchPeriod_[a].promise["catch"](function(){}),this.canSwitchPeriod_[a].promise.reject(),delete this.canSwitchPeriod_[a],shaka.log.warning("(all) failed to setup Period "+a),this.playerInterface_.onError(b))}.bind(this));return b.promise};
shaka.media.StreamingEngine.prototype.setupStreams_=function(a){var b=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function d(){var e,f,g,h,k,l,m;return $jscomp.generator.createGenerator(d,function(d){switch(d.nextAddress){case 1:e=[];for(var n=$jscomp.makeIterator(a),p=n.next();!p.done;p=n.next())f=p.value,(g=b.canSwitchStream_.get(f.id))?(shaka.log.debug("(all) Stream "+f.id+" is being or has been set up"),e.push(g.promise)):(shaka.log.v1("(all) setting up Stream "+f.id),b.canSwitchStream_.set(f.id,
{promise:new shaka.util.PublicPromise,resolved:!1}),e.push(f.createSegmentIndex()));d.setCatchFinallyBlocks(2);return d.yield(Promise.all(e),4);case 4:if(b.destroyed_)return d["return"]();d.leaveTryBlock(3);break;case 2:h=d.enterCatchBlock();if(b.destroyed_)return d["return"]();d=$jscomp.makeIterator(a);for(p=d.next();!p.done;p=d.next())k=p.value,b.canSwitchStream_.get(k.id).promise["catch"](function(){}),b.canSwitchStream_.get(k.id).promise.reject(),b.canSwitchStream_["delete"](k.id);throw h;case 3:n=
$jscomp.makeIterator(a);for(p=n.next();!p.done;p=n.next())l=p.value,m=b.canSwitchStream_.get(l.id),m.resolved||(m.promise.resolve(),m.resolved=!0,shaka.log.v1("(all) setup Stream "+l.id));d.jumpToEnd()}})})};shaka.media.StreamingEngine.prototype.setDuration_=function(){var a=this.manifest_.presentationTimeline.getDuration();Infinity>a?this.playerInterface_.mediaSourceEngine.setDuration(a):this.playerInterface_.mediaSourceEngine.setDuration(Math.pow(2,32))};
shaka.media.StreamingEngine.prototype.onUpdate_=function(a){if(!this.destroyed_){var b=shaka.media.StreamingEngine.logPrefix_(a);goog.asserts.assert(!a.performingUpdate&&null!=a.updateTimer,b+" unexpected call to onUpdate_()");if(!a.performingUpdate&&null!=a.updateTimer&&(goog.asserts.assert(!a.clearingBuffer,b+" onUpdate_() should not be called when clearing the buffer"),!a.clearingBuffer))if(a.updateTimer=null,a.waitingToClearBuffer)shaka.log.debug(b,"skipping update and clearing the buffer"),this.clearBuffer_(a,
a.waitingToFlushBuffer,a.clearBufferSafeMargin);else{try{var c=this.update_(a);null!=c&&(this.scheduleUpdate_(a,c),a.hasError=!1)}catch(d){this.handleStreamingError_(d);return}c=Array.from(this.mediaStates_.values());this.handlePeriodTransition_(a);this.startupComplete_&&c.every(function(a){return a.endOfStream})&&(shaka.log.v1(b,"calling endOfStream()..."),this.playerInterface_.mediaSourceEngine.endOfStream().then(function(){if(!this.destroyed_){var a=this.playerInterface_.mediaSourceEngine.getDuration();
0!=a&&a<this.manifest_.presentationTimeline.getDuration()&&this.manifest_.presentationTimeline.setDuration(a)}}.bind(this)))}}};
shaka.media.StreamingEngine.prototype.update_=function(a){var b=this;goog.asserts.assert(this.manifest_,"manifest_ should not be null");goog.asserts.assert(this.config_,"config_ should not be null");var c=shaka.util.ManifestParserUtils.ContentType;if(shaka.media.StreamingEngine.isEmbeddedText_(a))return this.playerInterface_.mediaSourceEngine.setSelectedClosedCaptionId(a.stream.originalId||""),null;var d=shaka.media.StreamingEngine.logPrefix_(a),e=this.playerInterface_.getPresentationTime(),f=this.getTimeNeeded_(a,
e);shaka.log.v2(d,"timeNeeded="+f);var g=this.findPeriodContainingStream_(a.stream),h=this.findPeriodForTime_(f),k=this.playerInterface_.mediaSourceEngine.bufferedAheadOf(a.type,e);shaka.log.v2(d,"update_:","presentationTime="+e,"bufferedAhead="+k);var l=Math.max(this.manifest_.minBufferTime||0,this.config_.rebufferingGoal,this.config_.bufferingGoal)*this.bufferingGoalScale_;if(f>=this.manifest_.presentationTimeline.getDuration())return shaka.log.debug(d,"buffered to end of presentation"),a.endOfStream=
!0,a.type==c.VIDEO&&(a=this.mediaStates_.get(c.TEXT))&&a.stream.mimeType==shaka.util.MimeUtils.CLOSED_CAPTION_MIMETYPE&&(a.endOfStream=!0),null;a.endOfStream=!1;a.needPeriodIndex=h;if(h!=g)return shaka.log.debug(d,"need Period "+h,"presentationTime="+e,"timeNeeded="+f,"currentPeriodIndex="+g),null;if(k>=l)return shaka.log.v2(d,"buffering goal met"),.5;c=this.playerInterface_.mediaSourceEngine.bufferEnd(a.type);c=this.getSegmentReferenceNeeded_(a,e,c,g);if(!c)return 1;var m=Infinity;Array.from(this.mediaStates_.values()).forEach(function(a){shaka.media.StreamingEngine.isEmbeddedText_(a)||
(a=b.getTimeNeeded_(a,e),m=Math.min(m,a))});d=this.manifest_.presentationTimeline.getMaxSegmentDuration()*shaka.media.StreamingEngine.MAX_RUN_AHEAD_SEGMENTS_;if(f>=m+d)return 1;a.resumeAt=0;this.fetchAndAppend_(a,e,g,c);return null};shaka.media.StreamingEngine.prototype.getTimeNeeded_=function(a,b){if(!a.lastStream||!a.lastSegmentReference)return Math.max(b,a.resumeAt);var c=this.findPeriodContainingStream_(a.lastStream);return this.manifest_.periods[c].startTime+a.lastSegmentReference.endTime};
shaka.media.StreamingEngine.prototype.getSegmentReferenceNeeded_=function(a,b,c,d){var e=shaka.media.StreamingEngine.logPrefix_(a);if(a.lastSegmentReference&&a.stream==a.lastStream)return c=a.lastSegmentReference.position+1,shaka.log.v2(e,"next position known:","position="+c),this.getSegmentReferenceIfAvailable_(a,d,c);a.lastSegmentReference?(goog.asserts.assert(a.lastStream,"lastStream should not be null"),shaka.log.v1(e,"next position unknown: another Stream buffered"),e=this.findPeriodContainingStream_(a.lastStream),
e=this.lookupSegmentPosition_(a,this.manifest_.periods[e].startTime+a.lastSegmentReference.endTime,d)):(goog.asserts.assert(!a.lastStream,"lastStream should be null"),shaka.log.v1(e,"next position unknown: nothing buffered"),e=this.lookupSegmentPosition_(a,c||b,d));if(null==e)return null;b=null;null==c&&(b=this.getSegmentReferenceIfAvailable_(a,d,Math.max(0,e-1)));return b||this.getSegmentReferenceIfAvailable_(a,d,e)};
shaka.media.StreamingEngine.prototype.lookupSegmentPosition_=function(a,b,c){var d=shaka.media.StreamingEngine.logPrefix_(a);c=this.manifest_.periods[c];shaka.log.debug(d,"looking up segment:","presentationTime="+b,"currentPeriod.startTime="+c.startTime);b=Math.max(0,b-c.startTime);a=a.stream.findSegmentPosition(b);null==a&&shaka.log.warning(d,"cannot find segment:","currentPeriod.startTime="+c.startTime,"lookupTime="+b);return a};
shaka.media.StreamingEngine.prototype.getSegmentReferenceIfAvailable_=function(a,b,c){var d=shaka.media.StreamingEngine.logPrefix_(a);b=this.manifest_.periods[b];a=a.stream.getSegmentReference(c);if(!a)return shaka.log.v1(d,"segment does not exist:","currentPeriod.startTime="+b.startTime,"position="+c),null;var e=this.manifest_.presentationTimeline;c=e.getSegmentAvailabilityStart();e=e.getSegmentAvailabilityEnd();return b.startTime+a.endTime<c||b.startTime+a.startTime>e?(shaka.log.v2(d,"segment is not available:",
"currentPeriod.startTime="+b.startTime,"reference.startTime="+a.startTime,"reference.endTime="+a.endTime,"availabilityStart="+c,"availabilityEnd="+e),null):a};
shaka.media.StreamingEngine.prototype.fetchAndAppend_=function(a,b,c,d){var e=this,f=shaka.util.ManifestParserUtils.ContentType,g=shaka.media.StreamingEngine,h=g.logPrefix_(a)+("#"+d.position),k=this.manifest_.periods[c];shaka.log.v1(h,"fetchAndAppend_:","presentationTime="+b,"currentPeriod.startTime="+k.startTime,"reference.position="+d.position,"reference.startTime="+d.startTime,"reference.endTime="+d.endTime);var l=a.stream,m=this.manifest_.presentationTimeline.getDuration(),n=this.manifest_.periods[c+
1],q=Math.max(0,k.startTime-g.APPEND_WINDOW_START_FUDGE_);g=n?n.startTime+g.APPEND_WINDOW_END_FUDGE_:m;goog.asserts.assert(d.startTime<=g,h+" segment should start before append window end");var p=this.initSourceBuffer_(a,c,q,g);a.performingUpdate=!0;a.needInitSegment=!1;shaka.log.v2(h,"fetching segment");var r=window.MP4Box.createFile(),u=0,t=function(a,b){a.fileStart=u;u=r.appendBuffer(a,b)},v=0;r.onReady=function(a){r.setSegmentOptions(a.tracks[0].id,null,{nbSamples:1});r.initializeSegmentation();
r.start()};r.onError=function(a){throw a;};r.onSegment=function(c,f,g){x=x.then(function(){if(e.destroyed_||e.fatalError_)return Promise.resolve();var c=l.emsgSchemeIdUris;if(null!=c&&0<c.length)for(var f=r.boxes||[];v<f.length;){var h=f[v];v++;"emsg"===h.type&&e.parseEMSG_(k,d,c,h)}return l.encrypted?Promise.resolve():e.append_(a,b,k,l,d,g)})};var x=p.then(function(){var b=a.stream.initSegmentReference.data;b&&t(b,!1)});this.fetch_(a,d,function(a,b,c,f){if(!e.destroyed_&&!e.fatalError_&&f){shaka.log.v2(h,
"#"+d.position+" appending "+f.byteLength+" bytes to mp4box, last="+(0===c));var g=f.buffer;p.then(function(){t(g,0===c)})}}).then(function(a){if(!e.destroyed_&&!e.fatalError_)return x.then(function(){return a})}).then(function(c){if(l.encrypted)return e.append_(a,b,k,l,d,c)}).then(function(){if(!this.destroyed_&&!this.fatalError_){a.performingUpdate=!1;a.recovering=!1;a.lastStream=l;a.lastSegmentReference=d;if(!a.waitingToClearBuffer)this.playerInterface_.onSegmentAppended();this.scheduleUpdate_(a,
0);this.handleStartup_(a,l);shaka.log.v1(h,"finished fetch and append")}}.bind(this))["catch"](function(b){this.destroyed_||this.fatalError_||(goog.asserts.assert(b instanceof shaka.util.Error,"Should only receive a Shaka error"),a.performingUpdate=!1,a.type==f.TEXT&&this.config_.ignoreTextStreamFailures?(b.code==shaka.util.Error.Code.BAD_HTTP_STATUS?shaka.log.warning(h,"Text stream failed to download. Proceeding without it."):shaka.log.warning(h,"Text stream failed to parse. Proceeding without it."),
this.mediaStates_["delete"](f.TEXT)):b.code==shaka.util.Error.Code.OPERATION_ABORTED?(a.performingUpdate=!1,a.updateTimer=null,this.scheduleUpdate_(a,0)):b.code==shaka.util.Error.Code.QUOTA_EXCEEDED_ERROR?this.handleQuotaExceeded_(a,b):(shaka.log.error(h,"failed fetch and append: code="+b.code),a.hasError=!0,b.severity=shaka.util.Error.Severity.CRITICAL,this.handleStreamingError_(b)))}.bind(this)).then(function(){r.stop()})};
shaka.media.StreamingEngine.prototype.retry=function(){if(this.destroyed_)return shaka.log.error("Unable to retry after StreamingEngine is destroyed!"),!1;if(this.fatalError_)return shaka.log.error("Unable to retry after StreamingEngine encountered a fatal error!"),!1;for(var a=$jscomp.makeIterator(this.mediaStates_.values()),b=a.next();!b.done;b=a.next()){b=b.value;var c=shaka.media.StreamingEngine.logPrefix_(b);b.hasError&&(shaka.log.info(c,"Retrying after failure..."),b.hasError=!1,this.scheduleUpdate_(b,
.1))}return!0};
shaka.media.StreamingEngine.prototype.handleQuotaExceeded_=function(a,b){var c=shaka.media.StreamingEngine.logPrefix_(a);if(Array.from(this.mediaStates_.values()).some(function(b){return b!=a&&b.recovering}))shaka.log.debug(c,"MediaSource threw QuotaExceededError:","waiting for another stream to recover...");else{var d=Math.round(100*this.bufferingGoalScale_);if(20<d)this.bufferingGoalScale_-=.2;else if(4<d)this.bufferingGoalScale_-=.04;else{shaka.log.error(c,"MediaSource threw QuotaExceededError too many times");this.fatalError_=
a.hasError=!0;this.playerInterface_.onError(b);return}shaka.log.warning(c,"MediaSource threw QuotaExceededError:","reducing buffering goals by "+(100-Math.round(100*this.bufferingGoalScale_))+"%");a.recovering=!0}this.scheduleUpdate_(a,4)};
shaka.media.StreamingEngine.prototype.initSourceBuffer_=function(a,b,c,d){if(!a.needInitSegment)return Promise.resolve();var e=shaka.media.StreamingEngine.logPrefix_(a);b=this.manifest_.periods[b].startTime-a.stream.presentationTimeOffset;shaka.log.v1(e,"setting timestamp offset to "+b);shaka.log.v1(e,"setting append window start to "+c);shaka.log.v1(e,"setting append window end to "+d);c=this.playerInterface_.mediaSourceEngine.setStreamProperties(a.type,b,c,d);if(!a.stream.initSegmentReference)return c;
shaka.log.v1(e,"fetching init segment");d=this.fetch_(a,a.stream.initSegmentReference).then(function(b){if(!this.destroyed_)return a.stream.initSegmentReference.data=b,shaka.log.v1(e,"appending init segment"),this.playerInterface_.mediaSourceEngine.appendBuffer(a.type,b,null,null,a.stream.closedCaptions&&0<a.stream.closedCaptions.size)}.bind(this))["catch"](function(b){a.needInitSegment=!0;return Promise.reject(b)});return Promise.all([c,d])};
shaka.media.StreamingEngine.prototype.append_=function(a,b,c,d,e,f){var g=shaka.media.StreamingEngine.logPrefix_(a),h=d.closedCaptions&&0<d.closedCaptions.size;return this.evict_(a,b).then(function(){if(!this.destroyed_)return shaka.log.v1(g,"appending media segment"),this.playerInterface_.mediaSourceEngine.appendBuffer(a.type,f,e.startTime+c.startTime,e.endTime+c.startTime,h)}.bind(this)).then(function(){if(!this.destroyed_)return shaka.log.v2(g,"appended media segment"),Promise.resolve()}.bind(this))};
shaka.media.StreamingEngine.prototype.parseEMSG_=function(a,b,c,d){var e=d.scheme_id_uri,f=d.value,g=d.timescale,h=d.presentation_time_delta,k=d.event_duration,l=d.id;d=d.message_data;a=a.startTime+b.startTime+h/g;if(c.includes(e))if("urn:mpeg:dash:event:2012"==e)this.playerInterface_.onManifestUpdate();else c=new shaka.util.FakeEvent("emsg",{detail:{startTime:a,endTime:a+k/g,schemeIdUri:e,value:f,timescale:g,presentationTimeDelta:h,eventDuration:k,id:l,messageData:d}}),this.playerInterface_.onEvent(c)};
shaka.media.StreamingEngine.prototype.evict_=function(a,b){var c=shaka.media.StreamingEngine.logPrefix_(a);shaka.log.v2(c,"checking buffer length");var d=Math.max(this.config_.bufferBehind,this.manifest_.presentationTimeline.getMaxSegmentDuration()),e=this.playerInterface_.mediaSourceEngine.bufferStart(a.type);if(null==e)return shaka.log.v2(c,"buffer behind okay because nothing buffered:","presentationTime="+b,"bufferBehind="+d),Promise.resolve();var f=b-e,g=f-d;if(0>=g)return shaka.log.v2(c,"buffer behind okay:",
"presentationTime="+b,"bufferedBehind="+f,"bufferBehind="+d,"underflow="+-g),Promise.resolve();shaka.log.v1(c,"buffer behind too large:","presentationTime="+b,"bufferedBehind="+f,"bufferBehind="+d,"overflow="+g);return this.playerInterface_.mediaSourceEngine.remove(a.type,e,e+g).then(function(){this.destroyed_||shaka.log.v1(c,"evicted "+g+" seconds")}.bind(this))};
shaka.media.StreamingEngine.prototype.handleStartup_=function(a,b){var c=shaka.util.Functional,d=shaka.util.ManifestParserUtils.ContentType;if(!this.startupComplete_){var e=shaka.media.StreamingEngine.logPrefix_(a),f=Array.from(this.mediaStates_.values());if(1!=f.length||f[0].type!=d.TEXT)this.startupComplete_=f.every(function(a){return a.type==d.TEXT?!0:!a.waitingToClearBuffer&&!a.clearingBuffer&&a.lastSegmentReference});if(this.startupComplete_){shaka.log.debug(e,"startup complete");var g=this.findPeriodContainingStream_(b);
goog.asserts.assert(f.every(function(a){return a.needPeriodIndex==g||a.needPeriodIndex==g+1}),e+" expected all MediaStates to need same Period");this.canSwitchPeriod_[g]||this.setupPeriod_(g).then(function(){this.destroyed_||(shaka.log.v1(e,"calling onCanSwitch()..."),this.playerInterface_.onCanSwitch())}.bind(this))["catch"](c.noop);for(f=0;f<this.manifest_.periods.length;++f)this.setupPeriod_(f)["catch"](c.noop);this.playerInterface_.onStartupComplete&&(shaka.log.v1(e,"calling onStartupComplete()..."),
this.playerInterface_.onStartupComplete())}}};
shaka.media.StreamingEngine.prototype.handlePeriodTransition_=function(a){var b=shaka.util.Functional,c=shaka.media.StreamingEngine.logPrefix_(a),d=shaka.util.ManifestParserUtils.ContentType,e=this.findPeriodContainingStream_(a.stream);if(a.needPeriodIndex!=e){var f=a.needPeriodIndex,g=Array.from(this.mediaStates_.values());goog.asserts.assert(g.every(function(a){return a.needPeriodIndex==f||a.hasError||!shaka.media.StreamingEngine.isIdle_(a)||shaka.media.StreamingEngine.isEmbeddedText_(a)}),"All MediaStates should need the same Period or be performing updates.");
g.every(function(a){return a.needPeriodIndex==f||shaka.media.StreamingEngine.isEmbeddedText_(a)})?g.every(shaka.media.StreamingEngine.isIdle_)?(shaka.log.debug(c,"all need Period "+f),this.setupPeriod_(f).then(function(){if(!this.destroyed_)if(g.every(function(a){var b=shaka.media.StreamingEngine.isIdle_(a),c=this.findPeriodContainingStream_(a.stream);return shaka.media.StreamingEngine.isEmbeddedText_(a)?!0:b&&a.needPeriodIndex==f&&c!=f}.bind(this))){var a=this.manifest_.periods[f];shaka.log.v1(c,
"calling onChooseStreams()...");var b=this.playerInterface_.onChooseStreams(a),e=new Map;b.variant&&b.variant.video&&e.set(d.VIDEO,b.variant.video);b.variant&&b.variant.audio&&e.set(d.AUDIO,b.variant.audio);b.text&&e.set(d.TEXT,b.text);var m=$jscomp.makeIterator(this.mediaStates_.keys());for(b=m.next();!b.done;b=m.next())if(b=b.value,!e.has(b)&&b!=d.TEXT){shaka.log.error(c,"invalid Streams chosen: missing "+b+" Stream");this.playerInterface_.onError(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,
shaka.util.Error.Category.STREAMING,shaka.util.Error.Code.INVALID_STREAMS_CHOSEN));return}m=$jscomp.makeIterator(Array.from(e.keys()));for(b=m.next();!b.done;b=m.next())if(b=b.value,!this.mediaStates_.has(b))if(b==d.TEXT)this.initStreams_(null,null,e.get(d.TEXT),a.startTime),e["delete"](b);else{shaka.log.error(c,"invalid Streams chosen: unusable "+b+" Stream");this.playerInterface_.onError(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.STREAMING,shaka.util.Error.Code.INVALID_STREAMS_CHOSEN));
return}a=$jscomp.makeIterator(Array.from(this.mediaStates_.keys()));for(b=a.next();!b.done;b=a.next())b=b.value,(m=e.get(b))?(this.switchInternal_(m,!1,0,!1),this.scheduleUpdate_(this.mediaStates_.get(b),0)):(goog.asserts.assert(b==d.TEXT,"Invalid streams chosen"),this.mediaStates_["delete"](b));shaka.log.v1(c,"calling onCanSwitch()...");this.playerInterface_.onCanSwitch()}else shaka.log.debug(c,"ignoring transition to Period",f,"since another is happening")}.bind(this))["catch"](b.noop)):shaka.log.debug(c,
"all MediaStates need Period "+f+", but not all MediaStates are idle"):shaka.log.debug(c,"not all MediaStates need Period "+f)}};shaka.media.StreamingEngine.isEmbeddedText_=function(a){var b=shaka.util.MimeUtils;return a.type==shaka.util.ManifestParserUtils.ContentType.TEXT&&a.stream.mimeType==b.CLOSED_CAPTION_MIMETYPE};shaka.media.StreamingEngine.isIdle_=function(a){return!a.performingUpdate&&null==a.updateTimer&&!a.waitingToClearBuffer&&!a.clearingBuffer};
shaka.media.StreamingEngine.prototype.findPeriodForTime_=function(a){return(a=shaka.util.Periods.findPeriodForTime(this.manifest_.periods,a+shaka.util.ManifestParserUtils.GAP_OVERLAP_TOLERANCE_SECONDS))?this.manifest_.periods.indexOf(a):0};
shaka.media.StreamingEngine.prototype.findPeriodContainingStream_=function(a){goog.asserts.assert(this.manifest_,"Must have a manifest to find a stream.");for(var b=this.manifest_.periods,c=0;c<b.length;c++){for(var d=b[c],e=new Set,f=$jscomp.makeIterator(d.variants),g=f.next();!g.done;g=f.next())g=g.value,g.audio&&e.add(g.audio),g.video&&e.add(g.video),g.video&&g.video.trickModeVideo&&e.add(g.video.trickModeVideo);d=$jscomp.makeIterator(d.textStreams);for(f=d.next();!f.done;f=d.next())e.add(f.value);
if(e.has(a))return c}return-1};shaka.media.StreamingEngine.prototype.fetch_=function(a,b,c){var d=shaka.net.NetworkingEngine.RequestType.SEGMENT,e=shaka.util.Networking.createSegmentRequest(b.getUris(),b.startByte,b.endByte,this.config_.retryParameters);shaka.log.v2("fetching: reference=",b);b=this.playerInterface_.netEngine.request(d,e,c);a.operation=b;return b.promise.then(function(b){a.operation=null;return b.data})};
shaka.media.StreamingEngine.prototype.clearBuffer_=function(a,b,c){var d=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function f(){var g,h,k,l;return $jscomp.generator.createGenerator(f,function(f){switch(f.nextAddress){case 1:return g=shaka.media.StreamingEngine.logPrefix_(a),goog.asserts.assert(!a.performingUpdate&&null==a.updateTimer,g+" unexpected call to clearBuffer_()"),a.waitingToClearBuffer=!1,a.waitingToFlushBuffer=!1,a.clearBufferSafeMargin=0,a.clearingBuffer=!0,shaka.log.debug(g,
"clearing buffer"),c?(k=d.playerInterface_.getPresentationTime(),l=d.playerInterface_.mediaSourceEngine.getDuration(),h=d.playerInterface_.mediaSourceEngine.remove(a.type,k+c,l)):h=d.playerInterface_.mediaSourceEngine.clear(a.type).then(function(){if(!this.destroyed_&&b)return this.playerInterface_.mediaSourceEngine.flush(a.type)}.bind(d)),f.yield(h,2);case 2:if(d.destroyed_)return f["return"]();shaka.log.debug(g,"cleared buffer");a.lastStream=null;a.lastSegmentReference=null;a.clearingBuffer=!1;
a.endOfStream=!1;d.scheduleUpdate_(a,0);f.jumpToEnd()}})})};
shaka.media.StreamingEngine.prototype.scheduleUpdate_=function(a,b){var c=this,d=shaka.media.StreamingEngine.logPrefix_(a);shaka.log.v2(d,"updating in "+b+" seconds");goog.asserts.assert(null==a.updateTimer,d+" did not expect update to be scheduled");a.updateTimer=(new shaka.util.DelayedTick(function(){return $jscomp.asyncExecutePromiseGeneratorFunction(function f(){var b;return $jscomp.generator.createGenerator(f,function(d){switch(d.nextAddress){case 1:return d.setCatchFinallyBlocks(2),d.yield(c.onUpdate_(a),
4);case 4:d.leaveTryBlock(0);break;case 2:b=d.enterCatchBlock();if(c.playerInterface_)c.playerInterface_.onError(b);d.jumpToEnd()}})})})).tickAfter(b)};shaka.media.StreamingEngine.prototype.cancelUpdate_=function(a){null!=a.updateTimer&&(a.updateTimer.stop(),a.updateTimer=null)};shaka.media.StreamingEngine.prototype.handleStreamingError_=function(a){this.failureCallbackBackoff_.attempt().then(function(){this.destroyed_||(this.playerInterface_.onError(a),a.handled||this.config_.failureCallback(a))}.bind(this))};
shaka.media.StreamingEngine.logPrefix_=function(a){return"("+a.type+":"+a.stream.id+")"};shaka.net.HttpPluginUtils={};
shaka.net.HttpPluginUtils.makeResponse=function(a,b,c,d,e,f){if(200<=c&&299>=c&&202!=c)return{uri:e||d,originalUri:d,data:b,headers:a,fromCache:!!a["x-shaka-from-cache"]};e=null;try{e=shaka.util.StringUtils.fromBytesAutoDetect(b)}catch(g){}shaka.log.debug("HTTP error text:",e);throw new shaka.util.Error(401==c||403==c?shaka.util.Error.Severity.CRITICAL:shaka.util.Error.Severity.RECOVERABLE,shaka.util.Error.Category.NETWORK,shaka.util.Error.Code.BAD_HTTP_STATUS,d,c,e,a,f);};shaka.net.HttpFetchPlugin=function(a,b,c,d){var e=new shaka.net.HttpFetchPlugin.Headers_;shaka.util.MapUtils.asMap(b.headers).forEach(function(a,b){e.append(b,a)});var f=new shaka.net.HttpFetchPlugin.AbortController_,g={canceled:!1,timedOut:!1};a=shaka.net.HttpFetchPlugin.request_(a,c,{body:b.body||void 0,headers:e,method:b.method,signal:f.signal,credentials:b.allowCrossSiteCredentials?"include":void 0},g,d);a=new shaka.util.AbortableOperation(a,function(){g.canceled=!0;f.abort();return Promise.resolve()});
if(b=b.retryParameters.timeout){var h=new shaka.util.Timer(function(){g.timedOut=!0;f.abort()});h.tickAfter(b/1E3);a["finally"](function(){h.stop()})}return a};goog.exportSymbol("shaka.net.HttpFetchPlugin",shaka.net.HttpFetchPlugin);
shaka.net.HttpFetchPlugin.request_=function(a,b,c,d,e){return $jscomp.asyncExecutePromiseGeneratorFunction(function g(){var h,k,l,m,n,q,p,r,u,t,v,x,w,y;return $jscomp.generator.createGenerator(g,function(g){switch(g.nextAddress){case 1:return h=shaka.net.HttpFetchPlugin.fetch_,k=shaka.net.HttpFetchPlugin.ReadableStream_,q=n=0,p=Date.now(),g.setCatchFinallyBlocks(2),g.yield(h(a,c),4);case 4:return l=g.yieldResult,r=l.clone().body.getReader(),t=(u=l.headers.get("Content-Length"))?parseInt(u,10):0,v=
function(a){var b=function(){return $jscomp.asyncExecutePromiseGeneratorFunction(function B(){var c,d,g,h,k,l;return $jscomp.generator.createGenerator(B,function(m){switch(m.nextAddress){case 1:return m.setCatchFinallyBlocks(2),m.yield(r.read(),4);case 4:c=m.yieldResult;m.leaveTryBlock(3);break;case 2:return d=m.enterCatchBlock(),shaka.log.v1("error reading from stream",d.message),m["return"]();case 3:c.done||(n+=c.value.byteLength),g=Date.now(),h=n-q,k=g-p,l=t-n,e(k,h,l,c.value),q=n,p=g,c.done?(goog.asserts.assert(!c.value,
'readObj should be unset when "done" is true.'),a.close()):(a.enqueue(c.value),b()),m.jumpToEnd()}})})};b()},new k({start:v}),g.yield(l.arrayBuffer(),5);case 5:m=g.yieldResult;g.leaveTryBlock(3);break;case 2:x=g.enterCatchBlock();if(d.canceled)throw new shaka.util.Error(shaka.util.Error.Severity.RECOVERABLE,shaka.util.Error.Category.NETWORK,shaka.util.Error.Code.OPERATION_ABORTED,a,b);if(d.timedOut)throw new shaka.util.Error(shaka.util.Error.Severity.RECOVERABLE,shaka.util.Error.Category.NETWORK,
shaka.util.Error.Code.TIMEOUT,a,b);throw new shaka.util.Error(shaka.util.Error.Severity.RECOVERABLE,shaka.util.Error.Category.NETWORK,shaka.util.Error.Code.HTTP_ERROR,a,x,b);case 3:return w={},y=l.headers,y.forEach(function(a,b){w[b.trim()]=a}),g["return"](shaka.net.HttpPluginUtils.makeResponse(w,m,l.status,a,l.url,b))}})})};shaka.net.HttpFetchPlugin.isSupported=function(){if(window.ReadableStream)try{new ReadableStream({})}catch(a){return!1}else return!1;return!(!window.fetch||!window.AbortController)};
goog.exportProperty(shaka.net.HttpFetchPlugin,"isSupported",shaka.net.HttpFetchPlugin.isSupported);shaka.net.HttpFetchPlugin.fetch_=window.fetch;shaka.net.HttpFetchPlugin.AbortController_=window.AbortController;shaka.net.HttpFetchPlugin.ReadableStream_=window.ReadableStream;shaka.net.HttpFetchPlugin.Headers_=window.Headers;
shaka.net.HttpFetchPlugin.isSupported()&&(shaka.net.NetworkingEngine.registerScheme("http",shaka.net.HttpFetchPlugin,shaka.net.NetworkingEngine.PluginPriority.PREFERRED),shaka.net.NetworkingEngine.registerScheme("https",shaka.net.HttpFetchPlugin,shaka.net.NetworkingEngine.PluginPriority.PREFERRED));shaka.net.HttpXHRPlugin=function(a,b,c,d){var e=new shaka.net.HttpXHRPlugin.Xhr_,f=Date.now(),g=0,h=new Promise(function(h,l){e.open(b.method,a,!0);e.responseType="arraybuffer";e.timeout=b.retryParameters.timeout;e.withCredentials=b.allowCrossSiteCredentials;e.onabort=function(){l(new shaka.util.Error(shaka.util.Error.Severity.RECOVERABLE,shaka.util.Error.Category.NETWORK,shaka.util.Error.Code.OPERATION_ABORTED,a,c))};e.onload=function(b){b=b.target;goog.asserts.assert(b,"XHR onload has no target!");
var d=b.getAllResponseHeaders().trim().split("\r\n"),e={};d=$jscomp.makeIterator(d);for(var f=d.next();!f.done;f=d.next())f=f.value.split(": "),e[f[0].toLowerCase()]=f.slice(1).join(": ");try{var g=shaka.net.HttpPluginUtils.makeResponse(e,b.response,b.status,a,b.responseURL,c);h(g)}catch(v){goog.asserts.assert(v instanceof shaka.util.Error,"Wrong error type!"),l(v)}};e.onerror=function(b){l(new shaka.util.Error(shaka.util.Error.Severity.RECOVERABLE,shaka.util.Error.Category.NETWORK,shaka.util.Error.Code.HTTP_ERROR,
a,b,c))};e.ontimeout=function(b){l(new shaka.util.Error(shaka.util.Error.Severity.RECOVERABLE,shaka.util.Error.Category.NETWORK,shaka.util.Error.Code.TIMEOUT,a,c))};e.onprogress=function(a){var b=Date.now();if(100<b-f||a.lengthComputable&&a.loaded==a.total)d(b-f,a.loaded-g,a.total-a.loaded),g=a.loaded,f=b};for(var k in b.headers){var n=k.toLowerCase();e.setRequestHeader(n,b.headers[k])}e.send(b.body)});return new shaka.util.AbortableOperation(h,function(){e.abort();return Promise.resolve()})};
goog.exportSymbol("shaka.net.HttpXHRPlugin",shaka.net.HttpXHRPlugin);shaka.net.HttpXHRPlugin.Xhr_=window.XMLHttpRequest;shaka.net.NetworkingEngine.registerScheme("http",shaka.net.HttpXHRPlugin,shaka.net.NetworkingEngine.PluginPriority.FALLBACK);shaka.net.NetworkingEngine.registerScheme("https",shaka.net.HttpXHRPlugin,shaka.net.NetworkingEngine.PluginPriority.FALLBACK);shaka.routing={};shaka.routing.Walker=function(a,b,c){var d=this;this.implementation_=c;this.currentlyAt_=a;this.currentlyWith_=b;this.waitForWork_=null;this.requests_=[];this.currentStep_=this.currentRoute_=null;this.isAlive_=!0;this.mainLoopPromise_=Promise.resolve().then(function(){return d.mainLoop_()})};
shaka.routing.Walker.prototype.destroy=function(){var a=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function c(){var d;return $jscomp.generator.createGenerator(c,function(c){switch(c.nextAddress){case 1:return a.isAlive_=!1,a.currentStep_&&a.currentStep_.abort(),a.unblockMainLoop_(),c.yield(a.mainLoopPromise_,2);case 2:if(a.currentRoute_)a.currentRoute_.listeners.onCancel();for(var e=$jscomp.makeIterator(a.requests_),g=e.next();!g.done;g=e.next())d=g.value,d.listeners.onCancel();a.currentRoute_=
null;a.requests_=[];a.implementation_=null;c.jumpToEnd()}})})};shaka.routing.Walker.prototype.startNewRoute=function(a){var b={onStart:function(){},onEnd:function(){},onCancel:function(){},onError:function(a){},onSkip:function(){},onEnter:function(){}};this.requests_.push({create:a,listeners:b});this.currentStep_&&this.currentStep_.abort();this.unblockMainLoop_();return b};
shaka.routing.Walker.prototype.mainLoop_=function(){var a=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function c(){return $jscomp.generator.createGenerator(c,function(c){switch(c.nextAddress){case 1:if(a.isAlive_)return c.yield(a.doOneThing_(),1);c.jumpTo(0)}})})};
shaka.routing.Walker.prototype.doOneThing_=function(){if(this.tryNewRoute_())return Promise.resolve();if(this.currentRoute_)return this.takeNextStep_();goog.asserts.assert(null==this.waitForWork_,"We should not have a promise yet.");this.implementation_.onIdle(this.currentlyAt_);return this.waitForWork_=new shaka.util.PublicPromise};
shaka.routing.Walker.prototype.tryNewRoute_=function(){goog.asserts.assert(null==this.currentStep_,"We should never have a current step between taking steps.");if(0==this.requests_.length||this.currentRoute_&&!this.currentRoute_.interruptible)return!1;this.currentRoute_&&(this.currentRoute_.listeners.onCancel(),this.currentRoute_=null);var a=this.requests_.shift(),b=a.create(this.currentlyWith_);if(b)a.listeners.onStart(),this.currentRoute_={node:b.node,payload:b.payload,interruptible:b.interruptible,
listeners:a.listeners};else a.listeners.onSkip();return!0};
shaka.routing.Walker.prototype.takeNextStep_=function(){var a=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function c(){var d,e;return $jscomp.generator.createGenerator(c,function(c){switch(c.nextAddress){case 1:return goog.asserts.assert(a.currentRoute_,"We need a current route to take the next step."),a.currentlyAt_=a.implementation_.getNext(a.currentlyAt_,a.currentlyWith_,a.currentRoute_.node,a.currentRoute_.payload),a.currentRoute_.listeners.onEnter(a.currentlyAt_),c.setCatchFinallyBlocks(2),
a.currentStep_=a.implementation_.enterNode(a.currentlyAt_,a.currentlyWith_,a.currentRoute_.payload),c.yield(a.currentStep_.promise,4);case 4:a.currentStep_=null;a.currentlyAt_==a.currentRoute_.node&&(a.currentRoute_.listeners.onEnd(),a.currentRoute_=null);c.leaveTryBlock(0);break;case 2:d=c.enterCatchBlock();if(d.code==shaka.util.Error.Code.OPERATION_ABORTED)goog.asserts.assert(a.currentRoute_.interruptible,"Do not put abortable steps in non-interruptible routes!"),a.currentRoute_.listeners.onCancel();
else a.currentRoute_.listeners.onError(d);a.currentRoute_=null;a.currentStep_=null;e=a;return c.yield(a.implementation_.handleError(a.currentlyWith_,d),5);case 5:e.currentlyAt_=c.yieldResult,c.jumpToEnd()}})})};shaka.routing.Walker.prototype.unblockMainLoop_=function(){this.waitForWork_&&(this.waitForWork_.resolve(),this.waitForWork_=null)};shaka.text.SimpleTextDisplayer=function(a){this.textTrack_=null;for(var b=0;b<a.textTracks.length;++b){var c=a.textTracks[b];c.mode="disabled";c.label==shaka.text.SimpleTextDisplayer.TextTrackLabel_&&(this.textTrack_=c)}this.textTrack_||(this.textTrack_=a.addTextTrack("subtitles",shaka.text.SimpleTextDisplayer.TextTrackLabel_));this.textTrack_.mode="hidden"};goog.exportSymbol("shaka.text.SimpleTextDisplayer",shaka.text.SimpleTextDisplayer);
shaka.text.SimpleTextDisplayer.prototype.remove=function(a,b){if(!this.textTrack_)return!1;shaka.text.SimpleTextDisplayer.removeWhere_(this.textTrack_,function(c){return c.startTime<b&&c.endTime>a});return!0};goog.exportProperty(shaka.text.SimpleTextDisplayer.prototype,"remove",shaka.text.SimpleTextDisplayer.prototype.remove);
shaka.text.SimpleTextDisplayer.prototype.append=function(a){for(var b=shaka.text.SimpleTextDisplayer.convertToTextTrackCue_,c=[],d=0;d<a.length;d++){var e=b(a[d]);e&&c.push(e)}c.slice().sort(function(a,b){return a.startTime!=b.startTime?a.startTime-b.startTime:a.endTime!=b.endTime?a.endTime-b.startTime:c.indexOf(b)-c.indexOf(a)}).forEach(function(a){this.textTrack_.addCue(a)}.bind(this))};goog.exportProperty(shaka.text.SimpleTextDisplayer.prototype,"append",shaka.text.SimpleTextDisplayer.prototype.append);
shaka.text.SimpleTextDisplayer.prototype.destroy=function(){this.textTrack_&&shaka.text.SimpleTextDisplayer.removeWhere_(this.textTrack_,function(a){return!0});this.textTrack_=null;return Promise.resolve()};goog.exportProperty(shaka.text.SimpleTextDisplayer.prototype,"destroy",shaka.text.SimpleTextDisplayer.prototype.destroy);shaka.text.SimpleTextDisplayer.prototype.isTextVisible=function(){return"showing"==this.textTrack_.mode};
goog.exportProperty(shaka.text.SimpleTextDisplayer.prototype,"isTextVisible",shaka.text.SimpleTextDisplayer.prototype.isTextVisible);shaka.text.SimpleTextDisplayer.prototype.setTextVisibility=function(a){this.textTrack_.mode=a?"showing":"hidden"};goog.exportProperty(shaka.text.SimpleTextDisplayer.prototype,"setTextVisibility",shaka.text.SimpleTextDisplayer.prototype.setTextVisibility);
shaka.text.SimpleTextDisplayer.convertToTextTrackCue_=function(a){if(a.startTime>=a.endTime)return shaka.log.warning("Invalid cue times: "+a.startTime+" - "+a.endTime),null;var b=shaka.text.Cue,c=new VTTCue(a.startTime,a.endTime,a.payload);c.lineAlign=a.lineAlign;c.positionAlign=a.positionAlign;c.size=a.size;try{c.align=a.textAlign}catch(d){}"center"==a.textAlign&&"center"!=c.align&&(c.align="middle");a.writingMode==b.writingMode.VERTICAL_LEFT_TO_RIGHT?c.vertical="lr":a.writingMode==b.writingMode.VERTICAL_RIGHT_TO_LEFT&&
(c.vertical="rl");a.lineInterpretation==b.lineInterpretation.PERCENTAGE&&(c.snapToLines=!1);null!=a.line&&(c.line=a.line);null!=a.position&&(c.position=a.position);return c};shaka.text.SimpleTextDisplayer.removeWhere_=function(a,b){var c=a.mode,d="showing"==c?"showing":"hidden";a.mode=d;goog.asserts.assert(a.cues,'Cues should be accessible when mode is set to "'+d+'".');d=a.cues;for(var e=d.length-1;0<=e;e--){var f=d[e];f&&b(f)&&a.removeCue(f)}a.mode=c};
shaka.text.SimpleTextDisplayer.TextTrackLabel_="Shaka Player TextTrack";shaka.util.ConfigUtils={};
shaka.util.ConfigUtils.mergeConfigObjects=function(a,b,c,d,e){goog.asserts.assert(a,"Destination config must not be null!");var f=e in d,g=!0,h;for(h in b){var k=e+"."+h,l=f?d[e]:c[h];f||h in c?void 0===b[h]?void 0===l||f?delete a[h]:a[h]=shaka.util.ObjectUtils.cloneObject(l):l.constructor==Object&&b[h]&&b[h].constructor==Object?(a[h]||(a[h]=shaka.util.ObjectUtils.cloneObject(l)),k=shaka.util.ConfigUtils.mergeConfigObjects(a[h],b[h],l,d,k),g=g&&k):typeof b[h]!=typeof l||null==b[h]||b[h].constructor!=
l.constructor?(shaka.log.error("Invalid config, wrong type for "+k),g=!1):("function"==typeof c[h]&&c[h].length!=b[h].length&&shaka.log.warning("Invalid config, wrong number of arguments for "+k),a[h]=b[h]):(shaka.log.error("Invalid config, unrecognized key "+k),g=!1)}return g};goog.exportSymbol("shaka.util.ConfigUtils.mergeConfigObjects",shaka.util.ConfigUtils.mergeConfigObjects);
shaka.util.ConfigUtils.convertToConfigObject=function(a,b){for(var c={},d=c,e=0,f=0;;){e=a.indexOf(".",e);if(0>e)break;if(0==e||"\\"!=a[e-1])f=a.substring(f,e).replace(/\\\./g,"."),d[f]={},d=d[f],f=e+1;e+=1}d[a.substring(f).replace(/\\\./g,".")]=b;return c};goog.exportSymbol("shaka.util.ConfigUtils.convertToConfigObject",shaka.util.ConfigUtils.convertToConfigObject);shaka.util.PlayerConfiguration=function(){};goog.exportSymbol("shaka.util.PlayerConfiguration",shaka.util.PlayerConfiguration);
shaka.util.PlayerConfiguration.createDefault=function(){var a=5E5,b=Infinity;navigator.connection&&(a=1E6*navigator.connection.downlink,navigator.connection.saveData&&(b=360));var c={retryParameters:shaka.net.NetworkingEngine.defaultRetryParameters(),servers:{},clearKeys:{},advanced:{},delayLicenseRequestUntilPlayed:!1,initDataTransform:function(a){return a},fairPlayTransform:!0},d={retryParameters:shaka.net.NetworkingEngine.defaultRetryParameters(),availabilityWindowOverride:NaN,dash:{customScheme:function(a){if(a)return null},
clockSyncUri:"",ignoreDrmInfo:!1,xlinkFailGracefully:!1,defaultPresentationDelay:10,ignoreMinBufferTime:!1,autoCorrectDrift:!0},hls:{ignoreTextStreamFailures:!1}},e={retryParameters:shaka.net.NetworkingEngine.defaultRetryParameters(),failureCallback:function(a){shaka.log.error("Unhandled streaming error",a)},rebufferingGoal:2,bufferingGoal:10,bufferBehind:30,ignoreTextStreamFailures:!1,alwaysStreamText:!1,startAtSegmentBoundary:!1,smallGapLimit:.5,jumpLargeGaps:!1,durationBackoff:1,forceTransmuxTS:!1,
safeSeekOffset:5,stallEnabled:!0,stallThreshold:1,stallSkip:.1};shaka.util.Platform.isWebOS()&&(e.stallEnabled=!1);var f={trackSelectionCallback:function(a){return a},progressCallback:function(a,b){shaka.log.v2("Offline operation on",a.originalManifestUri,"progress at",b)},usePersistentLicense:!0},g={drm:c,manifest:d,streaming:e,offline:f,abrFactory:shaka.abr.SimpleAbrManager,abr:{enabled:!0,defaultBandwidthEstimate:a,switchInterval:8,bandwidthUpgradeTarget:.85,bandwidthDowngradeTarget:.95,restrictions:{minWidth:0,
maxWidth:Infinity,minHeight:0,maxHeight:b,minPixels:0,maxPixels:Infinity,minBandwidth:0,maxBandwidth:Infinity}},preferredAudioLanguage:"",preferredTextLanguage:"",preferredVariantRole:"",preferredTextRole:"",preferredAudioChannelCount:2,restrictions:{minWidth:0,maxWidth:Infinity,minHeight:0,maxHeight:Infinity,minPixels:0,maxPixels:Infinity,minBandwidth:0,maxBandwidth:Infinity},playRangeStart:0,playRangeEnd:Infinity,textDisplayFactory:function(){return null}};f.trackSelectionCallback=function(a){return shaka.util.PlayerConfiguration.defaultTrackSelect(a,
g.preferredAudioLanguage)};return g};shaka.util.PlayerConfiguration.mergeConfigObjects=function(a,b,c){var d={".drm.servers":"",".drm.clearKeys":"",".drm.advanced":{distinctiveIdentifierRequired:!1,persistentStateRequired:!1,videoRobustness:"",audioRobustness:"",serverCertificate:new Uint8Array(0),individualizationServer:""}};return shaka.util.ConfigUtils.mergeConfigObjects(a,b,c||shaka.util.PlayerConfiguration.createDefault(),d,"")};
goog.exportProperty(shaka.util.PlayerConfiguration,"mergeConfigObjects",shaka.util.PlayerConfiguration.mergeConfigObjects);
shaka.util.PlayerConfiguration.defaultTrackSelect=function(a,b){var c=shaka.util.ManifestParserUtils.ContentType,d=shaka.util.LanguageUtils,e=a.filter(function(a){return"variant"==a.type}),f=[],g=d.findClosestLocale(b,e.map(function(a){return a.language}));g&&(f=e.filter(function(a){return d.normalize(a.language)==g}));0==f.length&&(f=e.filter(function(a){return a.primary}));0==f.length&&(1<(new Set(e.map(function(a){return a.language}))).size&&shaka.log.warning("Could not choose a good audio track based on language preferences or primary tracks.  An arbitrary language will be stored!"),
f=e);var h=f.filter(function(a){return a.height&&480>=a.height});h.length&&(h.sort(function(a,b){return b.height-a.height}),f=h.filter(function(a){return a.height==h[0].height}));e=[];if(f.length){var k=Math.floor(f.length/2);f.sort(function(a,b){return a.bandwidth-b.bandwidth});e.push(f[k])}f=$jscomp.makeIterator(a);for(k=f.next();!k.done;k=f.next())k=k.value,k.type==c.TEXT&&e.push(k);return e};shaka.util.StateHistory=function(){this.open_=null;this.closed_=[]};shaka.util.StateHistory.prototype.update=function(a){null==this.open_?this.start_(a):this.update_(a)};shaka.util.StateHistory.prototype.getTimeSpentIn=function(a){var b=0;this.open_&&this.open_.state==a&&(b+=this.open_.duration);for(var c=$jscomp.makeIterator(this.closed_),d=c.next();!d.done;d=c.next())d=d.value,b+=d.state==a?d.duration:0;return b};
shaka.util.StateHistory.prototype.getCopy=function(){for(var a=function(a){return{timestamp:a.timestamp,state:a.state,duration:a.duration}},b=[],c=$jscomp.makeIterator(this.closed_),d=c.next();!d.done;d=c.next())b.push(a(d.value));this.open_&&b.push(a(this.open_));return b};shaka.util.StateHistory.prototype.start_=function(a){goog.asserts.assert(null==this.open_,"There must be no open entry in order when we start");this.open_={timestamp:this.getNowInSeconds_(),state:a,duration:0}};
shaka.util.StateHistory.prototype.update_=function(a){goog.asserts.assert(this.open_,"There must be an open entry in order to update it");var b=this.getNowInSeconds_();this.open_.duration=b-this.open_.timestamp;this.open_.state!=a&&(this.closed_.push(this.open_),this.open_={timestamp:b,state:a,duration:0})};shaka.util.StateHistory.prototype.getNowInSeconds_=function(){return Date.now()/1E3};shaka.util.SwitchHistory=function(){this.currentText_=this.currentVariant_=null;this.history_=[]};shaka.util.SwitchHistory.prototype.updateCurrentVariant=function(a,b){this.currentVariant_!=a&&(this.currentVariant_=a,this.history_.push({timestamp:this.getNowInSeconds_(),id:a.id,type:"variant",fromAdaptation:b,bandwidth:a.bandwidth}))};
shaka.util.SwitchHistory.prototype.updateCurrentText=function(a,b){this.currentText_!=a&&(this.currentText_=a,this.history_.push({timestamp:this.getNowInSeconds_(),id:a.id,type:"text",fromAdaptation:b,bandwidth:null}))};shaka.util.SwitchHistory.prototype.getCopy=function(){for(var a=[],b=$jscomp.makeIterator(this.history_),c=b.next();!c.done;c=b.next())a.push(this.clone_(c.value));return a};shaka.util.SwitchHistory.prototype.getNowInSeconds_=function(){return Date.now()/1E3};
shaka.util.SwitchHistory.prototype.clone_=function(a){return{timestamp:a.timestamp,id:a.id,type:a.type,fromAdaptation:a.fromAdaptation,bandwidth:a.bandwidth}};shaka.util.Stats=function(){this.bandwidthEstimate_=this.variantBandwidth_=this.loadLatencySeconds_=this.totalDecodedFrames_=this.totalDroppedFrames_=this.height_=this.width_=NaN;this.stateHistory_=new shaka.util.StateHistory;this.switchHistory_=new shaka.util.SwitchHistory};shaka.util.Stats.prototype.setDroppedFrames=function(a,b){this.totalDroppedFrames_=a;this.totalDecodedFrames_=b};shaka.util.Stats.prototype.setResolution=function(a,b){this.width_=a;this.height_=b};
shaka.util.Stats.prototype.setLoadLatency=function(a){this.loadLatencySeconds_=a};shaka.util.Stats.prototype.setVariantBandwidth=function(a){this.variantBandwidth_=a};shaka.util.Stats.prototype.setBandwidthEstimate=function(a){this.bandwidthEstimate_=a};shaka.util.Stats.prototype.getStateHistory=function(){return this.stateHistory_};shaka.util.Stats.prototype.getSwitchHistory=function(){return this.switchHistory_};
shaka.util.Stats.prototype.getBlob=function(){return{width:this.width_,height:this.height_,streamBandwidth:this.variantBandwidth_,decodedFrames:this.totalDecodedFrames_,droppedFrames:this.totalDroppedFrames_,estimatedBandwidth:this.bandwidthEstimate_,loadLatency:this.loadLatencySeconds_,playTime:this.stateHistory_.getTimeSpentIn("playing"),pauseTime:this.stateHistory_.getTimeSpentIn("paused"),bufferingTime:this.stateHistory_.getTimeSpentIn("buffering"),stateHistory:this.stateHistory_.getCopy(),switchHistory:this.switchHistory_.getCopy()}};
shaka.util.Stats.getEmptyBlob=function(){return{width:NaN,height:NaN,streamBandwidth:NaN,decodedFrames:NaN,droppedFrames:NaN,estimatedBandwidth:NaN,loadLatency:NaN,playTime:NaN,pauseTime:NaN,bufferingTime:NaN,switchHistory:[],stateHistory:[]}};shaka.Player=function(a,b){var c=this;shaka.util.FakeEventTarget.call(this);this.loadMode_=shaka.Player.LoadMode.NOT_LOADED;this.video_=null;this.isTextVisible_=!1;this.eventManager_=new shaka.util.EventManager;this.abrManagerFactory_=this.abrManager_=this.assetUri_=this.manifest_=this.parser_=this.streamingEngine_=this.regionTimeline_=this.bufferObserver_=this.bufferPoller_=this.playRateController_=this.playheadObservers_=this.playhead_=this.mediaSourceEngine_=this.drmEngine_=this.networkingEngine_=
null;this.nextExternalStreamId_=1E9;this.loadingTextStreams_=new Set;this.switchingPeriods_=!0;this.deferredVariant_=null;this.deferredVariantClearBuffer_=!1;this.deferredVariantClearBufferSafeMargin_=0;this.deferredTextStream_=null;this.activeStreams_=new shaka.media.ActiveStreamMap;this.config_=this.defaultConfig_();this.maxHwRes_={width:Infinity,height:Infinity};this.stats_=null;this.currentAdaptationSetCriteria_=new shaka.media.PreferenceBasedCriteria(this.config_.preferredAudioLanguage,this.config_.preferredVariantRole,
this.config_.preferredAudioChannelCount);this.currentTextLanguage_=this.config_.preferredTextLanguage;this.currentTextRole_=this.config_.preferredTextRole;b&&b(this);this.networkingEngine_=this.createNetworkingEngine();this.eventManager_.listen(window,"online",function(){c.retryStreaming()});this.detachNode_={name:"detach"};this.attachNode_={name:"attach"};this.unloadNode_={name:"unload"};this.parserNode_={name:"manifest-parser"};this.manifestNode_={name:"manifest"};this.mediaSourceNode_={name:"media-source"};
this.drmNode_={name:"drm-engine"};this.loadNode_={name:"load"};this.srcEqualsDrmNode_={name:"src-equals-drm-engine"};this.srcEqualsNode_={name:"src-equals"};var d=shaka.util.AbortableOperation,e=new Map;e.set(this.attachNode_,function(a,b){return d.notAbortable(c.onAttach_(a,b))});e.set(this.detachNode_,function(a,b){return d.notAbortable(c.onDetach_(a,b))});e.set(this.unloadNode_,function(a,b){return d.notAbortable(c.onUnload_(a,b))});e.set(this.mediaSourceNode_,function(a,b){var e=c.onInitializeMediaSourceEngine_(a,
b);return d.notAbortable(e)});e.set(this.parserNode_,function(a,b){var e=c.onInitializeParser_(a,b);return d.notAbortable(e)});e.set(this.manifestNode_,function(a,b){return c.onParseManifest_(a,b)});e.set(this.drmNode_,function(a,b){var e=c.onInitializeDrm_(a,b);return d.notAbortable(e)});e.set(this.loadNode_,function(a,b){return d.notAbortable(c.onLoad_(a,b))});e.set(this.srcEqualsDrmNode_,function(a,b){var e=c.onInitializeSrcEqualsDrm_(a,b);return d.notAbortable(e)});e.set(this.srcEqualsNode_,function(a,
b){return c.onSrcEquals_(a,b)});this.walker_=new shaka.routing.Walker(this.detachNode_,this.createEmptyPayload_(),{getNext:function(a,b,d,e){return c.getNextStep_(a,b,d,e)},enterNode:function(a,b,d){c.dispatchEvent(new shaka.util.FakeEvent("onstatechange",{state:a.name}));return e.get(a)(b,d)},handleError:function(a,b){return $jscomp.asyncExecutePromiseGeneratorFunction(function k(){return $jscomp.generator.createGenerator(k,function(d){switch(d.nextAddress){case 1:return shaka.log.warning("The walker saw an error:"),
b instanceof shaka.util.Error?shaka.log.warning("Error Code:",b.code):(shaka.log.warning("Error Message:",b.message),shaka.log.warning("Error Stack:",b.stack)),d.yield(c.onUnload_(a,c.createEmptyPayload_()),2);case 2:return d["return"](a.mediaElement?c.attachNode_:c.detachNode_)}})})},onIdle:function(a){c.dispatchEvent(new shaka.util.FakeEvent("onstateidle",{state:a.name}))}});a&&this.attach(a,!0)};goog.inherits(shaka.Player,shaka.util.FakeEventTarget);goog.exportSymbol("shaka.Player",shaka.Player);
shaka.Player.prototype.destroy=function(){var a=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function c(){var d;return $jscomp.generator.createGenerator(c,function(c){switch(c.nextAddress){case 1:if(a.loadMode_==shaka.Player.LoadMode.DESTROYED)return c["return"]();a.loadMode_=shaka.Player.LoadMode.DESTROYED;d=a.walker_.startNewRoute(function(c){return{node:a.detachNode_,payload:a.createEmptyPayload_(),interruptible:!1}});return c.yield(new Promise(function(a){d.onStart=function(){shaka.log.info("Preparing to destroy walker...")};
d.onEnd=function(){a()};d.onCancel=function(){goog.asserts.assert(!1,"Our final detach call should never be cancelled.");a()};d.onError=function(){goog.asserts.assert(!1,"Our final detach call should never see an error");a()};d.onSkip=function(){goog.asserts.assert(!1,"Our final detach call should never be skipped");a()}}),2);case 2:return c.yield(a.walker_.destroy(),3);case 3:a.eventManager_&&(a.eventManager_.release(),a.eventManager_=null);a.abrManagerFactory_=null;a.abrManager_=null;a.config_=
null;if(!a.networkingEngine_){c.jumpTo(0);break}return c.yield(a.networkingEngine_.destroy(),5);case 5:a.networkingEngine_=null,c.jumpToEnd()}})})};goog.exportProperty(shaka.Player.prototype,"destroy",shaka.Player.prototype.destroy);shaka.Player.version="2.5.5-yandex-patched-custom-build-partial-chunks_4-2-gc12e8370-dirty-debug";goog.exportProperty(shaka.Player,"version",shaka.Player.version);shaka.Deprecate.init(shaka.Player.version);shaka.Player.restrictedStatuses_=["output-restricted","internal-error"];
shaka.Player.supportPlugins_={};shaka.Player.registerSupportPlugin=function(a,b){shaka.Player.supportPlugins_[a]=b};goog.exportProperty(shaka.Player,"registerSupportPlugin",shaka.Player.registerSupportPlugin);shaka.Player.isBrowserSupported=function(){return window.Promise&&window.Uint8Array&&Array.prototype.forEach&&shaka.media.DrmEngine.isBrowserSupported()?shaka.util.Platform.supportsMediaSource()?!0:shaka.util.Platform.supportsMediaType("application/x-mpegurl"):!1};
goog.exportProperty(shaka.Player,"isBrowserSupported",shaka.Player.isBrowserSupported);shaka.Player.probeSupport=function(){goog.asserts.assert(shaka.Player.isBrowserSupported(),"Must have basic support");return shaka.media.DrmEngine.probeSupport().then(function(a){var b=shaka.media.ManifestParser.probeSupport(),c=shaka.media.MediaSourceEngine.probeSupport();a={manifest:b,media:c,drm:a};b=shaka.Player.supportPlugins_;for(var d in b)a[d]=b[d]();return a})};
goog.exportProperty(shaka.Player,"probeSupport",shaka.Player.probeSupport);
shaka.Player.prototype.attach=function(a,b){b=void 0===b?!0:b;if(this.loadMode_==shaka.Player.LoadMode.DESTROYED)return Promise.reject(this.createAbortLoadError_());var c=this.createEmptyPayload_();c.mediaElement=a;shaka.util.Platform.supportsMediaSource()||(b=!1);var d=b?this.mediaSourceNode_:this.attachNode_,e=this.walker_.startNewRoute(function(a){return{node:d,payload:c,interruptible:!1}});e.onStart=function(){return shaka.log.info("Starting attach...")};return this.wrapWalkerListenersWithPromise_(e)};
goog.exportProperty(shaka.Player.prototype,"attach",shaka.Player.prototype.attach);shaka.Player.prototype.detach=function(){var a=this;if(this.loadMode_==shaka.Player.LoadMode.DESTROYED)return Promise.reject(this.createAbortLoadError_());var b=this.walker_.startNewRoute(function(b){return{node:a.detachNode_,payload:a.createEmptyPayload_(),interruptible:!1}});b.onStart=function(){return shaka.log.info("Starting detach...")};return this.wrapWalkerListenersWithPromise_(b)};
goog.exportProperty(shaka.Player.prototype,"detach",shaka.Player.prototype.detach);
shaka.Player.prototype.unload=function(a){var b=this;a=void 0===a?!0:a;if(this.loadMode_==shaka.Player.LoadMode.DESTROYED)return Promise.reject(this.createAbortLoadError_());shaka.util.Platform.supportsMediaSource()||(a=!1);var c=this.createEmptyPayload_(),d=this.walker_.startNewRoute(function(d){var e=d.mediaElement&&a?b.mediaSourceNode_:d.mediaElement?b.attachNode_:b.detachNode_;goog.asserts.assert(e,"We should have picked a destination.");c.mediaElement=d.mediaElement;return{node:e,payload:c,interruptible:!1}});
d.onStart=function(){return shaka.log.info("Starting unload...")};return this.wrapWalkerListenersWithPromise_(d)};goog.exportProperty(shaka.Player.prototype,"unload",shaka.Player.prototype.unload);
shaka.Player.prototype.load=function(a,b,c){var d=this;if(this.loadMode_==shaka.Player.LoadMode.DESTROYED)return Promise.reject(this.createAbortLoadError_());this.dispatchEvent(new shaka.util.FakeEvent("loading"));var e=this.createEmptyPayload_();e.uri=a;e.startTimeOfLoad=Date.now()/1E3;c&&"string"!=typeof c&&(shaka.Deprecate.deprecateFeature(2,6,"Loading with a manifest parser factory","Please register a manifest parser and for the mime-type."),e.factory=function(){return new c});c&&"string"==typeof c&&
(e.mimeType=c);void 0!==b&&(e.startTime=b);var f=this.shouldUseSrcEquals_(e)?this.srcEqualsNode_:this.loadNode_,g=this.walker_.startNewRoute(function(a){if(null==a.mediaElement)return null;e.mediaElement=a.mediaElement;return{node:f,payload:e,interruptible:!0}});g.onStart=function(){return shaka.log.info("Starting load of "+a+"...")};return new Promise(function(a,b){g.onSkip=function(){return b(new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.PLAYER,shaka.util.Error.Code.NO_VIDEO_ELEMENT))};
g.onEnd=function(){return a()};g.onCancel=function(){return b(d.createAbortLoadError_())};g.onError=function(a){return b(a)}})};goog.exportProperty(shaka.Player.prototype,"load",shaka.Player.prototype.load);
shaka.Player.prototype.shouldUseSrcEquals_=function(a){var b=shaka.util.Platform;if(a.factory)return!1;if(!b.supportsMediaSource())return!0;var c=a.mimeType,d=a.uri||"";c||(c={mp4:"video/mp4",m4v:"video/mp4",m4a:"audio/mp4",webm:"video/webm",ts:"video/mp2t",m3u8:"application/x-mpegurl",mp3:"audio/mpeg",aac:"audio/aac",flac:"audio/flac"}[shaka.media.ManifestParser.getExtension(d)]);if(c){a=b.supportsMediaType(c);if(!a)return!1;c=shaka.media.ManifestParser.isSupported(d,c);if(!c)return!0;goog.asserts.assert(a&&
c,"Both native and MSE playback should be possible!");return b.isApple()}return!1};shaka.Player.prototype.onAttach_=function(a,b){var c=this;goog.asserts.assert(null==a.mediaElement||a.mediaElement==b.mediaElement,"The routing logic failed. MediaElement requirement failed.");null==a.mediaElement&&(a.mediaElement=b.mediaElement,this.eventManager_.listen(a.mediaElement,"error",function(a){return c.onVideoError_(a)}));this.video_=a.mediaElement;return Promise.resolve()};
shaka.Player.prototype.onDetach_=function(a,b){a.mediaElement&&(this.eventManager_.unlisten(a.mediaElement,"error"),a.mediaElement=null);this.video_=null;return Promise.resolve()};
shaka.Player.prototype.onUnload_=function(a,b){var c=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function e(){return $jscomp.generator.createGenerator(e,function(b){switch(b.nextAddress){case 1:c.loadMode_!=shaka.Player.LoadMode.DESTROYED&&(c.loadMode_=shaka.Player.LoadMode.NOT_LOADED);c.dispatchEvent(new shaka.util.FakeEvent("unloading"));a.factory=null;a.mimeType=null;a.startTime=null;a.uri=null;a.mediaElement&&(c.eventManager_.unlisten(a.mediaElement,"loadeddata"),c.eventManager_.unlisten(a.mediaElement,
"playing"),c.eventManager_.unlisten(a.mediaElement,"pause"),c.eventManager_.unlisten(a.mediaElement,"ended"),c.eventManager_.unlisten(a.mediaElement,"ratechange"));c.playheadObservers_&&(c.playheadObservers_.release(),c.playheadObservers_=null);c.bufferPoller_&&(c.bufferPoller_.stop(),c.bufferPoller_=null);if(!c.parser_){b.jumpTo(2);break}return b.yield(c.parser_.stop(),3);case 3:c.parser_=null;case 2:if(!c.abrManager_){b.jumpTo(4);break}return b.yield(c.abrManager_.stop(),4);case 4:if(!c.streamingEngine_){b.jumpTo(6);
break}return b.yield(c.streamingEngine_.destroy(),7);case 7:c.streamingEngine_=null;case 6:c.playhead_&&(c.playhead_.release(),c.playhead_=null);if(!c.mediaSourceEngine_){b.jumpTo(8);break}return b.yield(c.mediaSourceEngine_.destroy(),9);case 9:c.mediaSourceEngine_=null;case 8:a.mediaElement&&a.mediaElement.src&&(a.mediaElement.removeAttribute("src"),a.mediaElement.load());if(!c.drmEngine_){b.jumpTo(10);break}return b.yield(c.drmEngine_.destroy(),11);case 11:c.drmEngine_=null;case 10:c.activeStreams_.clear(),
c.assetUri_=null,c.bufferObserver_=null,c.loadingTextStreams_.clear(),c.manifest_=null,c.stats_=null,c.lastTextFactory_=null,c.switchingPeriods_=!0,c.updateBufferState_(),b.jumpToEnd()}})})};
shaka.Player.prototype.onInitializeMediaSourceEngine_=function(a,b){var c=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function e(){var f,g,h,k;return $jscomp.generator.createGenerator(e,function(e){switch(e.nextAddress){case 1:return goog.asserts.assert(shaka.util.Platform.supportsMediaSource(),"We should not be initializing media source on a platform that does not support media source."),goog.asserts.assert(a.mediaElement,"We should have a media element when initializing media source."),
goog.asserts.assert(a.mediaElement==b.mediaElement,"|has| and |wants| should have the same media element when initializing media source."),goog.asserts.assert(null==c.mediaSourceEngine_,"We should not have a media source engine yet."),f=shaka.media.MuxJSClosedCaptionParser.isSupported()?new shaka.media.MuxJSClosedCaptionParser:new shaka.media.NoopCaptionParser,g=c.config_.textDisplayFactory,h=new g,c.lastTextFactory_=g,k=c.createMediaSourceEngine(a.mediaElement,f,h),e.yield(k.open(),2);case 2:c.mediaSourceEngine_=
k,e.jumpToEnd()}})})};
shaka.Player.prototype.onInitializeParser_=function(a,b){var c=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function e(){var f,g,h;return $jscomp.generator.createGenerator(e,function(e){switch(e.nextAddress){case 1:goog.asserts.assert(a.mediaElement,"We should have a media element when initializing the parser.");goog.asserts.assert(a.mediaElement==b.mediaElement,"|has| and |wants| should have the same media element when initializing the parser.");goog.asserts.assert(c.networkingEngine_,"Need networking engine when initializing the parser.");
goog.asserts.assert(c.config_,"Need player config when initializing the parser.");a.factory=b.factory;a.mimeType=b.mimeType;a.uri=b.uri;goog.asserts.assert(a.uri,"We should have an asset uri when initializing the parsing.");f=a.uri;g=c.networkingEngine_;c.assetUri_=f;if(a.factory){c.parser_=a.factory();e.jumpTo(2);break}h=c;return e.yield(shaka.media.ManifestParser.create(f,g,c.config_.manifest.retryParameters,a.mimeType),3);case 3:h.parser_=e.yieldResult;case 2:c.parser_.configure(c.config_.manifest),
e.jumpToEnd()}})})};
shaka.Player.prototype.onParseManifest_=function(a,b){var c=this;goog.asserts.assert(a.factory==b.factory,"|has| and |wants| should have the same factory when parsing.");goog.asserts.assert(a.mimeType==b.mimeType,"|has| and |wants| should have the same mime type when parsing.");goog.asserts.assert(a.uri==b.uri,"|has| and |wants| should have the same uri when parsing.");goog.asserts.assert(a.uri,"|has| should have a valid uri when parsing.");goog.asserts.assert(a.uri==this.assetUri_,"|has.uri| should match the cached asset uri.");
goog.asserts.assert(this.networkingEngine_,"Need networking engine to parse manifest.");goog.asserts.assert(this.config_,"Need player config to parse manifest.");goog.asserts.assert(this.parser_,"|this.parser_| should have been set in an earlier step.");var d=a.uri,e=this.networkingEngine_;this.regionTimeline_=new shaka.media.RegionTimeline;this.regionTimeline_.setListeners(function(a){c.onRegionEvent_("timelineregionadded",a)});var f={networkingEngine:e,filterNewPeriod:function(a){return c.filterNewPeriod_(a)},
filterAllPeriods:function(a){return c.filterAllPeriods_(a)},onTimelineRegionAdded:function(a){return c.regionTimeline_.addRegion(a)},onEvent:function(a){return c.dispatchEvent(a)},onError:function(a){return c.onError_(a)}};return new shaka.util.AbortableOperation(Promise.resolve().then(function(){return $jscomp.asyncExecutePromiseGeneratorFunction(function h(){var a;return $jscomp.generator.createGenerator(h,function(b){switch(b.nextAddress){case 1:return a=c,b.yield(c.parser_.start(d,f),2);case 2:a.manifest_=
b.yieldResult;c.dispatchEvent(new shaka.util.FakeEvent("manifestparsed"));if(0==c.manifest_.periods.length)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.NO_PERIODS);shaka.Player.filterForAVVariants_(c.manifest_.periods);b.jumpToEnd()}})})}),function(){shaka.log.info("Aborting parser step...");return c.parser_.stop()})};
shaka.Player.prototype.onInitializeDrm_=function(a,b){var c=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function e(){return $jscomp.generator.createGenerator(e,function(e){switch(e.nextAddress){case 1:return goog.asserts.assert(a.factory==b.factory,"The load graph should have ensured the factories matched."),goog.asserts.assert(a.mimeType==b.mimeType,"The load graph should have ensured the mime types matched."),goog.asserts.assert(a.uri==b.uri,"The load graph should have ensured the uris matched"),
goog.asserts.assert(c.networkingEngine_,"|onInitializeDrm_| should never be called after |destroy|"),goog.asserts.assert(c.config_,"|onInitializeDrm_| should never be called after |destroy|"),goog.asserts.assert(c.manifest_,"|this.manifest_| should have been set in an earlier step."),c.drmEngine_=c.createDrmEngine({netEngine:c.networkingEngine_,onError:function(a){c.onError_(a)},onKeyStatus:function(a){c.onKeyStatus_(a)},onExpirationUpdated:function(a,b){c.onExpirationUpdated_(a,b)},onEvent:function(a){c.dispatchEvent(a)}}),
c.drmEngine_.configure(c.config_.drm),e.yield(c.drmEngine_.initForPlayback(shaka.util.Periods.getAllVariantsFrom(c.manifest_.periods),c.manifest_.offlineSessionIds),2);case 2:c.filterAllPeriods_(c.manifest_.periods),e.jumpToEnd()}})})};
shaka.Player.prototype.onLoad_=function(a,b){var c=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function e(){var f,g,h,k,l,m,n,q,p,r;return $jscomp.generator.createGenerator(e,function(e){switch(e.nextAddress){case 1:return goog.asserts.assert(a.factory==b.factory,"|has| and |wants| should have the same factory when loading."),goog.asserts.assert(a.mimeType==b.mimeType,"|has| and |wants| should have the same mime type when loading."),goog.asserts.assert(a.uri==b.uri,"|has| and |wants| should have the same uri when loading."),
goog.asserts.assert(a.mediaElement,"We should have a media element when loading."),goog.asserts.assert(b.startTimeOfLoad,"|wants| should tell us when the load was originally requested"),a.startTime=b.startTime,f=a.mediaElement,g=a.uri,c.assetUri_=g,c.stats_=new shaka.util.Stats,h=function(){return c.updateStateHistory_()},k=function(){return c.onRateChange_()},c.eventManager_.listen(f,"playing",h),c.eventManager_.listen(f,"pause",h),c.eventManager_.listen(f,"ended",h),c.eventManager_.listen(f,"ratechange",
k),l=c.config_.abrFactory,c.abrManager_&&c.abrManagerFactory_==l||(c.abrManagerFactory_=l,c.abrManager_=new l,c.abrManager_.configure(c.config_.abr)),c.createTextStreamsForClosedCaptions_(c.manifest_.periods),c.currentAdaptationSetCriteria_=new shaka.media.PreferenceBasedCriteria(c.config_.preferredAudioLanguage,c.config_.preferredVariantRole,c.config_.preferredAudioChannelCount),c.currentTextLanguage_=c.config_.preferredTextLanguage,shaka.Player.applyPlayRange_(c.manifest_.presentationTimeline,c.config_.playRangeStart,
c.config_.playRangeEnd),e.yield(c.drmEngine_.attach(f),2);case 2:return c.abrManager_.init(function(a,b,e){return c.switch_(a,b,e)}),c.playhead_=c.createPlayhead(a.startTime),c.playheadObservers_=c.createPlayheadObserversForMSE_(),c.playRateController_=new shaka.media.PlayRateController({getRate:function(){return a.mediaElement.playbackRate},setRate:function(b){a.mediaElement.playbackRate=b},movePlayhead:function(b){a.mediaElement.currentTime+=b}}),m=Math.max(c.manifest_.minBufferTime,c.config_.streaming.rebufferingGoal),
c.startBufferManagement_(m),c.streamingEngine_=c.createStreamingEngine(),c.streamingEngine_.configure(c.config_.streaming),c.chooseCodecsAndFilterManifest_(),c.loadMode_=shaka.Player.LoadMode.MEDIA_SOURCE,c.dispatchEvent(new shaka.util.FakeEvent("streaming")),e.yield(c.streamingEngine_.start(),3);case 3:c.config_.streaming.startAtSegmentBoundary&&(n=c.playhead_.getTime(),q=c.adjustStartTime_(n),c.playhead_.setStartTime(q)),c.manifest_.periods.forEach(c.filterNewPeriod_.bind(c)),c.onTracksChanged_(),
c.onAdaptation_(),p=c.getPresentationPeriod_()||c.manifest_.periods[0],r=p.variants.some(function(a){return a.primary}),c.config_.preferredAudioLanguage||r||shaka.log.warning("No preferred audio language set.  We will choose an arbitrary language initially"),c.chooseVariant_(p.variants),c.eventManager_.listenOnce(f,"loadeddata",function(){var a=Date.now()/1E3-b.startTimeOfLoad;c.stats_.setLoadLatency(a)}),e.jumpToEnd()}})})};
shaka.Player.prototype.onInitializeSrcEqualsDrm_=function(a,b){var c=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function e(){var b,g;return $jscomp.generator.createGenerator(e,function(e){switch(e.nextAddress){case 1:return b=shaka.util.ManifestParserUtils.ContentType,goog.asserts.assert(c.networkingEngine_,"|onInitializeSrcEqualsDrm_| should never be called after |destroy|"),goog.asserts.assert(c.config_,"|onInitializeSrcEqualsDrm_| should never be called after |destroy|"),c.drmEngine_=
c.createDrmEngine({netEngine:c.networkingEngine_,onError:function(a){c.onError_(a)},onKeyStatus:function(a){c.onKeyStatus_(a)},onExpirationUpdated:function(a,b){c.onExpirationUpdated_(a,b)},onEvent:function(a){c.dispatchEvent(a)}}),c.drmEngine_.configure(c.config_.drm),g={id:0,language:"und",primary:!1,audio:null,video:{id:0,originalId:null,createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:function(a){return null},getSegmentReference:function(a){return null},initSegmentReference:null,
presentationTimeOffset:0,mimeType:"video/mp4",codecs:"",encrypted:!0,keyId:null,language:"und",label:null,type:b.VIDEO,primary:!1,trickModeVideo:null,emsgSchemeIdUris:null,roles:[],channelsCount:null,closedCaptions:null},bandwidth:100,drmInfos:[],allowedByApplication:!0,allowedByKeySystem:!0},e.yield(c.drmEngine_.initForPlayback([g],[]),2);case 2:return e.yield(c.drmEngine_.attach(a.mediaElement),0)}})})};
shaka.Player.prototype.onSrcEquals_=function(a,b){var c=this;goog.asserts.assert(a.mediaElement,"We should have a media element when loading.");goog.asserts.assert(b.uri,"|has| should have a valid uri when loading.");goog.asserts.assert(b.startTimeOfLoad,"|wants| should tell us when the load was originally requested");goog.asserts.assert(this.video_==a.mediaElement,"The video element should match our media element");a.uri=b.uri;a.startTime=b.startTime;this.assetUri_=a.uri;this.stats_=new shaka.util.Stats;
this.playhead_=new shaka.media.SrcEqualsPlayhead(a.mediaElement);null!=a.startTime&&this.playhead_.setStartTime(a.startTime);this.playRateController_=new shaka.media.PlayRateController({getRate:function(){return a.mediaElement.playbackRate},setRate:function(b){a.mediaElement.playbackRate=b},movePlayhead:function(b){a.mediaElement.currentTime+=b}});this.startBufferManagement_(this.config_.streaming.rebufferingGoal);var d=function(){return c.updateStateHistory_()};this.eventManager_.listen(a.mediaElement,
"playing",d);this.eventManager_.listen(a.mediaElement,"pause",d);this.eventManager_.listen(a.mediaElement,"ended",d);this.eventManager_.listenOnce(a.mediaElement,"loadeddata",function(){var a=Date.now()/1E3-b.startTimeOfLoad;c.stats_.setLoadLatency(a)});this.video_.audioTracks&&(this.eventManager_.listen(this.video_.audioTracks,"addtrack",function(){return c.onTracksChanged_()}),this.eventManager_.listen(this.video_.audioTracks,"removetrack",function(){return c.onTracksChanged_()}));this.video_.textTracks&&
(d=this.video_.textTracks,this.eventManager_.listen(d,"addtrack",function(){return c.onTracksChanged_()}),this.eventManager_.listen(d,"removetrack",function(){return c.onTracksChanged_()}));a.mediaElement.src=a.uri;this.loadMode_=shaka.Player.LoadMode.SRC_EQUALS;this.dispatchEvent(new shaka.util.FakeEvent("streaming"));var e=new shaka.util.PublicPromise;this.video_.readyState>=HTMLMediaElement.HAVE_CURRENT_DATA?e.resolve():this.video_.error?e.reject(this.videoErrorToShakaError_()):(this.eventManager_.listenOnce(this.video_,
"loadeddata",function(){e.resolve()}),this.eventManager_.listenOnce(this.video_,"error",function(){e.reject(c.videoErrorToShakaError_())}));return new shaka.util.AbortableOperation(e,function(){var a=new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.PLAYER,shaka.util.Error.Code.OPERATION_ABORTED);e.reject(a);return Promise.resolve()})};
shaka.Player.filterForAVVariants_=function(a){var b=function(a){return a.video&&a.audio||a.video&&a.video.codecs.includes(",")};a.some(function(a){return a.variants.some(b)})&&(shaka.log.debug("Found variant with audio and video content, so filtering out audio-only content in all periods."),a.forEach(function(a){a.variants=a.variants.filter(b)}))};
shaka.Player.prototype.chooseCodecsAndFilterManifest_=function(){function a(a){var b="";a.video&&(b=shaka.util.MimeUtils.getCodecBase(a.video.codecs));var c="";a.audio&&(c=shaka.util.MimeUtils.getCodecBase(a.audio.codecs));return b+"-"+c}var b=this.manifest_.periods.reduce(function(a,b){return a.concat(b.variants)},[]);b=shaka.util.StreamUtils.filterVariantsByAudioChannelCount(b,this.config_.preferredAudioChannelCount);var c=new shaka.util.MultiMap;b.forEach(function(b){var d=a(b);c.push(d,b)});var d=
null,e=Infinity;c.forEach(function(a,b){var c=0,f=0;b.forEach(function(a){c+=a.bandwidth||0;++f});var g=c/f;shaka.log.debug("codecs",a,"avg bandwidth",g);g<e&&(d=a,e=g)});goog.asserts.assert(null!=d,"Should have chosen codecs!");goog.asserts.assert(!isNaN(e),"Bandwidth should be a number!");this.manifest_.periods.forEach(function(b){b.variants=b.variants.filter(function(b){if(a(b)==d)return!0;shaka.log.debug("Dropping Variant (better codec available)",b);return!1})})};
shaka.Player.prototype.createDrmEngine=function(a){return new shaka.media.DrmEngine(a)};shaka.Player.prototype.createNetworkingEngine=function(){var a=this;return new shaka.net.NetworkingEngine(function(b,c){a.abrManager_&&a.abrManager_.segmentDownloaded(b,c)})};
shaka.Player.prototype.createPlayhead=function(a){var b=this;goog.asserts.assert(this.manifest_,"Must have manifest");goog.asserts.assert(this.video_,"Must have video");return new shaka.media.MediaSourcePlayhead(this.video_,this.manifest_,this.config_.streaming,a,function(){return b.onSeek_()},function(a){return b.dispatchEvent(a)})};
shaka.Player.prototype.createPlayheadObserversForMSE_=function(){var a=this;goog.asserts.assert(this.manifest_,"Must have manifest");goog.asserts.assert(this.regionTimeline_,"Must have region timeline");goog.asserts.assert(this.video_,"Must have video element");var b=new shaka.media.PeriodObserver(this.manifest_);b.setListeners(function(b){return a.onChangePeriod_()});var c=new shaka.media.RegionObserver(this.regionTimeline_);c.setListeners(function(b,c){a.onRegionEvent_("timelineregionenter",b)},
function(b,c){a.onRegionEvent_("timelineregionexit",b)},function(b,c){c||(a.onRegionEvent_("timelineregionenter",b),a.onRegionEvent_("timelineregionexit",b))});var d=new shaka.media.PlayheadObserverManager(this.video_);d.manage(b);d.manage(c);return d};
shaka.Player.prototype.startBufferManagement_=function(a){var b=this;goog.asserts.assert(!this.bufferObserver_,"No buffering observer should exist before initialization.");goog.asserts.assert(!this.bufferPoller_,"No buffer timer should exist before initialization.");this.bufferObserver_=new shaka.media.BufferingObserver(a,Math.min(shaka.Player.TYPICAL_BUFFERING_THRESHOLD_,a/2));this.bufferObserver_.setState(shaka.media.BufferingObserver.State.STARVING);this.updateBufferState_();this.bufferPoller_=
(new shaka.util.Timer(function(){b.pollBufferState_()})).tickEvery(.25)};
shaka.Player.prototype.pollBufferState_=function(){goog.asserts.assert(this.video_,"Need a media element to update the buffering observer");goog.asserts.assert(this.bufferObserver_,"Need a buffering observer to update");switch(this.loadMode_){case shaka.Player.LoadMode.SRC_EQUALS:var a=this.isBufferedToEndSrc_();break;case shaka.Player.LoadMode.MEDIA_SOURCE:a=this.isBufferedToEndMS_();break;default:a=!1}var b=shaka.media.TimeRangesUtils.bufferedAheadOf(this.video_.buffered,this.video_.currentTime);
this.bufferObserver_.update(b,a)&&this.updateBufferState_()};shaka.Player.prototype.createMediaSourceEngine=function(a,b,c){return new shaka.media.MediaSourceEngine(a,b,c)};
shaka.Player.prototype.createStreamingEngine=function(){var a=this;goog.asserts.assert(this.playhead_&&this.abrManager_&&this.mediaSourceEngine_&&this.manifest_,"Must not be destroyed");var b={getPresentationTime:function(){return a.playhead_.getTime()},getBandwidthEstimate:function(){return a.abrManager_.getBandwidthEstimate()},mediaSourceEngine:this.mediaSourceEngine_,netEngine:this.networkingEngine_,onChooseStreams:this.onChooseStreams_.bind(this),onCanSwitch:this.canSwitch_.bind(this),onError:this.onError_.bind(this),
onEvent:function(b){return a.dispatchEvent(b)},onManifestUpdate:this.onManifestUpdate_.bind(this),onSegmentAppended:this.onSegmentAppended_.bind(this)};return new shaka.media.StreamingEngine(this.manifest_,b)};
shaka.Player.prototype.configure=function(a,b){goog.asserts.assert(this.config_,"Config must not be null!");goog.asserts.assert("object"==typeof a||2==arguments.length,"String configs should have values!");2==arguments.length&&"string"==typeof a&&(a=shaka.util.ConfigUtils.convertToConfigObject(a,b));goog.asserts.assert("object"==typeof a,"Should be an object!");var c=shaka.util.PlayerConfiguration.mergeConfigObjects(this.config_,a,this.defaultConfig_());this.applyConfig_();return c};
goog.exportProperty(shaka.Player.prototype,"configure",shaka.Player.prototype.configure);
shaka.Player.prototype.applyConfig_=function(){this.parser_&&this.parser_.configure(this.config_.manifest);this.drmEngine_&&this.drmEngine_.configure(this.config_.drm);if(this.streamingEngine_){this.streamingEngine_.configure(this.config_.streaming);try{this.manifest_.periods.forEach(this.filterNewPeriod_.bind(this))}catch(d){this.onError_(d)}var a=this.streamingEngine_.getBufferingAudio(),b=this.streamingEngine_.getBufferingVideo(),c=this.getPresentationPeriod_();a=shaka.util.StreamUtils.getVariantByStreams(a,
b,c.variants);this.abrManager_&&a&&a.allowedByApplication&&a.allowedByKeySystem?this.chooseVariant_(c.variants):(shaka.log.debug("Choosing new streams after changing configuration"),this.chooseStreamsAndSwitch_(c))}this.mediaSourceEngine_&&(c=this.config_.textDisplayFactory,this.lastTextFactory_!=c&&(a=new c,this.mediaSourceEngine_.setTextDisplayer(a),this.lastTextFactory_=c,this.streamingEngine_&&this.streamingEngine_.reloadTextStream()));this.abrManager_&&(this.abrManager_.configure(this.config_.abr),
this.config_.abr.enabled&&!this.switchingPeriods_?this.abrManager_.enable():this.abrManager_.disable(),this.onAbrStatusChanged_())};shaka.Player.prototype.getConfiguration=function(){goog.asserts.assert(this.config_,"Config must not be null!");var a=this.defaultConfig_();shaka.util.PlayerConfiguration.mergeConfigObjects(a,this.config_,this.defaultConfig_());return a};goog.exportProperty(shaka.Player.prototype,"getConfiguration",shaka.Player.prototype.getConfiguration);
shaka.Player.prototype.getSharedConfiguration=function(){goog.asserts.assert(this.config_,"Cannot call getSharedConfiguration after call destroy!");return this.config_};shaka.Player.prototype.resetConfiguration=function(){goog.asserts.assert(this.config_,"Cannot be destroyed");for(var a in this.config_)delete this.config_[a];shaka.util.PlayerConfiguration.mergeConfigObjects(this.config_,this.defaultConfig_(),this.defaultConfig_());this.applyConfig_()};
goog.exportProperty(shaka.Player.prototype,"resetConfiguration",shaka.Player.prototype.resetConfiguration);shaka.Player.prototype.getLoadMode=function(){return this.loadMode_};goog.exportProperty(shaka.Player.prototype,"getLoadMode",shaka.Player.prototype.getLoadMode);shaka.Player.prototype.getMediaElement=function(){return this.video_};goog.exportProperty(shaka.Player.prototype,"getMediaElement",shaka.Player.prototype.getMediaElement);shaka.Player.prototype.getNetworkingEngine=function(){return this.networkingEngine_};
goog.exportProperty(shaka.Player.prototype,"getNetworkingEngine",shaka.Player.prototype.getNetworkingEngine);shaka.Player.prototype.getAssetUri=function(){return this.assetUri_};goog.exportProperty(shaka.Player.prototype,"getAssetUri",shaka.Player.prototype.getAssetUri);shaka.Player.prototype.getManifestUri=function(){shaka.Deprecate.deprecateFeature(2,6,"getManifestUri",'Please use "getAssetUri" instead.');return this.getAssetUri()};goog.exportProperty(shaka.Player.prototype,"getManifestUri",shaka.Player.prototype.getManifestUri);
shaka.Player.prototype.isLive=function(){return this.manifest_?this.manifest_.presentationTimeline.isLive():this.video_&&this.video_.src?Infinity==this.video_.duration:!1};goog.exportProperty(shaka.Player.prototype,"isLive",shaka.Player.prototype.isLive);shaka.Player.prototype.isInProgress=function(){return this.manifest_?this.manifest_.presentationTimeline.isInProgress():!1};goog.exportProperty(shaka.Player.prototype,"isInProgress",shaka.Player.prototype.isInProgress);
shaka.Player.prototype.isAudioOnly=function(){if(this.manifest_){if(!this.manifest_.periods.length)return!1;var a=this.manifest_.periods[0].variants;return a.length?!a[0].video:!1}return this.video_&&this.video_.src?this.video_.videoTracks?0==this.video_.videoTracks.length:0==this.video_.videoHeight:!1};goog.exportProperty(shaka.Player.prototype,"isAudioOnly",shaka.Player.prototype.isAudioOnly);
shaka.Player.prototype.seekRange=function(){if(this.manifest_){var a=this.manifest_.presentationTimeline;return{start:a.getSeekRangeStart(),end:a.getSeekRangeEnd()}}return this.video_&&this.video_.src&&(a=this.video_.seekable,a.length)?{start:a.start(0),end:a.end(a.length-1)}:{start:0,end:0}};goog.exportProperty(shaka.Player.prototype,"seekRange",shaka.Player.prototype.seekRange);shaka.Player.prototype.keySystem=function(){return this.drmEngine_?this.drmEngine_.keySystem():""};
goog.exportProperty(shaka.Player.prototype,"keySystem",shaka.Player.prototype.keySystem);shaka.Player.prototype.drmInfo=function(){return this.drmEngine_?this.drmEngine_.getDrmInfo():null};goog.exportProperty(shaka.Player.prototype,"drmInfo",shaka.Player.prototype.drmInfo);shaka.Player.prototype.getExpiration=function(){return this.drmEngine_?this.drmEngine_.getExpiration():Infinity};goog.exportProperty(shaka.Player.prototype,"getExpiration",shaka.Player.prototype.getExpiration);
shaka.Player.prototype.isBuffering=function(){var a=shaka.media.BufferingObserver.State;return this.bufferObserver_?this.bufferObserver_.getState()==a.STARVING:!1};goog.exportProperty(shaka.Player.prototype,"isBuffering",shaka.Player.prototype.isBuffering);shaka.Player.prototype.getPlaybackRate=function(){return this.playRateController_?this.playRateController_.getActiveRate():0};goog.exportProperty(shaka.Player.prototype,"getPlaybackRate",shaka.Player.prototype.getPlaybackRate);
shaka.Player.prototype.trickPlay=function(a){goog.asserts.assert(0!=a,"Should never set a trick play rate of 0!");0==a?shaka.log.alwaysWarn("A trick play rate of 0 is unsupported!"):(this.video_.paused&&this.video_.play(),this.playRateController_.set(a),this.loadMode_==shaka.Player.LoadMode.MEDIA_SOURCE&&this.streamingEngine_.setTrickPlay(1<Math.abs(a)))};goog.exportProperty(shaka.Player.prototype,"trickPlay",shaka.Player.prototype.trickPlay);
shaka.Player.prototype.cancelTrickPlay=function(){this.loadMode_==shaka.Player.LoadMode.SRC_EQUALS&&this.playRateController_.set(1);this.loadMode_==shaka.Player.LoadMode.MEDIA_SOURCE&&(this.playRateController_.set(1),this.streamingEngine_.setTrickPlay(!1))};goog.exportProperty(shaka.Player.prototype,"cancelTrickPlay",shaka.Player.prototype.cancelTrickPlay);
shaka.Player.prototype.getVariantTracks=function(){if(this.manifest_&&this.playhead_){for(var a=this.getPresentationVariant_(),b=[],c=$jscomp.makeIterator(this.getSelectableVariants_()),d=c.next();!d.done;d=c.next()){d=d.value;var e=shaka.util.StreamUtils.variantToTrack(d);e.active=d==a;b.push(e)}return b}return this.video_&&this.video_.audioTracks?Array.from(this.video_.audioTracks).map(function(a){return shaka.util.StreamUtils.html5AudioTrackToTrack(a)}):[]};
goog.exportProperty(shaka.Player.prototype,"getVariantTracks",shaka.Player.prototype.getVariantTracks);
shaka.Player.prototype.getTextTracks=function(){if(this.manifest_&&this.playhead_){for(var a=this.getPresentationText_(),b=[],c=$jscomp.makeIterator(this.getSelectableText_()),d=c.next();!d.done;d=c.next()){d=d.value;var e=shaka.util.StreamUtils.textStreamToTrack(d);e.active=d==a;b.push(e)}return b}if(this.video_&&this.video_.src&&this.video_.textTracks){a=Array.from(this.video_.textTracks);var f=shaka.util.StreamUtils;return a.map(function(a){return f.html5TextTrackToTrack(a)})}return[]};
goog.exportProperty(shaka.Player.prototype,"getTextTracks",shaka.Player.prototype.getTextTracks);
shaka.Player.prototype.selectTextTrack=function(a){if(this.manifest_&&this.streamingEngine_){var b=this.getPresentationPeriod_(),c=b.textStreams.find(function(b){return b.id==a.id});c?(this.addTextStreamToSwitchHistory_(b,c,!1),this.switchTextStream_(c),this.currentTextLanguage_=c.language):shaka.log.error("No stream with id",a.id)}else if(this.video_&&this.video_.src&&this.video_.textTracks){b=Array.from(this.video_.textTracks);b=$jscomp.makeIterator(b);for(c=b.next();!c.done;c=b.next())c=c.value,
shaka.util.StreamUtils.html5TrackId(c)==a.id?c.mode=this.isTextVisible_?"showing":"hidden":c.mode="disabled";this.onTextChanged_()}};goog.exportProperty(shaka.Player.prototype,"selectTextTrack",shaka.Player.prototype.selectTextTrack);
shaka.Player.prototype.selectEmbeddedTextTrack=function(){shaka.Deprecate.deprecateFeature(2,6,"selectEmbeddedTextTrack","If closed captions are signaled in the manifest, a text stream will be created to represent them. Please use SelectTextTrack.");var a=this.getTextTracks().filter(function(a){return a.mimeType==shaka.util.MimeUtils.CLOSED_CAPTION_MIMETYPE});0<a.length?this.selectTextTrack(a[0]):shaka.log.warning("Unable to find the text track embedded in the video.")};
goog.exportProperty(shaka.Player.prototype,"selectEmbeddedTextTrack",shaka.Player.prototype.selectEmbeddedTextTrack);
shaka.Player.prototype.usingEmbeddedTextTrack=function(){shaka.Deprecate.deprecateFeature(2,6,"usingEmbeddedTextTrack","If closed captions are signaled in the manifest, a text stream will be created to represent them. There should be no reason to know if the player is playing embedded text.");var a=this.getTextTracks().filter(function(a){return a.active})[0];return a?a.mimeType==shaka.util.MimeUtils.CLOSED_CAPTION_MIMETYPE:!1};goog.exportProperty(shaka.Player.prototype,"usingEmbeddedTextTrack",shaka.Player.prototype.usingEmbeddedTextTrack);
shaka.Player.prototype.selectVariantTrack=function(a,b,c){c=void 0===c?0:c;if(this.manifest_&&this.streamingEngine_){var d=this.getPresentationPeriod_();this.config_.abr.enabled&&shaka.log.alwaysWarn("Changing tracks while abr manager is enabled will likely result in the selected track being overriden. Consider disabling abr before calling selectVariantTrack().");var e=d.variants.find(function(b){return b.id==a.id});e?shaka.util.StreamUtils.isPlayable(e)?(this.addVariantToSwitchHistory_(d,e,!1),this.switchVariant_(e,
b,c),this.currentAdaptationSetCriteria_=new shaka.media.ExampleBasedCriteria(e),this.chooseVariant_(d.variants)):shaka.log.error("Unable to switch to restricted track",a.id):shaka.log.error("No variant with id",a.id)}else if(this.video_&&this.video_.audioTracks){b=Array.from(this.video_.audioTracks);b=$jscomp.makeIterator(b);for(c=b.next();!c.done;c=b.next())c=c.value,shaka.util.StreamUtils.html5TrackId(c)==a.id&&(c.enabled=!0);this.onVariantChanged_()}};
goog.exportProperty(shaka.Player.prototype,"selectVariantTrack",shaka.Player.prototype.selectVariantTrack);shaka.Player.prototype.getAudioLanguagesAndRoles=function(){return shaka.Player.getLanguageAndRolesFrom_(this.getVariantTracks())};goog.exportProperty(shaka.Player.prototype,"getAudioLanguagesAndRoles",shaka.Player.prototype.getAudioLanguagesAndRoles);shaka.Player.prototype.getTextLanguagesAndRoles=function(){return shaka.Player.getLanguageAndRolesFrom_(this.getTextTracks())};
goog.exportProperty(shaka.Player.prototype,"getTextLanguagesAndRoles",shaka.Player.prototype.getTextLanguagesAndRoles);shaka.Player.prototype.getAudioLanguages=function(){return Array.from(shaka.Player.getLanguagesFrom_(this.getVariantTracks()))};goog.exportProperty(shaka.Player.prototype,"getAudioLanguages",shaka.Player.prototype.getAudioLanguages);shaka.Player.prototype.getTextLanguages=function(){return Array.from(shaka.Player.getLanguagesFrom_(this.getTextTracks()))};
goog.exportProperty(shaka.Player.prototype,"getTextLanguages",shaka.Player.prototype.getTextLanguages);
shaka.Player.prototype.selectAudioLanguage=function(a,b){if(this.manifest_&&this.playhead_){var c=this.getPresentationPeriod_();this.currentAdaptationSetCriteria_=new shaka.media.PreferenceBasedCriteria(a,b||"",0);this.chooseStreamsAndSwitch_(c)}else if(this.video_&&this.video_.audioTracks){c=Array.from(this.video_.audioTracks);c=$jscomp.makeIterator(c);for(var d=c.next();!d.done;d=c.next())d=d.value,d.language==a&&(d.enabled=!0);this.onVariantChanged_()}};
goog.exportProperty(shaka.Player.prototype,"selectAudioLanguage",shaka.Player.prototype.selectAudioLanguage);
shaka.Player.prototype.selectTextLanguage=function(a,b){if(this.manifest_&&this.playhead_){var c=this.getPresentationPeriod_();this.currentTextLanguage_=a;this.currentTextRole_=b||"";var d=this.chooseTextStream_(c.textStreams);d&&(this.addTextStreamToSwitchHistory_(c,d,!1),this.shouldStreamText_()&&this.switchTextStream_(d))}else(c=this.getTextTracks().filter(function(b){return b.language==a})[0])&&this.selectTextTrack(c)};goog.exportProperty(shaka.Player.prototype,"selectTextLanguage",shaka.Player.prototype.selectTextLanguage);
shaka.Player.prototype.isTextTrackVisible=function(){var a=this.isTextVisible_;if(this.manifest_){var b=this.mediaSourceEngine_.getTextDisplayer().isTextVisible();goog.asserts.assert(b==a,"text visibility has fallen out of sync");return b}return this.video_&&this.video_.src&&this.video_.textTracks?Array.from(this.video_.textTracks).some(function(a){return"showing"==a.mode}):a};goog.exportProperty(shaka.Player.prototype,"isTextTrackVisible",shaka.Player.prototype.isTextTrackVisible);
shaka.Player.prototype.setTextTrackVisibility=function(a){var b=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function d(){var e,f,g,h,k,l;return $jscomp.generator.createGenerator(d,function(d){switch(d.nextAddress){case 1:e=b.isTextVisible_;f=a;if(e==f)return d["return"]();b.isTextVisible_=f;if(b.loadMode_!=shaka.Player.LoadMode.MEDIA_SOURCE){if(b.video_&&b.video_.src&&b.video_.textTracks){g=Array.from(b.video_.textTracks);for(var m=$jscomp.makeIterator(g),q=m.next();!q.done;q=m.next())h=
q.value,"disabled"!=h.mode&&(h.mode=a?"showing":"hidden")}d.jumpTo(2);break}b.mediaSourceEngine_.getTextDisplayer().setTextVisibility(a);if(b.config_.streaming.alwaysStreamText){d.jumpTo(2);break}if(!a){b.streamingEngine_.unloadTextStream();d.jumpTo(2);break}k=b.getPresentationPeriod_();l=shaka.util.StreamUtils.filterStreamsByLanguageAndRole(k.textStreams,b.currentTextLanguage_,b.currentTextRole_);if(!(0<l.length)){d.jumpTo(2);break}return d.yield(b.streamingEngine_.loadNewTextStream(l[0]),2);case 2:b.onTextTrackVisibility_(),
d.jumpToEnd()}})})};goog.exportProperty(shaka.Player.prototype,"setTextTrackVisibility",shaka.Player.prototype.setTextTrackVisibility);
shaka.Player.prototype.getPlayheadTimeAsDate=function(){if(!this.isLive())return shaka.log.warning("getPlayheadTimeAsDate is for live streams!"),null;if(this.manifest_){var a=this.manifest_.presentationTimeline.getPresentationStartTime();return new Date(1E3*(a+this.video_.currentTime))}if(this.video_&&this.video_.getStartDate)return a=this.video_.getStartDate(),isNaN(a.getTime())?(shaka.log.warning("EXT-X-PROGRAM-DATETIME required to get playhead time as Date!"),null):new Date(a.getTime()+1E3*this.video_.currentTime);
shaka.log.warning("No way to get playhead time as Date!");return null};goog.exportProperty(shaka.Player.prototype,"getPlayheadTimeAsDate",shaka.Player.prototype.getPlayheadTimeAsDate);
shaka.Player.prototype.getPresentationStartTimeAsDate=function(){if(!this.isLive())return shaka.log.warning("getPresentationStartTimeAsDate is for live streams!"),null;if(this.manifest_){var a=this.manifest_.presentationTimeline.getPresentationStartTime();return new Date(1E3*a)}if(this.video_&&this.video_.getStartDate)return a=this.video_.getStartDate(),isNaN(a.getTime())?(shaka.log.warning("EXT-X-PROGRAM-DATETIME required to get presentation start time as Date!"),null):a;shaka.log.warning("No way to get presentation start time as Date!");
return null};goog.exportProperty(shaka.Player.prototype,"getPresentationStartTimeAsDate",shaka.Player.prototype.getPresentationStartTimeAsDate);shaka.Player.prototype.getBufferedInfo=function(){var a={total:[],audio:[],video:[],text:[]};this.loadMode_==shaka.Player.LoadMode.SRC_EQUALS&&(a.total=shaka.media.TimeRangesUtils.getBufferedInfo(this.video_.buffered));this.loadMode_==shaka.Player.LoadMode.MEDIA_SOURCE&&this.mediaSourceEngine_.getBufferedInfo(a);return a};
goog.exportProperty(shaka.Player.prototype,"getBufferedInfo",shaka.Player.prototype.getBufferedInfo);
shaka.Player.prototype.getStats=function(){if(this.loadMode_!=shaka.Player.LoadMode.MEDIA_SOURCE&&this.loadMode_!=shaka.Player.LoadMode.SRC_EQUALS)return shaka.util.Stats.getEmptyBlob();this.updateStateHistory_();goog.asserts.assert(this.video_,"If we have stats, we should have video_");var a=this.video_;a.getVideoPlaybackQuality&&(a=a.getVideoPlaybackQuality(),this.stats_.setDroppedFrames(Number(a.droppedVideoFrames),Number(a.totalVideoFrames)));this.loadMode_==shaka.Player.LoadMode.MEDIA_SOURCE&&
((a=this.getPresentationVariant_())&&this.stats_.setVariantBandwidth(a.bandwidth),a&&a.video&&this.stats_.setResolution(a.video.width||NaN,a.video.height||NaN),a=this.abrManager_.getBandwidthEstimate(),this.stats_.setBandwidthEstimate(a));return this.stats_.getBlob()};goog.exportProperty(shaka.Player.prototype,"getStats",shaka.Player.prototype.getStats);
shaka.Player.prototype.addTextTrack=function(a,b,c,d,e,f){var g=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function k(){var l,m,n,q,p,r,u,t,v;return $jscomp.generator.createGenerator(k,function(k){switch(k.nextAddress){case 1:if(g.loadMode_==shaka.Player.LoadMode.SRC_EQUALS)throw shaka.log.error("Cannot add text when loaded with src="),Error("State error!");if(g.loadMode_!=shaka.Player.LoadMode.MEDIA_SOURCE)throw shaka.log.error("Must call load() and wait for it to resolve before adding text tracks."),
Error("State error!");l=g.getPresentationPeriod_();m=shaka.util.ManifestParserUtils.ContentType;n=g.manifest_.periods.indexOf(l);q=n+1;p=q>=g.manifest_.periods.length?g.manifest_.presentationTimeline.getDuration():g.manifest_.periods[q].startTime;r=p-l.startTime;if(Infinity==r)throw new shaka.util.Error(shaka.util.Error.Severity.RECOVERABLE,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.CANNOT_ADD_EXTERNAL_TEXT_TO_LIVE_STREAM);u=new shaka.media.SegmentReference(1,0,r,function(){return[a]},
0,null);t={id:g.nextExternalStreamId_++,originalId:null,createSegmentIndex:Promise.resolve.bind(Promise),findSegmentPosition:function(a){return 1},getSegmentReference:function(a){return 1==a?u:null},initSegmentReference:null,presentationTimeOffset:0,mimeType:d,codecs:e||"",kind:c,encrypted:!1,keyId:null,language:b,label:f||null,type:m.TEXT,primary:!1,trickModeVideo:null,emsgSchemeIdUris:null,roles:[],channelsCount:null,closedCaptions:null};g.loadingTextStreams_.add(t);l.textStreams.push(t);return k.yield(g.streamingEngine_.loadNewTextStream(t),
2);case 2:return goog.asserts.assert(l,"The period should still be non-null here."),(v=g.streamingEngine_.getBufferingText())&&g.activeStreams_.useText(l,v),g.loadingTextStreams_["delete"](t),shaka.log.debug("Choosing new streams after adding a text stream"),g.chooseStreamsAndSwitch_(l),g.onTracksChanged_(),k["return"](shaka.util.StreamUtils.textStreamToTrack(t))}})})};goog.exportProperty(shaka.Player.prototype,"addTextTrack",shaka.Player.prototype.addTextTrack);
shaka.Player.prototype.setMaxHardwareResolution=function(a,b){this.maxHwRes_.width=a;this.maxHwRes_.height=b};goog.exportProperty(shaka.Player.prototype,"setMaxHardwareResolution",shaka.Player.prototype.setMaxHardwareResolution);shaka.Player.prototype.retryStreaming=function(){return this.loadMode_==shaka.Player.LoadMode.MEDIA_SOURCE?this.streamingEngine_.retry():!1};goog.exportProperty(shaka.Player.prototype,"retryStreaming",shaka.Player.prototype.retryStreaming);
shaka.Player.prototype.getManifest=function(){return this.manifest_};goog.exportProperty(shaka.Player.prototype,"getManifest",shaka.Player.prototype.getManifest);shaka.Player.prototype.getManifestParserFactory=function(){return this.parser_?this.parser_.constructor:null};goog.exportProperty(shaka.Player.prototype,"getManifestParserFactory",shaka.Player.prototype.getManifestParserFactory);
shaka.Player.prototype.addVariantToSwitchHistory_=function(a,b,c){this.activeStreams_.useVariant(a,b);this.stats_.getSwitchHistory().updateCurrentVariant(b,c)};shaka.Player.prototype.addTextStreamToSwitchHistory_=function(a,b,c){this.activeStreams_.useText(a,b);this.stats_.getSwitchHistory().updateCurrentText(b,c)};
shaka.Player.prototype.defaultConfig_=function(){var a=this,b=shaka.util.PlayerConfiguration.createDefault();b.streaming.failureCallback=function(b){a.defaultStreamingFailureCallback_(b)};var c=this;b.textDisplayFactory=function(){return new shaka.text.SimpleTextDisplayer(c.video_)};return b};
shaka.Player.prototype.defaultStreamingFailureCallback_=function(a){var b=[shaka.util.Error.Code.BAD_HTTP_STATUS,shaka.util.Error.Code.HTTP_ERROR,shaka.util.Error.Code.TIMEOUT];this.isLive()&&b.includes(a.code)&&(a.severity=shaka.util.Error.Severity.RECOVERABLE,shaka.log.warning("Live streaming error.  Retrying automatically..."),this.retryStreaming())};
shaka.Player.prototype.createTextStreamsForClosedCaptions_=function(a){for(var b=shaka.util.ManifestParserUtils.ContentType,c=0;c<a.length;c++){for(var d=a[c],e=new Map,f=$jscomp.makeIterator(d.variants),g=f.next();!g.done;g=f.next())if(g=g.value,g.video&&g.video.closedCaptions){g=g.video;for(var h=$jscomp.makeIterator(g.closedCaptions.keys()),k=h.next();!k.done;k=h.next())if(k=k.value,!e.has(k)){var l={id:this.nextExternalStreamId_++,originalId:k,createSegmentIndex:Promise.resolve.bind(Promise),
findSegmentPosition:function(a){return null},getSegmentReference:function(a){return null},initSegmentReference:null,presentationTimeOffset:0,mimeType:shaka.util.MimeUtils.CLOSED_CAPTION_MIMETYPE,codecs:"",kind:shaka.util.ManifestParserUtils.TextStreamKind.CLOSED_CAPTION,encrypted:!1,keyId:null,language:g.closedCaptions.get(k),label:null,type:b.TEXT,primary:!1,trickModeVideo:null,emsgSchemeIdUris:null,roles:g.roles,channelsCount:null,closedCaptions:null};e.set(k,l)}}e=$jscomp.makeIterator(e.values());
for(f=e.next();!f.done;f=e.next())d.textStreams.push(f.value)}};
shaka.Player.prototype.filterAllPeriods_=function(a){goog.asserts.assert(this.video_,"Must not be destroyed");var b=shaka.util.ArrayUtils,c=shaka.util.StreamUtils,d=this.streamingEngine_?this.streamingEngine_.getBufferingAudio():null,e=this.streamingEngine_?this.streamingEngine_.getBufferingVideo():null;d=c.filterNewPeriod.bind(null,this.drmEngine_,d,e);a.forEach(d);b=b.count(a,function(a){return a.variants.some(c.isPlayable)});if(0==b)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,
shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.CONTENT_UNSUPPORTED_BY_BROWSER);if(b<a.length)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.UNPLAYABLE_PERIOD);a.forEach(function(a){if(shaka.util.StreamUtils.applyRestrictions(a.variants,this.config_.restrictions,this.maxHwRes_)&&this.streamingEngine_&&this.getPresentationPeriod_()==a)this.onTracksChanged_();this.checkRestrictedVariants_(a.variants)}.bind(this))};
shaka.Player.prototype.filterNewPeriod_=function(a){goog.asserts.assert(this.video_,"Must not be destroyed");var b=shaka.util.StreamUtils,c=this.streamingEngine_?this.streamingEngine_.getBufferingAudio():null,d=this.streamingEngine_?this.streamingEngine_.getBufferingVideo():null;b.filterNewPeriod(this.drmEngine_,c,d,a);c=a.variants;if(!c.some(b.isPlayable))throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.UNPLAYABLE_PERIOD);this.checkRestrictedVariants_(a.variants);
if(shaka.util.StreamUtils.applyRestrictions(c,this.config_.restrictions,this.maxHwRes_)&&this.streamingEngine_&&this.getPresentationPeriod_()==a)this.onTracksChanged_();if(a=this.drmEngine_?this.drmEngine_.getDrmInfo():null)for(b=$jscomp.makeIterator(c),c=b.next();!c.done;c=b.next())for(c=$jscomp.makeIterator(c.value.drmInfos),d=c.next();!d.done;d=c.next())if(d=d.value,d.keySystem==a.keySystem){d=$jscomp.makeIterator(d.initData||[]);for(var e=d.next();!e.done;e=d.next())e=e.value,this.drmEngine_.newInitData(e.initDataType,
e.initData)}};shaka.Player.prototype.switchVariant_=function(a,b,c){b=void 0===b?!1:b;c=void 0===c?0:c;this.switchingPeriods_?(this.deferredVariant_=a,this.deferredVariantClearBuffer_=b,this.deferredVariantClearBufferSafeMargin_=c):(this.streamingEngine_.switchVariant(a,b,c),this.onVariantChanged_())};shaka.Player.prototype.switchTextStream_=function(a){this.switchingPeriods_?this.deferredTextStream_=a:(this.streamingEngine_.switchTextStream(a),this.onTextChanged_())};
shaka.Player.prototype.assertCorrectActiveStreams_=function(){if(this.streamingEngine_&&this.manifest_&&goog.DEBUG){var a=this.streamingEngine_.getBufferingPeriod(),b=this.getPresentationPeriod_();if(null!=a&&a==b){a=this.streamingEngine_.getBufferingAudio();var c=this.streamingEngine_.getBufferingVideo(),d=this.streamingEngine_.getBufferingText();a=this.deferredVariant_?this.deferredVariant_.audio:a;c=this.deferredVariant_?this.deferredVariant_.video:c;d=this.deferredTextStream_||d;var e=this.activeStreams_.getVariant(b);
b=this.activeStreams_.getText(b);goog.asserts.assert(e.audio==a,"Inconsistent active audio stream");goog.asserts.assert(e.video==c,"Inconsistent active video stream");goog.asserts.assert(null==d||b==d,"Inconsistent active text stream")}}};
shaka.Player.prototype.adjustStartTime_=function(a){function b(a,b){if(!a)return null;var c=a.findSegmentPosition(b-e.startTime);if(null==c)return null;c=a.getSegmentReference(c);if(!c)return null;c=c.startTime+e.startTime;goog.asserts.assert(c<=b,"Segment should start before time");return c}var c=this.streamingEngine_.getBufferingAudio(),d=this.streamingEngine_.getBufferingVideo(),e=this.getPresentationPeriod_();c=b(c,a);d=b(d,a);return null!=d&&null!=c?Math.max(d,c):null!=d?d:null!=c?c:a};
shaka.Player.prototype.updateBufferState_=function(){var a=this.isBuffering();this.stats_&&this.bufferObserver_&&this.playhead_&&(this.playRateController_.setBuffering(a),this.updateStateHistory_());a=new shaka.util.FakeEvent("buffering",{buffering:a});this.dispatchEvent(a)};shaka.Player.prototype.onChangePeriod_=function(){this.onTracksChanged_()};shaka.Player.prototype.onRateChange_=function(){var a=this.video_.playbackRate;0!=a&&this.playRateController_.set(a)};
shaka.Player.prototype.updateStateHistory_=function(){if(this.stats_&&this.bufferObserver_){var a=shaka.media.BufferingObserver.State,b=this.stats_.getStateHistory();this.bufferObserver_.getState()==a.STARVING?b.update("buffering"):this.video_.paused?b.update("paused"):this.video_.ended?b.update("ended"):b.update("playing")}};shaka.Player.prototype.onSeek_=function(){this.playheadObservers_&&this.playheadObservers_.notifyOfSeek();this.streamingEngine_&&this.streamingEngine_.seeked()};
shaka.Player.prototype.chooseVariant_=function(a){goog.asserts.assert(this.config_,"Must not be destroyed");try{this.checkRestrictedVariants_(a)}catch(b){return this.onError_(b),null}goog.asserts.assert(a.length,"Should have thrown for no Variants.");a=a.filter(function(a){return shaka.util.StreamUtils.isPlayable(a)});a=this.currentAdaptationSetCriteria_.create(a);this.abrManager_.setVariants(Array.from(a.values()));return this.abrManager_.chooseVariant()};
shaka.Player.prototype.chooseTextStream_=function(a){return shaka.util.StreamUtils.filterStreamsByLanguageAndRole(a,this.currentTextLanguage_,this.currentTextRole_)[0]||null};
shaka.Player.prototype.chooseStreamsAndSwitch_=function(a){goog.asserts.assert(this.config_,"Must not be destroyed");var b=this.chooseVariant_(a.variants);b&&(this.addVariantToSwitchHistory_(a,b,!0),this.switchVariant_(b,!0));(b=this.chooseTextStream_(a.textStreams))&&this.shouldStreamText_()&&(this.addTextStreamToSwitchHistory_(a,b,!0),this.switchTextStream_(b));this.onAdaptation_()};
shaka.Player.prototype.onChooseStreams_=function(a){shaka.log.debug("onChooseStreams_",a);goog.asserts.assert(this.config_,"Must not be destroyed");try{shaka.log.v2("onChooseStreams_, choosing variant from ",a.variants);shaka.log.v2("onChooseStreams_, choosing text from ",a.textStreams);var b=this.chooseStreams_(a);shaka.log.v2("onChooseStreams_, chose variant ",b.variant);shaka.log.v2("onChooseStreams_, chose text ",b.text);return b}catch(c){return this.onError_(c),{variant:null,text:null}}};
shaka.Player.prototype.chooseStreams_=function(a){this.switchingPeriods_=!0;this.abrManager_.disable();this.onAbrStatusChanged_();shaka.log.debug("Choosing new streams after period changed");var b=this.chooseVariant_(a.variants),c=this.chooseTextStream_(a.textStreams);this.deferredVariant_&&(a.variants.includes(this.deferredVariant_)&&(b=this.deferredVariant_),this.deferredVariant_=null);this.deferredTextStream_&&(a.textStreams.includes(this.deferredTextStream_)&&(c=this.deferredTextStream_),this.deferredTextStream_=
null);b&&this.addVariantToSwitchHistory_(a,b,!0);c&&this.addTextStreamToSwitchHistory_(a,c,!0);a=!this.streamingEngine_.getBufferingPeriod();var d=b?b.audio:null;a&&c&&(d&&this.shouldShowText_(d,c)&&(this.isTextVisible_=!0),this.isTextVisible_&&(this.mediaSourceEngine_.getTextDisplayer().setTextVisibility(!0),goog.asserts.assert(this.shouldStreamText_(),"Should be streaming text")),this.onTextTrackVisibility_());return this.shouldStreamText_()?{variant:b,text:c}:{variant:b,text:null}};
shaka.Player.prototype.shouldShowText_=function(a,b){var c=shaka.util.LanguageUtils,d=c.normalize(this.config_.preferredTextLanguage),e=c.normalize(a.language),f=c.normalize(b.language);return c.areLanguageCompatible(f,d)&&!c.areLanguageCompatible(e,f)};
shaka.Player.prototype.canSwitch_=function(){shaka.log.debug("canSwitch_");goog.asserts.assert(this.config_,"Must not be destroyed");this.switchingPeriods_=!1;this.config_.abr.enabled&&(this.abrManager_.enable(),this.onAbrStatusChanged_());this.deferredVariant_&&(this.streamingEngine_.switchVariant(this.deferredVariant_,this.deferredVariantClearBuffer_,this.deferredVariantClearBufferSafeMargin_),this.onVariantChanged_(),this.deferredVariant_=null);this.deferredTextStream_&&(this.streamingEngine_.switchTextStream(this.deferredTextStream_),
this.onTextChanged_(),this.deferredTextStream_=null)};shaka.Player.prototype.onManifestUpdate_=function(){this.parser_&&this.parser_.update&&this.parser_.update()};shaka.Player.prototype.onSegmentAppended_=function(){this.playhead_&&this.playhead_.notifyOfBufferingChange()};
shaka.Player.prototype.switch_=function(a,b,c){b=void 0===b?!1:b;c=void 0===c?0:c;shaka.log.debug("switch_");goog.asserts.assert(this.config_.abr.enabled,"AbrManager should not call switch while disabled!");goog.asserts.assert(!this.switchingPeriods_,"AbrManager should not call switch while transitioning between Periods!");goog.asserts.assert(this.manifest_,"We need a manifest to switch variants.");var d=this.findPeriodWithVariant_(a);goog.asserts.assert(d,"A period should contain the variant.");
this.addVariantToSwitchHistory_(d,a,!0);this.streamingEngine_&&(this.streamingEngine_.switchVariant(a,b,c),this.onAdaptation_())};shaka.Player.prototype.onAdaptation_=function(){this.delayDispatchEvent_(new shaka.util.FakeEvent("adaptation"))};shaka.Player.prototype.onTracksChanged_=function(){this.delayDispatchEvent_(new shaka.util.FakeEvent("trackschanged"))};shaka.Player.prototype.onVariantChanged_=function(){this.delayDispatchEvent_(new shaka.util.FakeEvent("variantchanged"))};
shaka.Player.prototype.onTextChanged_=function(){this.delayDispatchEvent_(new shaka.util.FakeEvent("textchanged"))};shaka.Player.prototype.onTextTrackVisibility_=function(){this.delayDispatchEvent_(new shaka.util.FakeEvent("texttrackvisibility"))};shaka.Player.prototype.onAbrStatusChanged_=function(){this.delayDispatchEvent_(new shaka.util.FakeEvent("abrstatuschanged",{newStatus:this.config_.abr.enabled}))};
shaka.Player.prototype.onError_=function(a){goog.asserts.assert(a instanceof shaka.util.Error,"Wrong error type!");if(this.loadMode_!=shaka.Player.LoadMode.DESTROYED){var b=new shaka.util.FakeEvent("error",{detail:a});this.dispatchEvent(b);b.defaultPrevented&&(a.handled=!0)}};shaka.Player.prototype.onRegionEvent_=function(a,b){this.dispatchEvent(new shaka.util.FakeEvent(a,{detail:{schemeIdUri:b.schemeIdUri,value:b.value,startTime:b.startTime,endTime:b.endTime,id:b.id,eventElement:b.eventElement}}))};
shaka.Player.prototype.videoErrorToShakaError_=function(){goog.asserts.assert(this.video_.error,"Video error expected, but missing!");if(!this.video_.error)return null;var a=this.video_.error.code;if(1==a)return null;var b=this.video_.error.msExtendedCode;b&&(0>b&&(b+=Math.pow(2,32)),b=b.toString(16));return new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MEDIA,shaka.util.Error.Code.VIDEO_ERROR,a,b,this.video_.error.message)};
shaka.Player.prototype.onVideoError_=function(a){if(a=this.videoErrorToShakaError_())this.onError_(a)};
shaka.Player.prototype.onKeyStatus_=function(a){if(this.streamingEngine_){var b=shaka.Player.restrictedStatuses_,c=this.getPresentationPeriod_(),d=!1,e=Object.keys(a);0==e.length&&shaka.log.warning("Got a key status event without any key statuses, so we don't know the real key statuses. If we don't have all the keys, you'll need to set restrictions so we don't select those tracks.");var f=1==e.length&&"00"==e[0];f&&shaka.log.warning("Got a synthetic key status event, so we don't know the real key statuses. If we don't have all the keys, you'll need to set restrictions so we don't select those tracks.");
e.length&&c.variants.forEach(function(c){shaka.util.StreamUtils.getVariantStreams(c).forEach(function(e){var g=c.allowedByKeySystem;e.keyId&&(e=a[f?"00":e.keyId],c.allowedByKeySystem=!!e&&!b.includes(e));g!=c.allowedByKeySystem&&(d=!0)})});e=this.streamingEngine_.getBufferingAudio();var g=this.streamingEngine_.getBufferingVideo();(e=shaka.util.StreamUtils.getVariantByStreams(e,g,c.variants))&&!e.allowedByKeySystem&&(shaka.log.debug("Choosing new streams after key status changed"),this.chooseStreamsAndSwitch_(c));
d&&(this.onTracksChanged_(),this.chooseVariant_(c.variants))}};shaka.Player.prototype.onExpirationUpdated_=function(a,b){if(this.parser_&&this.parser_.onExpirationUpdated)this.parser_.onExpirationUpdated(a,b);var c=new shaka.util.FakeEvent("expirationupdated");this.dispatchEvent(c)};shaka.Player.prototype.shouldStreamText_=function(){return this.config_.streaming.alwaysStreamText||this.isTextTrackVisible()};
shaka.Player.applyPlayRange_=function(a,b,c){0<b&&(a.isLive()?shaka.log.warning("|playRangeStart| has been configured for live content. Ignoring the setting."):a.setUserSeekStart(b));b=a.getDuration();c<b&&(a.isLive()?shaka.log.warning("|playRangeEnd| has been configured for live content. Ignoring the setting."):a.setDuration(c))};
shaka.Player.prototype.checkRestrictedVariants_=function(a){var b=shaka.Player.restrictedStatuses_,c=this.drmEngine_?this.drmEngine_.getKeyStatuses():{},d=Object.keys(c);d=d.length&&"00"==d[0];var e=!1,f=!1,g=[],h=[];a=$jscomp.makeIterator(a);for(var k=a.next();!k.done;k=a.next()){k=k.value;var l=[];k.audio&&l.push(k.audio);k.video&&l.push(k.video);l=$jscomp.makeIterator(l);for(var m=l.next();!m.done;m=l.next())if(m=m.value,m.keyId){var n=c[d?"00":m.keyId];n?b.includes(n)&&(h.includes(n)||h.push(n)):
g.includes(m.keyId)||g.push(m.keyId)}k.allowedByApplication?k.allowedByKeySystem&&(e=!0):f=!0}if(!e)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.MANIFEST,shaka.util.Error.Code.RESTRICTIONS_CANNOT_BE_MET,{hasAppRestrictions:f,missingKeys:g,restrictedKeyStatuses:h});};
shaka.Player.prototype.delayDispatchEvent_=function(a){var b=this;return $jscomp.asyncExecutePromiseGeneratorFunction(function d(){return $jscomp.generator.createGenerator(d,function(d){switch(d.nextAddress){case 1:return d.yield(Promise.resolve(),2);case 2:b.loadMode_!=shaka.Player.LoadMode.DESTROYED&&b.dispatchEvent(a),d.jumpToEnd()}})})};
shaka.Player.getLanguagesFrom_=function(a){var b=new Set;a=$jscomp.makeIterator(a);for(var c=a.next();!c.done;c=a.next())c=c.value,c.language?b.add(shaka.util.LanguageUtils.normalize(c.language)):b.add("und");return b};
shaka.Player.getLanguageAndRolesFrom_=function(a){var b=new Map;a=$jscomp.makeIterator(a);for(var c=a.next();!c.done;c=a.next()){var d=c.value;c="und";var e=[];d.language&&(c=shaka.util.LanguageUtils.normalize(d.language));(e="variant"==d.type?d.audioRoles:d.roles)&&e.length||(e=[""]);b.has(c)||b.set(c,new Set);d=$jscomp.makeIterator(e);for(e=d.next();!e.done;e=d.next())e=e.value,b.get(c).add(e)}var f=[];b.forEach(function(a,b){for(var c=$jscomp.makeIterator(a),d=c.next();!d.done;d=c.next())f.push({language:b,
role:d.value})});return f};shaka.Player.prototype.getSelectableVariants_=function(){var a=this.getPresentationPeriod_();if(null==a)return[];this.assertCorrectActiveStreams_();return a.variants.filter(function(a){return shaka.util.StreamUtils.isPlayable(a)})};shaka.Player.prototype.getSelectableText_=function(){var a=this,b=this.getPresentationPeriod_();if(null==b)return[];this.assertCorrectActiveStreams_();return b.textStreams.filter(function(b){return!a.loadingTextStreams_.has(b)})};
shaka.Player.prototype.getPresentationPeriod_=function(){goog.asserts.assert(this.manifest_&&this.playhead_,"Only ask for the presentation period when loaded with media source.");for(var a=this.playhead_.getTime(),b=null,c=$jscomp.makeIterator(this.manifest_.periods),d=c.next();!d.done;d=c.next())d=d.value,d.startTime<=a&&(b=d);goog.asserts.assert(b,"Should have found a period.");return b};shaka.Player.prototype.getPresentationVariant_=function(){var a=this.getPresentationPeriod_();return this.activeStreams_.getVariant(a)};
shaka.Player.prototype.getPresentationText_=function(){var a=this.getPresentationPeriod_();if(null==a)return null;if(!this.activeStreams_.getText(a)){var b=shaka.util.StreamUtils.filterStreamsByLanguageAndRole(a.textStreams,this.currentTextLanguage_,this.currentTextRole_);b.length&&this.activeStreams_.useText(a,b[0])}return this.activeStreams_.getText(a)};
shaka.Player.prototype.isBufferedToEndMS_=function(){goog.asserts.assert(this.video_,"We need a video element to get buffering information");goog.asserts.assert(this.mediaSourceEngine_,"We need a media source engine to get buffering information");goog.asserts.assert(this.manifest_,"We need a manifest to get buffering information");if(this.video_.ended||this.mediaSourceEngine_.ended())return!0;if(this.manifest_.presentationTimeline.isLive()){var a=this.manifest_.presentationTimeline.getSegmentAvailabilityEnd();
if(shaka.media.TimeRangesUtils.bufferEnd(this.video_.buffered)>=a)return!0}return!1};shaka.Player.prototype.isBufferedToEndSrc_=function(){goog.asserts.assert(this.video_,"We need a video element to get buffering information");return this.video_.ended?!0:shaka.media.TimeRangesUtils.bufferEnd(this.video_.buffered)>=this.video_.duration-.1};
shaka.Player.prototype.findPeriodWithVariant_=function(a){for(var b=$jscomp.makeIterator(this.manifest_.periods),c=b.next();!c.done;c=b.next())if(c=c.value,c.variants.includes(a))return c;return null};shaka.Player.prototype.createAbortLoadError_=function(){return new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.PLAYER,shaka.util.Error.Code.LOAD_INTERRUPTED)};
shaka.Player.prototype.getNextStep_=function(a,b,c,d){var e=null;a==this.detachNode_&&(e=c==this.detachNode_?this.detachNode_:this.attachNode_);a==this.attachNode_&&(e=this.getNextAfterAttach_(c,b,d));a==this.mediaSourceNode_&&(e=this.getNextAfterMediaSource_(c,b,d));a==this.parserNode_&&(e=this.getNextMatchingAllDependencies_(this.loadNode_,this.manifestNode_,this.unloadNode_,c,b,d));a==this.manifestNode_&&(e=this.getNextMatchingAllDependencies_(this.loadNode_,this.drmNode_,this.unloadNode_,c,b,
d));a==this.drmNode_&&(e=this.getNextMatchingAllDependencies_(this.loadNode_,this.loadNode_,this.unloadNode_,c,b,d));a==this.srcEqualsDrmNode_&&(e=c==this.srcEqualsNode_&&b.mediaElement==d.mediaElement?this.srcEqualsNode_:this.unloadNode_);if(a==this.loadNode_||a==this.srcEqualsNode_)e=this.unloadNode_;a==this.unloadNode_&&(e=this.getNextAfterUnload_(c,b,d));goog.asserts.assert(e,"Missing next step!");return e};
shaka.Player.prototype.getNextAfterAttach_=function(a,b,c){return a==this.detachNode_||b.mediaElement!=c.mediaElement?this.detachNode_:a==this.attachNode_?this.attachNode_:a==this.mediaSourceNode_||a==this.loadNode_?this.mediaSourceNode_:a==this.srcEqualsNode_?this.srcEqualsDrmNode_:null};shaka.Player.prototype.getNextAfterMediaSource_=function(a,b,c){return a==this.loadNode_&&b.mediaElement==c.mediaElement?this.parserNode_:this.unloadNode_};
shaka.Player.prototype.getNextAfterUnload_=function(a,b,c){return c.mediaElement&&b.mediaElement==c.mediaElement?this.attachNode_:this.detachNode_};shaka.Player.prototype.getNextMatchingAllDependencies_=function(a,b,c,d,e,f){return d==a&&e.mediaElement==f.mediaElement&&e.uri==f.uri&&e.mimeType==f.mimeType&&e.factory==f.factory?b:c};shaka.Player.prototype.createEmptyPayload_=function(){return{factory:null,mediaElement:null,mimeType:null,startTime:null,startTimeOfLoad:null,uri:null}};
shaka.Player.prototype.wrapWalkerListenersWithPromise_=function(a){var b=this;return new Promise(function(c,d){a.onCancel=function(){return d(b.createAbortLoadError_())};a.onEnd=function(){return c()};a.onError=function(a){return d(a)};a.onSkip=function(){return d(b.createAbortLoadError_())}})};shaka.Player.LoadMode={DESTROYED:0,NOT_LOADED:1,MEDIA_SOURCE:2,SRC_EQUALS:3};goog.exportProperty(shaka.Player,"LoadMode",shaka.Player.LoadMode);shaka.Player.TYPICAL_BUFFERING_THRESHOLD_=.5;shaka.polyfill={};shaka.polyfill.installAll=function(){for(var a=0;a<shaka.polyfill.polyfills_.length;++a)shaka.polyfill.polyfills_[a].callback()};goog.exportSymbol("shaka.polyfill.installAll",shaka.polyfill.installAll);shaka.polyfill.polyfills_=[];shaka.polyfill.register=function(a,b){b=b||0;for(var c={priority:b,callback:a},d=0;d<shaka.polyfill.polyfills_.length;d++)if(shaka.polyfill.polyfills_[d].priority<b){shaka.polyfill.polyfills_.splice(d,0,c);return}shaka.polyfill.polyfills_.push(c)};
goog.exportSymbol("shaka.polyfill.register",shaka.polyfill.register);shaka.polyfill.InputEvent={};shaka.polyfill.InputEvent.install=function(){shaka.log.debug("InputEvent.install");shaka.util.Platform.isIE()&&!HTMLInputElement.prototype.originalAddEventListener&&(shaka.log.info("Patching input event support on IE."),HTMLInputElement.prototype.originalAddEventListener=HTMLInputElement.prototype.addEventListener,HTMLInputElement.prototype.addEventListener=shaka.polyfill.InputEvent.addEventListener_)};
shaka.polyfill.InputEvent.addEventListener_=function(a,b,c){if("input"==a)switch(this.type){case "range":a="change"}HTMLInputElement.prototype.originalAddEventListener.call(this,a,b,c)};shaka.polyfill.register(shaka.polyfill.InputEvent.install);shaka.polyfill.Languages={};shaka.polyfill.Languages.install=function(){navigator.languages||Object.defineProperty(navigator,"languages",{get:function(){return navigator.language?[navigator.language]:["en"]}})};shaka.polyfill.register(shaka.polyfill.Languages.install);shaka.polyfill.MathRound={};shaka.polyfill.MathRound.MAX_ACCURATE_INPUT_=4503599627370496;shaka.polyfill.MathRound.install=function(){shaka.log.debug("mathRound.install");var a=shaka.polyfill.MathRound.MAX_ACCURATE_INPUT_+1;if(Math.round(a)!=a){shaka.log.debug("polyfill Math.round");var b=Math.round;Math.round=function(a){var c=a;a<=shaka.polyfill.MathRound.MAX_ACCURATE_INPUT_&&(c=b(a));return c}}};shaka.polyfill.register(shaka.polyfill.MathRound.install);shaka.polyfill.MediaSource={};
shaka.polyfill.MediaSource.install=function(){shaka.log.debug("MediaSource.install");if(window.MediaSource)if(window.cast&&cast.__platform__&&cast.__platform__.canDisplayType)shaka.log.info("Patching Chromecast MSE bugs."),shaka.polyfill.MediaSource.patchCastIsTypeSupported_();else if(shaka.util.Platform.isApple()){var a=navigator.appVersion;shaka.polyfill.MediaSource.rejectTsContent_();if(a.includes("Version/8"))shaka.log.info("Blacklisting Safari 8 MSE."),shaka.polyfill.MediaSource.blacklist_();else if(a.includes("Version/9"))shaka.log.info("Patching Safari 9 MSE bugs."),
shaka.polyfill.MediaSource.stubAbort_();else if(a.includes("Version/10"))shaka.log.info("Patching Safari 10 MSE bugs."),shaka.polyfill.MediaSource.stubAbort_(),shaka.polyfill.MediaSource.patchEndOfStreamEvents_();else if(a.includes("Version/11")||a.includes("Version/12"))shaka.log.info("Patching Safari 11/12 MSE bugs."),shaka.polyfill.MediaSource.stubAbort_(),shaka.polyfill.MediaSource.patchRemovalRange_()}else shaka.util.Platform.isTizen()?shaka.polyfill.MediaSource.rejectCodec_("opus"):shaka.log.info("Using native MSE as-is.");
else shaka.log.info("No MSE implementation available.")};shaka.polyfill.MediaSource.blacklist_=function(){window.MediaSource=null};shaka.polyfill.MediaSource.stubAbort_=function(){var a=MediaSource.prototype.addSourceBuffer;MediaSource.prototype.addSourceBuffer=function(b){for(var c=[],d=0;d<arguments.length;++d)c[d-0]=arguments[d];c=a.apply(this,c);c.abort=function(){};return c}};
shaka.polyfill.MediaSource.patchRemovalRange_=function(){var a=SourceBuffer.prototype.remove;SourceBuffer.prototype.remove=function(b,c){return a.call(this,b,c-.001)}};
shaka.polyfill.MediaSource.patchEndOfStreamEvents_=function(){var a=MediaSource.prototype.endOfStream;MediaSource.prototype.endOfStream=function(b){for(var c=[],d=0;d<arguments.length;++d)c[d-0]=arguments[d];for(var g=d=0;g<this.sourceBuffers.length;++g){var h=this.sourceBuffers[g];h=h.buffered.end(h.buffered.length-1);d=Math.max(d,h)}if(!isNaN(this.duration)&&d<this.duration)for(this.ignoreUpdateEnd_=!0,d=0;d<this.sourceBuffers.length;++d)this.sourceBuffers[d].eventSuppressed_=!1;return a.apply(this,
c)};var b=!1,c=MediaSource.prototype.addSourceBuffer;MediaSource.prototype.addSourceBuffer=function(a){for(var d=[],f=0;f<arguments.length;++f)d[f-0]=arguments[f];d=c.apply(this,d);d.mediaSource_=this;d.addEventListener("updateend",shaka.polyfill.MediaSource.ignoreUpdateEnd_,!1);b||(this.addEventListener("sourceclose",shaka.polyfill.MediaSource.cleanUpListeners_,!1),b=!0);return d}};
shaka.polyfill.MediaSource.ignoreUpdateEnd_=function(a){var b=a.target,c=b.mediaSource_;if(c.ignoreUpdateEnd_){a.preventDefault();a.stopPropagation();a.stopImmediatePropagation();b.eventSuppressed_=!0;for(a=0;a<c.sourceBuffers.length;++a)if(0==c.sourceBuffers[a].eventSuppressed_)return;c.ignoreUpdateEnd_=!1}};
shaka.polyfill.MediaSource.cleanUpListeners_=function(a){a=a.target;for(var b=0;b<a.sourceBuffers.length;++b)a.sourceBuffers[b].removeEventListener("updateend",shaka.polyfill.MediaSource.ignoreUpdateEnd_,!1);a.removeEventListener("sourceclose",shaka.polyfill.MediaSource.cleanUpListeners_,!1)};shaka.polyfill.MediaSource.rejectTsContent_=function(){var a=MediaSource.isTypeSupported;MediaSource.isTypeSupported=function(b){return"mp2t"==b.split(/ *; */)[0].split("/")[1].toLowerCase()?!1:a(b)}};
shaka.polyfill.MediaSource.rejectCodec_=function(a){var b=MediaSource.isTypeSupported;MediaSource.isTypeSupported=function(c){return shaka.util.MimeUtils.getCodecBase(c)!=a&&b(c)}};
shaka.polyfill.MediaSource.patchCastIsTypeSupported_=function(){var a=MediaSource.isTypeSupported,b=/^dv(?:h[e1]|a[v1])\./;MediaSource.isTypeSupported=function(c){for(var d=c.split(/ *; */),e=d[0],f={},g=1;g<d.length;++g){var h=d[g].split("="),k=h[0];h=h[1].replace(/"(.*)"/,"$1");f[k]=h}d=f.codecs;if(!d)return a(c);var l=!1,m=!1;c=d.split(",").filter(function(a){b.test(a)&&(m=!0);/^(hev|hvc)1\.2/.test(a)&&(l=!0);return!0});m&&(l=!1);f.codecs=c.join(",");l&&(f.eotf="smpte2084");for(var n in f)e+="; "+
n+'="'+f[n]+'"';return cast.__platform__.canDisplayType(e)}};shaka.polyfill.register(shaka.polyfill.MediaSource.install);shaka.polyfill.PatchedMediaKeysMs={};
shaka.polyfill.PatchedMediaKeysMs.install=function(){if(window.HTMLVideoElement&&window.MSMediaKeys&&(!navigator.requestMediaKeySystemAccess||!MediaKeySystemAccess.prototype.getConfiguration)){shaka.log.info("Using ms-prefixed EME v20140218");var a=shaka.polyfill.PatchedMediaKeysMs;a.MediaKeyStatusMap.KEY_ID_=(new Uint8Array([0])).buffer;delete HTMLMediaElement.prototype.mediaKeys;HTMLMediaElement.prototype.mediaKeys=null;HTMLMediaElement.prototype.setMediaKeys=a.setMediaKeys;window.MediaKeys=a.MediaKeys;
window.MediaKeySystemAccess=a.MediaKeySystemAccess;navigator.requestMediaKeySystemAccess=a.requestMediaKeySystemAccess}};shaka.polyfill.PatchedMediaKeysMs.requestMediaKeySystemAccess=function(a,b){shaka.log.debug("PatchedMediaKeysMs.requestMediaKeySystemAccess");goog.asserts.assert(this==navigator,'bad "this" for requestMediaKeySystemAccess');var c=shaka.polyfill.PatchedMediaKeysMs;try{var d=new c.MediaKeySystemAccess(a,b);return Promise.resolve(d)}catch(e){return Promise.reject(e)}};
shaka.polyfill.PatchedMediaKeysMs.MediaKeySystemAccess=function(a,b){shaka.log.debug("PatchedMediaKeysMs.MediaKeySystemAccess");this.keySystem=a;for(var c=!1,d=0;d<b.length;++d){var e=b[d],f={audioCapabilities:[],videoCapabilities:[],persistentState:"optional",distinctiveIdentifier:"optional",initDataTypes:e.initDataTypes,sessionTypes:["temporary"],label:e.label},g=!1;if(e.audioCapabilities)for(var h=0;h<e.audioCapabilities.length;++h){var k=e.audioCapabilities[h];if(k.contentType){g=!0;var l=k.contentType.split(";")[0];
MSMediaKeys.isTypeSupported(this.keySystem,l)&&(f.audioCapabilities.push(k),c=!0)}}if(e.videoCapabilities)for(h=0;h<e.videoCapabilities.length;++h)k=e.videoCapabilities[h],k.contentType&&(g=!0,l=k.contentType.split(";")[0],MSMediaKeys.isTypeSupported(this.keySystem,l)&&(f.videoCapabilities.push(k),c=!0));g||(c=MSMediaKeys.isTypeSupported(this.keySystem,"video/mp4"));"required"==e.persistentState&&(c=!1);if(c){this.configuration_=f;return}}c=Error("Unsupported keySystem");c.name="NotSupportedError";
c.code=DOMException.NOT_SUPPORTED_ERR;throw c;};shaka.polyfill.PatchedMediaKeysMs.MediaKeySystemAccess.prototype.createMediaKeys=function(){shaka.log.debug("PatchedMediaKeysMs.MediaKeySystemAccess.createMediaKeys");var a=new shaka.polyfill.PatchedMediaKeysMs.MediaKeys(this.keySystem);return Promise.resolve(a)};shaka.polyfill.PatchedMediaKeysMs.MediaKeySystemAccess.prototype.getConfiguration=function(){shaka.log.debug("PatchedMediaKeysMs.MediaKeySystemAccess.getConfiguration");return this.configuration_};
shaka.polyfill.PatchedMediaKeysMs.setMediaKeys=function(a){shaka.log.debug("PatchedMediaKeysMs.setMediaKeys");goog.asserts.assert(this instanceof HTMLMediaElement,'bad "this" for setMediaKeys');var b=shaka.polyfill.PatchedMediaKeysMs,c=this.mediaKeys;c&&c!=a&&(goog.asserts.assert(c instanceof b.MediaKeys,"non-polyfill instance of oldMediaKeys"),c.setMedia(null));delete this.mediaKeys;return(this.mediaKeys=a)?(goog.asserts.assert(a instanceof b.MediaKeys,"non-polyfill instance of newMediaKeys"),a.setMedia(this)):
Promise.resolve()};shaka.polyfill.PatchedMediaKeysMs.MediaKeys=function(a){shaka.log.debug("PatchedMediaKeysMs.MediaKeys");this.nativeMediaKeys_=new MSMediaKeys(a);this.eventManager_=new shaka.util.EventManager};
shaka.polyfill.PatchedMediaKeysMs.MediaKeys.prototype.createSession=function(a){shaka.log.debug("PatchedMediaKeysMs.MediaKeys.createSession");a=a||"temporary";if("temporary"!=a)throw new TypeError("Session type "+a+" is unsupported on this platform.");return new shaka.polyfill.PatchedMediaKeysMs.MediaKeySession(this.nativeMediaKeys_,a)};shaka.polyfill.PatchedMediaKeysMs.MediaKeys.prototype.setServerCertificate=function(a){shaka.log.debug("PatchedMediaKeysMs.MediaKeys.setServerCertificate");return Promise.resolve(!1)};
shaka.polyfill.PatchedMediaKeysMs.MediaKeys.prototype.setMedia=function(a){function b(){a.msSetMediaKeys(d.nativeMediaKeys_);a.removeEventListener("loadedmetadata",b)}var c=shaka.polyfill.PatchedMediaKeysMs;this.eventManager_.removeAll();if(!a)return Promise.resolve();this.eventManager_.listen(a,"msneedkey",c.onMsNeedKey_);var d=this;try{return 1<=a.readyState?a.msSetMediaKeys(this.nativeMediaKeys_):a.addEventListener("loadedmetadata",b),Promise.resolve()}catch(e){return Promise.reject(e)}};
shaka.polyfill.PatchedMediaKeysMs.MediaKeySession=function(a,b){shaka.log.debug("PatchedMediaKeysMs.MediaKeySession");shaka.util.FakeEventTarget.call(this);this.nativeMediaKeySession_=null;this.nativeMediaKeys_=a;this.updatePromise_=this.generateRequestPromise_=null;this.eventManager_=new shaka.util.EventManager;this.sessionId="";this.expiration=NaN;this.closed=new shaka.util.PublicPromise;this.keyStatuses=new shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap};
goog.inherits(shaka.polyfill.PatchedMediaKeysMs.MediaKeySession,shaka.util.FakeEventTarget);
shaka.polyfill.PatchedMediaKeysMs.MediaKeySession.prototype.generateRequest=function(a,b){shaka.log.debug("PatchedMediaKeysMs.MediaKeySession.generateRequest");this.generateRequestPromise_=new shaka.util.PublicPromise;try{this.nativeMediaKeySession_=this.nativeMediaKeys_.createSession("video/mp4",new Uint8Array(b),null),this.eventManager_.listen(this.nativeMediaKeySession_,"mskeymessage",this.onMsKeyMessage_.bind(this)),this.eventManager_.listen(this.nativeMediaKeySession_,"mskeyadded",this.onMsKeyAdded_.bind(this)),
this.eventManager_.listen(this.nativeMediaKeySession_,"mskeyerror",this.onMsKeyError_.bind(this)),this.updateKeyStatus_("status-pending")}catch(c){this.generateRequestPromise_.reject(c)}return this.generateRequestPromise_};shaka.polyfill.PatchedMediaKeysMs.MediaKeySession.prototype.load=function(){shaka.log.debug("PatchedMediaKeysMs.MediaKeySession.load");return Promise.reject(Error("MediaKeySession.load not yet supported"))};
shaka.polyfill.PatchedMediaKeysMs.MediaKeySession.prototype.update=function(a){shaka.log.debug("PatchedMediaKeysMs.MediaKeySession.update");this.updatePromise_=new shaka.util.PublicPromise;try{this.nativeMediaKeySession_.update(new Uint8Array(a))}catch(b){this.updatePromise_.reject(b)}return this.updatePromise_};
shaka.polyfill.PatchedMediaKeysMs.MediaKeySession.prototype.close=function(){shaka.log.debug("PatchedMediaKeysMs.MediaKeySession.close");try{this.nativeMediaKeySession_.close(),this.closed.resolve(),this.eventManager_.removeAll()}catch(a){this.closed.reject(a)}return this.closed};shaka.polyfill.PatchedMediaKeysMs.MediaKeySession.prototype.remove=function(){shaka.log.debug("PatchedMediaKeysMs.MediaKeySession.remove");return Promise.reject(Error("MediaKeySession.remove is only applicable for persistent licenses, which are not supported on this platform"))};
shaka.polyfill.PatchedMediaKeysMs.onMsNeedKey_=function(a){shaka.log.debug("PatchedMediaKeysMs.onMsNeedKey_",a);if(a.initData){var b=shaka.polyfill.PatchedMediaKeysMs,c=document.createEvent("CustomEvent");c.initCustomEvent("encrypted",!1,!1,null);c.initDataType="cenc";c.initData=b.normaliseInitData_(a.initData);this.dispatchEvent(c)}};
shaka.polyfill.PatchedMediaKeysMs.normaliseInitData_=function(a){if(!a)return a;var b=new shaka.util.Pssh(a);if(1>=b.dataBoundaries.length)return a;for(var c=[],d=0;d<b.dataBoundaries.length;d++){var e=a.subarray(b.dataBoundaries[d].start,b.dataBoundaries[d].end+1);c.push(e)}a=[];b={};d=$jscomp.makeIterator(c);for(c=d.next();!c.done;b={initData$170:b.initData$170},c=d.next())b.initData$170=c.value,a.some(function(a){return function(b){return shaka.util.Uint8ArrayUtils.equal(b,a.initData$170)}}(b))||
a.push(b.initData$170);b=0;d=$jscomp.makeIterator(a);for(c=d.next();!c.done;c=d.next())b+=c.value.length;b=new Uint8Array(b);d=0;a=$jscomp.makeIterator(a);for(c=a.next();!c.done;c=a.next())c=c.value,b.set(c,d),d+=c.length;return b};
shaka.polyfill.PatchedMediaKeysMs.MediaKeySession.prototype.onMsKeyMessage_=function(a){shaka.log.debug("PatchedMediaKeysMs.onMsKeyMessage_",a);goog.asserts.assert(this.generateRequestPromise_,"generateRequestPromise_ not set in onMsKeyMessage_");this.generateRequestPromise_&&(this.generateRequestPromise_.resolve(),this.generateRequestPromise_=null);var b=void 0==this.keyStatuses.getStatus();a=new shaka.util.FakeEvent("message",{messageType:b?"license-request":"license-renewal",message:a.message.buffer});
this.dispatchEvent(a)};
shaka.polyfill.PatchedMediaKeysMs.MediaKeySession.prototype.onMsKeyAdded_=function(a){shaka.log.debug("PatchedMediaKeysMs.onMsKeyAdded_",a);this.generateRequestPromise_?(shaka.log.debug("Simulating completion for a PR persistent license."),goog.asserts.assert(!this.updatePromise_,"updatePromise_ and generateRequestPromise_ set in onMsKeyAdded_"),this.updateKeyStatus_("usable"),this.generateRequestPromise_.resolve(),this.generateRequestPromise_=null):(goog.asserts.assert(this.updatePromise_,"updatePromise_ not set in onMsKeyAdded_"),
this.updatePromise_&&(this.updateKeyStatus_("usable"),this.updatePromise_.resolve(),this.updatePromise_=null))};
shaka.polyfill.PatchedMediaKeysMs.MediaKeySession.prototype.onMsKeyError_=function(a){shaka.log.debug("PatchedMediaKeysMs.onMsKeyError_",a);a=Error("EME PatchedMediaKeysMs key error");a.errorCode=this.nativeMediaKeySession_.error;if(null!=this.generateRequestPromise_)this.generateRequestPromise_.reject(a),this.generateRequestPromise_=null;else if(null!=this.updatePromise_)this.updatePromise_.reject(a),this.updatePromise_=null;else switch(this.nativeMediaKeySession_.error.code){case MSMediaKeyError.MS_MEDIA_KEYERR_OUTPUT:case MSMediaKeyError.MS_MEDIA_KEYERR_HARDWARECHANGE:this.updateKeyStatus_("output-not-allowed");
break;default:this.updateKeyStatus_("internal-error")}};shaka.polyfill.PatchedMediaKeysMs.MediaKeySession.prototype.updateKeyStatus_=function(a){this.keyStatuses.setStatus(a);a=new shaka.util.FakeEvent("keystatuseschange");this.dispatchEvent(a)};shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap=function(){this.size=0;this.status_=void 0};shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap.prototype.setStatus=function(a){this.size=void 0==a?0:1;this.status_=a};
shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap.prototype.getStatus=function(){return this.status_};shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap.prototype.forEach=function(a){this.status_&&a(this.status_,shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap.KEY_ID_)};shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap.prototype.get=function(a){if(this.has(a))return this.status_};
shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap.prototype.has=function(a){var b=shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap.KEY_ID_;return this.status_&&shaka.util.Uint8ArrayUtils.equal(new Uint8Array(a),new Uint8Array(b))?!0:!1};shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap.prototype.entries=function(){goog.asserts.assert(!1,"Not used!  Provided only for the compiler.")};shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap.prototype.keys=function(){goog.asserts.assert(!1,"Not used!  Provided only for the compiler.")};
shaka.polyfill.PatchedMediaKeysMs.MediaKeyStatusMap.prototype.values=function(){goog.asserts.assert(!1,"Not used!  Provided only for the compiler.")};shaka.polyfill.register(shaka.polyfill.PatchedMediaKeysMs.install);shaka.polyfill.PatchedMediaKeysNop={};
shaka.polyfill.PatchedMediaKeysNop.install=function(){if(!(!window.HTMLVideoElement||navigator.requestMediaKeySystemAccess&&MediaKeySystemAccess.prototype.getConfiguration)){shaka.log.info("EME not available.");var a=shaka.polyfill.PatchedMediaKeysNop;navigator.requestMediaKeySystemAccess=a.requestMediaKeySystemAccess;delete HTMLMediaElement.prototype.mediaKeys;HTMLMediaElement.prototype.mediaKeys=null;HTMLMediaElement.prototype.setMediaKeys=a.setMediaKeys;window.MediaKeys=a.MediaKeys;window.MediaKeySystemAccess=
a.MediaKeySystemAccess}};shaka.polyfill.PatchedMediaKeysNop.requestMediaKeySystemAccess=function(a,b){shaka.log.debug("PatchedMediaKeysNop.requestMediaKeySystemAccess");goog.asserts.assert(this==navigator,'bad "this" for requestMediaKeySystemAccess');return Promise.reject(Error("The key system specified is not supported."))};
shaka.polyfill.PatchedMediaKeysNop.setMediaKeys=function(a){shaka.log.debug("PatchedMediaKeysNop.setMediaKeys");goog.asserts.assert(this instanceof HTMLMediaElement,'bad "this" for setMediaKeys');return null==a?Promise.resolve():Promise.reject(Error("MediaKeys not supported."))};shaka.polyfill.PatchedMediaKeysNop.MediaKeys=function(){throw new TypeError("Illegal constructor.");};shaka.polyfill.PatchedMediaKeysNop.MediaKeys.prototype.createSession=function(){};
shaka.polyfill.PatchedMediaKeysNop.MediaKeys.prototype.setServerCertificate=function(){};shaka.polyfill.PatchedMediaKeysNop.MediaKeySystemAccess=function(){throw new TypeError("Illegal constructor.");};shaka.polyfill.PatchedMediaKeysNop.MediaKeySystemAccess.prototype.getConfiguration=function(){};shaka.polyfill.PatchedMediaKeysNop.MediaKeySystemAccess.prototype.createMediaKeys=function(){};shaka.polyfill.register(shaka.polyfill.PatchedMediaKeysNop.install,-10);shaka.polyfill.PatchedMediaKeysWebkit={};shaka.polyfill.PatchedMediaKeysWebkit.prefix_="";
shaka.polyfill.PatchedMediaKeysWebkit.install=function(){var a=shaka.polyfill.PatchedMediaKeysWebkit,b=a.prefixApi_;if(!(!window.HTMLVideoElement||navigator.requestMediaKeySystemAccess&&MediaKeySystemAccess.prototype.getConfiguration)){if(HTMLMediaElement.prototype.webkitGenerateKeyRequest)shaka.log.info("Using webkit-prefixed EME v0.1b"),a.prefix_="webkit";else if(HTMLMediaElement.prototype.generateKeyRequest)shaka.log.info("Using nonprefixed EME v0.1b");else return;goog.asserts.assert(HTMLMediaElement.prototype[b("generateKeyRequest")],
"PatchedMediaKeysWebkit APIs not available!");a.MediaKeyStatusMap.KEY_ID_=(new Uint8Array([0])).buffer;navigator.requestMediaKeySystemAccess=a.requestMediaKeySystemAccess;delete HTMLMediaElement.prototype.mediaKeys;HTMLMediaElement.prototype.mediaKeys=null;HTMLMediaElement.prototype.setMediaKeys=a.setMediaKeys;window.MediaKeys=a.MediaKeys;window.MediaKeySystemAccess=a.MediaKeySystemAccess}};
shaka.polyfill.PatchedMediaKeysWebkit.prefixApi_=function(a){var b=shaka.polyfill.PatchedMediaKeysWebkit.prefix_;return b?b+a.charAt(0).toUpperCase()+a.slice(1):a};shaka.polyfill.PatchedMediaKeysWebkit.requestMediaKeySystemAccess=function(a,b){shaka.log.debug("PatchedMediaKeysWebkit.requestMediaKeySystemAccess");goog.asserts.assert(this==navigator,'bad "this" for requestMediaKeySystemAccess');var c=shaka.polyfill.PatchedMediaKeysWebkit;try{var d=new c.MediaKeySystemAccess(a,b);return Promise.resolve(d)}catch(e){return Promise.reject(e)}};
shaka.polyfill.PatchedMediaKeysWebkit.setMediaKeys=function(a){shaka.log.debug("PatchedMediaKeysWebkit.setMediaKeys");goog.asserts.assert(this instanceof HTMLMediaElement,'bad "this" for setMediaKeys');var b=shaka.polyfill.PatchedMediaKeysWebkit,c=this.mediaKeys;c&&c!=a&&(goog.asserts.assert(c instanceof b.MediaKeys,"non-polyfill instance of oldMediaKeys"),c.setMedia(null));delete this.mediaKeys;if(this.mediaKeys=a)goog.asserts.assert(a instanceof b.MediaKeys,"non-polyfill instance of newMediaKeys"),
a.setMedia(this);return Promise.resolve()};shaka.polyfill.PatchedMediaKeysWebkit.getVideoElement_=function(){var a=document.getElementsByTagName("video");return a.length?a[0]:document.createElement("video")};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySystemAccess=function(a,b){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySystemAccess");this.internalKeySystem_=this.keySystem=a;var c=!1;"org.w3.clearkey"==a&&(this.internalKeySystem_="webkit-org.w3.clearkey",c=!1);for(var d=!1,e=shaka.polyfill.PatchedMediaKeysWebkit.getVideoElement_(),f=0;f<b.length;++f){var g=b[f],h={audioCapabilities:[],videoCapabilities:[],persistentState:"optional",distinctiveIdentifier:"optional",initDataTypes:g.initDataTypes,
sessionTypes:["temporary"],label:g.label},k=!1;if(g.audioCapabilities)for(var l=0;l<g.audioCapabilities.length;++l){var m=g.audioCapabilities[l];if(m.contentType){k=!0;var n=m.contentType.split(";")[0];e.canPlayType(n,this.internalKeySystem_)&&(h.audioCapabilities.push(m),d=!0)}}if(g.videoCapabilities)for(l=0;l<g.videoCapabilities.length;++l)m=g.videoCapabilities[l],m.contentType&&(k=!0,e.canPlayType(m.contentType,this.internalKeySystem_)&&(h.videoCapabilities.push(m),d=!0));k||(d=e.canPlayType("video/mp4",
this.internalKeySystem_)||e.canPlayType("video/webm",this.internalKeySystem_));"required"==g.persistentState&&(c?(h.persistentState="required",h.sessionTypes=["persistent-license"]):d=!1);if(d){this.configuration_=h;return}}c="Unsupported keySystem";if("org.w3.clearkey"==a||"com.widevine.alpha"==a)c="None of the requested configurations were supported.";c=Error(c);c.name="NotSupportedError";c.code=DOMException.NOT_SUPPORTED_ERR;throw c;};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySystemAccess.prototype.createMediaKeys=function(){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySystemAccess.createMediaKeys");var a=new shaka.polyfill.PatchedMediaKeysWebkit.MediaKeys(this.internalKeySystem_);return Promise.resolve(a)};shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySystemAccess.prototype.getConfiguration=function(){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySystemAccess.getConfiguration");return this.configuration_};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeys=function(a){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeys");this.keySystem_=a;this.media_=null;this.eventManager_=new shaka.util.EventManager;this.newSessions_=[];this.sessionMap_={}};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeys.prototype.setMedia=function(a){this.media_=a;this.eventManager_.removeAll();var b=shaka.polyfill.PatchedMediaKeysWebkit.prefix_;a&&(this.eventManager_.listen(a,b+"needkey",this.onWebkitNeedKey_.bind(this)),this.eventManager_.listen(a,b+"keymessage",this.onWebkitKeyMessage_.bind(this)),this.eventManager_.listen(a,b+"keyadded",this.onWebkitKeyAdded_.bind(this)),this.eventManager_.listen(a,b+"keyerror",this.onWebkitKeyError_.bind(this)))};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeys.prototype.createSession=function(a){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeys.createSession");a=a||"temporary";if("temporary"!=a&&"persistent-license"!=a)throw new TypeError("Session type "+a+" is unsupported on this platform.");var b=shaka.polyfill.PatchedMediaKeysWebkit,c=this.media_||document.createElement("video");c.src||(c.src="about:blank");a=new b.MediaKeySession(c,this.keySystem_,a);this.newSessions_.push(a);return a};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeys.prototype.setServerCertificate=function(a){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeys.setServerCertificate");return Promise.resolve(!1)};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeys.prototype.onWebkitNeedKey_=function(a){shaka.log.debug("PatchedMediaKeysWebkit.onWebkitNeedKey_",a);goog.asserts.assert(this.media_,"media_ not set in onWebkitNeedKey_");var b=document.createEvent("CustomEvent");b.initCustomEvent("encrypted",!1,!1,null);b.initDataType="webm";b.initData=a.initData;this.media_.dispatchEvent(b)};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeys.prototype.onWebkitKeyMessage_=function(a){shaka.log.debug("PatchedMediaKeysWebkit.onWebkitKeyMessage_",a);var b=this.findSession_(a.sessionId);if(b){var c=void 0==b.keyStatuses.getStatus();a=new shaka.util.FakeEvent("message",{messageType:c?"licenserequest":"licenserenewal",message:a.message});b.generated();b.dispatchEvent(a)}else shaka.log.error("Session not found",a.sessionId)};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeys.prototype.onWebkitKeyAdded_=function(a){shaka.log.debug("PatchedMediaKeysWebkit.onWebkitKeyAdded_",a);a=this.findSession_(a.sessionId);goog.asserts.assert(a,"unable to find session in onWebkitKeyAdded_");a&&a.ready()};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeys.prototype.onWebkitKeyError_=function(a){shaka.log.debug("PatchedMediaKeysWebkit.onWebkitKeyError_",a);var b=this.findSession_(a.sessionId);goog.asserts.assert(b,"unable to find session in onWebkitKeyError_");b&&b.handleError(a)};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeys.prototype.findSession_=function(a){var b=this.sessionMap_[a];return b?(shaka.log.debug("PatchedMediaKeysWebkit.MediaKeys.findSession_",b),b):(b=this.newSessions_.shift())?(b.sessionId=a,this.sessionMap_[a]=b,shaka.log.debug("PatchedMediaKeysWebkit.MediaKeys.findSession_",b),b):null};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession=function(a,b,c){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySession");shaka.util.FakeEventTarget.call(this);this.media_=a;this.initialized_=!1;this.updatePromise_=this.generatePromise_=null;this.keySystem_=b;this.type_=c;this.sessionId="";this.expiration=NaN;this.closed=new shaka.util.PublicPromise;this.keyStatuses=new shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap};
goog.inherits(shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession,shaka.util.FakeEventTarget);shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession.prototype.generated=function(){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySession.generated");this.generatePromise_&&(this.generatePromise_.resolve(),this.generatePromise_=null)};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession.prototype.ready=function(){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySession.ready");this.updateKeyStatus_("usable");this.updatePromise_&&this.updatePromise_.resolve();this.updatePromise_=null};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession.prototype.handleError=function(a){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySession.handleError",a);var b=Error("EME v0.1b key error");b.errorCode=a.errorCode;b.errorCode.systemCode=a.systemCode;!a.sessionId&&this.generatePromise_?(b.method="generateRequest",45==a.systemCode&&(b.message="Unsupported session type."),this.generatePromise_.reject(b),this.generatePromise_=null):a.sessionId&&this.updatePromise_?(b.method="update",this.updatePromise_.reject(b),
this.updatePromise_=null):(b=a.systemCode,a.errorCode.code==MediaKeyError.MEDIA_KEYERR_OUTPUT?this.updateKeyStatus_("output-restricted"):1==b?this.updateKeyStatus_("expired"):this.updateKeyStatus_("internal-error"))};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession.prototype.generate_=function(a,b){var c=this;if(this.initialized_)return Promise.reject(Error("The session is already initialized."));this.initialized_=!0;try{if("persistent-license"==this.type_){var d=shaka.util.StringUtils;if(b)var e=new Uint8Array(d.toUTF8("LOAD_SESSION|"+b));else{var f=d.toUTF8("PERSISTENT|"),g=new Uint8Array(f.byteLength+a.byteLength);g.set(new Uint8Array(f),0);g.set(new Uint8Array(a),f.byteLength);e=g}}else goog.asserts.assert("temporary"==
this.type_,"expected temporary session"),goog.asserts.assert(!b,"unexpected offline session ID"),e=new Uint8Array(a);goog.asserts.assert(e,"init data not set!")}catch(k){return Promise.reject(k)}goog.asserts.assert(null==this.generatePromise_,"generatePromise_ should be null");this.generatePromise_=new shaka.util.PublicPromise;d=shaka.polyfill.PatchedMediaKeysWebkit.prefixApi_;var h=d("generateKeyRequest");try{this.media_[h](this.keySystem_,e)}catch(k){if("InvalidStateError"!=k.name)return this.generatePromise_=
null,Promise.reject(k);(new shaka.util.Timer(function(){try{c.media_[h](c.keySystem_,e)}catch(l){c.generatePromise_.reject(l),c.generatePromise_=null}})).tickAfter(.01)}return this.generatePromise_};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession.prototype.update_=function(a,b){if(this.updatePromise_)this.updatePromise_.then(this.update_.bind(this,a,b))["catch"](this.update_.bind(this,a,b));else{this.updatePromise_=a;if("webkit-org.w3.clearkey"==this.keySystem_){var c=shaka.util.Uint8ArrayUtils;var d=shaka.util.StringUtils.fromUTF8(b);var e=JSON.parse(d);"oct"!=e.keys[0].kty&&(this.updatePromise_.reject(Error("Response is not a valid JSON Web Key Set.")),this.updatePromise_=null);d=c.fromBase64(e.keys[0].k);
c=c.fromBase64(e.keys[0].kid)}else d=new Uint8Array(b),c=null;e=shaka.polyfill.PatchedMediaKeysWebkit.prefixApi_;e=e("addKey");try{this.media_[e](this.keySystem_,d,c,this.sessionId)}catch(f){this.updatePromise_.reject(f),this.updatePromise_=null}}};shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession.prototype.updateKeyStatus_=function(a){this.keyStatuses.setStatus(a);a=new shaka.util.FakeEvent("keystatuseschange");this.dispatchEvent(a)};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession.prototype.generateRequest=function(a,b){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySession.generateRequest");return this.generate_(b,null)};shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession.prototype.load=function(a){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySession.load");return"persistent-license"==this.type_?this.generate_(null,a):Promise.reject(Error("Not a persistent session."))};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession.prototype.update=function(a){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySession.update",a);goog.asserts.assert(this.sessionId,"update without session ID");var b=new shaka.util.PublicPromise;this.update_(b,a);return b};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession.prototype.close=function(){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySession.close");if("persistent-license"!=this.type_){if(!this.sessionId)return this.closed.reject(Error("The session is not callable.")),this.closed;var a=shaka.polyfill.PatchedMediaKeysWebkit.prefixApi_;a=a("cancelKeyRequest");try{this.media_[a](this.keySystem_,this.sessionId)}catch(b){}}this.closed.resolve();return this.closed};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeySession.prototype.remove=function(){shaka.log.debug("PatchedMediaKeysWebkit.MediaKeySession.remove");return"persistent-license"!=this.type_?Promise.reject(Error("Not a persistent session.")):this.close()};shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap=function(){this.size=0;this.status_=void 0};shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap.prototype.setStatus=function(a){this.size=void 0==a?0:1;this.status_=a};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap.prototype.getStatus=function(){return this.status_};shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap.prototype.forEach=function(a){this.status_&&a(this.status_,shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap.KEY_ID_)};shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap.prototype.get=function(a){if(this.has(a))return this.status_};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap.prototype.has=function(a){var b=shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap.KEY_ID_;return this.status_&&shaka.util.Uint8ArrayUtils.equal(new Uint8Array(a),new Uint8Array(b))?!0:!1};shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap.prototype.entries=function(){goog.asserts.assert(!1,"Not used!  Provided only for compiler.")};
shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap.prototype.keys=function(){goog.asserts.assert(!1,"Not used!  Provided only for compiler.")};shaka.polyfill.PatchedMediaKeysWebkit.MediaKeyStatusMap.prototype.values=function(){goog.asserts.assert(!1,"Not used!  Provided only for compiler.")};shaka.polyfill.register(shaka.polyfill.PatchedMediaKeysWebkit.install);shaka.polyfill.VideoPlayPromise={};shaka.polyfill.VideoPlayPromise.install=function(){shaka.log.debug("VideoPlayPromise.install");if(window.HTMLMediaElement){var a=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){var b=a.apply(this);b&&b["catch"](function(){});return b}}};shaka.polyfill.register(shaka.polyfill.VideoPlayPromise.install);shaka.polyfill.VideoPlaybackQuality={};shaka.polyfill.VideoPlaybackQuality.install=function(){if(window.HTMLVideoElement){var a=HTMLVideoElement.prototype;!a.getVideoPlaybackQuality&&"webkitDroppedFrameCount"in a&&(a.getVideoPlaybackQuality=shaka.polyfill.VideoPlaybackQuality.webkit_)}};shaka.polyfill.VideoPlaybackQuality.webkit_=function(){return{droppedVideoFrames:this.webkitDroppedFrameCount,totalVideoFrames:this.webkitDecodedFrameCount,corruptedVideoFrames:0,creationTime:NaN,totalFrameDelay:0}};
shaka.polyfill.register(shaka.polyfill.VideoPlaybackQuality.install);shaka.polyfill.VTTCue={};
shaka.polyfill.VTTCue.install=function(){if(window.VTTCue)shaka.log.info("Using native VTTCue.");else if(window.TextTrackCue){var a=TextTrackCue.length;3==a?(shaka.log.info("Using VTTCue polyfill from 3 argument TextTrackCue."),window.VTTCue=shaka.polyfill.VTTCue.from3ArgsTextTrackCue_):6==a?(shaka.log.info("Using VTTCue polyfill from 6 argument TextTrackCue."),window.VTTCue=shaka.polyfill.VTTCue.from6ArgsTextTrackCue_):shaka.polyfill.VTTCue.canUse3ArgsTextTrackCue_()&&(shaka.log.info("Using VTTCue polyfill from 3 argument TextTrackCue."),window.VTTCue=
shaka.polyfill.VTTCue.from3ArgsTextTrackCue_)}else shaka.log.error("VTTCue not available.")};shaka.polyfill.VTTCue.from3ArgsTextTrackCue_=function(a,b,c){return new window.TextTrackCue(a,b,c)};shaka.polyfill.VTTCue.from6ArgsTextTrackCue_=function(a,b,c){return new window.TextTrackCue(a+"-"+b+"-"+c,a,b,c)};shaka.polyfill.VTTCue.canUse3ArgsTextTrackCue_=function(){try{return!!shaka.polyfill.VTTCue.from3ArgsTextTrackCue_(1,2,"")}catch(a){return!1}};shaka.polyfill.register(shaka.polyfill.VTTCue.install);shaka.text.TtmlTextParser=function(){};shaka.text.TtmlTextParser.parameterNs_="http://www.w3.org/ns/ttml#parameter";shaka.text.TtmlTextParser.styleNs_="http://www.w3.org/ns/ttml#styling";shaka.text.TtmlTextParser.prototype.parseInit=function(a){goog.asserts.assert(!1,"TTML does not have init segments")};
shaka.text.TtmlTextParser.prototype.parseMedia=function(a,b){var c=shaka.text.TtmlTextParser,d=shaka.util.XmlUtils,e=c.parameterNs_,f=shaka.util.StringUtils.fromUTF8(a),g=[],h=new DOMParser,k=null;try{k=h.parseFromString(f,"text/xml")}catch(r){throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_XML);}if(k){if(f=k.getElementsByTagName("tt")[0]){h=d.getAttributeNS(f,e,"frameRate");k=d.getAttributeNS(f,e,"subFrameRate");var l=d.getAttributeNS(f,
e,"frameRateMultiplier");var m=d.getAttributeNS(f,e,"tickRate");d=f.getAttribute("xml:space")||"default";e=f.getAttribute("tts:extent")}else throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_XML);if("default"!=d&&"preserve"!=d)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_XML);d="default"==d;h=new c.RateInfo_(h,k,l,m);k=c.getLeafNodes_(f.getElementsByTagName("metadata")[0]);
l=c.getLeafNodes_(f.getElementsByTagName("styling")[0]);m=c.getLeafNodes_(f.getElementsByTagName("layout")[0]);for(var n=[],q=0;q<m.length;q++){var p=c.parseCueRegion_(m[q],l,e);p&&n.push(p)}f=c.getLeafNodes_(f.getElementsByTagName("body")[0]);for(e=0;e<f.length;e++)(q=c.parseCue_(f[e],b.periodStart,h,k,l,m,n,d))&&g.push(q)}return g};shaka.text.TtmlTextParser.percentValues_=/^(\d{1,2}|100)% (\d{1,2}|100)%$/;shaka.text.TtmlTextParser.unitValues_=/^(\d+px|\d+em)$/;
shaka.text.TtmlTextParser.pixelValues_=/^(\d+)px (\d+)px$/;shaka.text.TtmlTextParser.timeColonFormatFrames_=/^(\d{2,}):(\d{2}):(\d{2}):(\d{2})\.?(\d+)?$/;shaka.text.TtmlTextParser.timeColonFormat_=/^(?:(\d{2,}):)?(\d{2}):(\d{2})$/;shaka.text.TtmlTextParser.timeColonFormatMilliseconds_=/^(?:(\d{2,}):)?(\d{2}):(\d{2}\.\d{2,})$/;shaka.text.TtmlTextParser.timeFramesFormat_=/^(\d*(?:\.\d*)?)f$/;shaka.text.TtmlTextParser.timeTickFormat_=/^(\d*(?:\.\d*)?)t$/;shaka.text.TtmlTextParser.timeHMSFormat_=/^(?:(\d*(?:\.\d*)?)h)?(?:(\d*(?:\.\d*)?)m)?(?:(\d*(?:\.\d*)?)s)?(?:(\d*(?:\.\d*)?)ms)?$/;
shaka.text.TtmlTextParser.textAlignToLineAlign_={left:shaka.text.Cue.lineAlign.START,center:shaka.text.Cue.lineAlign.CENTER,right:shaka.text.Cue.lineAlign.END,start:shaka.text.Cue.lineAlign.START,end:shaka.text.Cue.lineAlign.END};shaka.text.TtmlTextParser.textAlignToPositionAlign_={left:shaka.text.Cue.positionAlign.LEFT,center:shaka.text.Cue.positionAlign.CENTER,right:shaka.text.Cue.positionAlign.RIGHT};
shaka.text.TtmlTextParser.getLeafNodes_=function(a){var b=[];if(!a)return b;for(var c=a.childNodes,d=0;d<c.length;d++){var e="span"==c[d].nodeName&&"p"==a.nodeName;c[d].nodeType!=Node.ELEMENT_NODE||"br"==c[d].nodeName||e||(goog.asserts.assert(c[d]instanceof Element,"Node should be Element!"),e=shaka.text.TtmlTextParser.getLeafNodes_(c[d]),goog.asserts.assert(0<e.length,"Only a null Element should return no leaves!"),b=b.concat(e))}b.length||b.push(a);return b};
shaka.text.TtmlTextParser.addNewLines_=function(a,b){for(var c=a.childNodes,d=0;d<c.length;d++)if("br"==c[d].nodeName&&0<d)c[d-1].textContent+="\n";else if(0<c[d].childNodes.length)shaka.text.TtmlTextParser.addNewLines_(c[d],b);else if(b){var e=c[d].textContent.trim();e=e.replace(/\s+/g," ");c[d].textContent=e}};
shaka.text.TtmlTextParser.parseCue_=function(a,b,c,d,e,f,g,h){if(!a.hasAttribute("begin")&&!a.hasAttribute("end")&&/^\s*$/.test(a.textContent))return null;shaka.text.TtmlTextParser.addNewLines_(a,h);h=shaka.text.TtmlTextParser.parseTime_(a.getAttribute("begin"),c);var k=shaka.text.TtmlTextParser.parseTime_(a.getAttribute("end"),c);c=shaka.text.TtmlTextParser.parseTime_(a.getAttribute("dur"),c);var l=a.textContent;null==k&&null!=c&&(k=h+c);if(null==h||null==k)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,
shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_TEXT_CUE);b=new shaka.text.Cue(h+b,k+b,l);if((f=shaka.text.TtmlTextParser.getElementFromCollection_(a,"region",f,""))&&f.getAttribute("xml:id")){var m=f.getAttribute("xml:id");g=g.filter(function(a){return a.id==m});b.region=g[0]}d=shaka.text.TtmlTextParser.getElementFromCollection_(a,"smpte:backgroundImage",d,"#");shaka.text.TtmlTextParser.addStyle_(b,a,f,d,e);return b};
shaka.text.TtmlTextParser.parseCueRegion_=function(a,b,c){var d=shaka.text.TtmlTextParser,e=new shaka.text.CueRegion,f=a.getAttribute("xml:id");if(!f)return shaka.log.warning("TtmlTextParser parser encountered a region with no id. Region will be ignored."),null;e.id=f;f=null;c&&(f=d.percentValues_.exec(c)||d.pixelValues_.exec(c));c=f?Number(f[1]):null;f=f?Number(f[2]):null;var g,h;if(g=d.getStyleAttributeFromRegion_(a,b,"extent"))g=(h=d.percentValues_.exec(g))||d.pixelValues_.exec(g),null!=g&&(e.width=
null!=c?100*Number(g[1])/c:Number(g[1]),e.height=null!=f?100*Number(g[2])/f:Number(g[2]),e.widthUnits=h||null!=c?shaka.text.CueRegion.units.PERCENTAGE:shaka.text.CueRegion.units.PX,e.heightUnits=h||null!=f?shaka.text.CueRegion.units.PERCENTAGE:shaka.text.CueRegion.units.PX);if(a=d.getStyleAttributeFromRegion_(a,b,"origin"))g=(h=d.percentValues_.exec(a))||d.pixelValues_.exec(a),null!=g&&(e.viewportAnchorX=null!=f?100*Number(g[1])/f:Number(g[1]),e.viewportAnchorY=null!=c?100*Number(g[2])/c:Number(g[2]),
e.viewportAnchorUnits=h||null!=c?shaka.text.CueRegion.units.PERCENTAGE:shaka.text.CueRegion.units.PX);return e};
shaka.text.TtmlTextParser.addStyle_=function(a,b,c,d,e){var f=shaka.text.TtmlTextParser,g=shaka.text.Cue;"rtl"==f.getStyleAttribute_(b,c,e,"direction")&&(a.direction=g.direction.HORIZONTAL_RIGHT_TO_LEFT);var h=f.getStyleAttribute_(b,c,e,"writingMode");"tb"==h||"tblr"==h?a.writingMode=g.writingMode.VERTICAL_LEFT_TO_RIGHT:"tbrl"==h?a.writingMode=g.writingMode.VERTICAL_RIGHT_TO_LEFT:"rltb"==h||"rl"==h?a.direction=g.direction.HORIZONTAL_RIGHT_TO_LEFT:h&&(a.direction=g.direction.HORIZONTAL_LEFT_TO_RIGHT);
if(h=f.getStyleAttribute_(b,c,e,"textAlign"))a.positionAlign=f.textAlignToPositionAlign_[h],a.lineAlign=f.textAlignToLineAlign_[h],goog.asserts.assert(h.toUpperCase()in g.textAlign,h.toUpperCase()+" Should be in Cue.textAlign values!"),a.textAlign=g.textAlign[h.toUpperCase()];if(h=f.getStyleAttribute_(b,c,e,"displayAlign"))goog.asserts.assert(h.toUpperCase()in g.displayAlign,h.toUpperCase()+" Should be in Cue.displayAlign values!"),a.displayAlign=g.displayAlign[h.toUpperCase()];if(h=f.getStyleAttribute_(b,
c,e,"color"))a.color=h;if(h=f.getStyleAttribute_(b,c,e,"backgroundColor"))a.backgroundColor=h;if(h=f.getStyleAttribute_(b,c,e,"fontFamily"))a.fontFamily=h;(h=f.getStyleAttribute_(b,c,e,"fontWeight"))&&"bold"==h&&(a.fontWeight=g.fontWeight.BOLD);(h=f.getStyleAttribute_(b,c,e,"wrapOption"))&&"noWrap"==h&&(a.wrapLine=!1);(h=f.getStyleAttribute_(b,c,e,"lineHeight"))&&h.match(f.unitValues_)&&(a.lineHeight=h);(h=f.getStyleAttribute_(b,c,e,"fontSize"))&&h.match(f.unitValues_)&&(a.fontSize=h);if(h=f.getStyleAttribute_(b,
c,e,"fontStyle"))goog.asserts.assert(h.toUpperCase()in g.fontStyle,h.toUpperCase()+" Should be in Cue.fontStyle values!"),a.fontStyle=g.fontStyle[h.toUpperCase()];d&&(g=d.getAttribute("imagetype"),h=d.getAttribute("encoding"),d=d.textContent.trim(),"PNG"==g&&"Base64"==h&&d&&(a.backgroundImage="data:image/png;base64,"+d));(c=f.getStyleAttributeFromRegion_(c,e,"textDecoration"))&&f.addTextDecoration_(a,c);(b=f.getStyleAttributeFromElement_(b,e,"textDecoration"))&&f.addTextDecoration_(a,b)};
shaka.text.TtmlTextParser.addTextDecoration_=function(a,b){for(var c=shaka.text.Cue,d=b.split(" "),e=0;e<d.length;e++)switch(d[e]){case "underline":a.textDecoration.includes(c.textDecoration.UNDERLINE)||a.textDecoration.push(c.textDecoration.UNDERLINE);break;case "noUnderline":a.textDecoration.includes(c.textDecoration.UNDERLINE)&&shaka.util.ArrayUtils.remove(a.textDecoration,c.textDecoration.UNDERLINE);break;case "lineThrough":a.textDecoration.includes(c.textDecoration.LINE_THROUGH)||a.textDecoration.push(c.textDecoration.LINE_THROUGH);
break;case "noLineThrough":a.textDecoration.includes(c.textDecoration.LINE_THROUGH)&&shaka.util.ArrayUtils.remove(a.textDecoration,c.textDecoration.LINE_THROUGH);break;case "overline":a.textDecoration.includes(c.textDecoration.OVERLINE)||a.textDecoration.push(c.textDecoration.OVERLINE);break;case "noOverline":a.textDecoration.includes(c.textDecoration.OVERLINE)&&shaka.util.ArrayUtils.remove(a.textDecoration,c.textDecoration.OVERLINE)}};
shaka.text.TtmlTextParser.getStyleAttribute_=function(a,b,c,d){var e=shaka.text.TtmlTextParser;return(a=e.getStyleAttributeFromElement_(a,c,d))?a:e.getStyleAttributeFromRegion_(b,c,d)};
shaka.text.TtmlTextParser.getStyleAttributeFromRegion_=function(a,b,c){for(var d=shaka.util.XmlUtils,e=shaka.text.TtmlTextParser.styleNs_,f=shaka.text.TtmlTextParser.getLeafNodes_(a),g=0;g<f.length;g++){var h=d.getAttributeNS(f[g],e,c);if(h)return h}return(a=shaka.text.TtmlTextParser.getElementFromCollection_(a,"style",b,""))?d.getAttributeNS(a,e,c):null};
shaka.text.TtmlTextParser.getStyleAttributeFromElement_=function(a,b,c){var d=shaka.util.XmlUtils,e=shaka.text.TtmlTextParser.styleNs_,f=shaka.text.TtmlTextParser.getElementFromCollection_;return(a=f(a,"style",b,""))?d.getAttributeNS(a,e,c):null};shaka.text.TtmlTextParser.getElementFromCollection_=function(a,b,c,d){if(!a||1>c.length)return null;var e=null;if(a=shaka.text.TtmlTextParser.getInheritedAttribute_(a,b))for(b=0;b<c.length;b++)if(d+c[b].getAttribute("xml:id")==a){e=c[b];break}return e};
shaka.text.TtmlTextParser.getInheritedAttribute_=function(a,b){for(var c=null;a&&!(c=a.getAttribute(b));){var d=a.parentNode;if(d instanceof Element)a=d;else break}return c};
shaka.text.TtmlTextParser.parseTime_=function(a,b){var c=null,d=shaka.text.TtmlTextParser;d.timeColonFormatFrames_.test(a)?c=d.parseColonTimeWithFrames_(b,a):d.timeColonFormat_.test(a)?c=d.parseTimeFromRegex_(d.timeColonFormat_,a):d.timeColonFormatMilliseconds_.test(a)?c=d.parseTimeFromRegex_(d.timeColonFormatMilliseconds_,a):d.timeFramesFormat_.test(a)?c=d.parseFramesTime_(b,a):d.timeTickFormat_.test(a)?c=d.parseTickTime_(b,a):d.timeHMSFormat_.test(a)&&(c=d.parseTimeFromRegex_(d.timeHMSFormat_,a));
return c};shaka.text.TtmlTextParser.parseFramesTime_=function(a,b){var c=shaka.text.TtmlTextParser.timeFramesFormat_.exec(b);return Number(c[1])/a.frameRate};shaka.text.TtmlTextParser.parseTickTime_=function(a,b){var c=shaka.text.TtmlTextParser.timeTickFormat_.exec(b);return Number(c[1])/a.tickRate};
shaka.text.TtmlTextParser.parseColonTimeWithFrames_=function(a,b){var c=shaka.text.TtmlTextParser.timeColonFormatFrames_.exec(b),d=Number(c[1]),e=Number(c[2]),f=Number(c[3]),g=Number(c[4]);g+=(Number(c[5])||0)/a.subFrameRate;f+=g/a.frameRate;return f+60*e+3600*d};shaka.text.TtmlTextParser.parseTimeFromRegex_=function(a,b){var c=a.exec(b);return null==c||""==c[0]?null:(Number(c[4])||0)/1E3+(Number(c[3])||0)+60*(Number(c[2])||0)+3600*(Number(c[1])||0)};
shaka.text.TtmlTextParser.RateInfo_=function(a,b,c,d){this.frameRate=Number(a)||30;this.subFrameRate=Number(b)||1;this.tickRate=Number(d);0==this.tickRate&&(this.tickRate=a?this.frameRate*this.subFrameRate:1);c&&(a=/^(\d+) (\d+)$/g.exec(c))&&(this.frameRate*=Number(a[1])/Number(a[2]))};shaka.text.TextEngine.registerParser("application/ttml+xml",shaka.text.TtmlTextParser);shaka.text.Mp4TtmlParser=function(){this.parser_=new shaka.text.TtmlTextParser};
shaka.text.Mp4TtmlParser.prototype.parseInit=function(a){var b=shaka.util.Mp4Parser,c=!1;(new b).box("moov",b.children).box("trak",b.children).box("mdia",b.children).box("minf",b.children).box("stbl",b.children).fullBox("stsd",b.sampleDescription).box("stpp",function(a){c=!0;a.parser.stop()}).parse(a);if(!c)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_MP4_TTML);};
shaka.text.Mp4TtmlParser.prototype.parseMedia=function(a,b){var c=shaka.util.Mp4Parser,d=!1,e=[];(new c).box("mdat",c.allData(function(a){d=!0;e=e.concat(this.parser_.parseMedia(a,b))}.bind(this))).parse(a);if(!d)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_MP4_TTML);return e};shaka.text.TextEngine.registerParser('application/mp4; codecs="stpp"',shaka.text.Mp4TtmlParser);
shaka.text.TextEngine.registerParser('application/mp4; codecs="stpp.TTML.im1t"',shaka.text.Mp4TtmlParser);shaka.util.TextParser=function(a){this.data_=a;this.position_=0};shaka.util.TextParser.prototype.atEnd=function(){return this.position_==this.data_.length};shaka.util.TextParser.prototype.readLine=function(){return this.readRegexReturnCapture_(/(.*?)(\n|$)/gm,1)};shaka.util.TextParser.prototype.readWord=function(){return this.readRegexReturnCapture_(/[^ \t\n]*/gm,0)};shaka.util.TextParser.prototype.skipWhitespace=function(){this.readRegex(/[ \t]+/gm)};
shaka.util.TextParser.prototype.readRegex=function(a){a=this.indexOf_(a);if(this.atEnd()||null==a||a.position!=this.position_)return null;this.position_+=a.length;return a.results};shaka.util.TextParser.prototype.readRegexReturnCapture_=function(a,b){if(this.atEnd())return null;var c=this.readRegex(a);return c?c[b]:null};
shaka.util.TextParser.prototype.indexOf_=function(a){goog.asserts.assert(a.global,"global flag should be set");a.lastIndex=this.position_;a=a.exec(this.data_);return null==a?null:{position:a.index,length:a[0].length,results:a}};shaka.text.VttTextParser=function(){};shaka.text.VttTextParser.prototype.parseInit=function(a){goog.asserts.assert(!1,"VTT does not have init segments")};
shaka.text.VttTextParser.prototype.parseMedia=function(a,b){var c=shaka.text.VttTextParser,d=shaka.util.StringUtils.fromUTF8(a);d=d.replace(/\r\n|\r(?=[^\n]|$)/gm,"\n");d=d.split(/\n{2,}/m);if(!/^WEBVTT($|[ \t\n])/m.test(d[0]))throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_TEXT_HEADER);var e=b.segmentStart;if(null==e&&(e=0,d[0].includes("X-TIMESTAMP-MAP"))){var f=d[0].match(/LOCAL:((?:(\d{1,}):)?(\d{2}):(\d{2})\.(\d{3}))/m),
g=d[0].match(/MPEGTS:(\d+)/m);if(f&&g){e=new shaka.util.TextParser(f[1]);e=shaka.text.VttTextParser.parseTime_(e);if(null==e)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_TEXT_HEADER);e=b.periodStart+(Number(g[1])/shaka.text.VttTextParser.MPEG_TIMESCALE_-e)}}g=[];f=d[0].split("\n");for(var h=1;h<f.length;h++)if(/^Region:/.test(f[h])){var k=c.parseRegion_(f[h]);g.push(k)}h=[];for(k=1;k<d.length;k++)f=d[k].split("\n"),(f=c.parseCue_(f,
e,g))&&h.push(f);return h};shaka.text.VttTextParser.parseRegion_=function(a){var b=shaka.text.VttTextParser;a=new shaka.util.TextParser(a);var c=new shaka.text.CueRegion;a.readWord();a.skipWhitespace();for(var d=a.readWord();d;)b.parseRegionSetting_(c,d)||shaka.log.warning("VTT parser encountered an invalid VTTRegion setting: ",d," The setting will be ignored."),a.skipWhitespace(),d=a.readWord();return c};
shaka.text.VttTextParser.parseCue_=function(a,b,c){var d=shaka.text.VttTextParser;if(1==a.length&&!a[0]||/^NOTE($|[ \t])/.test(a[0])||"STYLE"==a[0])return null;var e=null;a[0].includes("--\x3e")||(e=a[0],a.splice(0,1));var f=new shaka.util.TextParser(a[0]),g=d.parseTime_(f),h=f.readRegex(/[ \t]+--\x3e[ \t]+/g),k=d.parseTime_(f);if(null==g||null==h||null==k)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_TEXT_CUE);g+=b;k+=b;
a=a.slice(1).join("\n").trim();g=new shaka.text.Cue(g,k,a);f.skipWhitespace();for(k=f.readWord();k;)d.parseCueSetting(g,k,c)||shaka.log.warning("VTT parser encountered an invalid VTT setting: ",k," The setting will be ignored."),f.skipWhitespace(),k=f.readWord();null!=e&&(g.id=e);return g};
shaka.text.VttTextParser.parseCueSetting=function(a,b,c){var d=shaka.text.VttTextParser,e;if(e=/^align:(start|middle|center|end|left|right)$/.exec(b))d.setTextAlign_(a,e[1]);else if(e=/^vertical:(lr|rl)$/.exec(b))d.setVerticalWritingMode_(a,e[1]);else if(e=/^size:([\d.]+)%$/.exec(b))a.size=Number(e[1]);else if(e=/^position:([\d.]+)%(?:,(line-left|line-right|center|start|end))?$/.exec(b))a.position=Number(e[1]),e[2]&&d.setPositionAlign_(a,e[2]);else if(e=/^region:(.*)$/.exec(b)){if(b=d.getRegionById_(c,
e[1]))a.region=b}else return d.parsedLineValueAndInterpretation_(a,b);return!0};shaka.text.VttTextParser.getRegionById_=function(a,b){var c=a.filter(function(a){return a.id==b});if(!c.length)return shaka.log.warning("VTT parser could not find a region with id: ",b," The region will be ignored."),null;goog.asserts.assert(1==c.length,"VTTRegion ids should be unique!");return c[0]};
shaka.text.VttTextParser.parseRegionSetting_=function(a,b){var c;if(c=/^id=(.*)$/.exec(b))a.id=c[1];else if(c=/^width=(\d{1,2}|100)%$/.exec(b))a.width=Number(c[1]);else if(c=/^lines=(\d+)$/.exec(b))a.height=Number(c[1]),a.heightUnits=shaka.text.CueRegion.units.LINES;else if(c=/^regionanchor=(\d{1,2}|100)%,(\d{1,2}|100)%$/.exec(b))a.regionAnchorX=Number(c[1]),a.regionAnchorY=Number(c[2]);else if(c=/^viewportanchor=(\d{1,2}|100)%,(\d{1,2}|100)%$/.exec(b))a.viewportAnchorX=Number(c[1]),a.viewportAnchorY=
Number(c[2]);else if(/^scroll=up$/.exec(b))a.scroll=shaka.text.CueRegion.scrollMode.UP;else return!1;return!0};shaka.text.VttTextParser.setTextAlign_=function(a,b){var c=shaka.text.Cue;"middle"==b?a.textAlign=c.textAlign.CENTER:(goog.asserts.assert(b.toUpperCase()in c.textAlign,b.toUpperCase()+" Should be in Cue.textAlign values!"),a.textAlign=c.textAlign[b.toUpperCase()])};
shaka.text.VttTextParser.setPositionAlign_=function(a,b){var c=shaka.text.Cue;a.positionAlign="line-left"==b||"start"==b?c.positionAlign.LEFT:"line-right"==b||"end"==b?c.positionAlign.RIGHT:c.positionAlign.CENTER};shaka.text.VttTextParser.setVerticalWritingMode_=function(a,b){var c=shaka.text.Cue;a.writingMode="lr"==b?c.writingMode.VERTICAL_LEFT_TO_RIGHT:c.writingMode.VERTICAL_RIGHT_TO_LEFT};
shaka.text.VttTextParser.parsedLineValueAndInterpretation_=function(a,b){var c=shaka.text.Cue,d;if(d=/^line:([\d.]+)%(?:,(start|end|center))?$/.exec(b))a.lineInterpretation=c.lineInterpretation.PERCENTAGE,a.line=Number(d[1]),d[2]&&(goog.asserts.assert(d[2].toUpperCase()in c.lineAlign,d[2].toUpperCase()+" Should be in Cue.lineAlign values!"),a.lineAlign=c.lineAlign[d[2].toUpperCase()]);else if(d=/^line:(-?\d+)(?:,(start|end|center))?$/.exec(b))a.lineInterpretation=c.lineInterpretation.LINE_NUMBER,
a.line=Number(d[1]),d[2]&&(goog.asserts.assert(d[2].toUpperCase()in c.lineAlign,d[2].toUpperCase()+" Should be in Cue.lineAlign values!"),a.lineAlign=c.lineAlign[d[2].toUpperCase()]);else return!1;return!0};shaka.text.VttTextParser.parseTime_=function(a){a=a.readRegex(/(?:(\d{1,}):)?(\d{2}):(\d{2})\.(\d{3})/g);if(null==a)return null;var b=Number(a[2]),c=Number(a[3]);return 59<b||59<c?null:Number(a[4])/1E3+c+60*b+3600*(Number(a[1])||0)};shaka.text.VttTextParser.MPEG_TIMESCALE_=9E4;
shaka.text.TextEngine.registerParser("text/vtt",shaka.text.VttTextParser);shaka.text.TextEngine.registerParser('text/vtt; codecs="vtt"',shaka.text.VttTextParser);shaka.text.Mp4VttParser=function(){this.timescale_=null};
shaka.text.Mp4VttParser.prototype.parseInit=function(a){var b=shaka.util.Mp4Parser,c=!1;(new b).box("moov",b.children).box("trak",b.children).box("mdia",b.children).fullBox("mdhd",function(a){goog.asserts.assert(0==a.version||1==a.version,"MDHD version can only be 0 or 1");0==a.version?(a.reader.skip(4),a.reader.skip(4),this.timescale_=a.reader.readUint32(),a.reader.skip(4)):(a.reader.skip(8),a.reader.skip(8),this.timescale_=a.reader.readUint32(),a.reader.skip(8));a.reader.skip(4)}.bind(this)).box("minf",
b.children).box("stbl",b.children).fullBox("stsd",b.sampleDescription).box("wvtt",function(a){c=!0}).parse(a);if(!this.timescale_)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_MP4_VTT);if(!c)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_MP4_VTT);};
shaka.text.Mp4VttParser.prototype.parseMedia=function(a,b){var c=this;if(!this.timescale_)throw shaka.log.error("No init segment for MP4+VTT!"),new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_MP4_VTT);var d=shaka.text.Mp4VttParser,e=shaka.util.Mp4Parser,f=0,g=[],h,k=[],l=!1,m=!1,n=!1,q=null;(new e).box("moof",e.children).box("traf",e.children).fullBox("tfdt",function(a){l=!0;goog.asserts.assert(0==a.version||1==a.version,"TFDT version can only be 0 or 1");
f=0==a.version?a.reader.readUint32():a.reader.readUint64()}).fullBox("tfhd",function(a){goog.asserts.assert(null!=a.flags,"A TFHD box should have a valid flags value");q=d.parseTFHD_(a.flags,a.reader)}).fullBox("trun",function(a){m=!0;goog.asserts.assert(null!=a.version,"A TRUN box should have a valid version value");goog.asserts.assert(null!=a.flags,"A TRUN box should have a valid flags value");g=d.parseTRUN_(a.version,a.flags,a.reader)}).box("mdat",e.allData(function(a){goog.asserts.assert(!n,"VTT cues in mp4 with multiple MDAT are not currently supported!");
n=!0;h=a})).parse(a);if(!n&&!l&&!m)throw new shaka.util.Error(shaka.util.Error.Severity.CRITICAL,shaka.util.Error.Category.TEXT,shaka.util.Error.Code.INVALID_MP4_VTT);var p=f;e=new DataView(h.buffer,h.byteOffset,h.byteLength);var r=new shaka.util.DataViewReader(e,shaka.util.DataViewReader.Endianness.BIG_ENDIAN);g.forEach(function(a){var d=a.duration||q,e=a.timeOffset?f+a.timeOffset:p;p=e+(d||0);var g=0;do{var h=r.readUint32();g+=h;var l=r.readUint32();l=shaka.util.Mp4Parser.typeToString(l);var m=
null;"vttc"==l?8<h&&(m=r.readBytes(h-8)):("vtte"!=l&&shaka.log.error("Unknown box "+l+"! Skipping!"),r.skip(h-8));d?m&&(goog.asserts.assert(null!=c.timescale_,"Timescale should not be null!"),k.push(shaka.text.Mp4VttParser.parseVTTC_(m,b.periodStart+e/c.timescale_,b.periodStart+p/c.timescale_))):shaka.log.error("WVTT sample duration unknown, and no default found!");goog.asserts.assert(!a.sampleSize||g<=a.sampleSize,"The samples do not fit evenly into the sample sizes given in the TRUN box!")}while(a.sampleSize&&
g<a.sampleSize)});goog.asserts.assert(!r.hasMoreData(),"MDAT which contain VTT cues and non-VTT data are not currently supported!");return k.filter(shaka.util.Functional.isNotNull)};shaka.text.Mp4VttParser.parseTFHD_=function(a,b){b.skip(4);a&1&&b.skip(8);a&2&&b.skip(4);return a&8?b.readUint32():null};
shaka.text.Mp4VttParser.parseTRUN_=function(a,b,c){var d=c.readUint32();b&1&&c.skip(4);b&4&&c.skip(4);for(var e=[],f=0;f<d;f++){var g={duration:null,sampleSize:null,timeOffset:null};b&256&&(g.duration=c.readUint32());b&512&&(g.sampleSize=c.readUint32());b&1024&&c.skip(4);b&2048&&(g.timeOffset=0==a?c.readUint32():c.readInt32());e.push(g)}return e};
shaka.text.Mp4VttParser.parseVTTC_=function(a,b,c){var d,e,f;(new shaka.util.Mp4Parser).box("payl",shaka.util.Mp4Parser.allData(function(a){d=shaka.util.StringUtils.fromUTF8(a)})).box("iden",shaka.util.Mp4Parser.allData(function(a){e=shaka.util.StringUtils.fromUTF8(a)})).box("sttg",shaka.util.Mp4Parser.allData(function(a){f=shaka.util.StringUtils.fromUTF8(a)})).parse(a);return d?shaka.text.Mp4VttParser.assembleCue_(d,e,f,b,c):null};
shaka.text.Mp4VttParser.assembleCue_=function(a,b,c,d,e){a=new shaka.text.Cue(d,e,a);b&&(a.id=b);if(c)for(b=new shaka.util.TextParser(c),c=b.readWord();c;)shaka.text.VttTextParser.parseCueSetting(a,c,[])||shaka.log.warning("VTT parser encountered an invalid VTT setting: ",c," The setting will be ignored."),b.skipWhitespace(),c=b.readWord();return a};shaka.text.TextEngine.registerParser('application/mp4; codecs="wvtt"',shaka.text.Mp4VttParser);shaka.util.Destroyer=function(a){this.destroyed_=!1;this.waitOnDestroy_=new shaka.util.PublicPromise;this.onDestroy_=a};shaka.util.Destroyer.prototype.destroyed=function(){return this.destroyed_};shaka.util.Destroyer.prototype.destroy=function(){var a=this;if(this.destroyed_)return this.waitOnDestroy_;this.destroyed_=!0;return this.onDestroy_().then(function(){a.waitOnDestroy_.resolve()},function(){a.waitOnDestroy_.resolve()})};shaka.util.Dom=function(){};shaka.util.Dom.createHTMLElement=function(a){return document.createElement(a)};goog.exportSymbol("shaka.util.Dom.createHTMLElement",shaka.util.Dom.createHTMLElement);shaka.util.Dom.createVideoElement=function(){var a=document.createElement("video");a.muted=!0;a.width=600;a.height=400;return a};goog.exportSymbol("shaka.util.Dom.createVideoElement",shaka.util.Dom.createVideoElement);shaka.util.Dom.asHTMLElement=function(a){return a};
goog.exportSymbol("shaka.util.Dom.asHTMLElement",shaka.util.Dom.asHTMLElement);shaka.util.Dom.asHTMLMediaElement=function(a){return a};goog.exportSymbol("shaka.util.Dom.asHTMLMediaElement",shaka.util.Dom.asHTMLMediaElement);shaka.util.Dom.getElementByClassName=function(a,b){var c=b.getElementsByClassName(a);goog.asserts.assert(1==c.length,"Should only be one element with class name "+a);return shaka.util.Dom.asHTMLElement(c[0])};shaka.util.Dom.removeAllChildren=function(a){for(;a.firstChild;)a.removeChild(a.firstChild)};
goog.exportSymbol("shaka.util.Dom.removeAllChildren",shaka.util.Dom.removeAllChildren);shaka.util.ManifestFilter=function(){};shaka.util.ManifestFilter.filterByRestrictions=function(a,b,c){a=$jscomp.makeIterator(a.periods);for(var d=a.next();!d.done;d=a.next())d=d.value,d.variants=d.variants.filter(function(a){return shaka.util.StreamUtils.meetsRestrictions(a,b,c)})};
shaka.util.ManifestFilter.filterByMediaSourceSupport=function(a){var b=shaka.media.MediaSourceEngine;a=$jscomp.makeIterator(a.periods);for(var c=a.next();!c.done;c=a.next())c=c.value,c.variants=c.variants.filter(function(a){var c=!0;a.audio&&(c=c&&b.isStreamSupported(a.audio));a.video&&(c=c&&b.isStreamSupported(a.video));return c})};shaka.util.ManifestFilter.filterByDrmSupport=function(a,b){for(var c=$jscomp.makeIterator(a.periods),d=c.next();!d.done;d=c.next())d=d.value,d.variants=d.variants.filter(function(a){return b.supportsVariant(a)})};
shaka.util.ManifestFilter.filterByCommonCodecs=function(a){goog.asserts.assert(0<a.periods.length,"There should be at least be one period");var b=shaka.util.ManifestFilter,c=new shaka.util.ManifestFilter.VariantCodecSummarySet;a.periods.forEach(function(a,d){var e=b.VariantCodecSummarySet.fromVariants(a.variants);if(0==d)c.includeAll(e);else c.onlyKeep(e)});a=$jscomp.makeIterator(a.periods);for(var d=a.next();!d.done;d=a.next())d=d.value,d.variants=d.variants.filter(function(a){a=new b.VariantCodecSummary(a);
return c.contains(a)})};shaka.util.ManifestFilter.rollingFilter=function(a,b){var c=shaka.util.ManifestFilter,d=new c.VariantCodecSummarySet;a.periods.forEach(function(a,f){0<f&&(a.variants=a.variants.filter(function(a){a=new c.VariantCodecSummary(a);return d.contains(a)}));b(a);d=c.VariantCodecSummarySet.fromVariants(a.variants)})};
shaka.util.ManifestFilter.VariantCodecSummary=function(a){var b=a.audio;a=a.video;this.audioMime_=b?b.mimeType:null;this.audioCodec_=b?b.codecs.split(".")[0]:null;this.videoMime_=a?a.mimeType:null;this.videoCodec_=a?a.codecs.split(".")[0]:null};shaka.util.ManifestFilter.VariantCodecSummary.prototype.equals=function(a){return this.audioMime_==a.audioMime_&&this.audioCodec_==a.audioCodec_&&this.videoMime_==a.videoMime_&&this.videoCodec_==a.videoCodec_};
shaka.util.ManifestFilter.VariantCodecSummarySet=function(){this.all_=[]};shaka.util.ManifestFilter.VariantCodecSummarySet.prototype.add=function(a){this.contains(a)||this.all_.push(a)};shaka.util.ManifestFilter.VariantCodecSummarySet.prototype.includeAll=function(a){a=$jscomp.makeIterator(a.all_);for(var b=a.next();!b.done;b=a.next())this.add(b.value)};shaka.util.ManifestFilter.VariantCodecSummarySet.prototype.onlyKeep=function(a){this.all_=this.all_.filter(function(b){return a.contains(b)})};
shaka.util.ManifestFilter.VariantCodecSummarySet.prototype.contains=function(a){return this.all_.some(function(b){return a.equals(b)})};shaka.util.ManifestFilter.VariantCodecSummarySet.fromVariants=function(a){var b=new shaka.util.ManifestFilter.VariantCodecSummarySet;a=$jscomp.makeIterator(a);for(var c=a.next();!c.done;c=a.next())b.add(new shaka.util.ManifestFilter.VariantCodecSummary(c.value));return b};

//# sourceMappingURL=shaka-player.compiled.debug.js.map