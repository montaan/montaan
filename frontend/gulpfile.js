const gulp = require('gulp');
const brotli = require('gulp-brotli');
const gzip = require('gulp-gzip');
const imagemin = require('gulp-imagemin');

const COMPRESS_IMAGES = 'build/**/*.{jpg,png,gif,jpeg}';
const COMPRESS_FILES = 'build/**/*.{html,js,css,svg,json,webmanifest,ico,wasm}';

gulp.task('imagemin', () => {
	let src = COMPRESS_IMAGES,
		dest = 'build';

	return gulp
		.src(src)
		.pipe(imagemin())
		.pipe(gulp.dest(dest));
});

gulp.task('brotli', () => {
	let src = COMPRESS_FILES,
		dest = 'build';

	return gulp
		.src(src)
		.pipe(
			brotli.compress({
				extension: 'br',
				quality: 11,
			})
		)
		.pipe(gulp.dest(dest));
});

gulp.task('gzip', () => {
	let src = COMPRESS_FILES,
		dest = 'build';

	return gulp
		.src(src)
		.pipe(
			gzip({
				gzipOptions: { level: 9 },
				extension: 'gz',
			})
		)
		.pipe(gulp.dest(dest));
});
