/*global describe, it*/

(function () {

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

        it('should create a new instance', function () {
            var Collection = Base.Collection.extend({
                model: Model
            });
            collection = new Collection();
        });

        it('should create a record', function () {
            var model = collection.create({
                name: 'zero'
            });
            model.name.should.equal('zero');
        });

        it('should add a record', function () {
            var model = new Model({
                name: 'one'
            });
            collection.add(model);
            collection.at(1).name.should.equal('one');
        });

        it('should remove a record', function () {
            var model, length = collection.length;
            model = collection.create({
                name: 'I am going to be removed'
            });
            collection.remove(model);
            collection.length.should.equal(length);
        });

        it('should add multiple records at once using refresh', function () {
            collection.refresh([
                { name: 'two' },
                { name: 'three' },
                { name: 'four' }
            ]);
            collection.length.should.equal(5);
        });

        it('should move a record to a new position', function () {
            var current, record;
            current = collection.at(3);
            record = collection.at(2);
            collection.move(record, 3);
            collection.at(3).should.eql(record);
            collection.at(2).should.eql(current);
        });

        it('should get the index of the model', function () {
            var model = collection.create({
                name: 'five'
            });
            console.log('--creating', model);
            collection.indexOf(model.id).should.equal(collection.length - 1);
            collection.indexOf('null').should.equal(-1);
        });

        it('should get the first record', function () {
            var first = collection.first();
            first.name.should.equal('zero');
        });

        it('should get the last record', function () {
            collection.create({
                name: 'six'
            });
            var last = collection.last();
            last.name.should.equal('six');
        });

        it('should get a record by its position', function () {
            var model = collection.at(1);
            model.name.should.equal('one');
        });

        it('should get a record by its id', function () {
            var id = collection.create({
                name: 'seven'
            }).id;
            collection.get(id).name.should.equal('seven');
        });

        it('should loop through all the records', function () {
            var length = collection.length;
            collection.forEach(function (record, index) {
                record.should.eql(collection.at(index));
            });
        });
    });
}());
