var automodules = {};

var load = function(mod) {
  automodules[mod] = require("./" + mod);
  require('fs').watchFile("src/" + mod + ".js", function(curr, prev) {
    require('sys').puts('Re-loading ' + mod);
    module.moduleCache[mod] = null;
    automodules[mod] = require("./" + mod);
  });
  return automodules[mod];
}

exports.load = load;