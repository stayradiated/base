{exec} = require 'child_process'

task 'build', ->
  exec 'coffee -cs < source/base.coffee > index.js', (err, stdout, stderr) ->
    console.log stdout+stderr
