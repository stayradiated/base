(function() {

  // Only load jQuery if are running in a browser
  if (typeof window !== 'undefined') {
    var $ = require('jqueryify');
  }

  // Use swig for templates
  var swig = require('swig');

  // Copy object properties
  include = function(to, from) {
    var key;
    for (key in from) {
      if (from.hasOwnProperty(key)) {
        to[key] = from[key];
      }
    }
  };

  // CoffeeScript extend for classes
  __extend = function(child, parent) {
    var key, ctor;
    for (key in parent) {
      if (parent.hasOwnProperty(key)) {
        child[key] = parent[key];
      }
    }
    ctor = function() {
      this.constructor = child;
    };
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
      this.elements = {};
      this.events = {};
      include(this, attrs);
      if (this.el) { this.bind(); }
    }

    Controller.prototype.bind = function(el) {
      var selector, query, action, split, event;

      // If el is not specified use this.el
      if (!el) { el = this.el; }

      // Cache elements
      for (selector in this.elements) {
        if (this.elements.hasOwnProperty(selector)) {
          name = this.elements[selector];
          this[name] = el.find(selector);
        }
      }

      // Bind events
      for (query in this.events) {
        if (this.events.hasOwnProperty(query)) {
          action = this.events[query];
          split = query.indexOf(' ') + 1;
          event = query.slice(0, split || 9e9);
          selector = query.slice(split);
          if (selector.length > 0) {
            el.on(event, selector, this[action]);
          } else {
            el.on(event, this[action]);
          }
        }
      }

    };

    return Controller;

  }());


  /*
   * EVENT
   */

  var Event = (function() {

    function Event() {
      this._events = {};
    }

    Event.prototype.on = function(events, fn) {
      var i, len;
      // Allow multiple events to be set at once such as:
      // event.on('update change refresh', this.render);
      events = events.split(' ');
      for (i = 0, len = events.length; i < len; i++) {
        event = events[i];
        if (!this._events[event]) { this._events[event] = []; }
        this._events[event].push(fn);
      }
    };

    Event.prototype.trigger = function(event) {
      var actions, i, len;
      // args is a splat
      args = 2 <= arguments.length ? [].slice.call(arguments, 1) : [];
      actions = this._events[event];
      if (actions) {
        for (i = 0, len = actions.length; i < len; i++) {
          actions[i].apply(actions[i], args);
        }
      }
    };

    return Event;

  }());


  /*
   * MODEL
   */

  var Model = (function() {

    Model = function(attrs) {

      var key, self = this;

      // Call super
      Model.__super__.constructor.apply(this, arguments);

      // Set attributes
      if (!this.defaults) { this.defaults = {}; }
      this._data = {};
      include(this._data, this.defaults);
      include(this._data, attrs);

      set = function(key) {
        // Encapture key
        return function(value) {
          // Don't do anything if the value doesn't change
          if (value === self._data[key]) { return; }
          self._data[key] = value;
          self.trigger('change:' + key, value);
        };
      };

      get = function(key) {
        // Encapture key
        return function() {
          return self._data[key];
        };
      };

      for (key in this.defaults) {
        if (this.defaults.hasOwnProperty(key)) {
          this.__defineSetter__(key, set(key));
          this.__defineGetter__(key, get(key));
        }
      }

    };

    // Load Events
    __extend(Model, Event);

    // Load data into the model
    Model.prototype.refresh = function(data, replace) {
      if (replace) { this._data = this.defaults; }
      include(this._data, data);
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

    Collection = function() {
      Collection.__super__.constructor.apply(this, arguments);
      this._records = [];
    };
    
    // Load Events
    __extend(Collection, Event);

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
      var i, len;
      if (replace) { this._records = []; }
      for (i = 0, len = data.length; i < len; i++) {
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
      var i, len, results = [];
      for (i = 0, len = this._records.length; i < len; i++) {
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

    function View(template, fromString) {
      if (fromString) {
        this.template = swig.compile(template);
      } else {
        var path = template + '.html';
        this.template = swig.compileFile(path);
      }
    }

    // Expose swig
    View.swig = swig;

    // Render the template
    View.prototype.render = function(data) {
      return this.template(data);
    };

    return View;

  }());


  // Backbone like extending
  extend = function(attrs) {
    parent = this;
    if (!attrs) { attrs = {}; }
    if (attrs.hasOwnProperty('constructor')) {
      child = attrs.constructor;
    } else {
      child = function() {
        child.__super__.constructor.apply(this, arguments);
      };
    }
    __extend(child, parent);
    include(child.prototype, attrs);
    return child;
  };
  
  // Add the extend to method to all classes, except Event;
  Event.extend = Controller.extend = Model.extend = Collection.extend = View.extend = extend;

  // Export all the classes
  module.exports = {
    Event: Event,
    Controller: Controller,
    Model: Model,
    Collection: Collection,
    View: View
  };

}());
