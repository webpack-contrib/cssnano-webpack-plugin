const cssnano = require('cssnano');

/*
 * We bring to the line here, because when passing result from the worker,
 * the warning.toString is replaced with native Object.toString
 * */
function warningsToString(warnings) {
  return warnings.map((i) => i.toString());
}

const minify = async (options) => {
  const {
    assetName,
    input,
    minimizerOptions,
    map,
    inputSourceMap,
    minify: minifyFn,
  } = options;

  const postcssOptions = { to: assetName, from: assetName };

  if (minifyFn) {
    const result = await minifyFn(
      { input, postcssOptions, minimizerOptions },
      inputSourceMap
    );

    return {
      css: result.css,
      map: result.map,
      error: result.error,
      warnings: warningsToString(result.warnings || []),
    };
  }

  if (inputSourceMap) {
    postcssOptions.map = { prev: inputSourceMap, ...map };
  }

  const result = await cssnano.process(input, postcssOptions, minimizerOptions);

  return {
    css: result.css,
    map: result.map,
    error: result.error,
    warnings: warningsToString(result.warnings()),
  };
};

async function transform(options) {
  // 'use strict' => this === undefined (Clean Scope)
  // Safer for possible security issues, albeit not critical at all here
  // eslint-disable-next-line no-new-func, no-param-reassign
  options = new Function(
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
    `'use strict'\nreturn ${options}`
  )(exports, require, module, __filename, __dirname);

  const result = await minify(options);

  if (result.error) {
    throw result.error;
  } else {
    return result;
  }
}

module.exports.minify = minify;
module.exports.transform = transform;
