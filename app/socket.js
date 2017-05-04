var isTyping = false;
var socket = io();
function LogIn() {
  socket.emit('login', $('#login').val());
  $('#messageDiv').toggle();
  $('#loginForm').hide();
}
$(function () {

  $('#msgForm').submit(function () {
    socket.emit('chat message', $('#m').val());
    $('#messages').append($('<li/>', {
      html: '<p><b>You wrote</b>: ' + $('#m').val() + '</p>',
      class: 'ownage'
    }));
    $('#m').val('');
    AutoScroll();
    isTyping = false;
    return false;
  });

  socket.on('chat message', function (msg) {
    $('#messages').append($('<li>').html('<p><b>' + msg.username + '</b>' + msg.message + '</p>'));
    $('#messages #' + msg.username.replace(/\s/g, '')).remove();
    AutoScroll();
  });

  socket.on('disconnect', function (msg) {
    $('#messages').append($('<li>').html('<p><b>' + msg.username + '</b>' + msg.message + '</p>'));
    $('#usersOnlineList #' + msg.username.replace(/\s/g, '')).remove();
  });

  socket.on('joined', function (msg) {
    $('#messages').append($('<li>').html('<p><b>' + msg.username + '</b>' + msg.message + '</p>'));
    $('#usersOnlineList').empty();
    msg.onlineUsers.forEach(function (element) {
      $('#usersOnlineList').append($('<li/>', {
        text: element.username,
        id: element.username.replace(/\s/g, ''),
        'socket-id': element.socketId
      }));
    });
  });

  socket.on('typing', function (msg) {
    $('#messages').append($('<li/>', {
      html: '<p><b>' + msg.username + '</b>' + msg.message + '</p>',
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

$(document).on('click', '#usersOnlineList', function (data) {
  console.log(data.target);
  var id = data.target.getAttribute('socket-id');
  console.log(id);
  $('#privateChat').append('<p> hej hopp </p>');
  socket.emit('startPrivateChat', id);
});


//FLUM KARDEMUM
function ToggleGeneral() {
  $('#hideCurrent').toggle();
  $('#generalButtonId').toggleClass('ToggleGeneralButtonFalse', 'ToggleGeneralButton');
  $('#currentChatName').html('<p>Current Chat: <b>General</b></p>');
  AutoScroll();
}

function AutoScroll() {
    var scrollBody = $('body');
    var extendableContent = $("#messages");
    var currentHeight = extendableContent.outerHeight();
    scrollBody.scrollTop(currentHeight);
}