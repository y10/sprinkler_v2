const del = require('del');
const path = require('path');
const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const gzip = require('gulp-gzip');
const inline = require('gulp-inline');
const inlineImages = require('gulp-css-base64');
const ard = require("./tools/arduino-gulp");


gulp.task('clean', function () {
    return del(['arduino/html/***']);
});

gulp.task('copy', function () {
    return gulp.src('html/**/*.*')
        .pipe(gulp.dest('arduino/html'));
});

gulp.task('webpack', function () {
    return gulp
        .src('arduino/html/js/index.js', 'arduino/html/js/setup.js', 'arduino/html/js/settings.js')
        .pipe(ard.buildWebpack("development", path.resolve(__dirname, 'arduino/html')))
        .pipe(gulp.dest('arduino/html'))

});

gulp.task('inline', function () {
    return gulp.src('arduino/html/*.html')
        .pipe(inline({
            base: 'arduino/html/',
            css: [inlineImages],
            disabledTypes: ['svg', 'img']
        }))
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true
        }))
        .pipe(gulp.dest('arduino/html'))
})

gulp.task('gzip', function () {
    return gulp.src('arduino/html/**/*.*')
        .pipe(gzip())
        .pipe(gulp.dest('arduino/html'))
});

gulp.task('buildVersion', function () {
    return gulp.src('.sprinkler/settings.json').pipe(ard.buildVersion()).pipe(gulp.dest('.sprinkler'));
});

gulp.task('buildConfigJs', function () {
    return gulp.src('.sprinkler/settings.json').pipe(ard.buildConfigJs()).pipe(gulp.dest('arduino/html'));
});

gulp.task('buildHttpJs', function () {
    return gulp.src('.sprinkler/settings.json').pipe(ard.buildHttpJs()).pipe(gulp.dest('arduino/html'));
});

gulp.task('buildVersionHeader', function () {
    return gulp.src('.sprinkler/settings.json').pipe(ard.buildVersionHeader()).pipe(gulp.dest('arduino/html'));
});

gulp.task('buildHeaders', function () {
    return gulp.src('arduino/html/**/*.*').pipe(ard.buildHeaders({ uint8_t: true })).pipe(gulp.dest('arduino/html'));
});

gulp.task('default', gulp.series(
    'clean',
    'copy',
    'buildConfigJs',
    //'buildHttpJs',
    'webpack',
    'inline',
    'gzip',
    'buildHeaders',
    'buildVersionHeader',
    'buildVersion'
));