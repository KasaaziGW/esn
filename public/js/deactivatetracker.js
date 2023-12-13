var socket = io();
var _id = document.querySelector("#_id").textContent;
var eventId = `deactivated_${_id}`
socket.on(eventId, () => {
    alert("Your account has been deactivated. Please contact administrator")
});
