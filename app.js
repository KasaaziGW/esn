const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const flashMessage = require("connect-flash");
const sessions = require("express-session");
const { Citizen } = require("./models/Citizen");
const { Message } = require("./models/Message");
const bcrypt = require("bcryptjs");

const PORT = 4000;

const app = express();
const httpServer = require("http").Server(app);
const socketIO = require("socket.io")(httpServer);
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
var session, uname;
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
            response.redirect("/home");
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
// loading the dashboard
app.get("/home", (request, response) => {
  session = request.session;
  // console.log(`User ID: ${session.userId}\nFullname: ${session.fullname}`);
  if (session.userId && session.fullname) {
    response.render("dashboard", {
      data: {
        userid: request.session.userId,
        fullname: request.session.fullname,
      },
    });
  } else response.redirect("/");
});

//loading the chatroom
app.get("/chatroom", (request, response) => {
  session = request.session;
  uname = request.session.fullname;
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

// saving the message to the database
app.post("/saveMessage", (request, response) => {
  // create an object from the model
  var message = new Message(request.body);
  // saving the message to the db
  message.save((err) => {
    if (err) {
      console.log(`Error while saving the message. \n Error: ${err}`);
      response.sendStatus(500);
    } else {
      socketIO.emit("message", message);
      response.sendStatus(200);
    }
  });
});
// fetching messages from the database
app.get("/fetchMessages", (request, response) => {
  //retrieving the messages from the db
  Message.find({}, (err, messages) => {
    if (err) console.log(`Error while fetching messages.\nError: ${err}`);
    else response.send(messages);
  });
});
// emitting a message when a user joins the chat
socketIO.on("connect", (socket) => {
  socketIO.emit("joined", uname);
  console.log(`${uname} has joined`);
});
app.get('/searchctz', async (req, res) => {
  session = req.session;
  uname = req.session.fullname;
  try {
      const page = parseInt(req.query.page) || 1;
      const perPage = 10;

      const citizens = await Citizen.find()
          .skip((page - 1) * perPage)
          .limit(perPage);
       if (session.userId && session.fullname) {
      res.render('searchctz.ejs', { citizens,messages: req.flash(),data: {
        userid: req.session.userId,
        fullname: req.session.fullname,
      }, });
    }
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

// Route to handle search with pagination
app.get('/search', async (req, res) => {
  session = req.session;
  uname = req.session.fullname;
  const { username, page } = req.query;
  const perPage = 5;

  try {
    const { username, page } = req.query;
    const perPage = 5;

    if (!req.session.userId || !req.session.fullname) {
        req.flash('error', 'Please log in to perform a search.');
        res.redirect('/');
        return;
    }

    const citizens = await Citizen.find({ username: { $regex: new RegExp(username, 'i') } })


.skip((page - 1) * perPage)
        .limit(perPage);

    if (citizens.length === 0) {
        req.flash('info', 'No citizens found.');
    }

    res.render('searchctz.ejs', {
        citizens, messages: req.flash(),
        data: {
            userid: req.session.userId,
            fullname: req.session.fullname,
        },
         // Pass flash messages to the template
    });

  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

const predefinedStatuses = ['Okay', 'Help', 'Emergency'];

app.get('/share-status', async (req, res) => {
  session = req.session;
  uname = req.session.fullname;
  const userStatus = 'OK'; // Replace this with your actual logic to fetch user status

  if (session.userId && session.fullname) {
    res.render('shareStatus', { predefinedStatuses, data: {
      userid: req.session.userId,
      fullname: req.session.fullname,
    }, userStatus });
  } else {
    res.redirect('/');
  }
});

app.post('/update-status', async (req, res) => {
  try {
    const { status } = req.body;

    // Check if the user is logged in
    if (req.session.userId && req.session.fullname) {
      // Update the user's status in the database
      await Citizen.findOneAndUpdate(
        { username: req.session.userId },
        { $set: { status } },
        { new: true }
      );

      console.log(`User ${req.session.userId} updated status to: ${status}`);
      
      // Redirect to the status page with the updated information
      res.redirect(`/status-info?status=${encodeURIComponent(status)}`);
    } else {
      res.redirect('/'); // Redirect to the login page if the user is not logged in
    }
  } catch (error) {
    console.error(`Error updating status: ${error}`);
    res.status(500).send('Internal Server Error');
  }
});

// New route for displaying the updated status information
app.get('/status-info', (req, res) => {
  const updatedStatus = req.query.status || 'No Status';
  res.render('statusInfo', { updatedStatus ,data: {
    userid: req.session.userId,
    fullname: req.session.fullname,
  },});
});

// starting the server
httpServer.listen(PORT, () => {
  console.log("The server is up and running on port 4000.");
});
