var Promise = require('bluebird');
var utils = require('./utils');

module.exports = function updateCss(options, css, rules, spriteMaps) {
    return new Promise(function (resolve, reject) {
        try {
            for (var map in spriteMaps) {
                css.eachRule(function (rule) {
                    rule.eachDecl(updateRule(options, rules, spriteMaps[map]));
                });
            }
            resolve(css);
        } catch (err) {
            reject(err);
        }
    });
};

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
            value: updatedValue
        });
    }
}

function updateRule(options, rules, spriteMap) {

    return function (decl) {
        var rule = decl.parent;
        var sprite;

        if (decl.file && decl.file.path) {
            sprite = findInSprite(decl.file.path, spriteMap);
        }

        if (!sprite) {
            return;
        }


        // 1. if we have background decl:
        // a. parse it: color, bg-imgae, bg-repeat, bg-position
        // b. update it
        // 2. else
        // a. create it with transparent color
        // 3. remove all bg-* declarations

        switch (decl.prop) {
            case 'background-image':
                decl.value = utils.replaceImageUrl(decl.value, spriteMap.file.url);

                addOrUpdateDeclaration(rule, 'background-position', sprite.x + ' ' + sprite.y);
                addOrUpdateDeclaration(rule, 'background-repeat', 'no-repeat');
                addOrUpdateDeclaration(rule, 'width', sprite.width);
                addOrUpdateDeclaration(rule, 'height', sprite.height);
                break;
            case 'background':


                decl.value = utils.replaceImageUrl(decl.value, spriteMap.file.url);
                break;
        }

        return decl;
    }
}
