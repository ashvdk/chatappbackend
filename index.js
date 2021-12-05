var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http, {
    cors: {
      origin: ["https://ashvdk.github.io", "http://localhost:3000", "http://localhost:8100"],
    },
});


const users = {};

app.get('/', (req, res) => {
  io.emit('get user', users);
  res.send('<h1>We are here</h1>');
});

const crypto = require("crypto");
const { Server } = require('http');
const randomId = () => crypto.randomBytes(8).toString("hex");

const { InMemorySessionStore } = require("./sessionStore");
const sessionStore = new InMemorySessionStore();


io.use((socket, next) => {
  console.log("Came to the server");
    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
      // find existing session
      const session = sessionStore.findSession(sessionID);
      if (session) {
        socket.sessionID = sessionID;
        socket.userID = session.userID;
        socket.username = session.username;
        return next();
      }
    }
    const username = socket.handshake.auth.username;
    if (!username) {
      return next(new Error("invalid username"));
    }
    // create new session
    socket.sessionID = username;
    socket.userID = randomId();
    socket.username = username;
    next();
});



io.on("connection", (socket) => {

  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });
  console.log("came to Server");
  socket.join(socket.userID);
  io.to(socket.userID).emit("send_connected_user_info", {sessionID: socket.sessionID,userID: socket.userID,username: socket.username});
  //io.to(socket.userID).emit("send_connected_user_info", "users");

  // for (let [id, socket] of io.of("/").sockets) {
  //   const { username } = socket.handshake.auth;
    
  //     users[username] = {
  //       socketid: id,
  //       username,
  //     }
    
  //   console.log(users[username]);
  //   io.to(users[username].socketid).emit("send_connected_user_info", users[username]);
  // }
  

  socket.on("get user", ({searchUsername, transmitToSocketID}) => {
    //console.log(searchUsername, transmitToSocketID);
    const sessionID = searchUsername;
    const user = {};
    if (sessionID) {
      // find existing session
      const session = sessionStore.findSession(sessionID);
      if (session) {
        user['sessionID'] = sessionID;
        user['userID'] = session.userID;
        user['username'] = session.username;
      }
    }
    console.log(user);
    //io.to(transmitToSocketID).emit("get user", users[searchUsername]);
    io.to(transmitToSocketID).emit("get user", user);
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