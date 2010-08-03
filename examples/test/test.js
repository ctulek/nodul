var sys = require('sys');
var fs = require('fs');

exports.func1 = function(req, res) {
  res.redirect("/test/func2")
  res.iamdone();
}

exports.func2 = function(req, res) {
  res.render("Redirected\n");
  res.iamdone();
}

exports.hello = function(req, res) {
  res.cookie("test1","value1",-1);
  res.render("<html><head><title>Hello World!!!<title></head><body><iframe src='/test/iframe'/></body></html>");
  res.iamdone();
}

exports.iframe = function(req, res) {
  res.render("iFrame content");
  res.iamdone();
}