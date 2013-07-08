(function() {

  // NPM Dependencies
  var $ = require('jqueryify');
  var swig = require('swig');


  /*
   * UTILS
   */

  var slice = [].slice;
  var hasProp = {}.hasOwnProperty;

  // Copy the attributes of one object into another
  var include = function(to, from) {
    for (var key in from) {
      if (hasProp.call(from, key)) {
        to[key] = from[key];
      }
    }
  };

  // Extend a functions prototype
  var extend = function(child, parent) {
    includes(child, parent);
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.__super__ = parent.prototype;
    return child;
  };


  /*
   * CONTROLLER
   */

  var Controller = (function() {

    function Controller(attrs) {
      include(this, attrs);
      if (!this.elements) this.elements = {};
      if (!this.events) this.events = {};
      if (this.el != null) this._bind();
    }

    Controller.prototype._bind = function(el) {

      // If el is not defined use this.el
      if (el == null) el = this.el;

      // Cache elements
      for (var selector in this.elements) {
        this.elements[selector] = el.find(selector);
      }

      // Bind events
      for (var query in this.events) {
        var action = this.events[query];
        var split = query.indexOf(' ') + 1;
        var event = query.slice(0, split || 9e9);
        var selector = query.slice(split);
        if (selector.length > 0) {
          el.on(event, selector, this[action]);
        } else {
          el.on(event, this[action]);
        }
      }

    };

    return Controller;

  }();


  /*
   * EVENT
   */

  var Event = (function() {

    function Event() {
      this._events = {};
    }

    Event.prototype.on = function(events, fn) {
      // Allow multiple events to be set at once such as:
      // event.on('update change refresh', this.render);
      events = events.split(' ');
      for (var i = 0, len = events.length; i < len; i++) {
        event = events[_i];
        if (this._events[event] == null) this._events[event] = [];
        this._events[event].push(fn);
      }
    };

    Event.prototype.trigger = function(event, args) {
      // args is a splat
      event = arguments[0];
      args = 2 <= arguments.length ? [].slice.call(arguments, 1) : [];
      var actions = this._events[event];
      if (actions != null) {
        for (var i = 0, len = actions.length; i < len; i++) {
          actions[i].apply(fn, args);
        }
      }
    };

    return Event;

  }();


  /*
   * MODEL
   */

  var Model = (function() {

    extends(Model, Event);

    function Model(attrs) {

      // Call super
      Model.__super__.constructor.apply(this, arguments);

      // Set attributes
      if (this.defaults == null) this.defaults = {};
      this._data = {};
      include(this.defaults);
      include(attrs);

      var self = this;

      set = function(key) {
        // Encapture key
        return function(value) {
          // Don't do anything if the value doesn't change
          if (value === _this._data[key]) return;
          self._data[key] = value;
          self.trigger('change:' + key, value);
        };
      };

      get = function(key) {
        // Encapture key
        return function() { return self._data[key]; }
      };

      for (var key in this.defaults) {
        this.__defineSetter__(key, set(key));
        this.__defineGetter__(key, get(key));
      }

    }

    // Load data into the model
    Model.prototype.refresh = function(data, replace) {
      if (replace) this._data = {};
      include(this, data);
      this.trigger('refresh');
      return this;
    };

    // Destroy the model
    Model.prototype.destroy = function() {
      delete this._data;
      this.trigger('destroy');
      return this;
    };

    // Convert the class instance into a simple object
    Model.prototype.toJSON = function() {
      return this._data;
    };

    return Model;

  }());


  /*
   * COLLECTION
   */

  var Collection = (function() {

    extends(Collection, Event);

    function Collection() {
      Collection.__super__.constructor.apply(this, arguments);
      this._records = [];
    }

    // Create a new instance of the model and add it to the collection
    Collection.prototype.create = function(attrs) {
      var model = new this.model(attrs);
      this.add(model);
      return model;
    };

    // Add a model to the collection
    Collection.prototype.add = function(model) {

      // Add to collection
      this._records.push(model);
      var self = this;

      // Bubble change event
      model.on('change', function() {
        self.trigger('change:model', model);
      });

      // Bubble destroy event
      model.on('destroy', function() {
        self.trigger('destroy:model', model);
        self.remove(model);
      });

      // Trigger create event
      this.trigger('create:model', model);

    };

    // Remove a model from the collection
    // Does not destroy the model - just removes it from the array
    Collection.prototype.remove = function(model) {
      var index = this._records.indexOf(model);
      this._records.splice(index, 1);
      this.trigger('change');
    };

    // Reorder the collection
    Collection.prototype.move = function(record, pos) {
      var index = this._records.indexOf(record);
      this._records.splice(index, 1);
      this._records.splice(pos, 0, record);
      this.trigger('change');
    };

    // Append or replace the data in the collection
    // Doesn't trigger any events when updating the array apart from 'refresh'
    Collection.prototype.refresh = function(data, replace) {
      if (replace) this._records = [];
      for (var i = 0, len = data.length; i < len; i++) {
        var model = new this.model(data[i]);
        this._records.push(model);
      }
      return this.trigger('refresh');
    };

    // Loop over each record in the collection
    Collection.prototype.forEach = function() {
      return Array.prototype.forEach.apply(this._records, arguments);
    };

    // Convert the collection into an array of objects
    Collection.prototype.toJSON = function() {
      var results = [];
      for (var i = 0, len = this._records.length; i < len; i++) {
        var record = this._records[_i];
        results.push(record.toJSON());
      }
      return results;
    };

    // Return the first record in the collection
    Collection.prototype.first = function() {
      return this._records[0];
    };

    // Return the last record in the collection
    Collection.prototype.last = function() {
      return this._records[this._records.length - 1];
    };

    // Return a specified record in the collection
    Collection.prototype.get = function(index) {
      return this._records[index];
    };

    return Collection;

  }());


  /*
   * VIEW
   */

  var View = (function() {

    function View(filename) {
      var path = filename + '.html';
      this.template = swig.compileFile(path);
    }

    // Expose swig.init
    View.init = swig.init.bind(swig);

    // Render the template
    View.prototype.render = function(data) {
      return this.template.render(data);
    };

    return View;

  }());


  // Export all the classes
  module.exports = {
    Event: Event,
    Controller: Controller,
    Model: Model,
    Collection: Collection,
    View: View
  };

}());
