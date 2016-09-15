function loadLoginSignup() {
  $("#buttonsForms").load("/public/views/partials/loginSignup.html", function(req, res) {
    if (res === "success") {
      // Click on Login Button Behavior
      $("#loginButton").click(function() {
        $("#buttonsForms").load("/public/views/partials/login.html", function(req, res) {
          if (res === "success") {
            login()
          } else if (res === "failure") {
            console.log("Unable to load login form.")
          }
        })
      });
      // Click on Signup Button Behavior
      $("#signupButton").click(function() {
        $("#buttonsForms").load("/public/views/partials/signup.html", function(req, res) {
          if (res === "success") {
           signup()
          } else if (res === "failure") {
            console.log("Unable to load signup form.")
          }
        })
      })
    } else if (res === "failure") {
      console.log("Unable to load login and signup buttons.")
    }
  })
}
