var sys = require('sys');
var fs = require('fs');

var module = {};

module.func1 = function(a, b) {
  sys.log(sys.inspect(this));
  res.writeHead(200);
  res.write("A: " + a + "<br/>\n");
  res.write("B: " + b + "<br/>\n");
  res.write("Test\n");
  sys.log("Test");
  iamdone();
}

module.func2 = function(a) {
  res.writeHead(200);
  res.write("HELLO " + a + "\n");
  iamdone();
}

exec(module);