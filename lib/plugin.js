var filters = require('./filters');
var Promise = require('bluebird');
var spritesmith = Promise.promisify(require('spritesmith'));
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');

exports = module.exports = function postcssSpriterFactory(options) {

    options = options || {};

    function getDecl(css) {
        return getBackgroundRulesInFile(css)
            .map(filters.extractImageUrl(options.imagesPath))
            .filter(filters.checkIfFileExists);
            //.tap(console.log);
    }

    return function (css) {
        return Promise.join(css, getDecl(css))
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

function generateSpriteFilepath(fileName) {
    return path.resolve(__dirname, fileName + '.png');
    //return fs.fileWriteAsync(filePath, data);
};

function generateSprite(css, rules) {
    var files = [];
    for (var i = 0, j = rules.length; i < j; i++) {
        files.push(rules[i].filePath);
    }

    return spritesmith({ src: files }).then(function (spritemap) {

        spritemap.fileName = generateSpriteFilename(css.source.input.file);
        spritemap.filePath = generateSpriteFilepath(spritemap.fileName);

        return fs.writeFileAsync(spritemap.filePath, spritemap.image, 'binary').tap(function () {
            console.log('write', spritemap.filePath);
        }).thenReturn(spritemap);

    }).then(function (spritemap) {
        return [css, rules, spritemap];
    });
};


function updateCss(css, rules, sprite) {
    return new Promise(function (resolve, reject) {
        try {
            css.eachRule(function (rule) {
                rule.eachDecl(updateDeclaration(rules, sprite));
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

function updateDeclaration(rules, spritemap) {
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
                decl.value = filters.replaceImageUrl(decl.value, spritemap.filePath);
                rule.insertAfter(decl, {
                    prop: 'background-position',
                    value: sprite.x + 'px ' + sprite.y + 'px'
                });
                break;
            case 'background':
                decl.value = filters.replaceImageUrl(decl.value, spritemap.filePath);
                rule.insertAfter(decl, {
                    prop: 'background-position',
                    value: sprite.x + 'px ' + sprite.y + 'px'
                });
                break;
        }

        return decl;
    }
}
