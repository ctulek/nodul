var sys = require('sys'),
   http = require('http');

var config = require('./config');
var handler = require('./handler');

port = 8080;
if(process.argv[2]) {
  port = process.argv[2];
}

http.createServer(function (req, res) {
  handler.handle(req, res);
}).listen(port, "127.0.0.1");
sys.puts('Server running at http://127.0.0.1:'+port+'/');

config.set("messages.404","Not Found!");

handler.static("/main.js",config.get("server.root") + "/src/main.js");
handler.static("/src",config.get("server.root") + "/src");


handler.pattern("*/aaa/*", function(a, b) {
  this.res.writeHead(200);
  this.res.write("AAA");
  this.res.write("A: " + a);
  this.res.write("B: " + b);
  this.res.end();
});

handler.module("bbb","./deneme");
