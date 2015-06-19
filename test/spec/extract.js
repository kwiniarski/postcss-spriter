var path = require('path');
var postcss = require('postcss');
var fs = require('fs');
var Promise = require('bluebird');
var spritesmith = require('spritesmith');
var filters = require('../../lib/filters');

describe('filters', function () {
   describe('#isBackgroundDecl', function () {
       it('should return true for background or background-image declarations', function () {
           expect(filters.isBackgroundDecl('background')).to.be.true;
           expect(filters.isBackgroundDecl('background-image')).to.be.true;
       });
       it('should return false for other background declarations', function () {
           expect(filters.isBackgroundDecl('background-position')).to.be.false;
           expect(filters.isBackgroundDecl('background-repeat')).to.be.false;
       });
   })
});

describe('Extract paths from CSS files', function () {
    it('should get all images paths embeded in CSS file', function (done) {

        var file = path.resolve(__dirname, '../fixtures/extract.css');
        var plugin = require('../../lib/plugin')();

        fs.readFile(file, { encoding: 'utf8' }, function (err, css) {

            var root = postcss.parse(css, { from: file });
            //plugin(root).then(function(){
            //    done();
            //});

            postcss([plugin]).process(root).then(function(res){
                console.log(res);
                done();
            });





        });

    });

    //it('spritesmith', function (done) {
    //    spritesmith({
    //        src: [
    //            'C:\\projects\\postcss-spriter\\test\\fixtures\\img\\cup.png',
    //            'C:\\projects\\postcss-spriter\\test\\fixtures\\img\\cup_edit.png'
    //        ]
    //    }, function () {
    //        console.log(arguments);
    //        done();
    //    })
    //});
    //
    //it('spritesmith promise', function (done) {
    //    var ssp = Promise.promisify(spritesmith);
    //    ssp({
    //        src: [
    //            'C:\\projects\\postcss-spriter\\test\\fixtures\\img\\cup.png',
    //            'C:\\projects\\postcss-spriter\\test\\fixtures\\img\\cup_edit.png'
    //        ]
    //    }).then(function(){
    //        console.log(arguments);
    //        done();
    //    });
    //
    //});
});
