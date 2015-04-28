var io = require('socket.io').listen(5001),
    redis = require('redis').createClient();

redis.subscribe('rt-change');

io.on('connection', function(socket){
	socket.on('join', function (data) {
		socket.join(data.id);
	});
});
	
redis.on('message', function(channel, message){
	var message = JSON.parse(message);
	for (var i = message.users.length - 1; i >= 0; i--) {
		io.sockets.in(parseInt(message.users[i])).emit('rt-change', message);
	};
});

	