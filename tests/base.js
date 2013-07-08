(function() {

  var Base = require('../index.js');
  var assert = requir('assert');

  describe('Controller', function() {

  });

  describe('Event', function() {

    var event;

    it('should create a new event', function() {
      event = new Base.Event();
    });

    it('should trigger events', function(done) {

      var arg = true;

      event.on('event', function(data) {
        assert.equal(data, arg);
        done();
      });

      event.trigger('event', arg);

    });

  });

  describe('Model', function() {

  });

  describe('Collection', function() {

  });

  describe('View', function() {

  });

}());
