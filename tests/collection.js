(function() {

  var Base = require('../index.js');
  var should = require('should');

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

}());
