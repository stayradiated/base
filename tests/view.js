(function() {

  var Base = require('../index.js');
  var should = require('should');

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
