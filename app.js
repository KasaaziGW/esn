const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const PORT = 3000;

const app = express();
app.use(express.static("public")); // points to where the static files are.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // specifying the templating engine

//
// connecting to the database
const dbUrl = "mongodb+srv://umumis:umu123@cluster0.odksibj.mongodb.net/";
mongoose.connect(dbUrl, (err) => {
  if (err) console.log(`Couldn't connect to MongoDB \n${err}.`);
  else console.log("Succesfully connected to MongoDB.");
});

// loading the login page when the user visits the '/'
app.get("/", (request, response) => {
  response.render("login");
});

app.get("/register", (request, response) => {
  response.render("register");
});
// starting the server
app.listen(PORT, () => {
  console.log("The server is up and running on port 3000.");
});
