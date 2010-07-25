var deneme = function(a, b) {
  this.res.writeHead(200);
  this.res.write("A: " + a + "<br/>");
  this.res.write("B: " + b);
  this.res.end();
}

exports.deneme = deneme;