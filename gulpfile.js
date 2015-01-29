/* jshint node:true */
'use strict';
var gulp = require('gulp');
var argv = require('yargs').argv;       // gulp my-js-task --production -> gulpif(argv.production, uglify()
var gulpif = require('gulp-if');
var $ = require('gulp-load-plugins')();
var templateCache = require('gulp-angular-templatecache');
var LessPluginAutoPrefix = require('less-plugin-autoprefix'),
    autoprefix = new LessPluginAutoPrefix({browsers: ['last 2 versions']});
var closureDeps = require('gulp-closure-deps');
var rename = require('gulp-rename');


gulp.task('less', function (cb) {
    return gulp.src('src/less/abc.less')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.less({
            paths: ['.'],
            plugins: [autoprefix]
        }))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('.tmp/css'));
});

gulp.task('jshint', function () {
    return gulp.src('src/js/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'))
        .pipe($.jshint.reporter('fail'));
});

gulp.task('closure:deps', ['templates'], function() {
    gulp.src([
        'src/js/**/*.js',
        '.tmp/js/templates.js'
    ]).pipe(closureDeps({
            fileName: 'deps.js',
            prefix: '/',
            baseDir: '/baseDir'
        }))
        .pipe($.replace(/(goog.addDependency\(')\/(src|\.tmp)\//g, '$1'))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('closure:compile', function() {
    var compilerFlags = {
        closure_entry_point: 'abc.module',
        compilation_level: 'WHITESPACE_ONLY',
                            //'SIMPLE_OPTIMIZATIONS',
                            //'ADVANCED_OPTIMIZATIONS',
        externs: [
            'bower_components/externs-*/index.js'
        ],
        // Some compiler flags (like --use_types_for_optimization) don't have value. Use null.
        // use_types_for_optimization: null,
        angular_pass: true,
        generate_exports: true,
        only_closure_dependencies: true,
        output_wrapper: '(function(){%output%}).call(this);',
        warning_level: 'VERBOSE'
    };

    if (argv.production) {
        compilerFlags.compilation_level = 'ADVANCED_OPTIMIZATIONS';
//        compilerFlags.define = ["goog.DEBUG=false"];
    } else {
        compilerFlags.output_wrapper = '(function(){%output%}).call(this); //# sourceMappingURL=../abc.js.map';
        compilerFlags.create_source_map = '.tmp/abc.js.map.fixme';
    }

    return gulp.src([
        'src/js/**/*.js',
        '.tmp/js/templates.js'
    ])
        .pipe($.closureCompiler({
            compilerPath: 'bower_components/closure-compiler/compiler.jar',
            fileName: 'abc.js',
            compilerFlags: compilerFlags
        }))
        .pipe(gulp.dest('.tmp/js'));
});

gulp.task('closure', function() {
   if (argv.production) {
       gulp.start('closure:dist');
   } else {
       gulp.start('closure:dev');
   }
});

gulp.task('closure:dist', ['closure:deps'], function() {
    argv.production = true;
    gulp.start('closure:compile');
});

gulp.task('closure:dev', ['closure:deps', 'closure:compile'], function() {
    return gulp.src('.tmp/abc.js.map.fixme')
        .pipe($.replace(new RegExp('\\"[^"]*(/|\\\\)(src|.tmp)(/|\\\\)(js(/|\\\\))?', 'g'), '"js/'))
        .pipe(rename('abc.js.map'))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('soy', function() {
   return gulp.src('template/**/*.soy')
       .pipe($.soy())
       .pipe(gulp.dest('.tmp/js/soy'));
});

gulp.task('templates', function() {
    return gulp.src(['template/**/*.html'])
        .pipe(templateCache({
            templateHeader: 'goog.provide("abc.templates");' +
                    'angular.module("abc.templates",[]).run(["$templateCache", function($templateCache) {',
            root: 'template'
        }))
        .pipe(gulp.dest('.tmp/js'));
});

gulp.task('html', ['less', 'templates'], function () {
    var assets = $.useref.assets({searchPath: '{.tmp,src}'});

    return gulp.src('demo/*.html')
        .pipe(assets)
        .pipe(gulpif(argv.production, $.rev()))
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe($.revReplace())
        .pipe(gulp.dest('dist'));
});

//gulp.task('images', function () {
//    return gulp.src('src/images/**/*')
//        .pipe($.cache($.imagemin({
//            progressive: true,
//            interlaced: true
//        })))
//        .pipe(gulp.dest('dist/images'));
//});

//gulp.task('fonts', function () {
//    return gulp.src(require('main-bower-files')().concat('src/fonts/**/*'))
//        .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
//        .pipe($.flatten())
//        .pipe(gulp.dest('dist/fonts'));
//});

gulp.task('extras', ['less', 'closure'], function () {
    return gulp.src([
        '.tmp/**/*.js',
        '.tmp/**/*.js.map',
        '.tmp/**/*.css'
    ], {
        dot: true
    }).pipe(gulp.dest('dist'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('connect', ['closure:dev', 'less'], function () {
    var serveStatic = require('serve-static');
    var serveIndex = require('serve-index');
    var app = require('connect')()
        .use(require('connect-livereload')({port: 35729}))
        .use(serveStatic('.tmp'))
        .use(serveStatic('src'))
        .use(serveStatic('demo'))
        // paths to bower_components should be relative to the current file
        // e.g. in src/index.html you should use ../bower_components
        .use('/bower_components', serveStatic('bower_components'))
        .use(serveIndex('demo'));

    //http://localhost:9000/bower_components/angular-ui-router/release/angular-ui-router.js
    //http://localhost:9000/bower_components/angularjs/                angular.js

    require('http').createServer(app)
        .listen(9000)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:9000');
        });
});

gulp.task('serve', ['templates', 'connect', 'watch'], function () {
    require('opn')('http://localhost:9000');
});

//// inject bower components
//gulp.task('wiredep', function () {
//    var wiredep = require('wiredep').stream;
//
//    gulp.src('src/less/*.less')
//        .pipe(wiredep())
//        .pipe(gulp.dest('src/css'));
//
//    gulp.src('demo/*.html')
//        .pipe(wiredep({
//            exclude: ['bootstrap/dist'],
//            ignorePath: /^(\.\.\/)*\.\./
//        }))
//        .pipe(gulp.dest('demo'));
//});

gulp.task('watch', ['connect'], function () {
    $.livereload.listen();

    // watch for changes
    gulp.watch([
        'demo/*.html',
        '.tmp/css/**/*.css',
        '.tmp/js/**/*.js',
        'src/js/**/*.js',
        'src/images/**/*'
    ]).on('change', $.livereload.changed);

    gulp.watch('template/**/*.html', ['templates']);
    gulp.watch('src/less/**/*.less', ['less']);
    gulp.watch('src/js/**/*.js', ['closure:dev']);
});


//gulp.task('e2e', function() {
//    //protractorQA.init({
//    //    testSrc : 'test/e2e/**/*.js',
//    //    viewSrc : [ 'demo/index.html', 'app/**/*.html' ]
//    //});
//    gulp.src(["./test/e2e/spec/**/*.js"])
//        .pipe(protractor({
//            configFile: "test/e2e/protractor.conf.js"
////            args: ['--baseUrl', 'http://127.0.0.1:8000']
//        }))
//        .on('error', function(e) { throw e })
//});

/**
 * Run test once and exit
 */
//gulp.task('unit-test', function (done) {
//    karma.start( //_.assign({}, karmaCommonConf, {singleRun: true}),
//                { configFile: __dirname + '/test/karma.conf.js', singleRun: true },
//                 done);
//});

/**
 * Watch for file changes and re-run tests on each change
 */
//gulp.task('unit-tdd', function (done) {
//    karma.start(//karmaCommonConf,
//                { configFile: __dirname + '/test/karma.conf.js', singleRun: false },
//                done);
//});


gulp.task('build', ['jshint', 'closure', 'html', 'extras'], function () {
    return gulp.src('dist/**/*')
        .pipe($.size({title: 'build', gzip: true}));
});

gulp.task('gh-pages', ['build'], function() {
    return gulp.src('dist/index.html', { dot: true })
        .pipe($.replace(/"(css|js)\//g, '"dist/$1/'))
        .pipe(gulp.dest('.'));
});

gulp.task('default', ['clean'], function () {
    gulp.start('build');
});
