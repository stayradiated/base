/*jslint node: true, nomen: true*/

(function () {
  'use strict';

  var include, extend, inherit, View, Event, Model, Collection;

  // Copy object properties
  include = function (to, from) {
    var key;
    for (key in from) {
      if (from.hasOwnProperty(key)) {
        to[key] = from[key];
      }
    }
    return to;
  };

  // CoffeeScript extend for classes
  inherit = function (child, parent) {
    var Klass;

    include(child, parent);

    Klass = function () {
      this.constructor = child;
    };

    Klass.prototype = parent.prototype;
    child.prototype = new Klass();
    child.__super__ = parent.prototype;

    Klass = undefined;
    parent = undefined;

    return child;
  };

  // Backbone like extending
  extend = function (attrs) {
    var child, parent = this;

    if (!attrs) { attrs = {}; }

    if (attrs.hasOwnProperty('constructor')) {
      child = attrs.constructor;
    } else {
      child = function () {
        child.__super__.constructor.apply(this, arguments);
      };
    }

    inherit(child, parent);
    include(child.prototype, attrs);

    attrs = undefined;
    parent = undefined;

    return child;
  };


  /*
   * EVENT
   */

  Event = function () {

    // Stores all the event handlers that others are listening to on us
    this._events = {};

    // Stores some of the event handlers that we are listening to on others
    this._listening = [];

  };

  // Bind an event to a function
  // Returns an event ID so you can unbind it later
  Event.prototype.on = function (events, fn) {
    var i, len, event;

    // Allow multiple events to be set at once such as:
    // event.on('update change refresh', this.render);
    events = events.split(' ');
    len = events.length;

    for (i = 0; i < len; i += 1) {
      event = events[i];

      // If the event has never been listened to before
      if (! this._events.hasOwnProperty(event)) {
        this._events[event] = [];
      }

      // Add the event handler
      this._events[event].push(fn);
    }

    // Return the arguments so they can be reused to unbind
    // the event handlers
    return arguments;
  };


  // Only run an event once and then remove the handler
  Event.prototype.once = function (event, fn) {
    var self, once;
    self = this;

    // Create a wrapper function that unbinds the event
    // and then runs the original function
    once = function () {
      self.off(event, once);
      fn.apply(this, arguments);
    };

    // So that you can use `fn` to unbind the event as well
    once._callback = fn;

    return this.on(event, once);
  };


  // Trigger an event
  Event.prototype.trigger = function (event) {
    var args, events, a1, a2, a3, i, len, ev;
    args = [].slice.call(arguments, 1);

    // Listen to all events
    if (event !== '*') {
      this.trigger('*', event, args);
    }

    // Don't do anything if there are not any events
    if (! this._events.hasOwnProperty(event)) {
      return;
    }

    i = -1;
    a1 = args[0];
    a2 = args[1];
    a3 = args[2];

    events = this._events[event];
    len = events.length;

    // Backbone.js does this and it seems pretty fast

    switch (args.length) {
      case 0:  while (++i < len) events[i].call(this); return;
      case 1:  while (++i < len) events[i].call(this, a1); return;
      case 2:  while (++i < len) events[i].call(this, a1, a2); return;
      case 3:  while (++i < len) events[i].call(this, a1, a2, a3); return;
      default: while (++i < len) events[i].apply(this, args); return;
    }

  };

  // Remove a listener from an event
  Event.prototype.off = function (events, fn) {
    var i, j, k, l, name, event, retain, handler;
    events = events.split(' ');
    l = events.length;

    // Go through each event specified
    for (i = 0; i < l; i += 1) {

      name = events[i];
      event = this._events[name];
      this._events[name] = retain = [];

      if (typeof fn !== 'undefined') {

        // Loop through each of the event handlers
        k = event.length;
        for (j = 0; j < k; j += 1) {

          handler = event[j];

          if (handler !== fn && handler._callback !== fn) {
            retain.push(event[j]);
          }
        }
      }
    }

  };

  /**
   * Listen to multiple events from multiple objects
   * Use this.stopListening to stop listening to them all
   *
   * Example:
   *
   *   this.listen(object, {
   *      'create change': this.render,
   *      'remove': this.remove
   *   });
   *
   *   this.listen([
   *      objectOne, {
   *          'create': this.render,
   *          'remove': this.remove
   *      },
   *      objectTwo, {
   *          'change': 'this.render
   *      }
   *   ]);
   *
   */
  Event.prototype.listen = function (obj, attrs) {
    var i, len, event, listener;
    if (Array.isArray(obj)) {
      for (i = 0, len = obj.length; i < len; i += 2) {
        this.listen(obj[i], obj[i + 1]);
      }
      return;
    }
    listener = [obj, {}];
    for (event in attrs) {
      if (attrs.hasOwnProperty(event)) {
        listener[1][event] = obj.on(event, attrs[event]);
      }
    }
    this._listening.push(listener);
  };

  // Stop listening to all events
  Event.prototype.stopListening = function (object) {
    var i, len, obj, events, event;
    for (i = 0, len = this._listening.length; i < len; i += 1) {
      obj = this._listening[i][0];
      if (!object || object === obj) {
        events = this._listening[i][1];

        for (event in events) {
          if (events.hasOwnProperty(event)) {
            event = events[event];
            obj.off.call(obj, event[0], event[1]);
          }
        }

      }
    }
    this._listening = [];
  };

  /*
   * VIEW
   */

  View = function (attrs) {
    View.__super__.constructor.apply(this, arguments);
    include(this, attrs);

    if (!this.ui) {
      this.ui = {};
    }

    if (!this.events) {
      this.events = {};
    }

    if (this.el) {
      this.bind();
    }

  };

  // Load Events
  inherit(View, Event);

  View.prototype.bind = function (el) {
    var selector, query, action, split, name, ui;

    // If el is not specified use this.el
    if (!el) { el = this.el; }

    // Convert strings into jQuery objects
    if (typeof el === 'string') {
      el = $(el);
    }

    this.el = el;

    // Clone the ui list so we can use it in sub classes
    if (! this._ui) {
      this._ui = include({}, this.ui);
    }

    this.ui = {};

    // Load UI elements
    for (name in this._ui) {
      if (this._ui.hasOwnProperty(name)) {
        this.ui[name] = el.find(this._ui[name]);
      }
    }

    // Bind events
    for (query in this.events) {
      if (this.events.hasOwnProperty(query)) {

        action = this.events[query];
        split = query.indexOf(' ');

        if (split > -1) {
          selector = query.slice(split + 1);
          el.on(query.slice(0, split), selector, this[action]);
        } else {
          el.on(query, this[action]);
        }

      }
    }

  };

  View.prototype.unbind = function (el) {
    var selector, query, action, split, name, event;

    // If el is not specified use this.el
    if (!el) { el = this.el; }

    // Delete elements
    delete this.ui;

    // Unbind events
    for (query in this.events) {
      if (this.events.hasOwnProperty(query)) {

        action = this.events[query];
        split = query.indexOf(' ');
        event = query.slice(0, split || undefined);

        if (split > -1) {
          selector = query.slice(split + 1);
          el.off(event, selector, this[action]);
        } else {
          el.off(event, this[action]);
        }
      }
    }

  };

  // Unbind the view and remove the element
  View.prototype.release = function () {
    this.unbind();
    this.el.remove();
    this.stopListening();
  };


  /*
   * MODEL
   */

  Model = function (attrs) {
    var set, get, key, self = this;

    // Call super
    Model.__super__.constructor.apply(this, arguments);

    // Set attributes
    if (!this.defaults) { this.defaults = {}; }
    this._data = {};
    include(this._data, this.defaults);

    // Merge attributes into the correct object
    // depending on whether the key is in the defaults object
    for (key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        if (this.defaults.hasOwnProperty(key)) {
          this._data[key] = attrs[key];
        } else {
          this[key] = attrs[key];
        }
      }
    }

    set = function (key) {
      return function (value) {
        return self.set.call(self, key, value);
      };
    };

    get = function (key) {
      return function () {
        return self.get(key);
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
  inherit(Model, Event);

  // Change a value
  Model.prototype.set = function (key, value, options) {
    if (! this.defaults.hasOwnProperty(key)) {
      this[key] = value;
      return value;
    }
    if (value === this._data[key]) { return; }
    this._data[key] = value;
    if (!options || !options.silent) {
      this.trigger('change', key, value);
      this.trigger('change:' + key, value);
    }
  };

  // Get a value
  Model.prototype.get = function(key) {
    if (this.defaults.hasOwnProperty(key)) {
      return this._data[key];
    }
    return this[key];
  };

  // Change multiple values
  Model.prototype.setAttributes = function (obj, options) {
    for (var key in obj) {
      this.set(key, obj[key], options);
    }
  };

  // Load data into the model
  Model.prototype.refresh = function (data, replace) {
    if (replace) {
      this._data = {};
      include(this._data, this.defaults);
    }
    include(this._data, data);
    this.trigger('refresh', this);
    return this;
  };

  // Destroy the model
  Model.prototype.destroy = function () {
    this.trigger('before:destroy', this);
    delete this._data;
    this.trigger('destroy', this);
    return this;
  };

  // Convert the class instance into a simple object
  Model.prototype.toJSON = function () {
    var key, json = {};
    for (key in this.defaults) {
      if (this.defaults.hasOwnProperty(key)) {
        json[key] = this._data[key];
      }
    }
    return json;
  };


  /*
   * COLLECTION
   */

  Collection = function () {
    Collection.__super__.constructor.apply(this, arguments);
    this.length  = 0;
    this._index  = 0;
    this._models = [];
    this._lookup = {};
  };

  // Load Events
  inherit(Collection, Event);

  // Generate a new id
  Collection.prototype.generateId = function () {
    return 'c' + this._index++;
  };

  // Parse id
  Collection.prototype.parseId = function (id) {
    var number;
    id = id.toString();
    number = parseInt(id.slice(1), 10);
    return isNaN(number) ? id : number;
  };

  // Update id
  // - id (number) : output from this.parseId()
  Collection.prototype.updateId = function (id) {
    this._index = id + 1;
  };

  // Access all models
  Collection.prototype.all = function () {
    return this._models;
  };

  // Create a new instance of the model and add it to the collection
  Collection.prototype.create = function (attrs, options) {
    var model = new this.model(attrs);
    this.add(model, options);
    return model;
  };

  // Add a model to the collection
  Collection.prototype.add = function (model, options) {

    var id, number, index, self = this;

    // Set ID
    if (model.id !== null && model.id !== undefined) {
      // Make sure we don't reuse an existing id
      id = this.parseId(model.id);
      if (number >= this._index) {
        this.updateId(number);
      }
    } else {
      id = this.generateId();
      model.set('id', id, {silent: true});
    }

    // Add to collection
    model.collection = this;
    this._models.push(model);
    this._lookup[id] = model;
    this.length += 1;

    // Bubble events
    this._bubble(model);

    // Only trigger create if silent is not set
    if (!options || !options.silent) {
      this.trigger('create:model', model);
      this.trigger('change');
    }

  };


  // Hook into the events of a model and bubble them
  // up to this collection
  Collection.prototype._bubble = function (model) {

    var self, id;

    self = this;
    id = model.id;

    this.listen(model, {
      '*': function (event, args) {
        args = args.slice(0);
        args.unshift(event + ':model', model);
        self.trigger.apply(self, args);
      },
      'before:destroy': function () {
        self.remove(model);
      },
      'change:id': function (newId) {
        self._lookup[newId] = model;
        delete self._lookup[id];
        id = newId;
      }
    });

  };

  // Remove a model from the collection
  // Does not destroy the model - just removes it from the array
  Collection.prototype.remove = function (model) {
    var index = this.indexOf(model);
    this._models.splice(index, 1);
    delete this._lookup[model.id];
    this.length -= 1;
    this.stopListening(model);
    this.trigger('remove:model');
    this.trigger('change');
  };

  // Reorder the collection
  Collection.prototype.move = function (model, pos) {
    var index = this.indexOf(model);
    this._models.splice(index, 1);
    this._models.splice(pos, 0, model);
    this.trigger('change:order');
    this.trigger('change');
  };

  // Append or replace the data in the collection
  // Doesn't trigger any events when updating the array apart from 'refresh'
  Collection.prototype.refresh = function (data, replace) {
    var i, len;
    if (replace) { this.deleteAll(); }
    for (i = 0, len = data.length; i < len; i += 1) {
      this.create(data[i], { silent: true });
    }
    return this.trigger('refresh');
  };

  Collection.prototype.deleteAll = function () {
    this._models = [];
    this._lookup = {};
    this.length = 0;
  };

  // Get a range from the collection
  Collection.prototype.slice = function (begin, end) {
    return this._models.slice(begin, end);
  };

  // Loop over each record in the collection
  Collection.prototype.forEach = function (callback, _this) {
    return this._models.forEach(callback, _this);
  };

  // Filter the models
  Collection.prototype.filter = function (callback, _this) {
    return this._models.filter(callback, _this);
  };

  // Sort the models. Does not alter original order
  Collection.prototype.sort = function (fn) {
    return this._models.sort(fn);
  };

  // Get an array of all the properties from the models
  Collection.prototype.pluck = function(property) {
    var i, len = this.length, array = [];
    for (i = 0; i < len; i += 1) {
      array.push(this._models[i][property]);
    }
    return array;
  };

  // Get the index of the item
  Collection.prototype.indexOf = function (model) {
    var type = typeof model;
    if (type === 'string' || type === 'number') {
      // Convert model id to actual model
      return this.indexOf(this.get(model));
    }
    return this._models.indexOf(model);
  };

  // Convert the collection into an array of objects
  Collection.prototype.toJSON = function () {
    var i, len, record, results = [];
    for (i = 0, len = this._models.length; i < len; i += 1) {
      record = this._models[i];
      results.push(record.toJSON());
    }
    return results;
  };

  // Return the first record in the collection
  Collection.prototype.first = function () {
    return this.at(0);
  };

  // Return the last record in the collection
  Collection.prototype.last = function () {
    return this.at(this.length - 1);
  };

  // Return the record by the id
  Collection.prototype.get = function (id) {
    return this._lookup[id];
  };

  // Return a specified record in the collection
  Collection.prototype.at = function (index) {
    return this._models[index];
  };

  // Check if a model exists in the collection
  Collection.prototype.exists = function (model) {
    return this.indexOf(model) > -1;
  };


  // Add the extend to method to all classes
  Event.extend = View.extend = Model.extend = Collection.extend = extend;

  // Export all the classes
  module.exports = {
    Event: Event,
    View: View,
    Model: Model,
    Collection: Collection
  };

}());
