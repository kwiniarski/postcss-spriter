var path = require('path');
var Promise = require('bluebird');
var spritesmith = Promise.promisify(require('spritesmith'));
var fs = Promise.promisifyAll(require('fs'));
var utils = require('./utils');


/**
 * Get filename from CSS file
 *
 * @param {String} cssFileName
 * @param {String} [extension='.png']
 * @returns {String}
 */
function getFileNameFromCSS(cssFileName, ext) {
    return path.basename(cssFileName, '.css') + (ext || '.png');
}

/**
 * Get absolute path to the sprite map file.
 * This path will be used to save image.
 *
 * @param {String} fileName
 * @param {String} basePath
 * @returns {String}
 */
function getFilePath(fileName, basePath) {
    return path.resolve(basePath, fileName);
};

/**
 * Saves file to disk
 *
 * @param {String} filePath
 * @param {String} imageData
 * @param {Boolean} dryRun
 * @returns {Promise}
 */
function writeFile(filePath, imageData, dryRun) {
    if (dryRun) {
        console.log('write (dry-run)', filePath);
        return Promise.resolve();
    }

    return fs.writeFileAsync(filePath, imageData, 'binary').tap(function () {
        console.log('write', filePath);
    });
}

/**
 *
 * @param {Object} pluginOptions
 * @param {Object} css - Parsed CSS file
 * @param {Array} rules - CSS nodes with resolved filePath
 * @returns {Promise}
 */
module.exports = function (pluginOptions, css, rules) {
    var files = [];
    var spriteMapsBaseUrl = pluginOptions.spriteMapsBaseUrl;

    for (var i = 0, j = rules.length; i < j; i++) {
        files.push(rules[i].filePath);
    }

    return spritesmith({ src: files }).then(function (spriteMap) {

        spriteMap.css = {};
        spriteMap.css.file = css.source.input.file;
        spriteMap.css.path = path.dirname(css.source.input.file);

        if (!spriteMapsBaseUrl) {
            // By default in CSS file generate relative paths
            // from CSS file location to sprite map save location
            spriteMapsBaseUrl = path.relative(spriteMap.css.path, pluginOptions.spriteMapsDir);
        }

        spriteMap.file = {};
        spriteMap.file.name = getFileNameFromCSS(css.source.input.file);
        spriteMap.file.path = getFilePath(spriteMap.file.name, pluginOptions.spriteMapsDir);

        // URL to generated sprite map in CSS file can be:
        // - absolute with full hostname, ex. http://cdn.com/file.png or //cdn.com/file.png
        // - absolute to CSS file hostname, ex. /file.png
        // - relative to CSS file pathname, ex. ./file.png or ../css/file.png
        spriteMap.file.url = utils.resolvePathToUrl(spriteMap.file.name, spriteMapsBaseUrl);

        return writeFile(spriteMap.file.path, spriteMap.image, pluginOptions.dryRun)
            .return([pluginOptions, css, rules, spriteMap]);
    });
};
