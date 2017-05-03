var isTyping = false;
var socket = io();
function LogIn() {
  socket.emit('login', $('#login').val());
  $('#messageDiv').toggle();
  $('#hideMe').hide();
}
$(function () {

  $('#msgForm').submit(function () {
    socket.emit('chat message', $('#m').val());
    $('#messages').append($('<li/>', {
      text: "You wrote: " + $('#m').val(),
      class: 'ownage'
    }));
    // $('#messages').scrollTop($('#messages')[0].scrollHeight);
    $('#m').val('');
    isTyping = false;
    return false;
  });

  socket.on('chat message', function (msg) {
    $('#messages').append($('<li>').text(msg.username + msg.message));
    $('#messages #' + msg.username.replace(/\s/g, '')).remove();
  });

  socket.on('disconnect', function (msg) {
    $('#messages').append($('<li>').text(msg.username + msg.message));
    $('#usersOnline #' + msg.username.replace(/\s/g, '')).remove();
  });

  socket.on('joined', function (msg) {
    $('#messages').append($('<li>').text(msg.username + msg.message));
    $('#usersOnline').empty();
    $('#usersOnline').append('<li><strong>Users Online</strong></li>')
    msg.onlineUsers.forEach(function (element) {
      $('#usersOnline').append($('<li/>', {
        text: element.username,
        id: element.username.replace(/\s/g, ''),
        'socket-id': element.socketId
      }));
    });
  });

  socket.on('typing', function (msg) {
    $('#messages').append($('<li/>', {
      text: msg.username + msg.message,
      id: msg.username.replace(/\s/g, '')
    }));
  });

  socket.on('startPrivateChat', function() {
    $('#privateChat').append('<p> hej hopp </p>');
  });
});

function IsTyping() {
  if (isTyping) {
    return;
  }

  isTyping = true;
  socket.emit('typing');
}

$(document).on('click', '#usersOnline', function (data) {
  console.log(data.target);
  var id = data.target.getAttribute('socket-id');
  console.log(id);
  $('#privateChat').append('<p> hej hopp </p>');
  socket.emit('startPrivateChat', id);
});