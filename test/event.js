(function () {

  var Base = require('../index.js');
  var should = require('should');

  describe('Event', function () {

    var event;

    it('should create a new event', function () {
      event = new Base.Event();
    });

    it('should listen and trigger events', function (done) {

      var arg = '123';

      event.on('event', function (data) {
        data.should.equal(arg);
        done();
      });

      event.trigger('event', arg);

    });

    it('should only trigger event.once events once', function (done) {

      event.once('special', function (a, b) {
        a.should.equal(1);
        b.should.equal(2);
        done();
      });

      event.trigger('special', 1, 2);
      event.trigger('special', 3, 4);

    });


    it('should be able to unbind event.once events', function () {

      fn = function () {
        throw new Error('This function should not be called!');
      };

      event.once('boom', fn);

      event.off('boom', fn);
      event.trigger('boom');

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
