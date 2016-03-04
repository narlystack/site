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
var tagsList = [],
    authorList = [];


main();

function main() {
  Promise.props({
    pages: loadPages(),
    posts: loadPosts(),
    tags: loadTags(),
    authors: loadAuthors()
  })
  .then((data) => {
    const globals = { 
      pages: data.pages,
      posts: data.posts,
      tags: data.tags,
      authors: data.authors,
      blog: {
        title: "Narly Stack",
        subtitle: "NodeJS and Relational databases",
        url: "/",
        cover: "/images/cover.jpg"
      }
    };
    template.global(globals);
    data.posts.sort(compareDate);

    var tagList=[];
    _.each(data.tags, (tag) => {
      var out = _.filter(data.posts, function(p){
        if(_.find(p.tags,(t)=> {
              return (t.name == tag.name);
            })){return true}
      });
      tag.Posts=Object.assign({},out);
      tagList.push.apply(tagList, execTemplate(tag,"tag",globals));

    });
    data.tags = tagList;

    //create list of template files for authors + pagination
    var authorList=[];
    _.each(data.authors, (author) => {
      var out = _.filter(data.posts, function (p) {
        return (p.author.name == author.name);
      });

      author.Posts = _.map(out, function (o) {
        var objT = Object.assign({}, o);
        objT.author = {};
        return objT;
      });
      authorList.push.apply(authorList, execTemplate(author,"author",globals));
    });
    data.authors=authorList;

    //create file after template + pagination
    var pageList=[];
    _.each(data.pages, (page) => {
      if(page.template=="index") {
        page.Posts = Object.assign({}, data.posts);

        page.Posts = _.values(page.Posts);
        if (_.size(page.Posts) > 4){
          var pagePostList = _.chunk(page.Posts,4);
          _.each(pagePostList,function(block, index){
            var pageTmp = Object.assign({},page);
            pageTmp.Posts = block;
            pageTmp.numberPages = _.size(pagePostList);
            if (index==0){
              pageTmp.numberPage = 1;
              pageTmp.next_page =pageTmp.permalink+"page/"+2;
              pageList.push(pageList,applyTemplate(page.template, pageTmp, globals))
            } else{
              if(index == 1){
                pageTmp.prev_page = pageTmp.permalink;
              } else {
                pageTmp.prev_page = pageTmp.permalink+"page/"+index;
              }
              if(index+1 != pageTmp.numberPages){
                pageTmp.next_page = pageTmp.permalink+"page/"+(index+2);
              }
              pageTmp.permalink+="/page/"+(index+1);
              pageTmp.path="/page/"+(index+1)+pageTmp.path;
              pageTmp.numberPage = index+1;
              pageList.push(pageList,applyTemplate(page.template, pageTmp, globals))
            }

          });
          }
        } else {
          var pageTmp=Object.assign({},page);
          pageTmp.numberPages = 1;
          pageTmp.numberPage = 1;
          pageList.push(pageList,applyTemplate(page.template || "page", pageTmp, globals))
        }
    });
    data.pages = pageList;

    data.posts = _.map(data.posts, (post,index) => {
      var postTmp = Object.assign({},post);
      (data.posts[index+1])?(postTmp.prev_post = Object.assign({},data.posts[index+1])):(undefined);
      (data.posts[index-1])?(postTmp.next_post = Object.assign({},data.posts[index-1])):(undefined);
      postTmp.numberPages = 1;
      postTmp.numberPage = 1;
      return applyTemplate("post", postTmp, globals)
    });

    var arr = [];
    arr.push.apply(arr,data.pages);
    arr.push.apply(arr,data.posts);
    arr.push.apply(arr,data.tags);
    arr.push.apply(arr,data.authors);

    return write(arr);

  })
  .then(() => {
    copyAssets();
    console.log("built")}, (e) => console.error(e.stack))
}

//function for loading, parsing, create lists, other operations for pages, posts, tags, authors
function loadPages() {
  const pages = load("pages/*.md");
  _.each(pages, all(readMetadata, markdown, _.partial(permalink, "/:title")));
  return pages; 
}

function loadPosts() {
  const posts = load("posts/*.md");
  _.each(posts, all(readMetadata, markdown, _.partial(permalink, "/posts/:title")));
  return posts;
}

function loadTags() {
  var count = _.groupBy(tagsList);
  tagsList = _.map(_.uniq(tagsList),function(tag){
    return {name: tag, number: _.size(count[tag])}
  });
  _.each(tagsList, all(_.partial(permalink, "/tags/:name")));
  return tagsList;
}

function loadAuthors() {
  var count = _.countBy(authorList,'name');
  authorList = _.map(_.uniq(authorList),function(author){
    author.number = count[author.name];
    return author
  });
  _.each(authorList, all(_.partial(permalink, "/authors/:name")));
  return authorList;
}

//function for writing file object
function write(files) {
  _.each(files, function(file) {
    const fn = __dirname + "/build/" + file.path;
    execSync(`mkdir -p ${path.dirname(fn)}`);
    fs.writeFileSync(fn, file.content);
  });
}

//function for safe using function in list
function all() {
  const fns = arguments;
  return function(item) {
    try {
      _.each(fns, (f) => f(item))
    } catch(e) {
      throw Error(`error in ${item.sourcePath}: ${e.stack}`);
    }
  }
}

function markdown(file) {
  file.content = compileMarkdown(file.content); 
}

//function for compile markdown
function compileMarkdown(md) {
  return marked(md, {
    "smartypants": true,
    "gfm": true,
    "tables": true
  });
}

//function for parsing markdown to file object
function readMetadata(file) {
  const index = file.content.search(/^---/m);
  if(index === -1 ) {
    return file;
  }
  const meta = file.content.slice(0, index - 1);
  file.content = file.content.slice(index + 4);
  const parsed = JSON.parse("{" + meta  + "}");

  if(parsed.date) {
    const raw = parsed.date;
    parsed.date = new Date(Date.parse(raw));
    if(isNaN(parsed.date.getTime())) {
      throw Error(`'${raw}' is not a valid date`);
    }
  }
  if(parsed.author){
    parsed.author=JSON.parse(parsed.author);
    parsed.author.url = "/authors/"+parsed.author.name.toLowerCase().replace(/[^\w]+/g, " ")
            .replace(/\s+/g, "-").replace(/\-$/, "");

    authorList.push(parsed.author);
  }
  if(parsed.tags){
    var tmp = parsed.tags.replace(/\s+/g, '').split(",");
    parsed.tags = _.map(tmp,function(tag){
      return {name: tag}
    });
    tagsList.push.apply(tagsList,tmp);
  }
  _.defaults(file, parsed);
  return file;
}

//function for applying template to each item
function applyTemplate(tpl, file, globals) {
  try {

    file.content = template.compile(tpl, {
      file: file,
      //blog parameters
      blogTitle: globals.blog.title,
      blogSubtitle: globals.blog.subtitle,
      blogUrl: globals.blog.url,
      tagsAll: globals.tags,

      //for pages
      title: file.title,
      content: file.content,
      cover: file.cover || globals.blog.cover,
      numberPage: file.numberPage,
      numberPages: file.numberPages,
      prev_page: file.prev_page,
      next_page: file.next_page,

      //for posts
      author: file.author,
      tags: file.tags,
      date: file.date,
      prev_post: file.prev_post,
      next_post: file.next_post,

      //for tags and authors
      name: file.name,
      number: file.number,
      posts: file.Posts,
      permalink: file.permalink,
      path: file.path,
      pages: globals.pages,
      image: file.image,
      visibleAuthor: file.visibleAuthor
    });
    //console.log("file cover: "+file.title+" "+file.cover);
    return file;

  } catch(e) {
    throw Error(`failed on ${file.sourcePath}: ${e.stack}`);
  }
}

//function for copy asset to build
function copyAssets() {
  execSync("rsync -a ./assets/* ./build");
}

//function for loading files
function load(path) {
  return glob.sync(path).map(function(fn) {
    return {
      path: fn,
      sourcePath: fn,
      content: fs.readFileSync(fn, { encoding: "utf8" }).toString()
    };
  });
}

//function for adding path and permalink to file object
function permalink(pattern, file) {
  if(!file.permalink) {
    const permalink = pattern.replace(/:(\w+)/g, (_a, key) => {
      if(!(key in file)) {
        throw Error(`missing ${key} in file`);
      }
      return slugify(file[key]);
    });

    file.permalink = permalink;
  }

  file.path = file.permalink.replace(/^\//, "") + "/index.html";

  function slugify(s) {
    return s.toLowerCase().replace(/[^\w]+/g, " ").replace(/\s+/g, "-").replace(/\-$/, "");
  }
}

//function for create file-values with applying templates for writing
function execTemplate(item,tpl,globals){
  var List=[];
  item.Posts = _.values(item.Posts);
  if (_.size(item.Posts) > 4) {
    var PostList = _.chunk(item.Posts, 4);
    _.each(PostList, function (block, index) {
      var Tmp = Object.assign({}, item);
      Tmp.Posts = block;
      Tmp.numberPages = _.size(PostList);
      if (index == 0) {
        Tmp.numberPage = 1;
        Tmp.next_page = Tmp.permalink + "/page/" + 2;
        List.push(List, applyTemplate(tpl, Tmp, globals))
      } else {
        if (index == 1) {
          Tmp.prev_page = Tmp.permalink;
        } else {
          Tmp.prev_page = Tmp.permalink + "/page/" + index;
        }
        if (index + 1 != Tmp.numberPages) {
          Tmp.next_page = Tmp.permalink + "/page/" + (index + 2);
        }
        Tmp.permalink += "/page/" + (index + 1);
        Tmp.path = Tmp.permalink+"/index.html";
        Tmp.numberPage = index + 1;
        List.push(List, applyTemplate(tpl, Tmp, globals))
      }
    });
  } else {
    var Tmp=Object.assign({},item);
    Tmp.numberPages = 1;
    Tmp.numberPage = 1;
    List.push(List, applyTemplate(tpl, Tmp, globals))
  }
  return List;
}

//function for compare dates in array
function compareDate(post1,post2){
  return post2.date - post1.date;
}

