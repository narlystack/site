var _ = require("lodash");

var Handlebars = require('handlebars');
var moment = require('moment');
const template = require("./templates");

const ASSET_PATH = "/";

module.exports = {
  //helper for formatting data for posts
  formatDate: function (date, options) {
    if (arguments.length === 1) {
      options = date;
      date = Date.now()
    }
    return moment(date).format(options.hash.format)
  },

  //helper for returning navigations for page
  navigation: function (context, options) {
    const file = context.data.root.file;
    return _.reduce(this.pages, (s, p) => {
      return s + context.fn({
        permalink: p.permalink,
        nav: p.nav,
        class: p.permalink === file.permalink ? "nav-current" : ""
      });
    }, "");
  },

  is: function (context) {
    return ;
  },

  //helper for returning path to asset
  asset: function (name) {
    name = name || "";
    if (name.slice(0, 2) === '//' || ['http:/', 'https:'].indexOf(name.slice(0, 6)) !== -1) {
      return name
    }
    if (name[0] === '/') name = name.slice(1);
    return ASSET_PATH + name;

  },

  //helper for limit of posts content
  substr: function (value, options) {
    var opts = options.hash;
    var start = opts.start || 0;
    var len = opts.max;
    var out = value.substr(start,len);
    if (value.length > len) out+="  [ ... ]";
    return new Handlebars.SafeString(out);
  },

  //helper for returning absolut or local url
  url: function (options) {
    if (options.hash.absolute) {
      return this.url
    }
    //console.log("this path = "+this.path);
    return ASSET_PATH+this.path
  },

  //helper for returning tag info
  plural: function(){
    var name = Handlebars.escapeExpression(this.name);
    var number = Handlebars.escapeExpression(this.number);
    if (number == 1){
      return "1 post"
    } else if(number){return number+" posts"}
    else return "No posts"
  },

  //helper for formatting tags list after post
  tag_anchor: function(){
    var name = Handlebars.escapeExpression(this.name);
    var tagPath= ASSET_PATH + "tags/"+name;
    return new Handlebars.SafeString('<\a href=\"'+tagPath+'\" title=\"'+name+'\" class=\"tag-'+name+'\">'+name.toUpperCase()+'</a>')
  },

  //debug helper
  debug: function(optionalValue) {
    console.log("Current Context");
    console.log("====================");
    console.log(this);
  
    if (optionalValue) {
      if ('function' === typeof optionalValue) {
        optionalValue = optionalValue()
      }
      console.log("Value");
      console.log("====================");
      console.log(optionalValue);
    }
  }
};
