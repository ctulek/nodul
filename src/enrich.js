var Url = require('url');
var Sys = require('sys');
var Query = require('querystring');

exports.request = function(req) {
  req.parsed = Url.parse(req.url, true);
  //console.log(Sys.inspect(req.parsed));
  
  req.params = {};
  for (var key in req.parsed.query) {
    req.params[key] = req.parsed.query[key];
  }

  req.raw = "";
  if(req.method == "POST") {
    req.on("data",function(chunk) {
      req.raw += chunk;
    });
    req.on("end",function() {
      if(req.headers['content-type'].match(/^application\/x-www-form-urlencoded/)) {
        var params = Query.parse(req.raw);
        for(var key in params) {
          req.params[key] = params[key];
        }
      }
      console.log(Sys.inspect(req));
    });
  }
  
  //console.log(Sys.inspect(req));
  return req;
}

exports.response = function(res) {
  res.statusCode = 200;
  res.headers = {};
  res.header = function(header, value) {
    res.headers[header] = value;
  }
  res.body = "";
  res.render = function(str) {
    if(res.__ended) {
      return false;
    }
    res.body += str;
    return true;
  }
  
  res.__headersSent = false;
  res.__bodySent = false;
  res.__ended = false;
  
  res.__sendHeaders = function() {
    if(res.__headersSent == false) {
      if(res.__bodySent == false) {
        res.header("Content-Length", res.body.length);
      }
      var headers = {};
      for(var key in res.headers) {
        // TODO: Support multi-value headers
        headers[key] = res.headers[key];
      }
      res.writeHead(res.statusCode,headers);
      res.__headersSent = true;
    }
  }
  
  res.finish = function() {
    if(res.__ended) {
      return false;
    }
    res.__sendHeaders();
    
    res.end(res.body);
    res.__bodySent = true;
    res.__ended = true;
    return true;
  }
  
  res.flush = function() {
    if(res.__ended) {
      return false;
    }
    res.__sendHeaders();

    if(body.length > 0) {
      res.write(res.body);
      res.__bodySent = true;
      res.body = "";
    }
    
    return true;
  }
  
  res.redirect = function(str) {
    if(res.__headersSent) {
      return false;
    }
    res.statusCode = 302;
    res.header("Location",str);
    res.finish();
  }
  
  return res;
}