var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http, {
    cors: {
      origin: ["https://ashvdk.github.io", "http://localhost:3000"],
    },
});


const users = {};

app.get('/', (req, res) => {
  io.emit('get user', users);
  res.send('<h1>We are here</h1>');
});

io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
      return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
});



io.on("connection", (socket) => {
  socket.removeAllListeners();
  
  //console.log(io.of("/").sockets);
  for (let [id, socket] of io.of("/").sockets) {
    const { username } = socket.handshake.auth;
    // if(users[username]){

    // }
    // else {
      users[username] = {
        socketid: id,
        username,
      }
    //}
    console.log(users[username]);
    io.to(users[username].socketid).emit("send_connected_user_info", users[username]);
  }
  
  
  // socket.broadcast.emit("user connected", {
  //   //this will emit to all the connected users except the one who connected
  //   userID: socket.id,
  //   username: socket.username,
  // });
  socket.on("get user", ({searchUsername, transmitToSocketID}) => {
    console.log(searchUsername, transmitToSocketID);
    io.to(transmitToSocketID).emit("get user", users[searchUsername]);
  });
  socket.on("typing", ({transmitToSocketID}) => {
    console.log(transmitToSocketID);
    io.to(transmitToSocketID).emit("typing");
  });
  // socket.on("private message", ({ content, to }) => {
  //   console.log(content, to);
  //   socket.to(to).emit("private message", {
  //     content,
  //     from: socket.id,
  //   });
  // });
});
var port = process.env.PORT || 8080;
http.listen(port, () => {
    console.log(`listening on *: ${port}`);
});