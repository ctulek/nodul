var config = {};

var get = function(key) {
  return config[key];
}

exports.get = get;

var set = function(key, val) {
  config[key] = val;
}

exports.set = set;

set("server.root","/Users/cagdas/Projects/nodul");
