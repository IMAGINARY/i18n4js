'use strict';

// JS Output directory. Relative to the public directory. No trailing /.
var js_out_dir = './distrib';
var js_out_name = 'i18n4js';

var config = require('./package.json');
var del = require('del');
var gulp = require('gulp');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var babelify = require('babelify');
var sourcemaps = require('gulp-sourcemaps');

function bundleApp() {
  var appBundler = browserify({
    entries: './src/main.js',
    debug: true
  });

  appBundler
  // transform ES6 and JSX to ES5 with babelify
    .transform("babelify", {presets: ["es2015"]})
    .bundle()
    .on('error',gutil.log)
    .pipe(source(js_out_name + '-' + config.version + '.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    // Add transformation tasks to the pipeline here.
      .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(js_out_dir + '/'));
}

gulp.task('clean', function() {
  return del([
    js_out_dir + '/' + js_out_name + '-*.*.*' + '.min.js',
    js_out_dir + '/' + js_out_name + '-*.*.*' + '.min.js.map'
  ]);
});

gulp.task('scripts', ['clean'], function () {
  bundleApp();
});

gulp.task('scripts:watch', function () {
  gulp.watch(['./src/*.js'], ['scripts']);
});

gulp.task('default', ['scripts']);