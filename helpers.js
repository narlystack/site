var _ = require("lodash");

var Handlebars = require('handlebars')
var moment = require('moment')
const template = require("./templates");

const ASSET_PATH = "/";

module.exports = {
  date: function (date, options) {
    if (arguments.length === 1) {
      options = date
      date = Date.now()
    }
    return moment(date).format(options.hash.format)
  },

  navigation: function (context, options) {
    const file = context.data.root.file;
    return _.reduce(context.data.root.pages, (s, p) => {
      console.log(p.permalink, file.permalink);
      return s + context.fn({
        permalink: p.permalink,
        nav: p.nav,
        class: p.permalink === file.permalink ? "active" : "",
      });
    }, "");
  },

  is: function (page) {
    return false;
  },

  isdraft: function (source) {
    return source.indexOf('_drafts/') === 0
  },

  asset: function (name) {
    name = name || "";
    if (name.slice(0, 2) === '//' || ['http:/', 'https:'].indexOf(name.slice(0, 6)) !== -1) {
      return name
    }
    if (name[0] === '/') name = name.slice(1)
    return ASSET_PATH + name
  },

  abs: function (name) {
    if (name.slice(0, 2) === '//' || ['http:/', 'https:'].indexOf(name.slice(0, 6)) !== -1) {
      return name
    }
    if (name[0] === '/') name = name.slice(1)
    return ASSET_PATH + name
  },

  encode: function (item) {
    return new Handlebars.SafeString(encodeURIComponent(item))
  },

  excerpt: function () {
    return new Handlebars.SafeString(this.excerpt)
  },

  url: function (options) {
    if (options.hash.absolute) {
      return this.url
    }
    return this.path
  },

  get_title: function (page) {
    if (page.title) {
      return page.title + ' | Jared Forsyth.com'
    }
    if (page.tag) {
      return page.tag + ' | Jared Forsyth.com'
    }
    return 'Jared Forsyth.com'
  },

  tags: function (tags, options) {
    if (arguments.length === 1) {
      options = tags
      tags = this.tags
    }
    options = options.hash
    if (!tags || !tags.length) return
    return new Handlebars.SafeString((options.prefix || '') + tags.map(function (tag) {
      return '<a href="' + ASSET_PATH + tag.path + '">' + tag.name + '</a>'
    }).join(options.separator || ' '))
  },

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
