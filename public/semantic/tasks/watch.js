import gulp from 'gulp';

// node dependencies
import console from 'better-console';
import fs from 'fs';

// gulp dependencies
import autoprefixer from 'gulp-autoprefixer';
import chmod from 'gulp-chmod';
import clone from 'gulp-clone';
import gulpif from 'gulp-if';
import less from 'gulp-less';
import minifyCSS from 'gulp-clean-css';
import plumber from 'gulp-plumber';
import print from 'gulp-print';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import uglify from 'gulp-uglify';
import replaceExt from 'replace-ext';

// user config
import config from './config/user';

// task config
import tasks from './config/tasks';
import install from './config/project/install';

// shorthand
const { series, parallel } = gulp;

let watch;
let watchCSS;
let watchJS;
let watchAssets;

let watchCSSCallback;
let watchJSCallback;
let watchAssetsCallback;

// add tasks referenced using gulp.run (sub-tasks)
if(config.rtl) {
  import('./collections/rtl.js').then(() => {});  // Use dynamic import for collections
}
import('./collections/internal.js').then(() => {});  // Use dynamic import for collections

// export task
watch = function(callback) {
  if (!install.isSetup()) {
    console.error('Cannot watch files. Run "gulp install" to set-up Semantic');
    return;
  }

  // check for right-to-left (RTL) language
  if(config.rtl == 'both') {
    gulp.start('watch-rtl');
  }
  if(config.rtl === true || config.rtl === 'Yes') {
    gulp.start('watch-rtl');
    return;
  }

  console.log('Watching source files for changes');

  /*--------------
      Watch CSS
  ---------------*/

  watchCSS = gulp.watch([
    source.config,
    `${source.definitions}/**/*.less`,
    `${source.site}/**/*.{overrides,variables}`,
    `${source.themes}/**/*.{overrides,variables}`,
  ]);
  watchCSSCallback = (filePath) => {
    let lessPath;

    // log modified file
    gulp.src(filePath)
      .pipe(print(tasks.log.modified));

    // recompile on *.override , *.variable change
    const isConfig = filePath.includes('theme.config') || filePath.includes('site.variables');
    const isPackagedTheme = filePath.includes(source.themes);
    const isSiteTheme = filePath.includes(source.site);
    const isDefinition = filePath.includes(source.definitions);

    if(isConfig) {
      console.info('Rebuilding all UI');
      gulp.start('build-css');
      return;
    } else if(isPackagedTheme) {
      console.log('Change detected in packaged theme');
      lessPath = replaceExt(filePath, '.less').replace(tasks.regExp.theme, source.definitions);
    } else if(isSiteTheme) {
      console.log('Change detected in site theme');
      lessPath = replaceExt(filePath, '.less').replace(source.site, source.definitions);
    } else {
      console.log('Change detected in definition');
      lessPath = filePath;
    }

    if (fs.existsSync(lessPath)) {
      const stream = gulp.src(lessPath)
        .pipe(plumber(tasks.settings.plumber.less))
        .pipe(less(tasks.settings.less))
        .pipe(print(tasks.log.created))
        .pipe(replace(tasks.comments.variables.in, tasks.comments.variables.out))
        .pipe(replace(tasks.comments.license.in, tasks.comments.license.out))
        .pipe(replace(tasks.comments.large.in, tasks.comments.large.out))
        .pipe(replace(tasks.comments.small.in, tasks.comments.small.out))
        .pipe(replace(tasks.comments.tiny.in, tasks.comments.tiny.out))
        .pipe(autoprefixer(tasks.settings.prefix))
        .pipe(gulpif(config.hasPermission, chmod(config.permission)));

      const uncompressedStream = stream.pipe(clone());
      const compressedStream = stream.pipe(clone());

      uncompressedStream
        .pipe(plumber())
        .pipe(replace(tasks.assets.source, tasks.assets.uncompressed))
        .pipe(gulp.dest(tasks.output.uncompressed))
        .pipe(print(tasks.log.created))
        .on('end', () => gulp.start('package uncompressed css'));

      compressedStream
        .pipe(plumber())
        .pipe(replace(tasks.assets.source, tasks.assets.compressed))
        .pipe(minifyCSS(tasks.settings.minify))
        .pipe(rename(tasks.settings.rename.minCSS))
        .pipe(gulp.dest(tasks.output.compressed))
        .pipe(print(tasks.log.created))
        .on('end', () => gulp.start('package compressed css'));
    } else {
      console.log('Cannot find UI definition at path', lessPath);
    }
  };

  // Watch CSS changes
  watchCSS
    .on('change', watchCSSCallback)
    .on('add', watchCSSCallback);

  /*--------------
      Watch JS
  ---------------*/

  watchJS = gulp.watch([
    `${source.definitions}/**/*.js`,
  ]);
  watchJSCallback = (filePath) => {
    gulp.src(filePath)
      .pipe(plumber())
      .pipe(replace(tasks.comments.license.in, tasks.comments.license.out))
      .pipe(gulpif(config.hasPermission, chmod(config.permission)))
      .pipe(gulp.dest(tasks.output.uncompressed))
      .pipe(print(tasks.log.created))
      .pipe(uglify(tasks.settings.uglify))
      .pipe(rename(tasks.settings.rename.minJS))
      .pipe(gulp.dest(tasks.output.compressed))
      .pipe(print(tasks.log.created))
      .on('end', () => {
        gulp.start('package compressed js');
        gulp.start('package uncompressed js');
      });
  };

  watchJS
    .on('change', watchJSCallback)
    .on('add', watchJSCallback);

  /*--------------
    Watch Assets
  ---------------*/

  watchAssets = gulp.watch([
    `${source.themes}/**/assets/**/*.*`,
  ]);
  watchAssetsCallback = (filePath) => {
    gulp.src(filePath, { base: source.themes })
      .pipe(gulpif(config.hasPermission, chmod(config.permission)))
      .pipe(gulp.dest(tasks.output.themes))
      .pipe(print(tasks.log.created));
  };

  watchAssets
    .on('change', watchAssetsCallback)
    .on('add', watchAssetsCallback);
};

/* Export with Metadata */
watch.displayName = 'watch';
watch.description = 'Watch for site/theme changes';

export default series(watch);
