var currentUser;
var socket;
// If browser supports geolocation, display map centered on current location; otherwise, prompt user to consent to location sharing.
function generateMap() {
  // Retrieve current user document and save to variable.
  $.get("/api/users/current")
  .done(function(user) {
     currentUser = user
    // If / else - supports geolocation or doesn't
    if (navigator.geolocation) {
      // Browser supports geolocation.
      console.log("Geolocation supported.")

      var buildMap = new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }

          // Connection to socket.io.
          socket = io()

          socket.on("connect", function() {
            // Update current user document with current location and socket ID.
            $.ajax({
              url: "/api/users/" + currentUser._id,
              method: "PUT",
              data: {currentLocation: pos, socketId: socket.id}
            })
            .done(function(updatedUser) {
              currentUser = updatedUser

              // Style of map.
              var styledMap = new google.maps.StyledMapType([
                {
                  featureType: 'road.local',
                  elementType: 'labels.text',
                  stylers: [
                    {visibility: 'off'}
                  ]
                }, {
                  featureType: 'road.arterial',
                  elementType: 'labels.text',
                  stylers: [
                    {visibility: 'on'}
                  ]
                }, {
                  featureType: 'road',
                  stylers: [
                    {saturation: -100}
                  ]
                }, {
                  featureType: 'road.highway',
                  stylers: [
                    {visibility: 'off'}
                  ]
                }, {
                  featureType: 'landscape.man_made',
                  stylers: [
                    {color: '#bfbfbf'}
                  ]
                }, {
                  featureType: 'water',
                  stylers: [
                    {saturation: -20}
                  ]
                }
              ])

              // User map.
              var map = new google.maps.Map(document.getElementById('map'), {
                center: pos,
                draggable: true,
                keyboardShortcuts: true,
                scrollwheel: false,
                zoomControl: true,
                zoom: 13,
                mapTypeControlOptions: {
                  mapTypeIds: ['styledMap']
                },
                mapTypeControl: false,
              })

              map.mapTypes.set('styledMap', styledMap)
              map.setMapTypeId('styledMap')

              google.maps.event.addListenerOnce(map, "idle", function() {
                resolve(map)
              })
            })
          })
        })
      })

      buildMap.then(function(map) {
        console.log(socket)
        receiveChatRequestsAndInvites()

        // Periodically retrieve user's current location.
        navigator.geolocation.watchPosition(function(position) {
          var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }

          // Update current user document location with current location.
          $.ajax({
            url: "/api/users/" + currentUser._id,
            method: "PUT",
            data: {currentLocation: pos}
          })
          .done(function(updatedUser) {
            currentUser = updatedUser

            // To recenter the map at the current user's current location.
            map.setCenter(pos)

            // To calculate user's age.
            function getAge(user) {
              var today = new Date()
              var dob = new Date(user.local.dob || user.facebook.dob)
              var age = today.getFullYear() - dob.getFullYear()
              var monthDiff = today.getMonth() - dob.getMonth()
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--
              }
              return age
            }

            // To calculate similarity of user's age to current user's age.
            function getSimAge(user) {
              var simAge
              if ((getAge(user) >= getAge(currentUser) - 10) && (getAge(user) <= getAge(currentUser) + 10)) {
                simAge = 1
              } else {
                simAge = 0
              }
              return simAge
            }

            // To calculate similarity of user's declared status to current user's declared status.
            function getSimStatus(user) {
              var simStatus
              if (user.currentStatus === currentUser.currentStatus) {
                simStatus = 1
              } else {
                simStatus = 0
              }
              return simStatus
            }

            // To calculate similarity of user to current user in terms of age and declared status.
            function getSim(user) {
              var sim = getSimAge(user) + getSimStatus(user)
              return sim
            }

            // To assign url for marker icon according to corresponding user's similarity to current user in terms of age and declared status.
            function getMarkerIcon(user) {
              var sim = getSim(user)
              var icon
              if (sim === 0) {
                icon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
              } else if (sim === 1) {
                icon = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
              } else if (sim === 2) {
                icon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
              }
              return icon
            }

            // To color marker based on similarity in terms of age and declared status.
            function colorizeMarker(marker) {
              var icon = getMarkerIcon(marker.user)
              marker.setIcon(icon)
            }

            // To add marker representing user on map.
            function addMarker(map, user) {
              // If no chats currently open, only display button to start chat; otherwise, display buttons to start chat and invite user to an open chat.
              var buttons = "<button class='startChat' type='button'>CHAT</button>"
              if (chats.length > 0) {
                buttons += "<button class='inviteToChat' type='button'>INVITE TO CHAT</button>"
              }

              var marker = new google.maps.Marker({
                map: map,
                position: user.currentLocation,
                title: getName(user),
                infoWindowContent: "<div class='infoWindow'>" + "<p class='infoName'>" + getName(user) + "</p><br>" + "<p class='infoAge'" + getAge(user) + "</p><br>" + "<p class='infoStatus'>" + user.currentStatus + "</p><br>" + buttons + "</div>",
                user: user
              })
              if (currentUser.currentStatus) {
                colorizeMarker(marker)
              } else {
                marker.setIcon("http://maps.google.com/mapfiles/ms/icons/purple-dot.png")
              }
              return marker
            }

            var displayMarkers = new Promise(function(resolve, reject) {
              // To put marker at current user's current location.
              var currentUserMarker = addMarker(map, currentUser)
              // AJAX request to retrieve all user documents.
              $.get("/api/users")
              // If AJAX request to retrieve all user documents succeeds, represent each user (apart from the current user) who has a value for current location and is currently located within map area with a market on map.
              .done(function(users) {
                // Array to hold all user markers.
                userMarkers = []
                for (u in users) {
                  user = users[u]
                  if (user.currentLocation && user._id !== currentUser._id) {
                    // Turn user's current coordinates into Google LatLng object.
                    currentLocation = new google.maps.LatLng(user.currentLocation.lat, user.currentLocation.lng)
                    if (map.getBounds().contains(currentLocation)) {
                      var userMarker = addMarker(map, user)
                      userMarkers.push(userMarker)
                    }
                  }
                }
                resolve(userMarkers)
              })
            })

            // To display info window containing user information.
            function displayInfo(map, marker) {
              var infoWindow = new google.maps.InfoWindow({
                content: marker.infoWindowContent
              })
              infoWindow.open(map, marker)
              return infoWindow
            }

            // After all user markers are placed on map, build event listener.
            displayMarkers.then(function(userMarkers) {
              // To display user information when marker is clicked.
              for (var m in userMarkers) {
                var userMarker = userMarkers[m]
                userMarker.addListener("click", function() {
                  var userMarker = this
                  var infoWindow = displayInfo(map, userMarker)

                  // AJAX request to open chat window when chat button is clicked.
                  $(".startChat").click(function(event) {
                    event.preventDefault()
                    sendChatRequest(userMarker, infoWindow)
                  })

                  $(".inviteToChat").click(function(event) {
                    event.preventDefault()
                    var chatOptions = ""
                    for (var c in chats) {
                      var chat = chats[c]
                        , users = [chat.users.requestingUser, chat.users.targetUser]
                        , othersInChat = []

                      chat.users.invitedUsers.forEach(function(invitedUser) {
                        users.push(invitedUser)
                      })

                      for (var u in users) {
                        var user = chat.users[u]
                        if (user._id !== currentUser._id) {
                          othersInChat.push(getName(user))
                        }
                      }

                      chatOptions += "<option class='chatOptions' value='" + chat.id + "'>" + othersInChat.join(", ") + "</option>"
                    }

                    var chatSelectionPrompt = "<b>Which chat?</b><br>" + "<form id='chatForm'>" + "<select id='chatDropdown' form='chatForm' required='required'>" + chatOptions + "</select>" + "</form>"

                    infoWindow.setContent(chatSelectionPrompt)

                    google.maps.event.addListenerOnce(infoWindow, "content_changed", function() {
                      $("#chatDropdown").change(function() {
                        var chatId = $(this).options[$(this).selectedIndex].val()
                        inviteToChat(userMarker, infoWindow, chatId)
                      })
                    })
                  })
                })
              }
            })
          })
        })

        return map
      })

      .then(function(map) {
        var userMarkers = map.markers

        // HTML for overlay that prompts user to declare status.
        var statusOverlay = "<div id='statusOverlay'>" + "<p id='statusPrompt'>What are you in the mood for?</p>" + "<form id='statusForm'>" + "<select id='statusDropdown' form='statusForm' required='required'>" + "<option class='statusOptions' value='food'>Food</option>" + "<option class='statusOptions' value='coffee'>Coffee/Tea</option>" + "<option class='statusOptions' value='movie'>Movie</option>" + "<option class='statusOptions' value='stroll'>Stroll</option>" + "<option class='statusOptions' value='exercise'>Exercise</option>" + "<option class='statusOptions' value='recreation'>Recreation</option>" + "<option class='statusOptions' value='shopping'>Shopping</option>" + "<option class='statusOptions' value='sightseeing'>Sightseeing</option>" + "<option class='statusOptions' value='party'>Party</option>" + "<option class='statusOptions' value='concert'>Concert</option>" + "</select>" + "</form>" + "</div>"

        // To display status overlay in browser.
        $("#map").append(statusOverlay)

        var statusDropdown = $("#statusDropdown")

        // If status selected, update current user's current status with selection, remove status overlay from browser, and colorize user markers according to similarities in terms of age and declared status.
        statusDropdown.change(function() {
          var status = $(this).options[$(this).selectedIndex].val()
          console.log(status)
          $.ajax({
            url: "/api/users/" + currentUser._id,
            method: "PUT",
            data: {currentStatus: status}
          })
          .done(function(updatedUser) {
            currentUser = updatedUser
            $("#statusOverlay").remove()
            for (var m in userMarkers) {
              var userMarker = userMarkers[m]
              colorizeMarker(userMarker)
            }
          })
          .fail(function() {
            console.log("Failed to update user document current status.")
          })
        })
      })
    } else {
      // Browser doesn't support geolocation.
      $("#map").append("<div id='geolocationPrompt'>To continue, please consent to location sharing in your browser.</div>")
      console.log("Geolocation not supported.")
    }
  })
}
