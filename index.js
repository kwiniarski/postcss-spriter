var postcss = require('postcss');
var postcssSpriterFactory = require('./lib/plugin');

exports = module.exports = postcss.plugin('postcss-spriter', postcssSpriterFactory);



