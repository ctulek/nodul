var Fs = require('fs');
var Script = process.binding('evals').Script;

var scripts = {};

exports.load = function(filePath, callback) {
  Fs.readFile(filePath, function(err, data) {
    if(err) {
      callback.apply(undefined, null);
      return;
    }
    var script = compile(data);
    if(!script) {
      console.log(filePath + " has returned an error.");
    }
    callback.apply(undefined, [script]);
    if(script) {
      Fs.watchFile(filePath, function(curr, prev) {
        if(curr.size + "" != prev.size + "" || curr.mtime + "" != prev.mtime + "" || curr.ctime + "" != prev.ctime + "") {
          console.log("Reloading the script " + filePath);
          Fs.readFile(filePath, function(err, data) {
            if(err) {
              callback.apply(undefined, null);
            }
            console.log("Script reloaded: " + filePath);
            var script = compile(data);
            if(!script) {
              console.log("Script compilation failed: " + filePath);
            } else {
              console.log("Script compiled: " + filePath);
            }
            callback.apply(undefined, [script]);
          });     
        }
      });
    }
  });
}

var compile = function(code) {
  try {
    var script = new Script(code);
    return script;
  } catch (err) {
    console.log(err);
    return null;
  }
}