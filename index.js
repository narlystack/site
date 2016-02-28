"use strict";
`requires es6 node`;

var _ = require("lodash");
var template = require("./templates");
var marked = require("marked");
var Promise = require("bluebird");
var execSync = require("child_process").execSync;
var glob = require("glob");
var fs = require("fs");
var path = require("path");


main();

function main() {
  Promise.props({
    pages: loadPages(),
  })
  .then((data) => {
    const globals = { 
      pages: data.pages,
      blog: {
        title: "Narly Stack",
        subtitle: "NodeJS and Relational databases",
      },
    };

    template.setGlobals(globals);

    data.pages = _.map(data.pages, _.partial(compile, "page"));

    return write(data.pages);
  })
  .then(() => console.log("built"), (e) => console.error(e.stack))
}

function loadPages() {
  const pages = load("pages/*.md");
  _.each(pages, all(readMetadata, markdown, _.partial(permalink, "/:title")));
  return pages; 
}

function write(files) {
  _.each(files, function(file) {
    const fn = __dirname + "/build/" + file.path;
    execSync(`mkdir -p '${path.dirname(fn)}'`);
    fs.writeFileSync(fn, file.content);
  });
}

function all() {
  const fns = arguments;
  return function(item) {
    _.each(fns, (f) => f(item))
  }
}

function markdown(file) {
  file.content = compileMarkdown(file.content); 
}

function compileMarkdown(md) {
  return marked(md, {
    "smartypants": true,
    "gfm": true,
    "tables": true,
  });
}

function readMetadata(file) {
  const index = file.content.search(/^---/m);
  
  if(index === -1 ) {
    return file;
  }
  const meta = file.content.slice(0, index - 1);
  file.content = file.content.slice(index + 4);
  const parsed = JSON.parse("{" + meta  + "}");
  _.defaults(file, parsed);
  return file;
}

function compile(tpl, file) {
  try {
    file.content = template.compile(tpl, {
      title: file.title,
      content: file.content,
    });

    return file;

  } catch(e) {
    throw Error(`failed on ${file.sourceFile}: ${e.stack}`);
  }
}

function copyAssets() {
  exec("rsync -a assets/* build");
}

function load(path) {
  return glob.sync(path).map(function(fn) {
    return {
      path: fn,
      sourceFile: fn,
      content: fs.readFileSync(fn, { encoding: "utf8" }).toString(),
    };
  });
}

function permalink(pattern, file) {
  const permalink = pattern.replace(/:(\w+)/g, (_a, key) => {
    if(!(key in file)) {
      throw Error(`missing ${key} in file`);
    }
    return slugify(file[key]);
  });

  file.permalink = permalink;
  file.path = permalink.replace(/^\//, "") + "/index.html";

  function slugify(s) {
    return s.toLowerCase().replace(/[^\w]+/g, " ").replace(/\s+/g, "-");
  }
}

