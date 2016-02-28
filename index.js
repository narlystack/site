"use strict";
`requires es6 node`;

var _ = require("lodash");
var template = require("./templates");
var markdown = require("markdown");
var Promise = require("bluebird");


main();

function main() {
  loadData()
  .then(template.setGlobals)
  .then(compilePages)
  .then(copyAssets)
  .then(() => console.log("built"), (e) => console.error(e.stack))
}

function compilePages() {
  return Promise.fromCallback((cb) => {
    loadPages()
      .destination(__dirname + '/build')
      .use(markdown({
        "smartypants": true,
        "gfm": true,
        "tables": true,
      }))
      .use(_.partial(compile, "page"))
      .build(cb)
  });
}

function loadPages() {
  return Metalsmith(__dirname)  
    .source("pages")
    .clean(false)
    .use(markdownOnly)
    .use(permalinks("/:title"))
}

function loadData() {
  const globals = {
    blog: {
      title: "Narly Stack",
      subtitle: "NodeJS and Relational databases",
    },
  };

  const pages = Promise.fromCallback((cb) => {
    const chain = loadPages();

    chain
      .read((err, files) => {
        cb(err, { files, chain });
      })

  }).then(function(result) {
    return Promise.fromCallback((cb) => {
      result.chain.run(result.files, cb);
    });
  })

  return pages.then((allPages) => {
    console.log(allPages);
    
    globals.pages = _.values(allPages);
    return globals;
  });
}

function permalinks(pattern) {
  return function(files, _ms, cb) {
    _.each(files, function(file, name) {
      const permalink = pattern.replace(/:(\w+)/g, (_a, key) => {
        if(!(key in file)) {
          throw Error(`missing ${key} in file`);
        }
        return slugify(file[key]);
      });

      file.permalink = permalink;
      replaceKey(files, name, permalink.replace(/^\//, "") + "/index.html");
    });

    cb();
  }

  function slugify(s) {
    return s.toLowerCase().replace(/[^\w]+/g, " ").replace(/\s+/g, "-");
  }
}

function replaceKey(o, k, other) {
  const v= o[k];
  delete o[k];
  o[other] = v;
  return o; 
}

function promisify(cb) {
  var resolve;
  var reject;
  var p = new Promise(function(y, n) {
    resolve = y, reject = n;
  });
  return p;
}

function failOnError(err) {
  if(err) throw err;
}

function compile(tpl, files) {
  _.each(files, function(file, name) {
    try {
      file.contents = template.compile(tpl, {
        title: file.title,
        content: file.contents,
      });
    } catch(e) {
      throw Error(`failed on ${name}: ${e.stack}`);
    }
  })
}

function copyAssets() {
  return Promise.fromCallback((cb) => {
    Metalsmith(__dirname)
    .clean(false)
    .source("assets")
    .destination("build")
    .build(cb)
  });
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

function load() {
  
}
