var socket = io();
socket.on("joined", (user) => {
  var fullname = document.querySelector("#fullname").textContent;
  // var fname = $("#fullname").text();
  // alert(`Server: ${user}, Fullname: ${fullname}, JFullname: ${fname}`);
  if (user == fullname) {
    $("#messages").append(
      "<p><center><strong>You joined the chat.</strong></center></p>"
    );
  } else {
    $("#messages").append(
      `<p><center><strong> ${user} joined the chat.</strong></center></p>`
    );
  }
});
