/*jslint nomen: true*/
/*global window, require, module*/

(function () {
    "use strict";

    var swig, include, extend, inherit, Controller, Event, Model, Collection, View;

    // Use swig for templates
    if (typeof window.swig === 'undefined') {
      swig = require('swig');
    } else {
      swig = window.swig;
    }

    // Copy object properties
    include = function (to, from) {
        var key;
        for (key in from) {
            if (from.hasOwnProperty(key)) {
                to[key] = from[key];
            }
        }
    };

    // CoffeeScript extend for classes
    inherit = function (child, parent) {
        var key, Klass;
        for (key in parent) {
            if (parent.hasOwnProperty(key)) {
                child[key] = parent[key];
            }
        }
        Klass = function () {
            this.constructor = child;
        };
        Klass.prototype = parent.prototype;
        child.prototype = new Klass();
        child.__super__ = parent.prototype;
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
        return child;
    };


    /*
     * EVENT
     */

    Event = (function () {

        function Event(attrs) {
            var key;
            this._events = {};
            // Bind events specified in attrs
            if (attrs && attrs.on) {
                for (key in attrs.on) {
                    if (attrs.on.hasOwnProperty(key)) {
                        this.on(key, attrs.on[key]);
                    }
                }
                delete attrs.on;
            }
        }
        
        // Bind an event to a function
        // Returns an event ID so you can unbind it later
        Event.prototype.on = function (events, fn) {
            var ids, id, i, len, event;
            // Allow multiple events to be set at once such as:
            // event.on('update change refresh', this.render);
            ids = [];
            events = events.split(' ');
            for (i = 0, len = events.length; i < len; i += 1) {
                event = events[i];
                // If the event has never been listened to before
                if (!this._events[event]) {
                    this._events[event] = {};
                    this._events[event].index = 0;
                }
                // Increment the index and assign an ID
                id = this._events[event].index += 1;
                this._events[event][id] = fn;
                ids.push(id);
            }
            return ids;
        };

        // Trigger an event
        Event.prototype.trigger = function (event) {
            var args, actions, i;
            // args is a splat
            args = 2 <= arguments.length ? [].slice.call(arguments, 1) : [];
            actions = this._events[event];
            if (actions) {
                for (i in actions) {
                    if (actions.hasOwnProperty(i) && i !== 'index') {
                        actions[i].apply(actions[i], args);
                    }
                }
            }
        };

        // Remove a listener from an event
        Event.prototype.off = function (event, id) {
          delete this._events[event][id];
        };

        return Event;

    }());



    /*
     * CONTROLLER
     */

    Controller = (function () {

        function Controller(attrs) {
            Controller.__super__.constructor.apply(this, arguments);
            if (!this.elements) { this.elements = {}; }
            if (!this.events) { this.events = {}; }
            include(this, attrs);
            if (this.el) { this.bind(); }
            this.listening = [];
        }

        // Load Events
        inherit(Controller, Event);

        Controller.prototype.bind = function (el) {
            var selector, query, action, split, name, event;

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
                    if (split > 0) {
                        selector = query.slice(split);
                        el.on(event, selector, this[action]);
                    } else {
                        el.on(event, this[action]);
                    }
                }
            }

        };

        Controller.prototype.unbind = function(el) {
            var selector, query, action, split, name, event;

            // If el is not specified use this.el
            if (!el) { el = this.el; }

            // Delete elements
            for (selector in this.elements) {
                if (this.elements.hasOwnProperty(selector)) {
                    name = this.elements[selector];
                    delete this[name];
                }
            }

            // Unbind events
            for (query in this.events) {
                if (this.events.hasOwnProperty(query)) {
                    action = this.events[query];
                    split = query.indexOf(' ') + 1;
                    event = query.slice(0, split || 9e9);
                    if (split > 0) {
                        selector = query.slice(split);
                        el.off(event, selector);
                    } else {
                        el.off(event);
                    }
                }
            }

        };

        Controller.prototype.listen = function (model, attrs) {
          var event, ids, listener;
          listener = [model, {}];
          for (event in attrs) {
              if (attrs.hasOwnProperty(event)) {
                  ids = model.on(event, attrs[event]);
                  listener[1][event] = ids;
              }
          }
          this.listening.push(listener);
        };

        Controller.prototype.unlisten = function () {
            var i, len, model, events, event;
            for (i = 0, len = this.listening.length; i < len; i += 1) {
                model = this.listening[i][0];
                events = this.listening[i][1];
                for (event in events) {
                    if (events.hasOwnProperty(event)) {
                        model.off(event, events[event]);
                    }
                }
            }
            this.listening = [];
        };

        return Controller;

    }());


    /*
     * MODEL
     */

    Model = (function () {

        function Model(attrs) {
            var set, get, key, self = this;

            // Call super
            Model.__super__.constructor.apply(this, arguments);

            // Set attributes
            if (!this.defaults) { this.defaults = {}; }
            this._data = {};
            include(this._data, this.defaults);
            include(this._data, attrs);

            set = function (key) {
                // Encapture key
                return function (value) {
                    // Don't do anything if the value doesn't change
                    if (value === self._data[key]) { return; }
                    self._data[key] = value;
                    self.trigger('change:' + key, value);
                };
            };

            get = function (key) {
                // Encapture key
                return function () {
                    return self._data[key];
                };
            };

            for (key in this.defaults) {
                if (this.defaults.hasOwnProperty(key)) {
                    this.__defineSetter__(key, set(key));
                    this.__defineGetter__(key, get(key));
                }
            }

        }

        // Load Events
        inherit(Model, Event);

        // Load data into the model
        Model.prototype.refresh = function (data, replace) {
            if (replace) {
              this._data = {};
              include(this._data, this.defaults);
            }
            include(this._data, data);
            this.trigger('refresh');
            return this;
        };

        // Destroy the model
        Model.prototype.destroy = function () {
            this.trigger('before:destroy');
            delete this._data;
            this.trigger('destroy');
            return this;
        };

        // Convert the class instance into a simple object
        Model.prototype.toJSON = function () {
            return this._data;
        };


        return Model;

    }());


    /*
     * COLLECTION
     */

    Collection = (function () {

        function Collection() {
            Collection.__super__.constructor.apply(this, arguments);
            this._records = [];
            this.length = 0;
        }

        // Load Events
        inherit(Collection, Event);

        // Create a new instance of the model and add it to the collection
        Collection.prototype.create = function (attrs, options) {
            var model = new this.model(attrs);
            this.add(model, options);
            return model;
        };

        // Add a model to the collection
        Collection.prototype.add = function (model, options) {

            // Add to collection
            model.collection = this;
            this._records.push(model);
            this.length = this._records.length;
            var self = this;

            // Bubble change event
            model.on('change', function () {
                self.trigger('change:model', model);
            });

            // Bubble destroy event
            model.on('before:destroy', function() {
                self.trigger('before:destroy:model', model);
            });
            model.on('destroy', function () {
                self.trigger('destroy:model', model);
                self.remove(model);
            });

            // Only trigger create if silent is not set
            if (!options || !options.silent) {
              this.trigger('create:model', model);
            }

        };

        // Remove a model from the collection
        // Does not destroy the model - just removes it from the array
        Collection.prototype.remove = function (model) {
            var index = this._records.indexOf(model);
            this._records.splice(index, 1);
            this.length = this._records.length;
            this.trigger('change');
        };

        // Reorder the collection
        Collection.prototype.move = function (record, pos) {
            var index = this._records.indexOf(record);
            this._records.splice(index, 1);
            this._records.splice(pos, 0, record);
            this.trigger('change');
        };

        // Append or replace the data in the collection
        // Doesn't trigger any events when updating the array apart from 'refresh'
        Collection.prototype.refresh = function (data, replace) {
            var i, len, model;
            if (replace) { this._records = []; }
            for (i = 0, len = data.length; i < len; i += 1) {
                this.create(data[i], { silent: true });
            }
            return this.trigger('refresh');
        };

        // Loop over each record in the collection
        Collection.prototype.forEach = function () {
            return Array.prototype.forEach.apply(this._records, arguments);
        };

        // Get the index of the item
        Collection.prototype.indexOf = function() {
            return Array.prototype.indexOf.apply(this._records, arguments);
        };

        // Convert the collection into an array of objects
        Collection.prototype.toJSON = function () {
            var i, len, record, results = [];
            for (i = 0, len = this._records.length; i < len; i += 1) {
                record = this._records[i];
                results.push(record.toJSON());
            }
            return results;
        };

        // Return the first record in the collection
        Collection.prototype.first = function () {
            return this._records[0];
        };

        // Return the last record in the collection
        Collection.prototype.last = function () {
            return this._records[this._records.length - 1];
        };

        // Return a specified record in the collection
        Collection.prototype.get = function (index) {
            return this._records[index];
        };


        return Collection;

    }());


    /*
     * VIEW
     */

    View = (function () {

        function View(template, fromString) {
            this.fromString = fromString;
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
        View.prototype.render = function (data) {
            var html = '';
            if (this.fromString) {
                html = this.template(data);
            } else {
                html = this.template.render(data);
            }
            return html;
        };

        return View;

    }());

    // Add the extend to method to all classes
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
