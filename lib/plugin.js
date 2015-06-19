var filters = require('./filters');
var Promise = require('bluebird');
var spritesmith = Promise.promisify(require('spritesmith'));
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');

exports = module.exports = function postcssSpriterFactory(options) {

    options = options || {};
    // Path used to look up for images
    options.imagePath = options.imagePath || '.';
    // Where to put sprite maps
    options.spriteMapsDest = options.spriteMapsDest || '.';

    function getDecl(css) {
        return getBackgroundRulesInFile(css)
            .map(filters.extractImageUrl(options.imagesPath))
            .filter(filters.checkIfFileExists);
    }

    return function (css) {
        return Promise.join(options, css, getDecl(css))
            .spread(generateSprite)
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
 * @returns {bluebird}
 */
function getBackgroundRulesInFile(css) {
    var images = [];
    return new Promise(function (resolve, reject) {
        try {
            css.eachRule(function (rule) {
                rule.eachDecl(function (decl) {
                    if (filters.isBackgroundDecl(decl.prop)) {
                        images.push(decl);
                    }
                });
            });
            resolve(images);
        } catch (err) {
            reject(err);
        }
    });
};

function generateSpriteFilename(cssFileName) {
    return path.basename(cssFileName, '.css');
}

/**
 * Get absolute path to the sprite map file.
 * This path will be used to save image.
 * @param fileName
 * @param basePath
 * @returns {*}
 */
function generateSpriteFilepath(fileName, basePath) {
    return path.resolve(basePath, fileName + '.png');
};

/**
 * Get relative path/url to sprite map.
 * This path will be used inside CSS file.
 * @param fileName
 * @param basePath
 * @returns {*}
 */
function generateSpriteFileUrl(fileName, basePath) {
    return path.relative(basePath, fileName + '.png');
};

function generateSprite(options, css, rules) {
    var files = [];
    for (var i = 0, j = rules.length; i < j; i++) {
        files.push(rules[i].filePath);
    }

    return spritesmith({ src: files }).then(function (spritemap) {

        spritemap.fileName = generateSpriteFilename(css.source.input.file);
        spritemap.filePath = generateSpriteFilepath(spritemap.fileName, options.spriteMapsDest);
        spritemap.fileUrl = generateSpriteFileUrl(spritemap.fileName, options.spriteMapsDest);

        return fs.writeFileAsync(spritemap.filePath, spritemap.image, 'binary').tap(function () {
            console.log('write', spritemap.filePath);
        }).thenReturn([options, css, rules, spritemap]);

    });
};


function updateCss(options, css, rules, sprite) {
    return new Promise(function (resolve, reject) {
        try {
            css.eachRule(function (rule) {
                rule.eachDecl(updateDeclaration(options, rules, sprite));
            });
            resolve(css);
        } catch (err) {
            reject(err);
        }
    });
};

function findInSprite(file, spritemap) {
    var sprite = spritemap.coordinates[file];
    if (!sprite) {
        console.error('No sprite for', file);
    }

    return sprite;
}

function updateDeclaration(options, rules, spritemap) {
    return function (decl) {
        var rule = decl.parent;
        var sprite;

        if (decl.filePath) {
            sprite = findInSprite(decl.filePath, spritemap);
        }

        if (!sprite) {
            return;
        }

        switch (decl.prop) {
            case 'background-image':
                decl.value = filters.replaceImageUrl(decl.value, spritemap.fileUrl);
                rule.insertAfter(decl, {
                    prop: 'background-position',
                    value: sprite.x + 'px ' + sprite.y + 'px'
                });
                break;
            case 'background':
                decl.value = filters.replaceImageUrl(decl.value, spritemap.fileUrl);
                rule.insertAfter(decl, {
                    prop: 'background-position',
                    value: sprite.x + 'px ' + sprite.y + 'px'
                });
                break;
        }

        return decl;
    }
}
