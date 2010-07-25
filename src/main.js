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


handler.pattern("aaa", function() {
  console.log("func1");
  this.res.writeHead(200);
  this.res.write("FUNC1");
  this.res.write("A: ");
  this.res.write("B: ");
  var thisObject = this; // This is ugly find a better way
  setTimeout(function() {
    thisObject.iamdone();  
  }, 5000);
  
});

handler.pattern("aaa", function() {
  console.log("func2");
  this.res.write("FUNC2");
  this.res.write("A: ");
  this.res.write("B: ");
  this.iamdone();
});

handler.module("bbb","./deneme");
