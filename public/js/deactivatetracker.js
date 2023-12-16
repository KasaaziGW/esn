var socket = io();
var _id = document.querySelector("#_id").textContent;
var eventId = `deactivated_${_id}`
socket.on(eventId, () => {
    alert("Your account has been deactivated. Please contact administrator");
    window.setTimeout(logout(), 15000); // logout the user after 15 seconds
});

function logout() {
    window.location.replace('http://localhost:4000/logout');
}
