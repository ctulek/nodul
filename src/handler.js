var Url = require('url');
var FS = require('fs');

var handlers = [];
var handlerIndex = 0;

var register = function(match, handler) {
  handlers[handlerIndex] = {m:match, h:handler};
  handlerIndex++;
}

exports.register = register;

var handle = function(req, res) {
  for(var i = 0; i < handlers.length; i++) {
    var handler = handlers[i];
    if(handler.m(req)) {
      handler.h.apply(null,[req,res]);
      return;
    }
  }
  // Nothing matches. End the response.
  res.writeHead(404);
  res.end();
}

exports.handle = handle;

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

var pattern = function(pattern, handlerFunc) {
  pattern = getRegExpFunctionForPattern(pattern);
  if(pattern == null) {
    return;
  }
  matcher = function(req) {
    return pattern.apply(null,[req]) != false;
  }
  var handler = function(req, res) {
    var param_values = getParameterValuesFromUrl(req.url, handlerFunc);
    handlerFunc.apply({req:req,res:res}, param_values);
  }
  register(matcher, handler);
}

exports.pattern = pattern;

var module = function(pattern, modulePath) {
  pattern = getRegExpFunctionForPattern(pattern + "*");
  if(pattern == null) {
    return;
  }
  var module = require(modulePath);
  var handlerFunc = function() {
    module.req = this.req;
    module.res = this.res;
    var parsed = Url.parse(this.req.url);
    var pat = pattern.apply(null, [this.req]);
    var regexRes = pat.exec(parsed.pathname.substr(1));
    var funcName = regexRes[0].substr(regexRes[0].lastIndexOf("/") + 1);
    console.log(pat.lastIndex + " " + funcName);
    var param_values = getParameterValuesFromUrl(this.req.url, module[funcName]);
    module[funcName].apply(module,param_values);
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
      var result = pattern.test(parsed.pathname.substr(1));
      pattern.lastIndex = 0;
      return result ? pattern : false;
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

// Inspired from http://stackoverflow.com/questions/914968/inspect-the-names-values-of-arguments-in-the-definition-execution-of-a-javascript
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