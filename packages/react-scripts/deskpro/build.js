const bundle = require('./bundle');
const render = require('./render');

module.exports = function(data) {
  return process.env.DP_STATIC_RENDER === 'off'
    ? bundle(data)
    : render(data).then(bundle);
};
