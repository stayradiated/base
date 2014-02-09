/*global describe, it*/

'use strict';

var Base, should;

Base = require('../index.js');
should = require('should');

describe('Collection', function () {

  var collection, Model;

  Model = Base.Model.extend({
    defaults: {
      id: null,
      name: ''
    }
  });

  beforeEach(function () {

    var Collection = Base.Collection.extend({
      model: Model
    });

    collection = new Collection();

    collection.create({ name: 'zero' });
    collection.create({ name: 'one' });
    collection.create({ name: 'two' });
    collection.create({ name: 'three' });

  });

  describe(':create', function () {

    it('should create a record', function () {

      var model;

      model = collection.create({
        name: 'four'
      });

      model.name.should.equal('four');
      model.should.be.an.instanceOf(Model);

      collection.length.should.equal(5);

    });

  });

  describe(':add', function () {

    it('should add a record', function () {

      var model = new Model({
        name: 'four'
      });

      collection.add(model);

      collection.length.should.equal(5);
      collection.at(4).name.should.equal('four');

    });

    it('should add a record with an existing id', function () {

      var model = new Model({
        id: 'c10',
        name: 'ten'
      });

      collection.add(model);

      collection.length.should.equal(5);
      collection.at(4).name.should.equal('ten');

      model = collection.create({ name: 'eleven' });
      model.id.should.equal('c11');

    });

  });

  describe(':remove', function () {

    it('should remove a record', function () {
      var model, length = collection.length;
      model = collection.create({
        name: 'I am going to be removed'
      });
      collection.remove(model);
      collection.length.should.equal(length);
    });

  });

  describe(':refresh', function () {

    it('should add multiple records at once using refresh', function () {

      collection.refresh([
        { name: 'four' },
        { name: 'five' },
        { name: 'six' }
      ]);

      collection.length.should.equal(7);
      collection.at(4).name.should.equal('four');
      collection.at(5).name.should.equal('five');
      collection.at(6).name.should.equal('six');

    });

    it('should replace existing records', function () {

      collection.refresh([
        { name: 0 },
        { name: 1 }
      ], true);

      collection.length.should.eql(2);
      collection.at(0).name.should.equal(0);
      collection.at(1).name.should.equal(1);

    });

  });

  describe(':all', function () {

    it('should return all the models', function () {

      collection.all().should.eql([
        collection.at(0),
        collection.at(1),
        collection.at(2),
        collection.at(3)
      ]);

    });

  });

  describe(':move', function () {

    beforeEach(function () {
      collection.refresh([
        {name: 'a'}, {name: 'b'}, {name: 'c'},
        {name: 'd'}, {name: 'e'}, {name: 'f'}
      ], true);
    })

    it('should move a record towards the start of the list', function () {

      // Get model f
      var model = collection.at(5);

      // Move f -> 3
      collection.move(model, 3);

      collection.at(3).should.eql(model);
      collection.get(model.id).should.eql(model);

      collection.pluck('name').should.eql([
        'a', 'b', 'c', 'f', 'd', 'e'
      ]);

    });

    it('should move a record towards the end of the list', function () {

      // Get model a
      var model = collection.at(0);

      // Move a -> 3
      collection.move(model, 3);

      // Model is actually at position 2
      // Because it was moved to be before the element at position 3
      // So it will always before the letter d

      collection.at(2).should.eql(model);
      collection.get(model.id).should.eql(model);

      collection.pluck('name').should.eql([
        'b', 'c', 'a', 'd', 'e', 'f'
      ]);

    });

  });

  describe(':indexOf', function () {

    it('should get the index of the model', function () {
      var model = collection.create({
        name: 'five'
      });
      collection.indexOf(model.id).should.equal(collection.length - 1);
      collection.indexOf('null').should.equal(-1);
    });

  });

  describe(':first', function () {

    it('should get the first record', function () {
      var first = collection.first();
      first.name.should.equal('zero');
    });

  });

  describe(':last', function () {

    it('should get the last record', function () {
      var last = collection.last();
      last.name.should.equal('three');
    });

  });

  describe(':at', function () {

    beforeEach(function () {

    });

    it('should get a record by its position', function () {

      var model;

      model = collection.at(1);
      model.name.should.equal('one');

      model = collection.at(2);
      model.name.should.equal('two');

      model = collection.at(3);
      model.name.should.equal('three');

    });

    it('should return undefined for missing models', function () {

      var model;

      model = collection.at(-1);
      should.equal(undefined, model);

      model = collection.at(4);
      should.equal(undefined, model);

    });

  });

  describe(':get', function () {

    it('should get a record by its id', function () {
      var model = collection.create({
        name: 'seven'
      });
      collection.get(model.id).should.equal(model);
    });

  });

  describe(':forEach', function () {

    it('should loop through all the records', function () {
      var length = collection.length;
      collection.forEach(function (record, index) {
        record.should.eql(collection.at(index));
      });
    });

  });

  describe(':slice', function () {

    it('should get the first two items', function() {
      collection.slice(0, 2).should.eql([
        collection.at(0),
        collection.at(1)
      ]);
    });

    it('should get the middle two items', function() {
      collection.slice(1, 3).should.eql([
        collection.at(1),
        collection.at(2)
      ]);
    });

    it('should get the last two items', function() {
      collection.slice(2).should.eql([
        collection.at(2),
        collection.at(3)
      ]);
    });

  });

  describe(':filter', function () {

    it('should only get items containing an "o"', function () {

      var models;

      models = collection.filter(function (model, i, models) {
        return model.name.match(/o/);
      });

      models.should.eql([
         collection.at(0),
         collection.at(1),
         collection.at(2)
      ]);

    });

    it('should return an empty array when nothing matches', function () {

      var models;

      models = collection.filter(function () {
        return false;
      });

      models.should.eql([]);

    });

  });

  describe(':sort', function () {

    it('should sort by name', function () {

      collection.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });

      collection.pluck('name').should.eql([
        'one', 'three', 'two', 'zero'
      ]);

    });

  });

  describe(':pluck', function () {

    it('should get the name of each model', function () {
      collection.pluck('name').should.eql([
        'zero', 'one', 'two', 'three'
      ]);
    });

    it('should return undefined when the property is missing', function () {
      collection.pluck('null').should.eql([
        undefined, undefined, undefined, undefined
      ]);
    });

  });

  describe(':toJSON', function () {

    it('should return an array of objects', function () {

      collection.toJSON().should.eql([
        {id: 'c0', name: 'zero'},
        {id: 'c1', name: 'one'},
        {id: 'c2', name: 'two'},
        {id: 'c3', name: 'three'}
      ]);

    });

  });

  describe(':exists', function() {

    it('should check against an actual model', function () {

      var model;

      model = collection.at(0);
      collection.exists(model).should.equal(true);

      model = new Model({ name: 'infinity' });
      collection.exists(model).should.equal(false);

    });

    it('should check against a model id', function () {

      var id;

      id = collection.at(1).id;
      collection.exists(id).should.equal(true);

      id = 'c20';
      collection.exists(id).should.equal(false);

    });

  });

  describe(':events', function () {

    it('should listen to child events', function (done) {

      var model = collection.at(0);

      collection.on('event:model', function (_model, arg) {
        _model.should.equal(model);
        arg.should.equal('hello world');
        done();
      });

      model.trigger('event', 'hello world');

    });

    it('should respond to a model being destroyed', function () {

      var model = collection.at(0);
      collection.length.should.equal(4);

      model.destroy();

      collection.length.should.equal(3);
      collection.at(0).should.not.equal(model);

    });

    it('should respond to a model id being changed', function () {

      var model, id;

      model = collection.at(0);
      id = model.id

      collection.get(id).should.equal(model);

      // Change model id
      model.id = 'c200';

      should.equal(undefined, collection.get(id));
      collection.get(model.id).should.equal(model);

    });

  });

  describe(':custom-ids', function () {

    beforeEach(function () {

      Base.Collection.prototype._generateId = function () {
        return this._index += 2;
      };

      Base.Collection.prototype._parseId = function (id) {
        return id;
      };

      Base.Collection.prototype._updateIndex = function (id) {
        if (id > this._index) {
          this._index = id + 2;
        }
      };

      collection.refresh([
        {name: 'zero'},
        {name: 'one'},
        {name: 'two'},
        {name: 'three'}
      ]);

    });

    it('should assign ids in lots of 2s', function () {

      collection.pluck('id').should.eql([
        'c0', 'c1', 'c2', 'c3', 6, 8, 10, 12
      ]);

    });

  });

});
