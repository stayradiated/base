// Generated by CoffeeScript 1.6.3
(function() {
  var $, Collection, Controller, Event, Model, View, include, swig,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  $ = require('jqueryify');

  swig = require('swig');

  include = function(to, from) {
    var key, value;
    for (key in from) {
      value = from[key];
      to[key] = value;
    }
    return to;
  };

  Controller = (function() {
    Controller.prototype.elements = {};

    Controller.prototype.events = {};

    Controller.prototype._bind = function(el) {
      var action, event, name, query, selector, split, _ref, _ref1, _results;
      if (el == null) {
        el = this.el;
      }
      _ref = this.elements;
      for (selector in _ref) {
        name = _ref[selector];
        this[name] = el.find(selector);
      }
      _ref1 = this.events;
      _results = [];
      for (query in _ref1) {
        action = _ref1[query];
        split = query.indexOf(' ');
        event = query.slice(0, +split + 1 || 9e9);
        selector = query.slice(split + 1);
        if (selector.length > 0) {
          _results.push(el.on(event, selector, this[action]));
        } else {
          _results.push(el.on(event, this[action]));
        }
      }
      return _results;
    };

    function Controller(attrs) {
      this._bind = __bind(this._bind, this);
      include(this, attrs);
      if (this.el != null) {
        this._bind();
      }
    }

    return Controller;

  })();

  Event = (function() {
    function Event() {
      this.on = __bind(this.on, this);
      this.trigger = __bind(this.trigger, this);
      this._events = {};
    }

    Event.prototype.trigger = function() {
      var args, event, fn, _i, _len, _ref;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (this._events[event] != null) {
        _ref = this._events[event];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          fn = _ref[_i];
          fn.apply(fn, args);
        }
      }
    };

    Event.prototype.on = function(events, fn) {
      var event, _base, _i, _len, _ref, _results;
      _ref = events.split(' ');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        if ((_base = this._events)[event] == null) {
          _base[event] = [];
        }
        _results.push(this._events[event].push(fn));
      }
      return _results;
    };

    return Event;

  })();

  Model = (function(_super) {
    __extends(Model, _super);

    function Model(attrs) {
      this.toJSON = __bind(this.toJSON, this);
      this.destroy = __bind(this.destroy, this);
      this.refresh = __bind(this.refresh, this);
      var get, key, set,
        _this = this;
      Model.__super__.constructor.apply(this, arguments);
      if (this.defaults == null) {
        this.defaults = {};
      }
      this._data = {};
      include(this.defaults);
      include(attrs);
      set = function(key) {
        return function(value) {
          if (value === _this._data[key]) {
            return;
          }
          _this._data[key] = value;
          return _this.trigger("change:" + key, value);
        };
      };
      get = function(key) {
        return function() {
          return _this._data[key];
        };
      };
      for (key in this.defaults) {
        this.__defineSetter__(key, set(key));
        this.__defineGetter__(key, get(key));
      }
    }

    Model.prototype.refresh = function(data) {
      include(data);
      return this.trigger('refresh');
    };

    Model.prototype.destroy = function() {
      this.trigger('before:destroy');
      delete this._data;
      this.trigger('destroy');
      return this;
    };

    Model.prototype.toJSON = function() {
      return this._data;
    };

    return Model;

  })(Event);

  Collection = (function(_super) {
    __extends(Collection, _super);

    function Collection() {
      this.get = __bind(this.get, this);
      this.last = __bind(this.last, this);
      this.first = __bind(this.first, this);
      this.toJSON = __bind(this.toJSON, this);
      this.forEach = __bind(this.forEach, this);
      this.refresh = __bind(this.refresh, this);
      this.move = __bind(this.move, this);
      this.remove = __bind(this.remove, this);
      this.add = __bind(this.add, this);
      this.create = __bind(this.create, this);
      Collection.__super__.constructor.apply(this, arguments);
      this._records = [];
    }

    Collection.prototype.create = function() {
      var args, model;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      model = (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(this.model, args, function(){});
      this.add(model);
      return model;
    };

    Collection.prototype.add = function(model) {
      var _this = this;
      this._records.push(model);
      model.on('change', function() {
        return _this.trigger('change:model', model);
      });
      model.on('destroy', function() {
        _this.trigger('destroy:model', model);
        return _this.remove(model);
      });
      return this.trigger('create:model', model);
    };

    Collection.prototype.remove = function(record) {
      var index;
      index = this._records.indexOf(record);
      this._records.splice(index, 1);
      return this.trigger('change');
    };

    Collection.prototype.move = function(record, pos) {
      var index;
      index = this._records.indexOf(record);
      this._records.splice(index, 1);
      this._records.splice(pos, 0, record);
      return this.trigger('change');
    };

    Collection.prototype.refresh = function(data) {
      var model, record, _i, _len;
      this._records = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        record = data[_i];
        model = new this.model(record);
        this._records.push(model);
      }
      return this.trigger('refresh');
    };

    Collection.prototype.forEach = function() {
      return Array.prototype.forEach.apply(this._records, arguments);
    };

    Collection.prototype.toJSON = function() {
      var record, _i, _len, _ref, _results;
      _ref = this._records;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        record = _ref[_i];
        _results.push(record.toJSON());
      }
      return _results;
    };

    Collection.prototype.first = function() {
      return this._records[0];
    };

    Collection.prototype.last = function() {
      return this._records[this._records.length - 1];
    };

    Collection.prototype.get = function(index) {
      return this._records[index];
    };

    return Collection;

  })(Event);

  View = (function() {
    View.init = swig.init.bind(swig);

    function View(filename) {
      this.render = __bind(this.render, this);
      var path;
      path = filename + '.html';
      this.template = swig.compileFile(path);
    }

    View.prototype.render = function(data) {
      return this.template.render(data);
    };

    return View;

  })();

  module.exports = {
    Event: Event,
    Controller: Controller,
    Model: Model,
    Collection: Collection,
    View: View
  };

}).call(this);
