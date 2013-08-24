Base
====

_A tiny and simple javascript framework based on spine.js_

It was written to be used specifically with NodeJS based projects, such as
Node-Webkit, but it could be easily edited to work in the browser.

## Installation

This will probably never be published to the NPM registry, so the best way to
install it is to use `npm link`.

    git clone https://github.com/stayradiated/base.git
    cd base
    sudo npm link
    cd ~/project
    npm link base

## Model

Models use javascript getters and setters to detect changes to data, for this
to work you must set all model properties using the `defaults` object.

    Base = require 'base'

    class Task extends Base.Model

        defaults:
            name: ''
            completed: false

    task = new Task()

    task.on 'change:name', render

    task.name = 'Finish project'
    # will trigger change:name

## Controller

Controllers allow you to cache elements and bind DOM events

    Base = require 'base'

    class Panel extends Base.Controller

        elements:
            'input.search': 'search'

        events:
            'click .open': 'open'

        open: (e) =>
            query = @search
            console.log 'Looking for ' + query


## Collections

## Events

### Events.on( events, fn )

Listen for an event.

- `events` can be an array of events or just a single event.
- `fn` is the callback to run when the event is triggered.

### Events.trigger( event )

Trigger an event

### Events.off( event, id )

Stop listening for an event



## Views

## JavaScript

To use with JavaScript (instead of CoffeeScript) you can use the `extend`
method.
    
    var Base = require('base');

    var Task = Base.Model.extend({
        defaults: {
            name: '', 
            completed: false
        },
        constructor: function() {
            console.log('Created a new task');
        }
    });
