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

config.set("messages.404","Not Found!");

handler.static("/main.js",config.get("server.root") + "/examples/test/main.js");
handler.static("/src",config.get("server.root") + "/examples/test");

handler.pattern("/aaa", function(req, res) {
  console.log("func1");
  res.writeHead(200);
  res.write("FUNC1");
  res.write("A: ");
  res.write("B: ");
  res.iamdone();
});

handler.pattern("/aaa", function(req, res) {
  console.log("func2");
  res.write("FUNC2");
  res.write("A: ");
  res.write("B: ");
  res.iamdone();
});

handler.module("/bbb",__dirname + "/test.js");
