Base
====

> A minimal javascript MVC framework for modern browsers

## Installation

This will probably never be published to the NPM registry, so the best way to
install it is to use `npm link`.

    cd ~/npm_modules
    git clone https://github.com/stayradiated/Base.git
    cd Base
    npm link
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

    task.on 'change:name', ->
        console.log 'changing name'

    task.name = 'Finish project'
    # will trigger change:name



## View

Views allow you to cache elements and bind DOM events

    Base = require 'base'

    class Panel extends Base.View

        elements:
            'input.search': 'search'

        events:
            'click .open': 'open'

        open: (e) =>
            query = @search
            console.log 'Looking for ' + query


## Collections

A collection is just an array of models.

- create(attrs, options)
- add(model, options)
- remove(model)
- move(model, position)
- refresh(data, replace)
- foreach()
- indexOf()
- toJSON()
- first()
- last()
- get(index)

## Events

You can use event methods on Models, Collections and Views.

    var event = new Event();

### Events.on( events, fn )

Listen for an event.

- `events` can be an array of events or just a single event.
- `fn` is the callback to run when the event is triggered.

It returns the id of the event so you can remove it later.

    var id = event.on('change', function (data) {
        console.log('got some', data);
    });

### Events.trigger( event, data.. )

Trigger an event.

You can pass varibles to the event listener by including it as another
argument.

    event.trigger('change', 'data');
    // 'got some data'

### Events.off( event, id )

Stop listening for an event

    event.off('change', id);

## Using with CoffeeScript

You can just use the `class` and `extends` keyword. 

    Base = require 'base'

    class Task extends Base.Model
        defaults:
            name: ''
            completed: false
        constructor: ->
            console.log 'Created a new task'

## Using with JavaScript

To use with JavaScript you can use the `extend` method.
    
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
