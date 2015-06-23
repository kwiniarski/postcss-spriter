var utils = require('../../lib/utils');
var sinon = require('sinon');
var Promise = require('bluebird');

describe('utils', function () {

    beforeEach(function () {
        this.basePath = '/';
        this.cssDeclarationNode = {
            value: 'white url("img/cup_edit.png") no-repeat 0 0'
        };

        utils.extractImageUrl(this.basePath)(this.cssDeclarationNode);
    });

    describe('#replaceImageUrl', function () {
        it('should replace image url in CSS definition', function () {
            expect(utils.replaceImageUrl('white url("img/cup_edit.png") no-repeat 0 0', 'dest/sprite.png'))
                .to.equal('white url(\'dest/sprite.png\') no-repeat 0 0');
        });
    });

    describe('#extractImageUrl', function () {
        it('should add resolved absolute image file path to the CSS node object', function () {
            expect(this.cssDeclarationNode).to.have.property('filePath');
        });
    });

    describe('#checkIfFileExists', function () {
        it('should return log error when file does not exists', function () {
            sinon.spy(utils, 'errorHandler');
            return utils.checkIfFileExists(this.cssDeclarationNode).finally(function(){
                expect(utils.errorHandler).to.has.been.calledOnce;
                utils.errorHandler.restore();
            });
        });
        it('should filter list of unexisting files', function () {
            return Promise
                .resolve([this.cssDeclarationNode])
                .filter(utils.checkIfFileExists)
                .then(function (files) {
                    expect(files).to.be.an('array').and.empty;
                });
        });
    });

    describe('#isBackgroundDecl', function () {
        it('should return true for background or background-image declarations', function () {
            expect(utils.isBackgroundDecl('background')).to.be.true;
            expect(utils.isBackgroundDecl('background-image')).to.be.true;
        });
        it('should return false for other background declarations', function () {
            expect(utils.isBackgroundDecl('background-position')).to.be.false;
            expect(utils.isBackgroundDecl('background-repeat')).to.be.false;
        });
    });

    describe('#resolvePathToUrl', function () {
        it('should change CSS URL to absolute URL when basePath is absolute', function () {
            expect(utils.resolvePathToUrl('main1.png', 'http://cdn.com/path'))
                .to.equal('http://cdn.com/path/main1.png');
            expect(utils.resolvePathToUrl('main2.png', '//cdn.com/path'))
                .to.equal('//cdn.com/path/main2.png');
            expect(utils.resolvePathToUrl('main3.png', '/generated'))
                .to.match(/^([a-z]:)?[\\/]+generated(\/|\\)main\d+\.png/i); // /generated/main3.png
        });
        it('should change CSS URL to relative URL when basePath is relative and base is not given', function () {
            expect(utils.resolvePathToUrl('main1.png', '.'))
                .to.match(/^main\d+\.png/i); // main1.png
            expect(utils.resolvePathToUrl('main2.png', './'))
                .to.match(/^main\d+\.png/i); // main2.png
            expect(utils.resolvePathToUrl('main3.png', '../'))
                .to.match(/^\.\.(\/|\\)main\d+\.png/i); // ../main3.png
            expect(utils.resolvePathToUrl('main4.png', './generated'))
                .to.match(/^generated(\/|\\)main\d+\.png/i); // generated/main4.png
        });
        it('should transform CSS URL according to function if passed as baseUrl');
    });

});
