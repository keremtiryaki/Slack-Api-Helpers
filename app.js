var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname + "/public")).listen(8888); 