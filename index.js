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
  removeDocument(db, function () {
    findDocuments(db, function () {
      db.close();
    })
  })
});

// var insertDocuments = function (db, callback, data) {
//   // Get the documents collection
//   var collection = db.collection('documents');
//   // Insert some documents
//   collection.insertOne(data, function (err, result) {
//     assert.equal(err, null);
//     assert.equal(1, result.result.n);
//     assert.equal(1, result.ops.length);
//     console.log("Inserted" + data + "into the collection");
//     callback(result);
//   });
// }

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
  collection.remove({}, function (err, result) {
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

  socket.on('login', function (username, password) {
    if (isLoggedIn) {
      return;
    }
    // socket.join(socket.id);
    
    var data = { username: username, socketId: socket.id, password: password };
    var existingUser = false;
    var itemsProcessed = 0;
    var loginMessage = '';
    MongoClient.connect(url, function (err, db) {
      var collection = db.collection('documents');
      var findAll = function (db, callback) {
        var collection = db.collection('documents');

        collection.find({}).toArray(function (err, result) {
          if (err) {
            console.log("error find")
          } else if (result.length) {
            result.forEach(function (element) {
              if (element.username === data.username) {
                existingUser = true;

                if (element.password === password) {
                  onlineUsers.push(data);
                  isLoggedIn = true;
                  socket.emit('successful');
                  socket.username = username;
                  io.emit('joined', { onlineUsers: onlineUsers, message: " connected", username: socket.username });
                }
                else {
                  loginMessage = 'Wrong password';
                  socket.emit('login', loginMessage);
                }
                console.log(existingUser);
                console.log("User already exists");
                return;
              }
              itemsProcessed++;
              if (itemsProcessed == result.length)
                callback();
            });
          } else if (result.length === 0) {
            console.log("No users");
            callback();
          }
        });
      }

      findAll(db, function () {
        console.log('User existing status ' + existingUser)
        if (!existingUser) {
          collection.insert([data], function (err, result) {
            isLoggedIn = true;
            socket.username = username;
            onlineUsers.push(data);
            socket.emit('successful');
            io.emit('joined', { onlineUsers: onlineUsers, message: " connected", username: socket.username });
          });
        }
        db.close();
      })
    });
  });

  socket.on('chat message', function (msg) {
    socket.broadcast.emit('chat message', { username: socket.username, message: ": " + msg });
    console.log(socket.id)
  });

  socket.on('disconnect', function () {
    if (!isLoggedIn) {
      return;
    }
    let index = onlineUsers.findIndex(function (element, index, array) {
      return element.username == socket.username
    });
    console.log(index);
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