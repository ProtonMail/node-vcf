/**
 * vCard Property
 * @constructor
 * @memberOf vCard
 * @param {String} field
 * @param {String} value
 * @param {Object} params
 * @return {Property}
 */
function Property( field, value, params ) {

  if( !(this instanceof Property) )
    return new Property( value )

  this._params = ( params != null ) 
    ? Object.assign({}, params )
    : {}
  this._field = field
  this._data = value

  Object.defineProperty( this, '_field', { enumerable: false })
  Object.defineProperty( this, '_params', { enumerable: false })
  Object.defineProperty( this, '_data', { enumerable: false })
}

/**
 * Constructs a vCard.Property from jCard data
 * @param  {Array} data
 * @return {Property}
 */
Property.fromJSON = function( data ) {
  var [field, params, valType, value] = data

  if ( !/text/i.test( valType ) )
    params.value = valType
  
  if ( Array.isArray( value ) )
    value = value.join(';')

  return new Property( field, value, params )
}

/**
 * Turn a string into capitalized dash-case
 * @internal used by `Property#toString()`
 * @param  {String} value
 * @return {String}
 * @ignore
 */
function capitalDashCase( value ) {
  return value.replace(/([a-z])([A-Z])/g, '$1-$2').toUpperCase()
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
  is: function( type ) {
    type = ( type + '' ).toLowerCase()
    return Array.isArray( this.getType() ) ?
      this.getType().toLowerCase().indexOf( type ) :
      this.getType().toLowerCase() === type
  },
  
  get group () {
      return this.getParams().group
  },
  
  get charset () {
      return this.getParams().charset
  },
  
  get encoding () {
      return this.getParams().encoding
  },
  
  /**
   * Get field (key) value
   * @return {String}
   */
  getField: function() {
    return this._field;
  },

  /**
   * Get property type value
   * @return {String}
   */
  getType: function() {
    return this.getParams().type
  },

  /**
   * Get property group value
   */
  getGroup: function() {
    return this.getParams().group
  },

  /**
   * Get params
   * @return {Object}
   */
  getParams: function() {
    return this._params
  },

  /**
   * Check whether the property is empty
   * @return {Boolean}
   */
  isEmpty: function() {
    return !this._data || !this._data.length
  },

  /**
   * Clone the property
   * @return {Property}
   */
  clone: function() {
    return new Property( this._field, this._data, this.getParams() )
  },

  /**
   * Format the property as vcf with given version
   * @param  {String} version
   * @return {String}
   */
  toString: function( version ) {
    var group = this.getGroup()
    var propName = capitalDashCase( this._field )
    if (typeof group == 'string' && group.length > 0) {
      propName = [group, propName].join('.')
    }
    var params = this.getParams()
    
    var paramStr = ''
    for( var [k,v] of Object.entries(params) ) {
      if (k.toLowerCase() === 'group') continue
      paramStr += ';' + capitalDashCase( k ) + '=' + v
    }
    
    var valueStr = ( 
      Array.isArray( this._data ) 
      ? this._data.join( ';' ) 
      : this._data.trim() 
    )
    
    return propName + paramStr + ':' + valueStr
  },

  /**
   * Get the property's value
   * @return {String}
   */
  valueOf: function() {
    return this._data
  },

  /**
   * Format the property as jCard data
   * @return {Array}
   */
  toJSON: function() {

    var params = this.getParams()
      
    // RFC 7095, §3.4.1 <https://tools.ietf.org/html/rfc7095#section-3.4.1>:
    //      vCard defines a "VALUE" property parameter (Section 5.2 of
    //      [RFC6350]).  This property parameter MUST NOT be added to the
    //      parameters object.  Instead, the value type is signaled through the
    //      type identifier in the third element of the array describing the
    //      property.
    var valueType = (this.getParams().value) ? this.getParams().value : 'text'
    params.value = undefined
    delete params.value
    
    
    var data = [ this._field, params, valueType ]

    switch( this._field ) {
      default: data.push( this._data ); break
      case 'adr':
      case 'n':
        data.push( this._data.split( ';' ) )
        break
    }
    return data
  }

}

// Exports
module.exports = Property
