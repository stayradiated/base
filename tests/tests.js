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

  describe('Collection', function() {

    var collection;

    it('should create a new instance', function() {

      var Model = Base.Model.extend({
        constructor: function() {
          // TODO: Find out why I need to specify the constructor
          Model.__super__.constructor.apply(this, arguments);
        },
        defaults: {
          name: ''
        }
      });

      var Collection = Base.Collection.extend({
        model: Model 
      });

      collection = new Collection();

    });

    it('should add a record', function() {

      var name = 'zero';

      var model = collection.create({
        name: name
      });

      model.name.should.equal(name);

    });

    it('should get the first record', function() {
      collection.first().should.eql(collection._records[0]);
    });

    it('should add multiple records at once using refresh', function() {
      collection.refresh([
        { name: 'one' },
        { name: 'two' },
        { name: 'three' }
      ]);
      collection._records.length.should.equal(4);
    });

    it('should get the last record', function() {
      var records = collection._records;
      collection.last().should.eql(records[records.length - 1]);
    });

    it('should get an arbitrary record', function() {
      collection.get(1).should.eql(collection._records[1]);
    });

    it('should move a record to a new position', function() {
      var current = collection.get(3);
      var record = collection.get(2);
      collection.move(record, 3);
      collection.get(3).should.eql(record);
      collection.get(2).should.eql(current);
    });

    it('should loop through all the records', function(done) {
      var length = collection._records.length;
      collection.forEach(function(record, index) {
        record.should.eql(collection.get(index));
        if (index === length - 1) { done(); }
      });
    });

  });

  describe('View', function() {

    var view;
    var template = 'Hello {{ name }}';

    it('should create a new view', function() {
      var View = Base.View.extend();
      view = new View(template, true);
    });

    it('should render the view', function() {
      view.render({
        name: 'World'
      }).should.equal('Hello World');
    });

  });

}());
