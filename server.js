//Run this file with "node server.js"
var app        = require('express')();
var http       = require('http').Server(app);
var io         = require('socket.io')(http);
var serialport = require('serialport');
var exec = require('child_process').exec;
var SerialPort = serialport.SerialPort;
var serial;

//When a request come into the server for / give the client the file index.html
app.get('/', function(req, res){res.sendFile('./index.html', { root: __dirname});});
app.get('/js/jquery.js', function(req, res){res.sendFile('./js/jquery.js', { root: __dirname});});
app.get('/js/paper.js', function(req, res){res.sendFile('./js/paper.js', { root: __dirname});});
app.get('/js/index.js', function(req, res){res.sendFile('./js/index.js', { root: __dirname});});

//Listen for incoming connections
http.listen(3000, function(){console.log("listening on port 3000");});

//When the serial port is successfully opened...
var onSerialOpen = function()
{
	console.log("opened serial port");
	//When we get data from the serial port...
	serial.on('data', function(data)
	{
		console.log("got some data from Photon: ", data);

		//Send to the browser; 'data' is the name of the event
		io.emit('to browser', data);
	});

};

//Here's what happens when a connection is made from the browser
io.sockets.on('connection',
	function(socket)
	{
		console.log("someone connected");

		//Since the socket is open, we can now accept "to serial" messages
		// from the browser
		socket.on('to serial', function(data)
		{
			if(serial && serial.isOpen())
			{
				serial.write(data + '\n');
				console.log("Send '" + data + "' to serial");
			}
			else
				console.log("Serial port not open");
		});
	}
);

exec('particle serial list', function(error, stdout, stderr) {
  var devName = stdout.split('\n')[1].split(' - ')[0];
  console.log(devName);

  //Hook up the serial port
  serial = new SerialPort( devName,
														{parser: serialport.parsers.readline('\n')});
  //When the serial port is successfully opened...
  serial.on('open', onSerialOpen);
});
