(function() {

  var Base = require('../index.js');
  var should = require('should');

  describe('Model', function() {

    var model;
    var Model = Base.Model.extend({
      defaults: {
        name: 'default name',
        number: 20
      }
    });

    it('should create a new model', function() {
      model = new Model();
      should.exist(model.defaults);
    });

    it('should get attributes', function() {
      model.name.should.equal('default name');
    });

    it('should set attributes', function() {
      var value = 'value';
      model.name = value;
      model.name.should.equal(value);
    });

    it('should trigger events when setting attributes', function(done) {
      var value = 'something different';
      model.on('change:name', function(newValue) {
        newValue.should.equal(value);
        done();
      });
      model.name = value;
      model._events = {};
    });

    it('should not trigger a change if the value is the same', function() {
      var value = 'more text';
      model.name = value;
      model.on('change:name', function(newValue) {
        throw new Error('Should not be called');
      });
      model.name = value;
    });

    it('should refresh data', function() {
      var value = 'moar text';
      model.refresh({
        name: value 
      });
      model.name.should.equal(value);
    });

    it('should set data to default when replacing', function() {
      var value = 100;
      model.refresh({
        number: value
      }, true);
      model.number.should.equal(value);
      model.name.should.equal(model.defaults.name);
    });

    it('should convert data to JSON', function() {
      var data = {
        name: 'Something different',
        number: 200
      };
      model.refresh(data, true);
      model.toJSON().should.eql(data);
    });

    it('should destroy the model', function(done) {
      model.on('destroy', function() {
        should.not.exist(model._data);
        done();
      });
      model.destroy();
    });
        
  });

}());
