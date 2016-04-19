var _ = require('lodash');
var express = require('express');
var app = express();
var fs = require('fs');
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var storage = require('node-persist');

storage.initSync();

app.use(express.static('public'));

server.listen(80, function () {
  console.log('Nifty server running on port 80!');
});

//var configData = {};
//var configDef = {};

io.use(function(socket, next){
    if(socket.handshake.query.type == 'source'){
    	 io.sockets.sockets['sourceId'] = socket.id;
    }
	socket.join(socket.handshake.query.type);
    return next();
});

io.on('connection', function (socket) {
	
	app.get('/price/alterealitygames/:id', function (req, res) {
	res.status(404);
	  res.send(req.params.id);
	  socket.broadcast.emit('xsplit_image', 'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid='+req.params.id+'&type=card');
	});
	app.get('/cardmatch/:id', function (req, res) {
	  res.send(req.params.id);
	  if(isNaN(req.params.id)){
			socket.broadcast.emit('xsplit_image', 'http://localhost/cards/'+req.params.id+'.png');
	  }
	  else {
			socket.broadcast.emit('xsplit_image', 'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid='+req.params.id+'&type=card');
	  }
	});
	
	socket.on('write_file', function(msg){
		fs.appendFile(msg.filename, '{'+msg.timecode+':'+msg.scene+"}\r\n", (err) => {
		  if (err) throw err;
		});
	});

	socket.on('xsplit_image', function(msg){
		socket.broadcast.emit('xsplit_image', msg);
	  });

	socket.on('xsplit_update', function(msg){
	  //msg in the form {source:<source name>,data:{<data>}}
		//configData[msg.source] = msg.data;
		storage.setItem('configData-'+msg.source,msg.data);
		socket.broadcast.emit(msg.source, msg.data);
	});
  
	socket.on('xsplit_def', function(msg){
	  //msg in the form {source:<source name>,def:{<source definition>}}
		//configDef[msg.source] = msg.def;
		storage.setItem('configDef-'+msg.source,msg.def);
	});
  
	socket.on('xsplit_init', function(msg,fn){
		configDef = storage.getItem('configDef-'+msg.name)
		configData = storage.getItem('configData-'+msg.name)
		
		fn({'name':msg.name,
			'id':msg.id,
			'initObj':{'configDef':configDef,'data':configData}
		});
	});
  
	socket.on('xsplit_info', function(msg){
			io.sockets.sockets['returnId'] = socket.id;
			var sourceId = io.sockets.sockets['sourceId'];
			socket.to('source').emit('xsplit_info_get', msg);
	});
	socket.on('xsplit_info_send',function(msg){
			var returnId = io.sockets.sockets['returnId'];
			socket.to(returnId).emit('xsplit_info_receive',msg);
	});
	socket.on('clear_storage',function(msg){
		storage.clear();
		socket.broadcast.emit('xsplit_reload','');
	});
	

  
});