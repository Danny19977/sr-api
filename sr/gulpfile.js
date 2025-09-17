const gulp = require("gulp");
const gap = require("gulp-append-prepend");

gulp.task("licenses", async function () {
  // this is to add Freelance Solutions licenses in the production mode for the minified js
  gulp
    .src("build/static/js/*chunk.js", { base: "./" })
    .pipe(
      gap.prependText(`/*!

=========================================================
* Team On Site- v2.0.1
=========================================================

* Product Page: https://www.freelance-solutions.com/product/light-bootstrap-dashboard-react
* Copyright 2020 Freelance Solutions (https://www.freelance-solutions.com)

* Coded by Freelance Solutions

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/`)
    )
    .pipe(gulp.dest("./", { overwrite: true }));

  // this is to add Freelance Solutions licenses in the production mode for the minified html
  gulp
    .src("build/index.html", { base: "./" })
    .pipe(
      gap.prependText(`<!--

=========================================================
* Team On Site- v2.0.1
=========================================================

* Product Page: https://www.freelance-solutions.com/product/light-bootstrap-dashboard-react
* Copyright 2020 Freelance Solutions (https://www.freelance-solutions.com)

* Coded by Freelance Solutions

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

-->`)
    )
    .pipe(gulp.dest("./", { overwrite: true }));

  // this is to add Freelance Solutions licenses in the production mode for the minified css
  gulp
    .src("build/static/css/*chunk.css", { base: "./" })
    .pipe(
      gap.prependText(`/*!

=========================================================
* Team On Site- v2.0.1
=========================================================

* Product Page: https://www.freelance-solutions.com/product/light-bootstrap-dashboard-react
* Copyright 2020 Freelance Solutions (https://www.freelance-solutions.com)

* Coded by Freelance Solutions

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/`)
    )
    .pipe(gulp.dest("./", { overwrite: true }));
  return;
});
