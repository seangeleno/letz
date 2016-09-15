function login() {
  // When loginbutton is clicked pass the event and post it then either execute or display error
  $("#loginSubmit").click(function(evt) {
    //prevents bubbling up the event chain
    evt.preventDefault()
    // POST request using AJAX
    $.post("/api/users/login", {
      email: $("#loginEmail").val(),
      password: $("#loginPassword").val()
    })
    // If AJAX post request succeeds (user is authenticated and a session is started), load map page.
    .done(function() {
      $("#container").load("/public/views/map.html", function(req, res) {
        // If map page loads, generate user map.
        if (res === "success") {
          console.log("Trying to generate map.")
          generateMap()
        // If map page fails to load, log the failure to console.
        } else if (res === "error") {
          console.log("Unable to load map.html.")
        }
      })
    })
    .fail(function() {
      console.log("Failed to authenticate user and start session.")
    })
  })
}
