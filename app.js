const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const flashMessage = require("connect-flash");
const sessions = require("express-session");
const { Citizen } = require("./models/Citizen");
const bcrypt = require("bcryptjs");
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
// creating a global session variable
var session;
// connecting to the database
const dbUrl = "mongodb+srv://umumis:umu123@cluster0.odksibj.mongodb.net/";
mongoose.connect(dbUrl, (err) => {
  if (err) console.log(`Couldn't connect to MongoDB \n${err}.`);
  else console.log("Succesfully connected to MongoDB.");
});

// loading the login page when the user visits the '/'
app.get("/", (request, response) => {
  session = request.session;
  if (session.userId && session.fullname) response.redirect("/chatroom");
  else response.render("login");
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
    Citizen.findOne({ username: email }).then((user) => {
      // if the user exists, return an error and reload the page
      if (user) {
        request.flash(
          "error",
          `${user.fullname} already exists! Use a different email.`
        );
        response.redirect("/register");
      } else {
        // create account for the user
        // encrypt the password
        // var hashedPasswd = bcrypt.hash(pswd, 10);
        bcrypt.hash(pswd, 10, (err, hashedPassword) => {
          if (err) {
            request.flash("error", `Error while hashing password ${err}`);
            response.redirect("/register");
          }
          // create an object of the model
          let citizen = new Citizen({
            username: email,
            fullname: fullname,
            password: hashedPassword,
          });
          // adding the citizen to the database
          citizen.save((err) => {
            if (err) {
              request.flash("error", `Error while adding citizen ${err}`);
              response.redirect("/register");
            } else {
              request.flash(
                "success",
                `${fullname} successfully added to the system.`
              );
              response.redirect("/register");
            }
          });
        });
      }
    });
  }
});
// code for logging into the system
app.post("/citizenLogin", (request, response) => {
  let username = request.body.email;
  let pswd = request.body.password;
  // check that the user exists
  Citizen.findOne({ username: username })
    .then((userInfo) => {
      if (userInfo) {
        // user exists, check the password
        const hashedPassword = userInfo.password;
        bcrypt.compare(pswd, hashedPassword).then((result) => {
          if (result) {
            session = request.session;
            session.userId = userInfo.username;
            session.fullname = userInfo.fullname;
            response.redirect("/chatroom");
          } else {
            request.flash("error", "Invalid Username or Password combination!");
            response.redirect("/");
          }
        });
      } else {
        request.flash("error", "Citizen not found in the system!");
        response.redirect("/");
      }
    })
    .catch((err) => {
      request.flash("error", `Error while logging in ${err}`);
      response.redirect("/");
    });
});
// loading the chatroom
app.get("/chatroom", (request, response) => {
  session = request.session;
  // console.log(`User ID: ${session.userId}\nFullname: ${session.fullname}`);
  if (session.userId && session.fullname) {
    response.render("chatroom", {
      data: {
        userid: request.session.userId,
        fullname: request.session.fullname,
      },
    });
  } else response.redirect("/");
});
app.get("/logout", (request, response) => {
  request.session.destroy();
  response.redirect("/");
});
// starting the server
app.listen(PORT, () => {
  console.log("The server is up and running on port 4000.");
});
