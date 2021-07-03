const path = require('path');
const through = require('through2');
const webpack = require('webpack-stream');

module.exports =
{
    buildWebpack(mode, context) {
        return webpack({
            mode,
            context,
            entry: {
                index: './js/index.js',
                setup: './js/setup.js',
                settings: './js/settings.js',
            },
            output: {
                library: 'sprinkler',
                libraryTarget: 'umd',
                filename: './js/[name].js',
            },
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        loader: 'babel-loader',
                        exclude: /node_modules/,
                        query: {
                            plugins: [
                                ["@babel/plugin-proposal-class-properties", { "loose": true }],
                                ["@babel/plugin-transform-runtime",
                                    {
                                        "corejs": false,
                                        "helpers": false,
                                        "regenerator": true,
                                        "useESModules": true
                                    }
                                ]
                            ],
                        },
                    }
                ]
            }
        })
    },

    buildVersion() {
        return through.obj(function (source, encoding, callback) {

            var contents = source.contents.toString()
            var config = JSON.parse(contents)

            var [major, minor, release, build] = config.version.split(".");
            build = parseInt(build);
            config.version = [major, minor, release, ++build].join(".")

            var destination = source.clone();
            destination.contents = Buffer.from(JSON.stringify(config));

            callback(null, destination);
        });
    },

    buildHeaders({ uint8_t }) {
        return through.obj(function (source, encoding, callback) {

            var parts = source.path.split(path.sep);
            var filename = parts[parts.length - 1];
            var safename = filename.split('.').join('_').split('-').join('_').toUpperCase();

            var output = '';
            output += 'const ' + (uint8_t ? "uint8_t" : "char") + ' SKETCH_' + safename + '[] PROGMEM = {';
            for (var i = 0; i < source.contents.length; i++) {
                if (i > 0) { output += ','; }
                if (0 === (i % 20)) { output += '\n'; }
                output += '0x' + ('00' + source.contents[i].toString(16)).slice(-2);
            }
            output += '\n};';

            var destination = source.clone();
            destination.path = source.path + '.h';
            destination.contents = Buffer.from(output);

            callback(null, destination);
        });
    },

    buildVersionHeader() {
        return through.obj(function (source, encoding, callback) {

            var contents = source.contents.toString()
            var config = JSON.parse(contents)

            var [major, minor, release, build] = config.version.split(".");

            var destination = source.clone();
            destination.path = source.path + '.h';
            destination.contents = Buffer.from(`
#define SKETCH_VERSION_MAJOR ${major}\r\n
#define SKETCH_VERSION_MINOR ${minor}\r\n
#define SKETCH_VERSION_RELEASE ${release}\r\n
#define SKETCH_VERSION_BUILD ${build}\r\n
#define SKETCH_VERSION "${config.version}"\r\n
#define SKETCH_MAX_ZONES ${config.maxZones}\r\n
#define SKETCH_MAX_TIMERS ${config.maxTimers}\r\n
`);
            callback(null, destination);
        });
    },

    buildConfigJs() {
        return through.obj(function (source, encoding, callback) {
            const contents = source.contents.toString()
            const config = JSON.parse(contents)

            const [major, minor, release, build] = config.version.split(".");
            const version = `${major}.${minor}.${release}` + (((build || '0')) != '0' ? `.${build}` : '')

            var destination = source.clone();
            var parts = source.path.split(path.sep);
            parts = parts.splice(0, parts.length - 1);
            destination.path = [...parts, 'js', 'config.js'].join(path.sep);
            destination.contents = Buffer.from(`export const FIRMWARE_URL = "${config.firmwareUrl}";
export const MAX_ZONES = ${config.maxZones}
export const Version = {
    major:     ${major},
    minor:     ${minor},
    release:   ${release},
    build:     ${build},
    toString(){
        return "${version}"
    },
    toDecimal(){
        return ${major}${minor}${release} + (${build} * 0.001);
    }
}`);
            callback(null, destination);
        });
    },
    
    buildHttpJs() {
        return through.obj(function (source, encoding, callback) {
            var contents = source.contents.toString()
            var config = JSON.parse(contents);
            var destination = source.clone();
            var parts = source.path.split(path.sep);
            parts = parts.splice(0, parts.length - 1);
            destination.path = [...parts, 'js', 'system', 'http.js'].join(path.sep);
            destination.contents = Buffer.from(`export * from "./http.${config.mode == "production" ? 'prod' : 'mock'}";`);
            callback(null, destination);
        });
    }
}