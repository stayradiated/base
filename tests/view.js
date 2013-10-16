(function() {

  var Base = require('../index.js');
  var should = require('should');

  // TODO: The controller can't be tested properly inside NodeJS because it
  // uses jQuery. I think I can get it working inside PhantomJS or something
  // though.

  describe('View', function() {

    var controller;
    var View = Base.View.extend({

      elements: {
        '.selector': 'element'
      },

      events: {
        'click .selector': 'click'
      }

    });

    it('should create a new controller', function() {
      controller = new View();
    });

    it('should have events', function() {
      controller.events.should.have.property('click .selector');
    });

    it('should have elements', function() {
      controller.elements.should.have.property('.selector');
    });

    it('should have events', function(done) {
      controller.on('event', function() {
        done();
      });
      controller.trigger('event');
    });

  });

}());
