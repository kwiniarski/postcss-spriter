var utils = require('./utils');
var spriteMap = require('./spritemap');
var Promise = require('bluebird');


exports = module.exports = function postcssSpriterFactory(options) {

    options = options || {};
    // Path used to look up for images. By default all images paths are relative
    // to the CSS file
    options.imagePath = options.imagePath || '.';
    // Where to put sprite maps
    options.spriteMapsDir = options.spriteMapsDir || '.';
    // How to resolve sprite map URL in CSS file
    options.spriteMapsBaseUrl = options.spriteMapsBaseUrl;


    function getDecl(css) {
        return getBackgroundRulesInFile(css)
            .map(utils.extractImageUrl(options.imagesPath))
            .filter(utils.checkIfFileExists);
    }

    return function (css) {
        return Promise.join(options, css, getDecl(css))
            .spread(spriteMap)
            .spread(updateCss)
            .catch(function(err){
                console.error(err.stack);
            });
    }
};

exports.postcss = function(css) {
    return postcssSpriterFactory()(css);
};

/**
 *
 * @param css
 * @returns {Promise}
 */
function getBackgroundRulesInFile(css) {
    var images = [];
    return new Promise(function (resolve, reject) {
        try {
            css.eachRule(function (rule) {
                rule.eachDecl(function (decl) {
                    if (utils.isBackgroundDecl(decl.prop)) {
                        images.push(decl);
                    }
                });
            });
            resolve(images);
        } catch (err) {
            reject(err);
        }
    });
}




function updateCss(options, css, rules, spriteMap) {
    return new Promise(function (resolve, reject) {
        try {
            css.eachRule(function (rule) {
                rule.eachDecl(updateDeclaration(options, rules, spriteMap));
            });
            resolve(css);
        } catch (err) {
            reject(err);
        }
    });
};

function findInSprite(file, spriteMap) {
    return spriteMap.coordinates[file] || null;
}

function updateDeclaration(options, rules, spriteMap) {
    return function (decl) {
        var rule = decl.parent;
        var sprite;

        if (decl.filePath) {
            sprite = findInSprite(decl.filePath, spriteMap);
        }

        if (!sprite) {
            return;
        }

        switch (decl.prop) {
            case 'background-image':
                decl.value = utils.replaceImageUrl(decl.value, spriteMap.file.url);
                rule.insertAfter(decl, {
                    prop: 'background-position',
                    value: sprite.x + 'px ' + sprite.y + 'px'
                });
                break;
            case 'background':
                decl.value = utils.replaceImageUrl(decl.value, spriteMap.file.url);
                rule.insertAfter(decl, {
                    prop: 'background-position',
                    value: sprite.x + 'px ' + sprite.y + 'px'
                });
                break;
        }

        return decl;
    }
}
