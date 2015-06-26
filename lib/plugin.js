var utils = require('./utils');
var spriteMap = require('./spritemap');
var updateCss = require('./css-update');
var Promise = require('bluebird');

function groupImages(defaultGroupPrefix, groupingFn) {
    return function (total, item, index, arrayLength) {

        //var group = (function (file) {
        //    if (file.url.indexOf('edit') !== -1) {
        //        return 'edit';
        //    }
        //    return null;
        //}(item.file));
        var group = (groupingFn && groupingFn(item.file)) || defaultGroupPrefix;

        if (!total[group]) {
            total[group] = [item];
        } else {
            total[group].push(item);
        }

        return total;
    };
}

exports = module.exports = function postcssSpriterFactory(pluginOptions) {

    pluginOptions = pluginOptions || {};
    // Path used to look up for images. By default all images paths are relative
    // to the CSS file
    pluginOptions.imagePath = pluginOptions.imagePath || '.';
    // Where to put sprite maps
    pluginOptions.spriteMapsDir = pluginOptions.spriteMapsDir || '.';
    // How to resolve sprite map URL in CSS file
    pluginOptions.spriteMapsBaseUrl = pluginOptions.spriteMapsBaseUrl;
    pluginOptions.verbose = pluginOptions.verbose || false;
    pluginOptions.dryRun = pluginOptions.dryRun || false;
    pluginOptions.defaultGroupPrefix = pluginOptions.defaultGroupPrefix || 'sprite';
    pluginOptions.group = pluginOptions.group || null;


    function getDecl(css) {
        return getBackgroundRulesInFile(css)
            .map(utils.extractImageUrl(pluginOptions.imagesPath))
            // TODO Custom filtering functions
            .filter(utils.checkIfFileExists)
            .reduce(groupImages(pluginOptions.defaultGroupPrefix, pluginOptions.group), {})
    }


    return function (css) {
        return Promise.join(pluginOptions, css, getDecl(css))
            .spread(spriteMap)
            .spread(updateCss)
            .catch(utils.errorHandler);
    }
};

exports.postcss = function(css) {
    return postcssSpriterFactory()(css);
};

/**
 * Extract all CSS rules which contain any background image
 * declaration with path to existing file.
 *
 * @param {Object} css
 * @returns {Promise} - Promise resolved with list of CSS rule nodes
 */
function getBackgroundRulesInFile(css) {
    var images = [];
    return new Promise(function (resolve, reject) {
        try {
            css.eachRule(function (rule) {
                rule.eachDecl(function (decl) {
                    if (decl.prop.match(/^background(-image)?$/) !== null) {
                        images.push(decl);
                    }
                });
            });
            resolve(images);
        } catch (err) {
            reject(err.stack);
        }
    });
}




