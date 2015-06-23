var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
var url = require('url');
var isAbsolute = path.isAbsolute;

var CSS_URL = /^(.*)(url|resolve)\(["']?(.+?)["']?\)(.*)$/;
var IS_URL = /^(https?:)?\/\//i;

function isUrl(url) {
    return IS_URL.test(url);
};


exports.errorHandler = function (error) {
    console.error(error.message);
};

exports.replaceImageUrl = function (url, replace) {
    return url.replace(CSS_URL, '$1$2(\''+replace+'\')$4');
};


/**
 * Extract URL from CSS declaration and resolves it to absolute path
 * @param basePath
 * @returns {Function}
 */
exports.extractImageUrl = function (basePath) {
    return function (node) {
        var base = basePath || path.dirname(node.source.input.file);
        var url = node.value.replace(CSS_URL, '$3');

        node.filePath = path.resolve(base, url);

        return node;
    }
};

/**
 * Check if file exists
 * @param file
 * @returns {Promise}
 */
exports.checkIfFileExists = function (node) {
    // Use stat to check if file exists. fs.exists will be deprecated.
    return fs.statAsync(node.filePath).catch(exports.errorHandler);
};


exports.isBackgroundDecl = function (prop) {
    return prop.match(/^background(-image)?$/) !== null;
};


function urlJoin() {
    return path.join
        .apply(path, arguments)
        .replace(/\\/g, '/');
}

/**
 *
 * @param {String} filePath - file name with path
 * @param {String|Function} basePath - additional path or function which will transform filePath
  * @returns {String}
 */
exports.resolvePathToUrl = function (filePath, basePath) {
    if (isUrl(basePath)) {
        var cssUrl = url.parse(basePath);
        cssUrl.pathname = urlJoin(cssUrl.pathname, filePath);
        return url.format(cssUrl);
    } else {
        return urlJoin(basePath, filePath);
    }
};
