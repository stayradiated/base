/*jslint node: true, nomen: true*/

(function () {
    'use strict';

    var include, extend, inherit, Module, View, Event, Model, Collection;

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
     * MODULE
     *
     * Module magic taken from Spine
     */

    Module = {

        includes: function (obj) {
            var key;
            if (!obj) {
                throw new Error('include(obj) requires obj');
            }
            for (key in obj) {
                if (obj.hasOwnProperty(key) && key !== 'included' && key !== 'extended') {
                    this.prototype[key] = obj[key];
                }
            }
            if (obj.hasOwnProperty('included')) {
                obj.included.apply(this);
            }
            return this;
        },

        extends: function (obj) {
            var key;
            if (!obj) {
                throw new Error('extend(obj) requires obj');
            }
            for (key in obj) {
                if (obj.hasOwnProperty(key) && key !== 'included' && key !== 'extended') {
                    this[key] = obj[key];
                }
            }
            if (obj.hasOwnProperty('extended')) {
                obj.extended.apply(this);
            }
            return this;
        }

    };


    /*
     * EVENT
     */

    Event = (function () {

        function Event(attrs) {
            var key;
            this._events = {};
            this._listening = [];
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

        include(Event, Module);

        // Bind an event to a function
        // Returns an event ID so you can unbind it later
        Event.prototype.on = function (events, fn) {
            var ids, id, i, len, event;
            if (typeof fn !== 'function') {
                throw new Error('fn not function');
            }
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
            args = 2 <= arguments.length ? [].slice.call(arguments, 1) : [];
            // Is this a good idea?
            if (event !== '*') {
                this.trigger('*', event, args);
            }
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
        Event.prototype.off = function (events, id) {
            var i, len;
            if (Array.isArray(id)) {
                for (i = 0, len = id.length; i < len; i += 1) {
                    this.off(events, id[i]);
                }
                return;
            }
            events = events.split(' ');
            for (i = 0, len = events.length; i < len; i += 1) {
                delete this._events[events[i]][id];
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
                            obj.off(event, events[event]);
                        }
                    }
                }
            }
            this._listening = [];
        };

        return Event;

    }());


    /*
     * CONTROLLER
     */

    View = (function () {

        function View(attrs) {
            View.__super__.constructor.apply(this, arguments);
            if (!this.elements) { this.elements = {}; }
            if (!this.events) { this.events = {}; }
            include(this, attrs);
            if (this.el) { this.bind(); }
        }

        // Load Events
        inherit(View, Event);
        include(View, Module);

        View.prototype.bind = function (el) {
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

        View.prototype.unbind = function (el) {
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

        // Unbind the view and remove the element
        View.prototype.release = function () {
            this.unbind();
            this.el.remove();
            this.stopListening();
        };

        return View;

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

        }

        // Load Events
        inherit(Model, Event);
        include(Model, Module);

        // Change a value
        Model.prototype.set = function (key, value, options) {
            if (!this.defaults.hasOwnProperty(key)) {
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
        Model.prototype.get = function (key) {
            if (this.defaults.hasOwnProperty(key)) {
                return this._data[key];
            }
            return this[key];
        };

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
        Model.prototype.toJSON = function (strict) {
            var key, json;
            if (strict) {
                for (key in this.defaults) {
                    if (this.defaults.hasOwnProperty(key)) {
                        json[key] = this._data[key];
                    }
                }
            } else {
                json = this._data;
            }
            return json;
        };


        return Model;

    }());


    /*
     * COLLECTION
     */

    Collection = (function () {

        function Collection() {
            Collection.__super__.constructor.apply(this, arguments);
            this.length  = 0;
            this._index  = 0;
            this._models = [];
            this._lookup = {};
        }

        // Load Events
        inherit(Collection, Event);
        include(Collection, Module);

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

            var id, index, self = this;

            // Set ID
            if (model.id) {
                id = model.id;
            } else {
                id = 'c-' + this._index;
                this._index += 1;
                model.set('id', id, {silent: true});
            }

            // Add to collection
            model.collection = this;
            index = this._models.push(model) - 1;
            this._lookup[id] = index;
            this.length += 1;

            // Bubble events
            this.listen(model, {
                '*': function (event, args) {
                    args = args.slice(0);
                    args.unshift(event + ':model', model);
                    self.trigger.apply(self, args);
                },
                'before:destroy': function () {
                    self.remove(model);
                }
            });

            // Only trigger create if silent is not set
            if (!options || !options.silent) {
                this.trigger('create:model', model);
                this.trigger('change');
            }

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
            this._lookup[model.id] = index;
            this.trigger('change:order');
            this.trigger('change');
        };

        // Append or replace the data in the collection
        // Doesn't trigger any events when updating the array apart from 'refresh'
        Collection.prototype.refresh = function (data, replace) {
            var i, len;
            if (replace) {
                this._models = [];
                this._lookup = {};
            }
            for (i = 0, len = data.length; i < len; i += 1) {
                this.create(data[i], { silent: true });
            }
            return this.trigger('refresh');
        };

        // Loop over each record in the collection
        Collection.prototype.forEach = function () {
            return this._models.forEach.apply(this._models, arguments);
        };

        // Filter the models
        Collection.prototype.filter = function () {
            return this._models.filter.apply(this._models, arguments);
        };

        // Sort the models. Does not alter original order
        Collection.prototype.sort = function () {
            return this._models.sort.apply(this._models, arguments);
        };

        // Get the index of the item
        Collection.prototype.indexOf = function (model) {
            if (typeof model === 'string') {
                // Convert model id to actual model
                return this.indexOf(this.get(model));
            }
            return this._models.indexOf(model);
        };

        // Convert the collection into an array of objects
        Collection.prototype.toJSON = function () {
            var i, id, len, record, results = [];
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
            var index = this._lookup[id];
            return this.at(index);
        };

        // Return a specified record in the collection
        Collection.prototype.at = function (index) {
            return this._models[index];
        };

        // Check if a model exists in the collection
        Collection.prototype.exists = function (model) {
            return this.indexOf(model) > -1;
        };

        return Collection;

    }());

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
