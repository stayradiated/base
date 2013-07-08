(function() {

  var Base = require('../index.js');
  var should = require('should');

  describe('Controller', function() {

  });

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

  describe('Model', function() {

    var model;

    it('should create a new model', function() {
      model = Base.Model.extend({
        defaults: {
          name: 'default name',
          value: 20
        }
      });
    });

    it('should get attributes', function() {
      console.log(model);
      model.name.should.equal('default name');
    });

  });

  describe('Collection', function() {

  });

  describe('View', function() {

  });

}());
