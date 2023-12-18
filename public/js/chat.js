var socket = io();
$(() => {
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
  getMessages();

  socket.on("joined", (user) => {
    var fullname = document.querySelector("#fullname").textContent;
    // var fname = $("#fullname").text();
    // alert(`Server: ${user}, Fullname: ${fullname}, JFullname: ${fname}`);
    if (user == fullname) {
      $("#alert").val("");
      $("#alert").remove("p");
      $("#alert").append(
        "<p style='position:absolute;'><center><strong>You joined the chat.</strong></center></p>"
      );
    } else {
      $("#alert").text("");
      $("#alert").remove("p");
      $("#alert").append(
        `<p style='position:absolute;'><center><strong> ${user} joined the chat.</strong></center></p>`
      );
    }
    scrollContainer();
  });
});

// displaying message on the UI
function getMessages() {
  $.get("http://localhost:4000/fetchMessages", (messages) => {
    messages.forEach(addMessage);
  });
  scrollContainer();
}
socket.on("message", addMessage);
function addMessage(message) {
  var username = document.querySelector("#fullname").textContent;
  if (message.sender == username) {
    $("#messages").append(`<div id="messageContainer1">
                          <div id="messageHeader">
                          <div id="senderName">Me</div>
                          <div id="sentTime">${message.sentTime}</div>
                          </div>
                          <p>${message.message}</p>
                          </div>`);
  } else {
    $("#messages").append(`<div id="messageContainer">
      <div id="messageHeader">
      <div id="senderName">${message.sender}</div>
      <div id="sentTime">${message.sentTime}</div>
      </div>
      <p>${message.message}</p>
    </div>`);
  }
  scrollContainer();
}
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

// scrolling to the last message
function scrollContainer() {
  $("#messages").scrollTop($("#messages")[0].scrollHeight);
}

