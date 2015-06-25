var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
var url = require('url');
var chalk = require('chalk');

var CSS_URL = /^(.*)(url|resolve)\(["']?(.+?)["']?\)(.*)$/;
var IS_URL = /^(https?:)?\/\//i;

var BG_POSITION_RX = /\s*(?:(left|center|right|top|bottom|\d+(\.d+)?(%|r?em|ex|ch|v(h|w|min|max)|px|(m|c)m|in|p(t|c)|mozmm)?))/ig;
var BG_REPEAT_RX = /\s*(?:repeat-(x|y)|(no-)?repeat|space|round)/ig;
var BG_URL_RX = /\s*(?:url|resolve)\(["']?.+?["']?\)/i;

function urlJoin() {
    return path.join
        .apply(path, arguments)
        .replace(/\\/g, '/');
}

function pushString(value, add) {
    return (value + ' ' + add.trim()).trim();
}

function isUrl(url) {
    return IS_URL.test(url);
}


exports.errorHandler = function (error) {
    if (error.severity === 'warn') {
        console.log(chalk.yellow('warn'), error.message);
    } else {
        console.error(error.stack);
    }
};

exports.replaceImageUrl = function (url, replace) {
    return url.replace(CSS_URL, '$1$2(\'' + replace + '\')$4');
};

/**
 * Extract URL from CSS declaration and resolves it to absolute path
 * @param basePath
 * @returns {Function}
 */
exports.extractImageUrl = function (basePath) {
    return function (node) {
        var base = basePath || path.dirname(node.source.input.file);

        node.file = {};
        node.file.url = node.value.replace(CSS_URL, '$3');
        node.file.path = path.resolve(base, node.file.url);

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
    return fs.statAsync(node.file.path).catch(function (err) {
        err.severity = (err.code === 'ENOENT')
            ? 'warn'
            : 'error';

        exports.errorHandler(err);
    });
};


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

exports.parseBackgroundDeclaration = function (declarationValue) {
    var extract = {
        position: '',
        repeat: '',
        url: ''
    };

    extract.value = declarationValue

        .replace(BG_POSITION_RX, function (match) {
            extract.position = pushString(extract.position, match);
            return '';
        })
        .replace(BG_REPEAT_RX, function (match) {
            extract.repeat = pushString(extract.repeat, match);
            return '';
        })
        .replace(BG_URL_RX, function (match) {
            extract.url = pushString(extract.url, match);
            return '';
        });

    return extract;
};
