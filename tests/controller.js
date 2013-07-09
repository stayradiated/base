(function() {

  var Base = require('../index.js');
  var should = require('should');

  // TODO: The controller can't be tested properly inside NodeJS because it
  // uses jQuery. I think I can get it working inside PhantomJS or something
  // though.

  describe('Controller', function() {

    var controller;
    var Controller = Base.Controller.extend({

      elements: {
        '.selector': 'element'
      },

      events: {
        'click .selector': 'click'
      }

    });

    it('should create a new controller', function() {
      controller = new Controller();
    });

    it('should have events', function() {
      controller.events.should.have.property('click .selector');
    });

    it('should have elements', function() {
      controller.elements.should.have.property('.selector');
    });

  });

}());
