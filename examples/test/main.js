var sys = require('sys'),
   http = require('http');

var config = require('config');
var handler = require('handler');

port = 8080;
if(process.argv[2]) {
  port = process.argv[2];
}

http.createServer(function (req, res) {
  handler.handle(req, res);
}).listen(port, "127.0.0.1");
sys.puts('Server running at http://127.0.0.1:'+port+'/');

handler.static("/main.js",config.get("server.root") + "/examples/test/main.js");
handler.static("/src",config.get("server.root") + "/examples/test");

handler.pattern("/helloworld", function(req, res) {
  res.render("Hello");
  res.iamdone();
});

handler.pattern("/helloworld", function(req, res) {
  res.render(" World!");
  res.iamdone();
});

var counter = 0;
handler.pattern("/counter", function(req, res) {
  counter++;
  res.render(counter);
  res.iamdone();
});

handler.module("/test",__dirname + "/test.js");
