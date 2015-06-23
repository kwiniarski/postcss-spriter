var path = require('path');
var postcss = require('postcss');
var fs = require('fs');
var Promise = require('bluebird');


describe('Extract paths from CSS files', function () {
    it('should get all images paths embeded in CSS file', function (done) {

        var file = path.resolve(__dirname, '../fixtures/extract.css');
        var plugin = require('../../lib/plugin')({
            spriteMapsDir: __dirname + '/sprites', // where to save sprite maps
            //spriteMapsBaseUrl: '/res/img/sprites', // how to load sprite maps from css
            //spriteMapsBaseUrl: './', // how to load sprite maps from css
            dryRun: true
        });

        fs.readFile(file, { encoding: 'utf8' }, function (err, css) {
            var root = postcss.parse(css, { from: file });
            postcss([plugin]).process(root).then(function(res){
                //console.log(res.css);
                done();
            });
        });

    });

});
