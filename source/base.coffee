
# My own custom framework, it's based on Spine and Backbone.
# The idea is that it only includes the stuff I use.

# Uses jQuery for DOM stuff
$ = require 'jqueryify'

# Uses swig for templating
# Can easily be substituted with another templating engine
swig = require 'swig'

# Load values from one object into another
include = (to, from) ->
  for key, value of from
    to[key] = value
  return this


# Handle DOM interaction
class Controller

  include: (obj) => include(this, obj)

  elements: {}
  events: {}

  # You can specify which element to bind to
  # But it defaults to @el
  _bind: (el=@el) =>

    # Cache elements
    for selector, name of @elements
      @[name] = el.find(selector)

    # Bind events
    for query, action of @events
      split = query.indexOf(' ')
      event = query[0..split]
      selector = query[split+1..]
      if selector.length > 0
        el.on(event, selector, @[action])
      else
        el.on(event, @[action])

  constructor: (attrs) ->
    @include(this, attrs)

    # Binding events/elements requires an element
    if @el? then @_bind()


# Simple event handler
# I could add .off() and .once() but I never use them ...
class Event

  constructor: ->
    @_events = {}

  trigger: (event, args...) =>
    if @_events[event]?
      for fn in @_events[event]
       fn.apply(fn, args)
    return

  on: (events, fn) =>
    # Allow mutltiple events to be listend for at once
    # Event.on('update change refresh', fn)
    for event in events.split(' ')
      @_events[event] ?= []
      @_events[event].push(fn)


# A basic Model class
# Just stores data and has defaults and events
class Model extends Event

  include: (obj) => include(this, obj)

  constructor: (attrs) ->
    super

    @defaults ?= {}
    @_data = {}

    @include(@defaults)
    @include(attrs)

    set = (key) =>
      (value) =>
        return if value is @_data[key]
        @_data[key] = value
        @trigger("change:#{key}", value)

    get = (key) =>
      return => @_data[key]

    for key of @defaults
      @__defineSetter__ key, set(key)
      @__defineGetter__ key, get(key)

  refresh: (data) =>
    @include(data)
    @trigger('refresh')

  destroy: =>
    @trigger('before:destroy')
    delete @_data
    @trigger('destroy')
    return this

  toJSON: =>
    return @_data


# A collection holds an array of models
# Models events bubble up to the collection
# You can add/remove models
class Collection extends Event

  constructor: ->
    super
    @_records = []

  create: (args...) =>
    model = new @model(args...)
    @add(model)
    return model

  add: (model) =>

    # Add to records array
    @_records.push(model)

    # Bubble events
    model.on 'change', =>
      @trigger('change:model', model)

    model.on 'destroy', =>
      @trigger('destroy:model', model)
      @remove(model)

    # Alert app that a new model has been created
    @trigger('create:model', model)

  remove: (record) =>
    index = @_records.indexOf(record)
    @_records.splice(index, 1)
    @trigger('change')

  move: (record, pos) =>
    index = @_records.indexOf(record)
    @_records.splice(index, 1)
    @_records.splice(pos, 0, record)
    @trigger('change')

  refresh: (data) =>
    @_records = []
    for record in data
      model = new @model(record)
      @_records.push model
    @trigger('refresh')

  forEach: =>
    Array::forEach.apply(@_records, arguments)

  toJSON: =>
    record.toJSON() for record in @_records

  first: =>
    @_records[0]

  last: =>
    @_records[@_records.length-1]

  get: (index) =>
    @_records[index]


# A view stores and renders a template
class View
  
  # Expose swig
  # root: __dirname + '/../../../source/views'
  @init: swig.init.bind(swig)

  constructor: (filename) ->
    path = filename + '.html'
    @template = swig.compileFile(path)

  render: (data) =>
    @template.render(data)


# Export all the classes and jQuery
module.exports =
  Event: Event
  Controller: Controller
  Model: Model
  Collection: Collection
  View: View
