var sys = require('sys');
var fs = require('fs');


exports.func1 = function(req, res) {
  //res.render("DENEME1\n");
  //res.render(func3());
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

