const gulp = require('gulp');
const brotli = require('gulp-brotli');
const gzip = require('gulp-gzip');
const imageOptim = require('gulp-imageoptim');

gulp.task('imageOptim', () => {
    let src  = "build/**/*.{jpg,png,gif,jpeg}",
        dest = "build";

    return gulp.src(src)
        .pipe(imageOptim.optimize())
        .pipe(gulp.dest(dest));
});

gulp.task('brotli', () => {
    let src  = "build/**/*.{html,js,css,svg,json,webmanifest,ico}",
        dest = "build";

    return gulp.src(src)
        .pipe(brotli.compress({
            extension: "br",
            quality: 11
        }))
        .pipe(gulp.dest(dest));
});

gulp.task('gzip', () => {
    let src  = "build/**/*.{html,js,css,svg,json,webmanifest,ico}",
        dest = "build";

    return gulp.src(src)
        .pipe(gzip({
            gzipOptions: { level: 9 },
            extension: "gz"
        }))
        .pipe(gulp.dest(dest));
});

