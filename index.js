"use strict";
`requires es6 node`;

var Metalsmith = require('metalsmith');
var _ = require("lodash");
var template = require("./templates");

main();

function main() {
  compilePages();
}

function compilePages() {
  Metalsmith(__dirname)  
      .source("pages")
      .destination(__dirname + '/build')
      .use(markdownOnly)
      .use(function(files, ms, cb) {
        _.each(files, function(file, name) {
          try {
            delete files[name];
            file.contents = template.compile("page", {
              title: file.title,
              content: file.contents,
            });

            files[name.replace(/\.md$/, ".html")] = file;
          } catch(e) {
            cb(Error(`failed on ${name}: ${e.stack}`));
          }
        })
        cb();
      })
      .use(tapMiddleware)
      .build(function(err) {
        if(err) throw err;
        
      });
}


function compilePage(name, file) {
  template.compile("page", {
  });
}

function compileMarkdown() {
  
}

function markdownOnly(files, ms, cb) {
  _.forOwn(files, function(v, fn) {
    if(!/\.md$/.test(fn)) {
      delete files[fn];
    }
  });
  cb();
}

function tapMiddleware(files, metalsmith, cb) {
  console.log(files);
  cb();
}
