var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


//MONGO DB BELOW

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/myproject';
// Use connect method to connect to the server
MongoClient.connect(url, function (err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
});

var insertDocuments = function (db, callback, data) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Insert some documents
  collection.insertOne(data, function (err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    assert.equal(1, result.ops.length);
    console.log("Inserted" + data + "into the collection");
    callback(result);
  });
}

var findDocuments = function (db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Find some documents
  collection.find({}).toArray(function (err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    console.log(docs)
    callback(docs);
  });
}

var updateDocument = function (db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Update document where a is 2, set b equal to 1
  collection.updateOne({ a: 2 }
    , { $set: { b: 1 } }, function (err, result) {
      assert.equal(err, null);
      assert.equal(1, result.result.n);
      console.log("Updated the document with the field a equal to 2");
      callback(result);
    });
}

var removeDocument = function (db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Delete document where a is 3
  collection.deleteOne({ a: 3 }, function (err, result) {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log("Removed the document with the field a equal to 3");
    callback(result);
  });
}

//MONGO DB ABOVE

var onlineUsers = [];

app.use(express.static(__dirname + '/app'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  var isLoggedIn = false;
  socket.on('login', function (username) {
    if (isLoggedIn) {
      return;
    }
    // socket.join(socket.id);
    socket.username = username;
    onlineUsers.push({ username: socket.username, socketId: socket.id })
    var data = [{ username: socket.username }]
    MongoClient.connect(url, function (err, db) {
      assert.equal(null, err);
      insertDocuments(db, function () {
        db.close();
      },  data)
    });

    isLoggedIn = true;
    io.emit('joined', { onlineUsers: onlineUsers, message: " connected", username: socket.username })
  });

  socket.on('chat message', function (msg) {
    socket.broadcast.emit('chat message', { username: socket.username, message: ": " + msg });
  });

  socket.on('disconnect', function () {
    if (!isLoggedIn) {
      return;
    }
    let index = onlineUsers.findIndex(function (element, index, array) {
      return element.socketId == socket.id
    });
    if (index !== -1)
      onlineUsers.splice(index, 1);

    io.emit('disconnect', { username: socket.username, message: " disconnected" });
  });

  socket.on('typing', function () {
    socket.broadcast.emit('typing', { username: socket.username, message: " is typing..." });
  });

  socket.on('stoppedTyping', function () {
    socket.broadcast.emit('stoppedTyping', socket.username)
  })

  socket.on('startPrivateChat', function (id) {
    socket.broadcast.to(id).emit('startPrivateChat', socket.id, socket.username);
  });

  socket.on('newPrivateMessage', function (id, msg) {
    socket.broadcast.to(id).emit('newPrivateMessage', socket.id, msg, socket.username);
  });
});

http.listen(5000, function () {
  console.log('listening on *:5000');
});