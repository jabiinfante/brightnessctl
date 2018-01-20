#!/usr/bin/env node

if (process.getuid()) {
  console.error('Run as root')
  process.exit(1)
}

var diffy = require('diffy')()
var input = require('diffy/input')()
var fs = require('fs')
var path = require('path')

var FOLDER = guessBestController('/sys/class/backlight/');
var BRIGHTNESS_FILE = path.join(FOLDER, 'brightness')
var MAX_BRIGHTNESS_FILE = path.join(FOLDER, 'max_brightness')
var MAX = readInt(MAX_BRIGHTNESS_FILE)

var pct = Math.floor(100 * readInt(BRIGHTNESS_FILE) / MAX)
var inc = 5

var ws = fs.createWriteStream(BRIGHTNESS_FILE)

input.on('right', function () {
  pct += inc
  if (pct > 100) pct = 100
  update()
})

input.on('left', function () {
  pct -= inc
  if (pct < 0) pct = 0
  update()
})

diffy.render(render)

function readInt (file) {
  return parseInt(fs.readFileSync(file, 'ascii'), 10)
}

function update () {
  ws.write('' + Math.max(1, Math.floor(pct / 100 * MAX)) + '\n')
  diffy.render()
}

function times (str, n) {
  var res = ''
  while (n--) res += str
  return res
}

function render () {
  var wid = Math.max(0, process.stdout.columns - 8)
  var widPct = Math.floor(wid * pct / 100)
  var slider = '[' + times('#', widPct) + times(' ', wid - widPct) + ']'

  return  'Use <left> and <right> to adjust brightness\n' +
    slider + ' ' + (pct < 10 ? '  ' : (pct < 100 ? ' ' : '')) + pct + '%\n'
}

function noop () {}

function guessBestController(basePath) {
  var candidates = fs.readdirSync(basePath);
  for(var i=0; i<candidates.length; i++) {
    var type = fs.readFileSync(path.join(basePath,candidates[i],'type'), 'ascii');
    if (type.substr(0,3) === 'raw') {
      return path.join(basePath, candidates[i]);
    }
  }
  return candidates[0] || null;
}
