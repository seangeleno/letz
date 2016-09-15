/* Packages setup.*/
var express = require("express");
var app = express();
var mongoose = require("mongoose");
var flash = require("connect-flash");
var logger = require("morgan");
var bodyParser = require("body-parser");
var session = require("express-session");
var passport = require("passport");
var passportConfig = require("./config/passport.js");
var http = require("http");
// To allow HTTP to be bound to same port as WebSockets.
var httpServer = http.Server(app);
// To have provider of WebSockets connection to client listen at same port as HTTP.
var io = require("socket.io")(httpServer);
var webSocketsProvider = require("socket.io").listen(httpServer);

// Middleware.
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.LETZ_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use("/public", express.static(__dirname + "/public"));

// Database connection.
//mongoose.connect("mongodb://tripleS:uiop3!map@ds057214.mongolab.com:57214/letz-app");
mongoose.connect("mongodb://localhost:27017/letz");

// API routes.
var userRoutes = require("./routes/userRoutes.js");
app.use("/api/users", userRoutes);
// Frontend routes.
app.get("*", function(req, res) {
  res.sendFile(__dirname + "/public/views/index.html")
});

// WebSocket callbacks.
io.on("connection", function(socket) {
  console.log("A user connected.");
  socket.on("chat request", function(data) {
    var chatId = data.users.requestingUser.socketId + data.users.targetUser.socketId;
    io.to(data.users.targetUser.socketId).emit("chat request", data)
  });
  socket.on("chat invite", function(data) {
    io.to(data.invitedUser.socketId).emit("chat invite", data)
  });
  socket.on("accepted request", function(data) {
    socket.join(data.chatId);
    io.to(data.users.requestingUser.socketId).emit("accepted request", data)
  });
  socket.on("accepted invite", function(data) {
    socket.join(data.chatId);
    io.to(data.chatId).emit("someone joined chat", data.joiningUser)
  });
  socket.on("join chat", function(data) {
    socket.join(data.chatId)
  });
  socket.on("chat message", function(data) {
    io.to(data.chatId).emit("update chat", data)
  });
  socket.on("left chat", function(data) {
    socket.leave(data.chatId);
    io.to(data.chatId).emit("someone left chat", data.leavingUser)
  });
  socket.on("disconnect", function() {
    console.log("User disconnected.")
  })
});

// Environment port.
var port = process.env.PORT || 3000;

httpServer.listen(port, function() {
  console.log("Server running on port " + port + ".")
});
