var path = require('path');
var Promise = require('bluebird');
var spritesmith = Promise.promisify(require('spritesmith'));
var fs = Promise.promisifyAll(require('fs'));
var utils = require('./utils');


/**
 * Get filename from CSS file
 *
 * @param {String} groupName
 * @param {String} cssFileName
 * @param {String} [extension='.png']
 * @returns {String}
 */
function getFileNameFromCSS(groupName, cssFileName, ext) {
    return groupName + '_' + path.basename(cssFileName, '.css') + (ext || '.png');
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
 * Generates sprite map and writes it to disk
 *
 * @param {Object} pluginOptions
 * @param {String} groupName
 * @param {Object} css
 * @param {Array} files
 * @returns {Promise}
 */
function generateSpriteMap(pluginOptions, groupName, css, files) {
    return spritesmith({src: files}).then(function (spriteMap) {
        var spriteMapsBaseUrl = pluginOptions.spriteMapsBaseUrl;

        spriteMap.css = {};
        spriteMap.css.file = css.source.input.file;
        spriteMap.css.path = path.dirname(css.source.input.file);

        if (!spriteMapsBaseUrl) {
            // By default in CSS file generate relative paths
            // from CSS file location to sprite map save location
            spriteMapsBaseUrl = path.relative(spriteMap.css.path, pluginOptions.spriteMapsDir);
        }

        spriteMap.file = {};
        spriteMap.file.name = getFileNameFromCSS(groupName, css.source.input.file);
        spriteMap.file.path = getFilePath(spriteMap.file.name, pluginOptions.spriteMapsDir);

        // URL to generated sprite map in CSS file can be:
        // - absolute with full hostname, ex. http://cdn.com/file.png or //cdn.com/file.png
        // - absolute to CSS file hostname, ex. /file.png
        // - relative to CSS file pathname, ex. ./file.png or ../css/file.png
        spriteMap.file.url = utils.resolvePathToUrl(spriteMap.file.name, spriteMapsBaseUrl);

        return writeFile(spriteMap.file.path, spriteMap.image, pluginOptions.dryRun)
            .return(spriteMap);
    });
}


/**
 *
 * @param {Object} pluginOptions
 * @param {Object} css - Parsed CSS file
 * @param {Array} groupedRules - CSS nodes with resolved filePath
 * @returns {Promise}
 */
module.exports = function spritemap(pluginOptions, css, groupedRules) {
    var tasks = [];

    for (var groupName in groupedRules) {
        var files = [];
        for (var i = 0, j = groupedRules[groupName].length; i < j; i++) {
            files.push(groupedRules[groupName][i].file.path);
        }
        tasks.push(generateSpriteMap(pluginOptions, groupName, css, files));
    }

    return Promise.all(tasks).then(function (spriteMaps) {
        return [pluginOptions, css, groupedRules, spriteMaps];
    });
};


