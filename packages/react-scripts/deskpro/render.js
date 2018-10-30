const url = require('url');
const path = require('path');
const fs = require('fs');
const jsdom = require('jsdom');
const querystring = require('querystring');
const paths = require('../config/paths');

/**
 * @param {Number} delay
 * @param {{}} value
 * @return {Promise}
 */
function promiseDelay(delay, value) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(value);
    }, delay);
  });
}

/**
 * @param {string} path
 * @return {Promise}
 */
function readFile(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, 'utf8', function(err, data) {
      if (err) {
        return Promise.reject(err);
      }

      const buffer = typeof data === 'string' ? Buffer.from(data) : data;
      resolve(buffer);
    });
  });
}

function writeFile(path, data) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(path, data, function(err) {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
}

class CustomResourceLoader extends jsdom.ResourceLoader {
  /**
   * @param {Object} loaderOptions
   * @param {{baseUrl:String, docRoot:String }} [paths]
   */
  constructor(loaderOptions, paths) {
    super(loaderOptions);
    this.paths = paths;
  }

  fetch(resourceUrl, options) {
    if (!this.paths) {
      return null;
    }

    if (resourceUrl.match(/\.js$/)) {
      const path = resourceUrl.replace(this.paths.baseUrl, this.paths.docRoot);
      return readFile(path);
    }

    if (resourceUrl.match(/\.html/)) {
      const parsedURL = url.parse(resourceUrl);
      const fsPath = path.join(this.paths.docRoot, parsedURL.pathname);
      return readFile(fsPath);
    }

    return null;
  }
}

/**
 *
 * @param {{ target:String, url:String }} target
 * @param {{ deskpro: {} }} packageJson
 */
function renderStatic(target, packageJson) {
  const targetToContextType = {
    'ticket-sidebar': 'ticket',
  };

  const dpQuery = querystring.stringify({
    'dp.widgetId': 'STATIC',
    'dp.render': 'static',
    'dp.instance.appId': 'STATIC',
    'dp.instance.appTitle': packageJson.deskpro.title,
    'dp.instance.appPackageName': packageJson.name,
    'dp.instance.instanceId': 'STATIC',
    'dp.context.type': targetToContextType[target.target],
    'dp.context.entityId': 'STATIC',
    'dp.context.locationId': 'STATIC',
    'dp.context.tabId': 'tab-1',
    'dp.context.tabUrl': 'https://127.0.0.1',
  });

  const file = path.join(paths.appBuild, target.url);
  const url = `http://localhost/${target.url}?${dpQuery}`;

  const resources = new CustomResourceLoader(
    {},
    {
      baseUrl: 'http://localhost',
      docRoot: paths.appBuild,
    }
  );

  return jsdom.JSDOM
    .fromFile(file, { url, runScripts: 'dangerously', resources })
    .then(dom => promiseDelay(1000, dom)) // we'll delay until the parsing and reading can take place
    .then(dom => dom.window.document.getElementById('root').outerHTML) // extract just the application dom
    .then(replacement =>
      jsdom.JSDOM
        .fromFile(file, { url, resources: new CustomResourceLoader({}, null) })
        .then(dom => {
          dom.window.document.getElementById('root').outerHTML = replacement;
          return dom;
        })
    ); // overwrite the application dom
}

function render(data) {
  return readFile(paths.appPackageJson)
    .then(buffer => JSON.parse(buffer.toString('utf8')))
    .then(packageJson => {
      // exclude the installers
      const targets = packageJson.deskpro.targets.filter(function(target) {
        return target.target !== 'install';
      });

      /**
       * @param {{ target:String, url:String }} target
       * @return {*}
       */
      function renderTarget(target) {
        return renderStatic(target, packageJson).then(dom => dom.serialize());
      }

      function writeRendered(content, index) {
        const target = targets[index];
        const filePath = path.join(paths.appBuild, target.url);
        return writeFile(filePath, content);
      }

      return Promise.all(targets.map(renderTarget))
        .then(results => Promise.all(results.map(writeRendered)))
        .then(results => data);
    });
}

module.exports = render;
