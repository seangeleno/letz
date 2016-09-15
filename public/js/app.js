// Retrieve current user document and save to variable.
var currentUser;
// TODO: remove jQuery
$.get("/api/users/current", function(user) {
  currentUser = user;
});
// Get the name from db or fb
function getName(user) {
  var name = (user.local.first_name + " " + user.local.last_name) || user.facebook.name;
  return name
}
/* To load landing page if no current user, and map otherwise.*/
if (!currentUser) {
  $("#container").load("/public/views/landing.html", function(res, stat) {
    // If landing page loads, load login and signup buttons.
    if (stat === "success") {
      loadLoginSignup();
      // If landing page fails to load, log the failure to console.
    } else if (stat === "error") {
      console.log("Unable to load landing.html.")
    }
  })
} else {
  $("#container").load("/public/views/map.html", function(res, stat) {
    // If map page loads, generate user map.
    if (stat === "success") {
      generateMap();
      // If map page fails to load, log the failure to console.
    } else if (stat === "error") {
      console.log("Unable to load map.html.")
    }
  })
}
