(function() {

  var Base = require('../index.js');
  var should = require('should');

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

  });

}());
