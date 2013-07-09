(function() {

  var Base = require('../index.js');
  var should = require('should');

  describe('Event', function() {

    var event;

    it('should create a new event', function() {
      event = new Base.Event();
    });

    it('should trigger events', function(done) {

      var arg = '123';

      event.on('event', function(data) {
        data.should.equal(arg);
        done();
      });

      event.trigger('event', arg);

    });

  });

}());
