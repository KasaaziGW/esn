const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const flashMessage = require("connect-flash");
const sessions = require("express-session");
const PORT = 4000;

const app = express();
app.use(express.static("public")); // points to where the static files are.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // specifying the templating engine

app.use(
  sessions({
    secret: "esn2023",
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flashMessage());
// setting up a middleware for send all flash messages
app.use(function (request, response, next) {
  response.locals.message = request.flash();
  next();
});
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
  // response.render("register", { error: request.flash("error") });
  response.render("register");
});

// Registering a user
app.post("/userRegister", (request, response) => {
  // getting the data from the user
  let email = request.body.email;
  let fullname = request.body.fullname;
  let pswd = request.body.password;
  let cpswd = request.body.confirmpassword;
  if (pswd != cpswd) {
    // console.log(`${pswd} is not the same as ${cpswd}`);
    // console.log("Entered passwords do not match!");
    // send an error message
    request.flash("error", "Entered passwords do not match!");
    // redirect the user
    response.redirect("/register");
  } else {
    // check if the user already exists
    // encrypt the password
  }
});
// starting the server
app.listen(PORT, () => {
  console.log("The server is up and running on port 4000.");
});
