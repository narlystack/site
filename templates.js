"use strict";

var Handlebars = require("handlebars");
var fs = require("fs");
var glob = require("glob");
var _ = require("lodash");
var path = require("path");
var helpers = require("./helpers");

var loaded = false;
const globals = exports.globals = {};

loadTemplate = _.memoize(loadTemplate);

exports.global = function(k, v) {
  if(_.isObject(k)) {
    _.each(k, (vi, ki) => globals[ki] = vi);
  } else {
    globals[k] = v;
  }
}

exports.compile = function(template, data) {
  if(!loaded) {
    register();
    loaded = true;
  }

  try {
    var content = runTemplate(template, data);
  } catch(e) {
    throw Error(`error running template '${template}': ${e.stack}`);
  }
  
  return withBody(content, data);
}

function withBody(content, data) {
  try {
    return runTemplate("layout", _.defaults(data, {
      body: content,
    }));
  } catch(e) {
    throw Error(`error in layout.hbs: ${e.stack}`);
  }
}

function runTemplate(tpl, data) {
  return loadTemplate(tpl)(_.defaults(data, globals)); 
}

function loadTemplate(name) {
  return Handlebars.compile(fs.readFileSync(__dirname + "/layouts/" + name + ".hbs", { encoding: "utf8" }));
}

function register() {
  glob.sync(__dirname + "/layouts/partials/*.hbs").forEach((fn) => {
    Handlebars.registerPartial(path.basename(fn, ".hbs"), fs.readFileSync(fn, { encoding: "utf8" }));
  });
  _.each(helpers, (fn, name) => {
    Handlebars.registerHelper(name, fn);
  });
}
