var gulp = require('gulp');
var babel = require("gulp-babel"); // 默认不支持 es6 , 需要配置
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var cssClean = require('gulp-clean-css');
var htmlMin = require('gulp-htmlmin');
var livereload = require('gulp-livereload')
var connect = require('gulp-connect');
var proxy = require('http-proxy-middleware')
var browserify = require('browserify'),  // 插件，实际是node系
    // 转成stream流，gulp系
    stream = require('vinyl-source-stream'),
    // 转成二进制流，gulp系
    buffer = require('vinyl-buffer');
gulp.task('browserify', function () {
    // 定义入口文件
    return browserify({
        // 入口必须是转换过的es6文件，且文件不能是es6经过转换的es5文件，否者会报错
        entries: 'dist/js/login.js',
        debug: true
    })
    // 在bundle之前先转换es6，因为readabel stream 流没有transform方法
    // .transform("babelify", {presets: ['es2015']})
    // 转成stream流（stream流分小片段传输）
    .bundle()
    .on('error', function (error) {
        console.log(error.toString())
    })
    // node系只有content，添加名字转成gulp系可操作的流
    .pipe(stream('index.js'))
    // 转成二进制的流（二进制方式整体传输）
    .pipe(buffer())
    // 输出
    .pipe(gulp.dest('dist/js/'))
    .pipe(livereload())
    .pipe(connect.reload())
})

/** 合并压缩 css */
gulp.task('css', function () {
    return gulp.src('src/css/*.css')
        .pipe(concat('build.css'))  // 合并以后已 build.css命名
        .pipe(rename({ suffix: '.min' }))  // 压缩文件 加上 .min 后缀
        .pipe(cssClean({ compatibility: 'ie8' }))
        .pipe(gulp.dest('dist/css/')) // 输出目录
        .pipe(livereload())
        .pipe(connect.reload())
})
/** index.压缩 html */
gulp.task('html', function () {
    return gulp.src('src/*.html')
        .pipe(htmlMin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist/'))
        .pipe(livereload())
        .pipe(connect.reload())
})

/** img */
gulp.task('img', function () {
    return gulp.src('src/imgs/**/*.*')
        .pipe(gulp.dest('dist/imgs/'))
})
/**
 * 合并压缩 js 的任务
 */
gulp.task('js', function () {
    return gulp.src('src/js/**/*.js')
        .pipe(babel())
        .pipe(concat('build.js'))
        .pipe(gulp.dest('dist/js/')) //输出
        .pipe(uglify())  //压缩
        .pipe(rename({ suffix: '.min' })) //重命名
        .pipe(gulp.dest('dist/js/'))
        .pipe(livereload())
        .pipe(connect.reload())
})

/**
 * 开启监听
 */
gulp.task('watch', function () {
    livereload.listen();
    gulp.watch('src/*.html', gulp.series('html'));
    gulp.watch('src/js/*.js', gulp.series('js'));
    gulp.watch(['src/css/*.css', 'src/stylus/*.stylus'], gulp.series('css'))
})

/**
 * 开启服务
 */
gulp.task('ant_connect', function () {
    connect.server({
        root: 'dist',   // 静态目录
        livereload: true,
        port: 8888,
        middleware: function (connect, opt) {
            return [
                proxy('/api', {
                    target: 'http://api.degebug.cn',
                    changeOrigin: true
                })]
        }
    })
})

/**
 * 默认任务
 */
gulp.task('default', gulp.parallel('js', 'img', 'css', 'html', 'watch', 'ant_connect', ));