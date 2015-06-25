var Promise = require('bluebird');
var utils = require('./utils');
var chalk = require('chalk');

function findInSprite(file, spriteMap) {
    return spriteMap.coordinates[file] || null;
}

function addOrUpdateDeclaration(rule, prop, value) {
    var updatedValue = String(value).replace(/(\d+)\b/g, '$1px');
    var updated = false;

    rule.eachDecl(function (decl) {
        if (decl.prop === prop) {
            decl.value = updatedValue;
            updated = true;
        }
    });

    if (!updated) {
        rule.append({
            prop: prop,
            value: updatedValue,
            source: rule.source
        });
    }
}

function updateRule(pluginOptions, rules, spriteMap) {

    return function (decl) {
        var rule = decl.parent;
        var sprite;

        if (decl.file && decl.file.path) {
            sprite = findInSprite(decl.file.path, spriteMap);
        }

        if (!sprite) {
            return;
        }

        var bg = utils.parseBackgroundDeclaration(decl.value);
        var value = (bg.value || 'transparent') + ' ' + [
                utils.replaceImageUrl(bg.url, spriteMap.file.url),
                'no-repeat',
                sprite.x + ' ' + sprite.y
            ].join(' ');

        switch (decl.prop) {

            case 'background-image':
                rule.remove(decl);
                break;

            case 'background':
                rule.eachDecl(function (decl) {
                    if (decl.prop.match(/^background-(image|position|repeat)/)) {
                        rule.remove(decl);
                    }
                });
                break;
        }

        addOrUpdateDeclaration(rule, 'background', value);
        addOrUpdateDeclaration(rule, 'width', sprite.width);
        addOrUpdateDeclaration(rule, 'height', sprite.height);

        return decl;
    }
}

module.exports = function updateCss(pluginOptions, css, rules, spriteMaps) {
    return new Promise(function (resolve, reject) {
        try {
            for (var map in spriteMaps) {
                var spriteMap = spriteMaps[map];
                //console.log('updating', spriteMap.css.file, 'with' , spriteMap.file.name);

                if (pluginOptions.verbose) {
                    console.log('write', chalk.blue(spriteMap.css.file), '<', chalk.blue(spriteMap.file.name));
                }

                css.eachRule(function (rule) {
                    rule.eachDecl(updateRule(pluginOptions, rules, spriteMap));
                });
            }
            resolve(css);
        } catch (err) {
            reject(err);
        }
    });
};
