var vCard = require( '..' )
var fs = require( 'fs' )
var assert = require( 'assert' )

suite( 'vCard', function() {

  suite( 'JSON / jCard', function() {

    var jcardStr = JSON.stringify(require('./data/jcard'))
    var data = require('./data/jcard')

    test( 'fromJSON', function() {
      var card = vCard.fromJSON( jcardStr )
    })

    test( 'toJSON', function() {
      var card = vCard.fromJSON( jcardStr )
      assert.deepEqual( card.toJSON(), data )
    })

    test( 'toJCard', function() {
      var card = vCard.fromJSON( jcardStr )
      assert.deepEqual( card.toJCard(), data )
    })

  })

})
