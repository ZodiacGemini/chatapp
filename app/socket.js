var isTyping = false;
var socket = io();
function LogIn() {
  socket.emit('login', $('#login').val());
  $('#messageDiv').toggle();
  $('#loginForm').hide();
}

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

  socket.on('newPrivateMessage', function (id, msg, username) {
    $('#privateMessages' + id).append('<li><b>' + username + '</b>: ' + msg + '</li>');
    AddNotification(id, username);
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
    HideAllExceptThis(id, username);
    socket.emit('startPrivateChat', id);
  } else {
    HideAllExceptThis(id, username);
    $('#privateChatButton' + id).attr('messageCount', 0);
    $('#privateChatButton' + id).text(username);
  }
});


function CreateNewChat(id, username) {
  var newId = 'pmForm' + id;
  var newButton = $('<button/>', { text: 'Send' });
  var newDiv = $('<div/>', {
    class: 'chatRoom',
    id: 'privateChatDiv' + id,
    hidden: 'hidden'
  });
  var newInput = $('<input/>', {
    id: 'pm' + id,
    placeholder: 'Write private message...',
    autocomplete: 'off'
  });
  var newUl = $('<ul/>', {
    id: 'privateMessages' + id,
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
  var checkButtons = $('.PrivateChatButton')

  // Add chat selection button
  var newRoomBtn = $('<button/>', {
    text: username,
    value: id,
    class: 'PrivateChatButtonFalse',
    id: 'privateChatButton' + id,
    'messageCount': 0,
    'userName': username
  });
  $('#chatSelection').append(newRoomBtn);

  //Add function for submitting new private messages
  $('#' + newId).submit(function () {
    var msg = $('#pm' + id).val();
    socket.emit('newPrivateMessage', id, msg);
    newUl.append('<li><b>You</b>: ' + msg + '</li>');
    $('#pm' + id).val('');
    AutoScroll(id);
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

$(document).on('click', '.PrivateChatButtonFalse', function (data) {
  var id = data.target.value;
  var username = data.target.getAttribute('userName');
  HideAllExceptThis(id, username);
  $('#privateChatButton' + id).attr('messageCount', 0);
  $('#privateChatButton' + id).text(username);
});

function HideAllExceptThis(id, username) {
  $('.PrivateChatButton').each(function (index, value) {
    value.className = 'PrivateChatButtonFalse';
  });
  $('.chatRoom').hide();
  $('#privateChatDiv' + id).toggle();
  $('#currentChatName').html('<p>Current Chat: <b>' + username + '</b></p>');
  document.getElementById('toggleGeneralButton').className = 'ToggleGeneralButtonFalse';
  document.getElementById('privateChatButton' + id).className = 'PrivateChatButton';
  AutoScroll(id);
}

function AutoScroll(id) {
  var scrollBody = $('body');
  var extendableContent = $("#privateMessages" + id);
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
  if ($('#privateChatButton' + id).hasClass('PrivateChatButtonFalse')) {
    var count = $('#privateChatButton' + id).attr('messageCount');
    count++;
    $('#privateChatButton' + id).attr('messageCount', count);
    $('#privateChatButton' + id).text(username + ' ' + count);
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