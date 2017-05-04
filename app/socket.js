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
      html: '<p><b>You</b>: ' + $('#m').val() + '</p>',
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

  socket.on('newPrivateMessage', function (id, msg, username) {
    $('#privateMessages' + id).append('<li><b>'+ username +'</b>: ' + msg + '</li>');
  });

  socket.on('startPrivateChat', function (id, username) {
    CreateNewChat(id, username);
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
  var id = data.target.getAttribute('socket-id');
  var username = data.target.getAttribute('id');
  
  var checkIfExisting = $('#privateMessages' + id).val();
  if (checkIfExisting !== '') {
    CreateNewChat(id, username);
    socket.emit('startPrivateChat', id);
  }
});


function CreateNewChat(id, username) {
  var newId = 'pmForm' + id;
  var newButton = $('<button/>', { text: 'send' });
  var newDiv = $('<div/>', { class: 'newPM', id: 'pmDiv' + id });
  var newInput = $('<input/>', {
    id: 'pm' + id,
    placeholder: 'Write private message...',
    autocomplete: 'off'
  });
  var newUl = $('<ul/>', { id: 'privateMessages' + id });
  var newForm = $('<form/>', {
    id: newId,
    action: ''
  });
  newForm.append(newInput);
  newForm.append(newButton);
  newDiv.append(newUl);
  newDiv.append(newForm);
  $('#messageDiv').append(newDiv);

  // Add chat selection button
  var newRoomBtn = $('<button/>', { text: username, value: id, class: 'ToggleGeneralButton' })
  $('#chatSelection').append(newRoomBtn);

  $('#' + newId).submit(function () {
    var msg = $('#pm' + id).val();
    socket.emit('newPrivateMessage', id, msg);
    newUl.append('<li><b>You</b>: ' + msg + '</li>');
    $('#pm' + id).val('');
    return false;
  });

}

//FLUM KARDEMUM
function ToggleGeneral() {
  $('#hideCurrent').toggle();
  $('#generalButtonId').toggleClass('ToggleGeneralButtonFalse', 'ToggleGeneralButton');
  $('#currentChatName').html('<p>Current Chat: <b>General</b></p>');
  AutoScroll();
}

$(document).on('click', '.ToggleGeneralButton', function (data) {
  console.log(data.target.value);
  var id = data.target.value;
  $('#pmDiv' + id).toggle();

});

function AutoScroll() {
  var scrollBody = $('body');
  var extendableContent = $("#messages");
  var currentHeight = extendableContent.outerHeight();
  scrollBody.scrollTop(currentHeight);
}