var socket = io();
$(() => {
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

  $("#sendButton").click(() => {
    // alert(`${document.querySelector("#fullname").textContent} clicked me!`);
    var fullname = document.querySelector("#fullname").textContent;
    var sentMessage = $("#sendMessage").val();
    var currentDate = getCurrentTime();
    // var message1 = document.querySelector("#sendMessage").value;
    // alert(`Sender: ${fullname}\nMessage: ${message}\nTime: ${currentDate}`);
    var message = {
      sender: fullname,
      message: sentMessage,
      sentTime: currentDate,
    };
    saveMessage(message);
    $("#sendMessage").val("");
  });
});
// function to get the current date and time
function getCurrentTime() {
  var today = new Date();
  var currentDate = [
    today.getDate(),
    today.getMonth() + 1,
    today.getFullYear(),
  ];
  var currentTime = [today.getHours(), today.getMinutes(), today.getSeconds()];
  // converting from 24hours to 12hours format
  var suffix = currentTime[0] < 12 ? "AM" : "PM";
  currentTime[0] = currentTime[0] < 12 ? currentTime[0] : currentTime[0] - 12;
  // adding zero to the date or month in the currentDate object/array
  currentDate[0] = currentDate[0] < 10 ? "0" + currentDate[0] : currentDate[0];
  currentDate[1] = currentDate[1] < 10 ? "0" + currentDate[1] : currentDate[1];

  // adding zero for when hours, minutes, and/or seconds are not 0
  currentTime[0] = currentTime[0] < 10 ? "0" + currentTime[0] : currentTime[0];
  currentTime[1] = currentTime[1] < 10 ? "0" + currentTime[1] : currentTime[1];
  currentTime[2] = currentTime[2] < 10 ? "0" + currentTime[2] : currentTime[2];

  return currentDate.join("-") + " " + currentTime.join(":") + " " + suffix;
}

// sending a message to the server
function saveMessage(message) {
  $.post("http://localhost:4000/saveMessage", message);
}
