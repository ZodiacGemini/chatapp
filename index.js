var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var onlineUsers = [];

app.use(express.static(__dirname + '/app'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  var isLoggedIn = false;
  socket.on('login', function(username) {
    if (isLoggedIn) {
      return;
    }
    // socket.join(socket.id);
    socket.username = username;
    onlineUsers.push({username: socket.username, socketId: socket.id})
    isLoggedIn = true;
    io.emit('joined', {onlineUsers: onlineUsers, message : " connected", username: socket.username})
  });


  socket.on('chat message', function(msg){
    socket.broadcast.emit('chat message', {username : socket.username, message: ": " + msg});
    
  });

  socket.on('disconnect', function(){
    if(!isLoggedIn){
      return;
    }
    let index = onlineUsers.findIndex(function (element, index, array){
      return element.socketId == socket.id
    });
    if(index !== -1)
      onlineUsers.splice(index, 1);

    io.emit('disconnect', {username: socket.username, message : " disconnected"});
  });

  socket.on('typing', function(){
    socket.broadcast.emit('typing', {username: socket.username, message : " is typing..."});
  });
  
  socket.on('startPrivateChat', function(id) {
    socket.broadcast.to(id).emit('startPrivateChat');
  });
});

http.listen(5000, function(){
  console.log('listening on *:5000');
});