'use strict'

// This gulpfile makes use of new JavaScript features.
// Babel handles this without us having to do anything. It just works.
// You can read more about the new JavaScript features here:
// https://babeljs.io/docs/learn-es2015/

import gulp from 'gulp'
import del from 'del'
import runSequence from 'run-sequence'
import browserSync from 'browser-sync'
import webpack from'gulp-webpack'
import gulpLoadPlugins from 'gulp-load-plugins'
import {output as pagespeed} from 'psi'
import merge from 'merge-stream'

const $ = gulpLoadPlugins()
const reload = browserSync.reload

// Optimize images
gulp.task('images', () =>
  gulp.src('app/images/*.{png,jpg,jpeg,gif}')
    .pipe($.imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'images'}))
)

gulp.task('svg', () => {
  gulp.src('app/images/svg/*.svg')
    .pipe($.rename({prefix: 'icon-'}))
    .pipe($.svgstore({ inlineSvg: true }))
    .pipe(gulp.dest('dist/images/svg'))
    .pipe($.size({title: 'svg'}))
})

// Copy all files at the root level (app)
gulp.task('copy', () => {
  gulp.src([
    'app/*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}))
})

// Compile and automatically prefix stylesheets
gulp.task('styles', () => {
  const AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ]

  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src([
    'app/styles/main.scss',
    'app/styles/**/*.css'
  ])
    .pipe($.newer('.tmp/styles'))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      precision: 10
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    // Concatenate and minify styles
    .pipe($.if('*.css', $.cssnano()))
    .pipe($.size({title: 'styles'}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('dist/styles'))
})

// Concatenate and minify JavaScript.
gulp.task('scripts', () =>
    gulp.src([
      './app/scripts/main.js'
    ])
      .pipe($.newer('.tmp/scripts'))
      .pipe($.sourcemaps.init())
      .pipe(webpack({
        module: {
          loaders: [
            {
              test: /(\.jsx|\.js)$/,
              loader: 'babel',
              exclude: /(node_modules|bower_components)/
            }
          ]
        },
        output: {
          filename: 'main.js'
        }
      }))
      .pipe(gulp.dest('.tmp/scripts'))
      .pipe($.concat('main.min.js'))
      .pipe($.uglify({preserveComments: 'some'}))
      // Output files
      .pipe($.size({title: 'scripts'}))
      .pipe($.sourcemaps.write())
      .pipe(gulp.dest('dist/scripts'))
)

// Scan your HTML for assets & optimize them
gulp.task('html', () => {
  return gulp.src('app/**/*.html')
    .pipe($.useref({
      searchPath: '{.tmp,app}',
      noAssets: true
    }))

    // Minify any HTML
    .pipe($.if('*.html', $.htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeOptionalTags: true
    })))
    // Output files
    .pipe($.if('*.html', $.size({title: 'html', showFiles: true})))
    .pipe(gulp.dest('dist'))
})

// Clean output directory
gulp.task('clean', () => del(['.tmp', 'dist/*', '!dist/.git'], {dot: true}))

// Watch files for changes & reload
gulp.task('serve', ['scripts', 'styles', 'images', 'svg'], () => {
  browserSync({
    notify: false,
    logPrefix: 'QIAN',
    server: ['.tmp', 'app'],
    port: 3000
  })

  gulp.watch(['app/**/*.html'], reload)
  gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload])
  gulp.watch(['app/scripts/**/*.js'], ['scripts', reload])
  gulp.watch(['app/images/**/*'], reload)
})

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], () =>
  browserSync({
    notify: false,
    logPrefix: 'QIAN',
    server: 'dist',
    port: 3001
  })
)

// Build production files, the default task
gulp.task('default', ['clean'], cb =>
  runSequence(
    'styles',
    ['html', 'scripts', 'images', 'svg', 'copy'],
    cb
  )
)
