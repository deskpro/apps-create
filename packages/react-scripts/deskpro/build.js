const bundle = require('./bundle');
const render = require('./render');

module.exports = function(data) {
  return process.env.DP_STATIC_RENDER === 'on'
    ? render(data).then(bundle)
    : bundle(data);
};
