/*global describe, it*/

'use strict';

var Base, should;

Base = require('../index.js');
should = require('should');

describe('Collection', function () {

  var collection, Model;

  Model = Base.Model.extend({
    defaults: {
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

  describe('#create', function () {

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

  describe('#add', function () {

    it('should add a record', function () {

      var model = new Model({
        name: 'four'
      });

      collection.add(model);

      collection.length.should.equal(5);
      collection.at(4).name.should.equal('four');

    });

    it('should add a record with an existing id')

  });

  describe('#remove', function () {

    it('should remove a record', function () {
      var model, length = collection.length;
      model = collection.create({
        name: 'I am going to be removed'
      });
      collection.remove(model);
      collection.length.should.equal(length);
    });

  });

  describe('#refresh', function () {

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

  describe('#move', function () {

    it('should move a record to a new position', function () {

      var one, two;

      one = collection.at(1);
      two = collection.at(2);

      collection.move(one, 2);
      collection.at(2).should.eql(one);
      collection.at(1).should.eql(two);

      collection.get(one.id).should.eql(one);
      collection.get(two.id).should.eql(two);

    });

  });

  describe('#indexOf', function () {

    it('should get the index of the model', function () {
      var model = collection.create({
        name: 'five'
      });
      collection.indexOf(model.id).should.equal(collection.length - 1);
      collection.indexOf('null').should.equal(-1);
    });

  });

  describe('#first', function () {

    it('should get the first record', function () {
      var first = collection.first();
      first.name.should.equal('zero');
    });

  });

  describe('#last', function () {

    it('should get the last record', function () {
      var last = collection.last();
      last.name.should.equal('three');
    });

  });

  describe('#at', function () {

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

  describe('#get', function () {

    it('should get a record by its id', function () {
      var model = collection.create({
        name: 'seven'
      });
      collection.get(model.id).should.equal(model);
    });

  });

  describe('#forEach', function () {

    it('should loop through all the records', function () {
      var length = collection.length;
      collection.forEach(function (record, index) {
        record.should.eql(collection.at(index));
      });
    });

  });

  describe('#slice', function () {

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

  describe('#filter', function () {

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

  describe('#sort', function () {

  });

  describe('#pluck', function () {

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

  describe('#toJSON', function () {

    it('should return an array of objects', function () {

      collection.toJSON().should.eql([
        {name: 'zero'},
        {name: 'one'},
        {name: 'two'},
        {name: 'three'}
      ]);

    });

    it('should export the id', function () {

      // If you want toJSON to export the id,
      // you must add 'id' to the model.defaults

      var Collection = Base.Collection.extend({
        model: Base.Model.extend({

          defaults: {
            id: null,
            name: ''
          }

        })
      });

      collection = new Collection();

      collection.create({ name: 'zero' });
      collection.create({ name: 'one' });
      collection.create({ name: 'two' });
      collection.create({ name: 'three' });

      collection.toJSON().should.eql([
        {id: 'c0', name: 'zero'},
        {id: 'c1', name: 'one'},
        {id: 'c2', name: 'two'},
        {id: 'c3', name: 'three'}
      ]);

    });

  });

  describe('#exists', function() {

  });

  describe('#events', function () {

  });

  describe('#custom-ids', function () {

  });

});
