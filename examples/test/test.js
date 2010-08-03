var sys = require('sys');
var fs = require('fs');


exports.func1 = function(req, res) {
  res.redirect("/bbb/func2/?a=1&b=2&c=33")
  console.log("module#func1");
  res.iamdone();
}

exports.func2 = function(req, res) {
  res.render("DENEME1\n");
  console.log("module#func2");
  res.iamdone();
}

var func3 = function() {
  return "TEST123\n";
}

exports.hello = function(req, res) {
  res.render("<html><head><title>Hello World!<title></head><body><iframe src='/bbb/iframe'/></body></html>");
  res.iamdone();
}

exports.iframe = function(req, res) {
  res.render("Deneme");
  res.iamdone();
}