# postcss-spriter

Sprite map generator for [PostCSS](https://github.com/postcss/postcss)
based on [spritesmith](https://github.com/Ensighten/spritesmith).
Supports [Stylus](https://learnboost.github.io/stylus/)
through [PostStylus](https://github.com/seaneking/poststylus).

## Usage

### Runtime options

#### [imagePath='.']
Optional parameter, which defaults to `.`. By default postcss-spriter will look for images
from which it builds sprite map relative to CSS file which requires given file. However in some
cases this path may be incorrect (for example file was already processed by some plugin which altered
their path). Setting `imagePath` you can make postcss-spriter to resolve paths to images using other
base path. This path should be absolute or relative to the CSS file.

#### [spriteMapsDir='.']
Optional parameter which defaults to `.`. With this option you can change
location of generated sprite maps.By default postcss-spriter will write all created
sprite map files in the same folder where CSS file is located. This path should be absolute
or relative to the CSS file.

#### [spriteMapsBaseUrl]
Optional parameter. It can be used to alter path to the sprite map which is written to the CSS file.
By default all paths to sprite map files will be relative, resolved accordingly to `spriteMapsDir`
and CSS file location. However in some situations you will want to change patch in your CSS file, for
example when you are using URL rewriting on server side or serve your files from other domain.
This path should be absolute or relative to the CSS file.

#### [defaultGroupPrefix='sprite']
Optional parameter. Sprite maps names are generated dynamically by assembling group prefix and
original CSS file name from which sprite map is formed. When sprite do not match any group or you
are not using grouping function, then all sprite maps will be prefixed with the given
`defaultGroupPrefix`.
For example let say you are creating sprite map from files in "/www/assets/css/main.css" file. Without
grouping your sprite will be named `sprite_main.png` and saved in location provided by configuration.
See [group](#[group:Function]) options for more.

#### [group:Function]
Optional parameter. This parameter takes function as an argument. This function is called with one argument:
file name of the image. Using this information you can create new group name and return from function.
If you want a file in the common sprite (prefixed with the `defaultGroupPrefix`) return null. Example:

```js
function (fileName) {
	if (fileName.indexOf('retina') !== -1) {
		return 'retina';
	}
	return null;
}
```

Assuming we have "main.css" file which appeals to images with and without "retina" in the name, then
two different sprite maps will be generated: "sprite_main.png" and "retina_main.png".

#### [verbose=false]
Optional parameter which defaults to `false`. When `verbose` is set to `true` additional information
will be logged to the console.

#### [dryRun=false]
Optional parameter which defaults to `false`. When `dryRun` is set to `true` no sprite map files
will be created. Note that CSS file will be still altered by PostCSS.

### Examples

#### PostCSS as Grunt plugin (minimal setup)

Lets say we have following CSS file:

```css
// /www/assets/css/main.css
.icon {
	background-image: url('../img/sprites/icon.png');
}
```

Our images are located in "/www/assets/img". "Gruntfile.js" is located in "/www" which is our cwd.
We would like to save our images to "/www/res/img/sprites". Path to the sprite file will be relative to
our CSS file: `url('../../img/sprites/sprite_main.png')`.Example configuration for case above:

```js
postcss: {
    options: {
        processors: [
            require('postcss-spriter')({
                spriteMapsDir: 'res/img/sprites',
            })
        ]
    }
}
```

#### PostCSS as Grunt plugin (advanced)

Lets say we have following CSS file:

```css
// /www/assets/css/main.css
.icon {
	background-image: url('sprites/icon.png');
}
```

Our images are located in "/www/assets/img". "Gruntfile.js" is located in "/www" which is our cwd.
We would like to save our images to "/www/res/{buildNumber}/img/sprites". However in final CSS file
path to the sprite map should be altered to `url('//cdn.mydomain.com/sprites/main_sprite.png')`.
Note that name of the file is generated automatically. Example configuration for case above:

```js
postcss: {
    options: {
        processors: [
            require('postcss-spriter')({
                imagesPath: 'assets/img/',
                spriteMapsDir: 'res/' + buildNumber + '/img/sprites',
                spriteMapsBaseUrl: '//cdn.mydomain.com/sprites'
            })
        ]
    }
}
```

#### Use with poststylus (with Grunt)

You can use this plugin also with poststylus which is PostCSS plugin loader for Stylus.
Example configuration:

```js
stylus: {
	options: {
		use: [
			function () {
				require('poststylus')([
                    require('postcss-spriter')()
                ])
			}
		]
	}
}
```

## Changelog

See [CHANGELOG](./CHANGELOG.md) file.

## License

Copyright (c) 2015 Krzysztof Winiarski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
