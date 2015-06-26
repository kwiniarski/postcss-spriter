/**
 * https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically
 * @type {exports}
 */

var Mocha = require('mocha');
var path = require('path');
var blanket = require('blanket');
var BIN = path.resolve(__dirname, '../node_modules/.bin');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var bootstrap = require('./bootstrap');


var mocha = new Mocha({
    ui: 'bdd',
    reporter: 'spec'
});

function readDir(dirName, stack) {

    var dir = path.resolve(__dirname, dirName);

    return fs.readdirAsync(dir)
        .map(function (fileName) {
            return path.resolve(dir, fileName);
        })
        .reduce(function (stack, file) {
            return fs.statAsync(file)
                .call('isFile')
                .then(function(isFile){
                    return (isFile)
                        ? stack.concat(file)
                        : readDir(file, stack);
                });
        }, stack || []);
}

readDir('spec').each(function(file){
    mocha.addFile(file);
}).then(function () {
    mocha.run();
});







