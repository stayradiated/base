(function() {

  var Base = require('../index.js');
  var should = require('should');

  // TODO: The view can't be tested properly inside NodeJS because it
  // uses jQuery. I think I can get it working inside PhantomJS or something
  // though.

  describe('View', function() {

    var view;
    var View = Base.View.extend({

      elements: {
        '.selector': 'element'
      },

      events: {
        'click .selector': 'click'
      }

    });

    it('should create a new view', function() {
      view = new View();
    });

    it('should have events', function() {
      view.events.should.have.property('click .selector');
    });

    it('should have elements', function() {
      view.elements.should.have.property('.selector');
    });

    it('should have events', function(done) {
      view.on('event', function() {
        done();
      });
      view.trigger('event');
    });

  });

}());
