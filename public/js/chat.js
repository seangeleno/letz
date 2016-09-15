var chats = [];
// Generate the Chat
function generateChat(data) {
  var chatId = data.chatId;
  var chat = getChat(chatId);
  var chatWindow = "<div class='chats' id='" + chatId + "'>" + "<ul class='messages'></ul>" + "<form class='sendMessage' action=''>" + "<input class='newMessages' autocomplete='off' /><button>Send</button>" + "</form>" + "</div>";

  chats.push({
    id: data.chatId,
    users: data.users
  });

  $("#container").append(chatWindow);

  $("#" + chatId).dialog();

  // To send to server a message containing user chat message and chat window ID when send button clicked.
  $(".sendMessage").submit(function(event) {
    var message = {
      sender: currentUser,
      body: $(this).children(".newMessages").val(),
      chatId: chatId
    };
    event.preventDefault();
    socket.emit("chat message", message);
    $(this).children(".newMessages").val("")
  });

  socket.on("update chat", function(data) {
    $(".chats[id='" + data.chatId + "'] .messages").append("<li>" + "<b>" + getName(data.sender) + "</b>" + " " + data.body + "<br>")
  });

  $("#" + chatId).on("dialogueclose", function() {
    socket.emit("left chat", {
      leavingUser: currentUser,
      chatId: chatId
    })
  });

  socket.on("someone joined chat", function(user) {
    chat.invitedUsers.push(user);
    $(".chats[id='" + data.chatId + "'] .messages").append("<li>" + "<b>" + getName(user) + "</b>" + " has joined the chat.")
  });

  socket.on("someone left chat", function(user) {
    $(".chats[id='" + data.chatId + "'] .messages").append("<li>" + "<b>" + getName(user) + "</b>" + " has left the chat.")
  })
}
// ID Chat
function getChat(chatId) {
  var identifiedChat;
  for (var c in chats) {
    var chat = chats[c];
    if (chat.id === chatId) {
      identifiedChat = chat
    }
  }
  return identifiedChat
}
// Receive Chat Requests
function receiveChatRequestsAndInvites() {
  socket.on("chat request", function(data) {
    var requestingUser = data.users.requestingUser;
    var chatRequest = "<div class='chatRequests'>" + "<p>" + getName(requestingUser) + " would like to chat." + "</p>" + "<button class='acceptChatRequest' type='button'>ACCEPT</button>" + "</div>";
    // Appending can be refactored to vanilla js, ecmas6
    $("#container").append(chatRequest);
    // Behavior for accepting chat request - can refactor to vanilla js
    $(".acceptChatRequest").click(function(event) {
      event.preventDefault();
      socket.emit("accepted request", data);
      generateChat(data);
    })
  });

  socket.on("chat invite", function(data) {
    var invitingUser = data.invitingUser;
    var chatInvite = "<div class='chatInvites'>" + "<p>" + getName(invitingUser) + " has invited you to a chat." + "</p>" + "<button class='acceptChatInvite' type='button'>ACCEPT</button>" + "</div>";

    $("#container").append(chatInvite);

    $(".acceptChatInvite").click(function(event) {
      event.preventDefault();
      socket.emit("accepted invite", {
        joiningUser: currentUser,
        chatId: chatId
      });
      generateChat({
        chatId: data.chatId,
        users: data.users
      })
    })
  })
}
// Invite to chat
function inviteToChat(userMarker, infoWindow, chatId) {
  var chat = getChat(chatId);
  var invitedUser = userMarker.user;
  var sentInvite = "Invitation sent to " + getName(invitedUser) + ".";

  infoWindow.setContent(sentInvite);
  socket.emit("chat invite", {
    users: chat.users,
    chatId: chatId,
    invitedUser: invitedUser,
    invitingUser: currentUser
  });
  socket.on("accepted invite", function(data) {
    infoWindow.close()
  })
}
// Send Chat Requests
function sendChatRequest(userMarker, infoWindow) {
  var targetUser = userMarker.user;
  var sentRequest = "Chat request sent to " + getName(targetUser) + ".";

  infoWindow.setContent(sentRequest);
  socket.emit("chat request", {
    users: {
      targetUser: targetUser,
      requestingUser: currentUser,
      invitedUsers: []
    },
    chatId: currentUser.socketId + targetUser.socketId
  });
  socket.on("accepted request", function(data) {
    socket.emit("join chat", data);
    infoWindow.close();
    generateChat(data)
  })
}
