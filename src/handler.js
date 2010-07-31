var Url = require('url');
var FS = require('fs');
var Sys = require('sys');
var Script = process.binding('evals').Script;

var handlers = [];
var handlerIndex = 0;

var register = function(match, handler) {
  handlers[handlerIndex] = {m:match, h:handler};
  handlerIndex++;
}

exports.register = register;

var handle = function(req, res) {
  var chain = [];
  for(var i = 0, j = 0; i < handlers.length; i++) {
    var handler = handlers[i];
    if(handler.m(req)) {
      chain[j] = handler.h;
      j++;
    }
  }
  if(chain.length > 0) {
    handleChain(chain, req, res, 0);
  }
}

var handleChain = function(chain, req, res, index) {
  if(index == chain.length) {
    // End of chain
    res.end();
    return;
  }
  res.iamdone = function() {
    handleChain(chain, req, res, index + 1);
  }
  process.nextTick(function() {
    chain[index].apply(null, [req, res]);
  });
}

exports.handle = handle;

// PATTERN
var pattern = function(pattern, handlerFunc) {
  pattern = getRegExpFunctionForPattern(pattern);
  if(pattern == null) {
    return;
  }
  matcher = function(req) {
    return pattern.apply(null,[req]) != false;
  }
  register(matcher, handlerFunc);
}

exports.pattern = pattern;

var modules = {};

var module = function(pattern, modulePath) {
  var functionNamePattern = getRegExpFunctionForModulePattern(pattern);
  pattern = getRegExpFunctionForPattern(pattern + "*");
  if(pattern == null) {
    return;
  }
  var sandbox = {
    exports:{},
    require:require,
    process:process
  }
  modules[modulePath] = {script: new Script(FS.readFileSync(modulePath)), sandbox:sandbox};
  modules[modulePath].script.runInNewContext(sandbox);
  
  FS.watchFile(modulePath, function(curr, prev) {
    if(curr.size + "" != prev.size + "" || curr.mtime + "" != prev.mtime + "" || curr.ctime + "" != prev.ctime + "") {
      console.log("Reloading the module " + modulePath);
      try {
        var newModule = new Script(FS.readFileSync(modulePath));
        modules[modulePath].script = newModule;
        var sandbox = modules[modulePath].sandbox;
        sandbox.exports = {};
        modules[modulePath].script.runInNewContext(sandbox);
      } catch (err) {
        Sys.log(modulePath + " has returned an error. Continuing to use the old module code. Error is:");
        Sys.log(err);
      }
    }
  });
  var handlerFunc = function(req, res) {
    console.log("Module handler for " + modulePath);
    var module = modules[modulePath].script;    
    var sandbox = modules[modulePath].sandbox;
    try {
      var func = functionNamePattern(req);
      sandbox.exports[func].apply(sandbox,[req, res]);
    } catch (err) {
      Sys.log(modulePath + " throw an error");
      Sys.log(err);
      res.end();
    }
  }
  this.pattern(pattern, handlerFunc);
}

exports.module = module;

var getRegExpFunctionForPattern = function(pattern) {
  var type = typeof(pattern);
  if(type == "number") {
    pattern = "" + pattern;
  }
  if(type == "string") {
    pattern = new RegExp("^"+pattern.replace(/\*/g,".+?")+"$");
  }
  if(pattern instanceof RegExp) {
    return function(req) {
      var parsed = Url.parse(req.url);
      //console.log("Checking " + parsed.pathname + " against " + pattern.source);
      return pattern.test(parsed.pathname);
    };
  } else if(type == "function"){
      return pattern;  
  } else {
    console.log("Invalid pattern: " + pattern);
    return null;
  }
}

var getRegExpFunctionForModulePattern = function(pattern) {
  var type = typeof(pattern);
  if(type == "number") {
    pattern = "" + pattern;
  }
  if(type == "string") {
    pattern = new RegExp("^"+pattern.replace(/\*/g,".+?"));
  }
  if(pattern instanceof RegExp) {
    return function(req) {
      var parsed = Url.parse(req.url);
      var temp = pattern.exec(parsed.pathname);
      var lastIndex = temp[0].length;
      var reg = new RegExp("/([^/]+)");
      var result = reg.exec(parsed.pathname.substr(lastIndex));
      return result[1];
    };
  } else if(type == "function"){
      return pattern;  
  } else {
    console.log("Invalid pattern: " + pattern);
    return null;
  }
}

var getParameterValuesFromUrl = function(url, func) {
  var parameters = getFunctionParameterList(func);
  var parsed = Url.parse(url, true);
  var param_values = [];
  if(parsed.query) {
    for(i in parameters) {
      param_values[i] = parsed.query[parameters[i]];
    }
  }
  return param_values;
}

// NOT USED ANYMORE
// Inspired by http://stackoverflow.com/questions/914968/inspect-the-names-values-of-arguments-in-the-definition-execution-of-a-javascript
var getFunctionParameterList = function(func) {
  var funcParamReg = /\(([\s\S]*?)\)/;
  var params = funcParamReg.exec(func);
  var param_names = [];
  if (params) {
     param_names = params[1].split(',');
  }
  for(i in param_names) {
    param_names[i] = param_names[i].trim();
  }
  return param_names;
}

var static = function(url, path) {
  try {
    var stats = FS.statSync(path);
  } catch (err) {
    console.log("Invalid path: " + path);
    return;
  }
  console.log("Mapping " + url + " to " + path);
  var match = null;
  var handler = null;
  if(stats.isFile()) {
    match = function(req) {
      var parsed = Url.parse(req.url);
      if(parsed.pathname == url) {
        return true;
      }
      return false;
    };
    handler = function(req, res) {
      streamStaticFile(path, req, res);
    };
  } else if(stats.isDirectory()) {
    var reg = new RegExp("^"+url+"/(.+)$");
    match = function(req) {
      var parsed = Url.parse(req.url);
      if(reg.test(parsed.pathname)) {
        return true;
      } else if(parsed.pathname == url || parsed.pathname == url + '/' || parsed.pathname + '/' == url) {
        console.log('Directory browsing is not supported, yet.');
        return false;
      }
      return false;
    };
    handler = function(req, res) {
      var parsed = Url.parse(req.url);
      var regArr = reg.exec(parsed.pathname);
      var filePath = path + "/" + regArr[1];
      streamStaticFile(filePath, req, res);
    };
  } else {
    return;
  }
  register(match, handler);
}

exports.static = static;

// Inspired from antinode.
var streamStaticFile = function(path, req, res) {
  try {
    console.log("Trying to open " + path);
    var readStream = FS.createReadStream(path);
  } catch (err) {
      console.log(err);
      res.writeHead(404);
      res.end();
  }
  
  res.writeHead(200);
  
  req.connection.addListener('timeout', function() {
      /* dont destroy it when the fd's already closed */
      if (readStream.fd) {
          console.log('timed out. destroying file read stream');
          readStream.destroy();
      }
  });

  readStream.addListener('open', function() {
      console.log('open');
  });
  readStream.addListener('data', function (data) {
      res.write(data);
  });
  readStream.addListener('error', function (err) {
      console.log(err);
      res.end();
  });
  readStream.addListener('end', function () {
      res.end();
  });
}

