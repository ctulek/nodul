var sys = require('sys');
var fs = require('fs');


exports.func1 = function(req, res) {
  res.writeHead(200);
  res.write("OK1\n");
  //sys.log(sys.inspect(req));
  //sys.log(sys.inspect(res));
  res.write(func3());
  res.iamdone();
}

exports.func2 = function(req, res) {
  res.write("OK2");
  res.iamdone();
}

var func3 = function() {
  return "TEST\n";
}

