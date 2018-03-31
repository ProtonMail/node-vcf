(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.vCard = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var camelCase = require('camelcase');
var Property = require('./property');
var IGNORE_WRONG_TYPES = ['pref'];

function set(object, key, value) {
  if (Array.isArray(object[key])) {
    object[key].push(value);
  } else if (object[key] != null) {
    object[key] = [object[key], value];
  } else {
    object[key] = value;
  }
}

function createParams(params, param) {

  var parts = param.split('=');
  var k = camelCase(parts[0]);
  var value = parts[1];

  if (!value) {
    value = parts[0];
    k = 'type';
  }

  if (k === 'type') {

    value.split(',').filter(function (value) {
      return IGNORE_WRONG_TYPES.indexOf(value.toLowerCase()) === -1;
    }).forEach(function (value) {
      set(params, k, value);
    });

    return params;
  }

  set(params, k, value);

  return params;
}

function clearValue(value) {
  if (typeof value === 'string') {
    return value.replace(/\\n/g, '\n');
  }

  return value;
}

function parseLines(lines) {

  var data = {};

  // NOTE: Line format:
  //  PROPERTY[;PARAMETER[=VALUE]]:Attribute[;Attribute]
  var line = null;
  var pattern = /^([^;:]+)((?:;(?:[^;:]+))*)(?:\:(.+))?$/i;
  var len = lines.length - 1;

  for (var i = 1; i < len; i++) {

    line = lines[i];

    var match = pattern.exec(line);
    if (!match) continue;

    var name = match[1].split('.');
    var property = name.pop();
    var group = name.pop();
    var value = match[3];
    var params = match[2] ? match[2].replace(/^;|;$/g, '').split(';') : [];

    var propParams = params.reduce(createParams, group ? { group: group } : {});
    var propName = property.toLowerCase();
    var propVal = new Property(propName, clearValue(value), propParams);

    set(data, propName, propVal);
  }

  return data;
}

module.exports = parseLines;

},{"./property":2,"camelcase":4}],2:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * vCard Property
 * @constructor
 * @memberOf vCard
 * @param {String} field
 * @param {String} value
 * @param {Object} params
 * @return {Property}
 */
function Property(field, value, params) {

  if (!(this instanceof Property)) return new Property(value);

  this._params = params != null ? Object.assign({}, params) : {};
  this._field = field;
  this._data = value;

  Object.defineProperty(this, '_field', { enumerable: false });
  Object.defineProperty(this, '_params', { enumerable: false });
  Object.defineProperty(this, '_data', { enumerable: false });
}

/**
 * Constructs a vCard.Property from jCard data
 * @param  {Array} data
 * @return {Property}
 */
Property.fromJSON = function (data) {
  var _data = _slicedToArray(data, 4),
      field = _data[0],
      params = _data[1],
      valType = _data[2],
      value = _data[3];

  if (!/text/i.test(valType)) params.value = valType;

  if (Array.isArray(value)) value = value.join(';');

  return new Property(field, value, params);
};

/**
 * Turn a string into capitalized dash-case
 * @internal used by `Property#toString()`
 * @param  {String} value
 * @return {String}
 * @ignore
 */
function capitalDashCase(value) {
  return value.replace(/([a-z])([A-Z])/g, '$1-$2').toUpperCase();
}

/**
 * Property prototype
 * @type {Object}
 */
Property.prototype = {

  constructor: Property,

  /**
   * Check whether the property is of a given type
   * @param  {String}  type
   * @return {Boolean}
   */
  is: function is(type) {
    type = (type + '').toLowerCase();
    return Array.isArray(this.getType()) ? this.getType().toLowerCase().indexOf(type) : this.getType().toLowerCase() === type;
  },

  get group() {
    return this.getParams().group;
  },

  get charset() {
    return this.getParams().charset;
  },

  get encoding() {
    return this.getParams().encoding;
  },

  /**
   * Get field (key) value
   * @return {String}
   */
  getField: function getField() {
    return this._field;
  },

  /**
   * Get property type value
   * @return {String}
   */
  getType: function getType() {
    return this.getParams().type;
  },

  /**
   * Get property group value
   */
  getGroup: function getGroup() {
    return this.getParams().group;
  },

  /**
   * Get params
   * @return {Object}
   */
  getParams: function getParams() {
    return this._params;
  },

  /**
   * Check whether the property is empty
   * @return {Boolean}
   */
  isEmpty: function isEmpty() {
    return !this._data || !this._data.length;
  },

  /**
   * Clone the property
   * @return {Property}
   */
  clone: function clone() {
    return new Property(this._field, this._data, this.getParams());
  },

  /**
   * Format the property as vcf with given version
   * @param  {String} version
   * @return {String}
   */
  toString: function toString(version) {
    var group = this.getGroup();
    var propName = capitalDashCase(this._field);
    if (typeof group == 'string' && group.length > 0) {
      propName = [group, propName].join('.');
    }
    var params = this.getParams();

    var paramStr = '';
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.entries(params)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _ref = _step.value;

        var _ref2 = _slicedToArray(_ref, 2);

        var k = _ref2[0];
        var v = _ref2[1];

        if (k.toLowerCase() === 'group') continue;
        paramStr += ';' + capitalDashCase(k) + '=' + v;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    var valueStr = Array.isArray(this._data) ? this._data.join(';') : this._data.trim();

    return propName + paramStr + ':' + valueStr;
  },

  /**
   * Get the property's value
   * @return {String}
   */
  valueOf: function valueOf() {
    return this._data;
  },

  /**
   * Format the property as jCard data
   * @return {Array}
   */
  toJSON: function toJSON() {

    var params = this.getParams();

    // RFC 7095, §3.4.1 <https://tools.ietf.org/html/rfc7095#section-3.4.1>:
    //      vCard defines a "VALUE" property parameter (Section 5.2 of
    //      [RFC6350]).  This property parameter MUST NOT be added to the
    //      parameters object.  Instead, the value type is signaled through the
    //      type identifier in the third element of the array describing the
    //      property.
    var valueType = this.getParams().value ? this.getParams().value : 'text';
    params.value = undefined;
    delete params.value;

    var data = [this._field, params, valueType];

    switch (this._field) {
      default:
        data.push(this._data);break;
      case 'adr':
      case 'n':
        if (this._data instanceof Array) {
          data.push(this._data);
        } else {
          data.push(this._data.split(';'));
        }
        break;
    }
    return data;
  }

  // Exports
};module.exports = Property;

},{}],3:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * vCard
 * @constructor
 * @return {vCard}
 */
function vCard() {

  if (!(this instanceof vCard)) return new vCard();

  /** @type {String} Version number */
  this.version = vCard.versions[vCard.versions.length - 1];
  /** @type {Object} Card data */
  this.data = {};
}

/**
 * vCard MIME type
 * @type {String}
 */
vCard.mimeType = 'text/vcard';

/**
 * vCard file extension
 * @type {String}
 */
vCard.extension = '.vcf';

/**
 * vCard versions
 * @type {Array}
 */
vCard.versions = ['2.1', '3.0', '4.0'];

/**
 * Folds a long line according to the RFC 5322.
 * @see http://tools.ietf.org/html/rfc5322#section-2.1.1
 * @param  {String}  input
 * @param  {Number}  maxLength
 * @param  {Boolean} hardWrap
 * @return {String}
 */
vCard.foldLine = require('foldline');

/**
 * Normalizes input (cast to string, line folding, whitespace)
 * @param  {String} input
 * @return {String}
 */
vCard.normalize = function (input) {
  // remove unfolded lines
  /*
  * Don't trim lines at this moment: the old manner caused
  * KEY\n BLOCK to go to KEYBLOCK instead of KEY BLOCK. Effectively letting foldlines remove random spaces from
  * the input when converting to vcard and parsing that vcard again.
  */
  return (input + '').replace(/\r?\n\s*(?=\r?\n[^\x20\x09])/g, '').replace(/\r?\n([\x20\x09]|$)/g, '').trim();
};

/**
 * Check whether a given version is supported
 * @param  {String} version
 * @return {Boolean}
 */
vCard.isSupported = function (version) {
  return (/^\d\.\d$/.test(version) && vCard.versions.indexOf(version) !== -1
  );
};

/**
 * Parses a string or buffer into a vCard object
 * @param  {String|Buffer} value
 * @return {Array<vCard>}
 */
vCard.parse = function (value) {

  var objects = (value + '').split(/(?=BEGIN\:VCARD)/gi);
  var cards = [];

  for (var i = 0; i < objects.length; i++) {
    cards.push(new vCard().parse(objects[i]));
  }

  return cards;
};

/**
 * Parse an array of vcf formatted lines
 * @internal used by `vCard#parse()`
 * @type {Function}
 */
vCard.parseLines = require('./parse-lines');

/**
 * Constructs a vCard from jCard data
 * @param  {Array} jcard
 * @return {vCard}
 */
vCard.fromJSON = function (jcard) {

  jcard = typeof jcard === 'string' ? JSON.parse(jcard) : jcard;

  if (jcard == null || !Array.isArray(jcard)) return new vCard();

  if (!/vcard/i.test(jcard[0])) throw new Error('Object not in jCard format');

  var card = new vCard();

  jcard[1].forEach(function (prop) {
    card.addProperty(vCard.Property.fromJSON(prop));
  });

  return card;
};

/**
 * Format a card object according to the given version
 * @param  {vCard}  card
 * @param  {String} version
 * @return {String}
 */
vCard.format = function (card, version) {

  version = version || card.version || vCard.versions[vCard.versions.length - 1];

  if (!vCard.isSupported(version)) throw new Error('Unsupported vCard version "' + version + '"');

  var propToFormattedLine = function propToFormattedLine(prop) {
    return vCard.foldLine(prop.toString(version).replace(/\r?\n/g, '\\n'), 75);
  };
  var vcf = [];

  vcf.push('BEGIN:VCARD');
  vcf.push('VERSION:' + version);

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.entries(card.data)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _ref = _step.value;

      var _ref2 = _slicedToArray(_ref, 2);

      var key = _ref2[0];
      var val = _ref2[1];

      if (key === 'version') continue;

      if (!Array.isArray(val)) {
        var prop = val;
        if (prop.isEmpty()) continue;
        vcf.push(propToFormattedLine(prop));
      } else {
        var propArray = val;
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = propArray[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var prop = _step2.value;

            if (prop.isEmpty()) continue;
            vcf.push(propToFormattedLine(prop));
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  vcf.push('END:VCARD');

  return vcf.join('\r\n');
};
// vCard Property constructor
vCard.Property = require('./property');
/**
 * vCard prototype
 * @type {Object}
 */
vCard.prototype = {
  constructor: vCard,
  /**
   * Get a vCard property
   * @param  {String} key
   * @return {Object|Array}
   */
  get: function get(key) {

    if (this.data[key] == null) {

      return this.data[key];
    }

    if (Array.isArray(this.data[key])) {
      return this.data[key].map(function (prop) {

        return prop.clone();
      });
    } else {
      return this.data[key].clone();
    }
  },

  /**
   * Set a vCard property
   * @param {String} key
   * @param {String} value
   * @param {Object} params
   */
  set: function set(key, value, params) {
    return this.setProperty(new vCard.Property(key, value, params));
  },

  /**
   * Add a vCard property
   * @param {String} key
   * @param {String} value
   * @param {Object} params
   */
  add: function add(key, value, params) {
    var prop = new vCard.Property(key, value, params);
    this.addProperty(prop);
    return this;
  },

  /**
   * Remove a vCard property
   * @param {String} key
   * @return {Object}
   */
  remove: function remove(key) {
    delete this.data[key];
    return this;
  },

  /**
   * Set a vCard property from an already
   * constructed vCard.Property
   * @param {vCard.Property} prop
   */
  setProperty: function setProperty(prop) {
    this.data[prop._field] = prop;
    return this;
  },

  /**
   * Add a vCard property from an already
   * constructed vCard.Property
   * @param {vCard.Property} prop
   */
  addProperty: function addProperty(prop) {

    var key = prop._field;

    if (Array.isArray(this.data[key])) {
      this.data[key].push(prop);
    } else if (this.data[key] != null) {
      this.data[key] = [this.data[key], prop];
    } else {
      this.data[key] = prop;
    }

    return this;
  },

  /**
   * Parse a vcf formatted vCard
   * @param  {String} value
   * @return {vCard}
   */
  parse: function parse(value) {

    // Normalize & split
    var lines = vCard.normalize(value).split(/\r?\n/g);

    // Keep begin and end markers
    // for eventual error messages
    var begin = lines[0];
    var version = lines[1];
    var end = lines[lines.length - 1];

    if (!/BEGIN:VCARD/i.test(begin)) throw new SyntaxError('Invalid vCard: Expected "BEGIN:VCARD" but found "' + begin + '"');

    if (!/END:VCARD/i.test(end)) throw new SyntaxError('Invalid vCard: Expected "END:VCARD" but found "' + end + '"');

    // TODO: For version 2.1, the VERSION can be anywhere between BEGIN & END
    if (!/VERSION:\d\.\d/i.test(version)) throw new SyntaxError('Invalid vCard: Expected "VERSION:\\d.\\d" but found "' + version + '"');

    this.version = version.substring(8, 11);

    if (!vCard.isSupported(this.version)) throw new Error('Unsupported version "' + this.version + '"');

    this.data = vCard.parseLines(lines);

    return this;
  },

  /**
   * Format the vCard as vcf with given version
   * @param  {String} version
   * @param  {String} charset
   * @return {String}
   */
  toString: function toString(version, charset) {
    version = version || this.version;
    return vCard.format(this, version);
  },

  /**
   * Format the card as jCard
   * @param {String} version='4.0'
   * @return {Array} jCard
   */
  toJCard: function toJCard(version) {

    version = version || this.version || '4.0';

    var data = [['version', {}, 'text', version]];

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = Object.keys(this.data)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var key = _step3.value;

        var prop = this.data[key];
        if (key === 'version') continue;

        if (Array.isArray(prop)) {
          for (var k = 0; k < prop.length; k++) {
            data.push(prop[k].toJSON());
          }
        } else {
          data.push(prop.toJSON());
        }
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return ['vcard', data];
  },

  /**
   * Format the card as jCard
   * @return {Array} jCard
   */
  toJSON: function toJSON() {
    return this.toJCard(this.version);
  },

  /**
   * Check if the card doesn't contain properties
   * @return {Boolean}
   */
  isEmpty: function isEmpty() {
    var keys = Object.keys(this.data);
    var index = keys.indexOf('version');

    if (index > -1) {
      keys.splice(1, index);
    }

    return !keys.length;
  }

  // Exports
};module.exports = vCard;

},{"./parse-lines":1,"./property":2,"foldline":5}],4:[function(require,module,exports){
'use strict';

function preserveCamelCase(str) {
	var isLastCharLower = false;

	for (var i = 0; i < str.length; i++) {
		var c = str.charAt(i);

		if (isLastCharLower && (/[a-zA-Z]/).test(c) && c.toUpperCase() === c) {
			str = str.substr(0, i) + '-' + str.substr(i);
			isLastCharLower = false;
			i++;
		} else {
			isLastCharLower = (c.toLowerCase() === c);
		}
	}

	return str;
}

module.exports = function () {
	var str = [].map.call(arguments, function (str) {
		return str.trim();
	}).filter(function (str) {
		return str.length;
	}).join('-');

	if (!str.length) {
		return '';
	}

	if (str.length === 1) {
		return str.toLowerCase();
	}

	if (!(/[_.\- ]+/).test(str)) {
		if (str === str.toUpperCase()) {
			return str.toLowerCase();
		}

		if (str[0] !== str[0].toLowerCase()) {
			return str[0].toLowerCase() + str.slice(1);
		}

		return str;
	}

	str = preserveCamelCase(str);

	return str
	.replace(/^[_.\- ]+/, '')
	.toLowerCase()
	.replace(/[_.\- ]+(\w|$)/g, function (m, p1) {
		return p1.toUpperCase();
	});
};

},{}],5:[function(require,module,exports){
/**
 * Folds a long line according to RFC 5322
 * @see http://tools.ietf.org/html/rfc5322#section-2.1.1
 *
 * @param  {String}  input
 * @param  {Number}  maxLength
 * @param  {Boolean} hardWrap
 * @return {String}
 */
module.exports = function foldLine( input, maxLength, hardWrap ) {

  // Remove any newlines
  input = input.replace( /\r?\n/g, '' )

  if( maxLength != null && maxLength < 5 )
    throw new Error( 'Maximum length must not be less than 5' )

  // RFC compliant default line length
  maxLength = maxLength != null ? maxLength : 78

  // We really don't need to fold this
  if( input.length <= maxLength )
    return input

  // Substract 3 because CRLF<space> is the line delimiter
  // (3 bytes + 1 <space> extra because of soft folding)
  maxLength = maxLength - 4

  var CRLF = '\r\n'

  var lines = [], len = input.length
  var lastIndex = 0, index = 0;

  if (hardWrap) {

    // We remove the one <space> extra here again,
    // since we're going into hard folding mode
    maxLength++

    while( index < len ) {
      lines.push( input.slice( index, index += maxLength ) )
    }

    return lines.join( CRLF + ' ' )
  }

  while (index < len) {
    lastIndex = input.lastIndexOf( ' ', maxLength + index )
    if (input.slice(index).length <= maxLength) {
      lines.push( input.slice( index ) )
      break;
    }

    if (lastIndex <= index) {
      lines.push(input.slice(index, index + maxLength));
      index += maxLength;
      continue;
    }


    lines.push(input.slice( index, lastIndex ) )
    index = lastIndex
  }


  return lines.join( CRLF + ' ' )

}

},{}]},{},[3])(3)
});