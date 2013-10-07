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

    it('should create events if attrs.on is set', function(done) {
      event = new Base.Event({
        on: {
          'event': done
        }
      });
      event.trigger('event');
    });

    describe('- Remembered events', function () {

        var obj = new Base.Event();
        var obj2 = new Base.Event();
        var listener = new Base.Event();

        it('#start listening', function (done) {

            listener.listen([
                obj, {
                    'done': done,
                    'fail': function () {
                        throw new Error('fail');
                    }
                }
            ]);

            obj.trigger('done');

        });

        it('#stop listening', function (done) {

            listener.listen(obj2, {
                'done': done 
            });

            // Only stop listening to obj
            listener.stopListening(obj);

            // This shouldn't trigger the error message
            obj.trigger('fail');

            // This should still trigger the done() function
            obj2.trigger('done');

        });

    });

  });

}());
