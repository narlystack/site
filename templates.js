"use strict";

var Handlebars = require("handlebars");
var fs = require("fs");
var glob = require("glob");
var _ = require("lodash");
var path = require("path");
var helpers = require("./helpers");

var loaded = false;
var globals = {};

loadTemplate = _.memoize(loadTemplate);

exports.setGlobals = function(to) {
  globals = to;
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
  
  return withBody(content);
}

function withBody(content) {
  try {
    return runTemplate("layout", {
      body: content,
    });
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
