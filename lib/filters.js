var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));

var CSS_URL = /^(.*)(url|resolve)\(["']?(.+?)["']?\)(.*)$/;

exports.replaceImageUrl = function(url, replace) {
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
    return fs.statAsync(node.filePath).catch(function (err) {
        console.error(err.message);
    });
};


exports.isBackgroundDecl = function (prop) {
    return prop.match(/^background(-image)?$/) !== null;
};

