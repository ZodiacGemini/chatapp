var isTyping = false;
var socket = io();

$('#loginSubmit').submit(function (event) {
  console.log($('#login').val(), $('#loginpw').val())

  socket.emit('login', $('#login').val(), $('#loginpw').val());

  socket.on('login', function (loginMessage) {
    event.stopImmediatePropagation();
    $('#wrong').empty();
    $('#wrong').append('<p style="color: red; font-size: 200px; text-align: center;">Wrong Password</p>');
    return false;
  })
  socket.on('successful', function () {
    $('#messageDiv').show();
    $('#loginForm').hide();
    return false;
  })
  return false;
});

//Default function that socket added, this takes care of all "socket.on" calls
$(function () {
  $('#msgForm').submit(function () {
    socket.emit('chat message', $('#m').val());
    $('#messages').append($('<li/>', {
      html: '<p><b>You</b>: ' + $('#m').val() + '</p>',
      class: 'ownage'
    }));

    $('#m').val('');

    AutoScrollGeneral();
    isTyping = false;
    return false;
  });

  socket.on('chat message', function (msg) {
    $('#messages').append($('<li>').html('<p><b>' + msg.username + '</b>' + msg.message + '</p>'));
    $('#messages #' + msg.username.replace(/\s/g, '')).remove();
    AutoScrollGeneral();
    AddNotificationGeneral();
  });

  socket.on('disconnect', function (msg) {
    $('#messages').append($('<li>').html('<p><b>' + msg.username + '</b>' + msg.message + '</p>'));
    $('#usersOnlineList #' + msg.username.replace(/\s/g, '')).remove();
    $('#messages #' + msg.username.replace(/\s/g, '')).remove();
    AutoScrollGeneral();
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
    AutoScrollGeneral();
  });

  socket.on('stoppedTyping', function (username) {
    $('#messages #' + username.replace(/\s/g, '')).remove();
  })

  socket.on('newPrivateMessage', function (id, msg, username) {
    $('#privateMessages' + username).append('<li><b>' + username + '</b>: ' + msg + '</li>');
    AddNotification(id, username);
  });

  socket.on('startPrivateChat', function (id, username) {
    CreateNewChat(id, username);
  });
});

function IsTyping() {
  if (isTyping) {
    if ($('#m').val() == '') {
      isTyping = false;
      socket.emit('stoppedTyping');
    };
    return;
  }
  isTyping = true;
  socket.emit('typing');
}

$(document).on('click', '#usersOnlineList', function (data) {
  var id = data.target.getAttribute('socket-id');
  var username = data.target.getAttribute('id');

  var checkIfExisting = $('#privateMessages' + username).val();
  if (checkIfExisting !== '') {
    CreateNewChat(id, username);
    HideAllExceptThis(id, username);
    socket.emit('startPrivateChat', id);
  } else {
    HideAllExceptThis(id, username);
    $('#privateChatButton' + username).attr('messageCount', 0);
    $('#privateChatButton' + username).text(username);
  }
});

$(document).on('contextmenu', '#usersOnlineList', function (data) {
  data.preventDefault();
  alert(data.target.getAttribute('id'));
});

$(document).on('click', '.PrivateChatButtonFalse', function (data) {
  var id = data.target.value;
  var username = data.target.getAttribute('userName');
  HideAllExceptThis(id, username);
  $('#privateChatButton' + username).attr('messageCount', 0);
  $('#privateChatButton' + username).text(username);
});


function CreateNewChat(id, username) {
  var newId = 'pmForm' + username;
  var newButton = $('<button/>', { text: 'Send' });
  var newDiv = $('<div/>', {
    class: 'chatRoom',
    id: 'privateChatDiv' + username,
    hidden: 'hidden'
  });
  var newInput = $('<input/>', {
    id: 'pm' + username,
    placeholder: 'Write private message...',
    autocomplete: 'off'
  });
  var newUl = $('<ul/>', {
    id: 'privateMessages' + username,
    class: 'privateChatUl'
  });
  var newForm = $('<form/>', {
    id: newId,
    action: ''
  });
  newForm.append(newInput);
  newForm.append(newButton);
  newDiv.append(newUl);
  newDiv.append(newForm);
  $('#messageDiv').append(newDiv);
  var buttonExist = false;

  $('.PrivateChatButton').each(function (index, value) {
    if (value.id == 'privateChatButton' + username)
      buttonExist = true;
  });

  // Add chat selection button
  if (!buttonExist) {
    var newRoomBtn = $('<button/>', {
      text: username,
      value: id,
      class: 'PrivateChatButtonFalse',
      id: 'privateChatButton' + username,
      'messageCount': 0,
      'userName': username
    });
    $('#chatSelection').append(newRoomBtn);
  }

  //Add function for submitting new private messages
  $('#' + newId).submit(function () {
    var msg = $('#pm' + username).val();
    socket.emit('newPrivateMessage', id, msg);
    newUl.append('<li><b>You</b>: ' + msg + '</li>');
    $('#pm' + username).val('');
    AutoScroll(username);
    return false;
  });
}

function ToggleGeneral() {
  $('.PrivateChatButton').each(function (index, value) {
    value.className = 'PrivateChatButtonFalse';
  });
  document.getElementById('toggleGeneralButton').className = 'ToggleGeneralButton';

  $('.chatRoom').hide();
  $('#generalChat').toggle();
  $('#currentChatName').html('<p>Current Chat: <b>General</b></p>');
  $('#toggleGeneralButton').attr('messageCount', 0);
  $('#toggleGeneralButton').html('<p><b>General</b></p>');
  AutoScrollGeneral();
}

function HideAllExceptThis(id, username) {
  $('.PrivateChatButton').each(function (index, value) {
    value.className = 'PrivateChatButtonFalse';
  });
  $('.chatRoom').hide();
  $('#privateChatDiv' + username).toggle();
  $('#currentChatName').html('<p>Current Chat: <b>' + username + '</b></p>');
  document.getElementById('toggleGeneralButton').className = 'ToggleGeneralButtonFalse';
  document.getElementById('privateChatButton' + username).className = 'PrivateChatButton';
  AutoScroll(username);
}

function AutoScroll(username) {
  var scrollBody = $('body');
  var extendableContent = $("#privateMessages" + username);
  var currentHeight = extendableContent.outerHeight();
  scrollBody.scrollTop(currentHeight);
}

function AutoScrollGeneral() {
  var scrollBody = $('body');
  var extendableContent = $("#messages");
  var currentHeight = extendableContent.outerHeight();
  scrollBody.scrollTop(currentHeight);
}

function AddNotification(id, username) {
  if ($('#privateChatButton' + username).hasClass('PrivateChatButtonFalse')) {
    var count = $('#privateChatButton' + username).attr('messageCount');
    count++;
    $('#privateChatButton' + username).attr('messageCount', count);
    $('#privateChatButton' + username).text(username + ' ' + count);
  }
}

function AddNotificationGeneral() {
  if ($('#toggleGeneralButton').hasClass('ToggleGeneralButtonFalse')) {
    var generalCount = $('#toggleGeneralButton').attr('messageCount');
    generalCount++;
    $('#toggleGeneralButton').attr('messageCount', generalCount);
    $('#toggleGeneralButton').html('<p><b>General</b> ' + generalCount + '</p>');
  }
}