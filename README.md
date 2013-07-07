Base
====

A tiny and simple javascript framework based on spine.js

It was written to be used specifically with NodeJS based projects, such as
Node-Webkit, but it could be easily edited to work in the browser.

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


