// Packages setup.
var express = require("express")
  , app = express()
  , mongoose = require("mongoose")
  , flash = require("connect-flash")
  , logger = require("morgan")
  , bodyParser = require("body-parser")
  , session = require("express-session")
  , passport = require("passport")
  , passportConfig = require("./config/passport.js")
  , http = require("http")
    // To allow HTTP to be bound to same port as WebSockets.
  , httpServer = http.Server(app)
    // To have provider of WebSockets connection to client listen at same port as HTTP.
  , io = require("socket.io")(httpServer)
  , yelp = require('./config/yelp.js')

// Middleware.
app.use(logger("dev"))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(session({
    secret: process.env.LETZ_SECRET,
  resave: true,
  saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use("/public", express.static(__dirname + "/public"))

// Database connection.
mongoose.connect("mongodb://tripleS:uiop3!map@ds057214.mongolab.com:57214/letz-app")

// API routes.
var userRoutes = require("./routes/userRoutes.js")
app.use("/api/users", userRoutes)

// Frontend routes.
app.get("*", function(req, res) {
  res.sendFile(__dirname + "/public/views/index.html")
})

// WebSocket callbacks.
io.on("connection", function(socket) {
  console.log("A user connected.")
  socket.on("chat request", function(data) {
    var chatId = data.users.requestingUser.socketId + data.users.targetUser.socketId
    io.to(data.users.targetUser.socketId).emit("chat request", data)
  })
  socket.on("chat invite", function(data) {
    io.to(data.invitedUser.socketId).emit("chat invite", data)
  })
  socket.on("accepted request", function(data) {
    socket.join(data.chatId)
    io.to(data.users.requestingUser.socketId).emit("accepted request", data)
  })
  socket.on("accepted invite", function(data) {
    socket.join(data.chatId)
    io.to(data.chatId).emit("someone joined chat", data.joiningUser)
  })
  socket.on("join chat", function(data) {
    socket.join(data.chatId)
  })
  socket.on("chat message", function(data) {
    io.to(data.chatId).emit("update chat", data)
	})
  socket.on("left chat", function(data) {
    socket.leave(data.chatId)
    io.to(data.chatId).emit("someone left chat", data.leavingUser)
  })
  socket.on("disconnect", function() {
    console.log("User disconnected.")
  })
})

// // YELP API!
// app.post("/api/recommendations", function(req, res) {
//   yelp.search({term: req.body.term, limit: 1, ll: req.body.ll})
//     .then(function(data) {
//       // for (var i = 0; i < data.businesses.length; i++){
//       //   console.log(data.businesses[i].name);
//       //   console.log(data.businesses[i].url);
//       //   console.log(data.businesses[i].location);
//       // }
//       // console.log(data.businesses)
//       res.json(data.businesses)
//     })
//   .catch(function (err) {
//     console.log(err)
//   })
// })

// Environment port.
var port = process.env.PORT || 3000

httpServer.listen(port, function() {
  console.log("Server running on port " + port + ".")
})
