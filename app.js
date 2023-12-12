const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const flashMessage = require("connect-flash");
const sessions = require("express-session");
const { Citizen } = require("./models/Citizen");
const { Message } = require("./models/Message");
const { PrivateMessage } = require("./models/Privatemessage");
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
//request for private chat
app.get("/", (request, response) => {
  session = request.session;
  if (session.userId && session.fullname) response.redirect("/privatechat");
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
            session.uid = userInfo._id;
            session.userId = userInfo.username;
            session.fullname = userInfo.fullname;
            //update online status here..
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
  const op1 = 'x';
  const op2 = 'y';
  session = request.session;
  uname = request.session.fullname;
  // console.log(`User ID: ${session.userId}\nFullname: ${session.fullname}`);
  if (session.userId && session.fullname) {
    response.render("chatroom", {
      data: {
        userid: request.session.userId,
        fullname: request.session.fullname,
        uid: request.session.uid,
        participant1: op1,
        participant2: op2,
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

// Private chat
app.get("/privatechat", async (request, response) => {
  // get the private messages for the participants
  const participant1 = request.query.p1
  const participant2 = request.query.p2
  // ordering the participants for easier lookup
  let op1 = participant1;
  let op2 = participant2;
  if(participant2 < participant1){
    op1 = participant2
    op2 = participant1
  }
  // search for messages where the sender and recipient match the participants
  // arrange the participant ids in ascending order so that we can always sort by p1 and p2
  const messages = await PrivateMessage.find({
    participant1: op1,
    participant2: op2,
  })
  
  // , (err, msgz) => {
  //   if (err) console.log(`Error while fetching private messages.\nError: ${err}`);
  //   // else response.send(messages);
  //   else return msgz
  // })

  response.render("privatechat",{

    data: {
      userid: request.session.userId,
      fullname: request.session.fullname,
      uid: request.session.uid,
      participant1: op1,
      participant2: op2,
      messages
    },
  });
});

// socket based private chat
//loading the chatroom
app.get("/socketprivatechatview", (request, response) => {
  // get the private messages for the participants
  const participant1 = request.query.p1
  const participant2 = request.query.p2
  // ordering the participants for easier lookup
  let op1 = participant1;
  let op2 = participant2;
  if(participant2 < participant1){
    op1 = participant2
    op2 = participant1
  }
  
  session = request.session;
  uname = request.session.fullname;
  // console.log(`User ID: ${session.userId}\nFullname: ${session.fullname}`);
  const data = {
        userid: request.session.userId,
        fullname: request.session.fullname,
        uid: request.session.uid,
        participant1: op1,
        participant2: op2,
      }
  if (session.userId && session.fullname) {
    response.render(
      "socketprivatechat",
    {
      data
    });
  } else response.redirect("/");
});


// send private chat
app.post("/sendprivatechat", (request, response)=> {
  let primessage = request.body
  primessage.sender = request.session.uid
  primessage.sentTime = new Date()
  new PrivateMessage(primessage).save((err) => {
    if (err) {
      console.log(`Error while saving the message. \n Error: ${err}`);
      response.sendStatus(500);
    } else {
      // socketIO.emit("message", message);
      // response.sendStatus(200);
      response.redirect(`/privatechat?p1=${request.body.participant1}&p2=${request.body.participant2}`)
    }
  })
  
})

app.post("/savePrivateMessage", (request, response) => {
  // create an object from the model
  var message = new PrivateMessage(request.body);
  // saving the message to the db
  message.save((err) => {
    if (err) {
      console.log(`Error while saving the private message. \n Error: ${err}`);
      response.sendStatus(500);
    } else {
      const eventname = `privatemessage-${message.participant1}-${message.participant2}`
      // const eventname = "private"
      socketIO.emit(eventname, message);
      response.sendStatus(200);
    }
  });
});

// fetching messages from the database
app.get("/fetchPrivateMessages", (request, response) => {
  //retrieving the messages from the db
  PrivateMessage.find({
    participant1: request.query.p1,
    participant2: request.query.p2
  }, (err, messages) => {
    if (err) console.log(`Error while fetching messages.\nError: ${err}`);
    else response.send(messages);
  });
});


app.get("/esndirectory", (request, response) => {
	Citizen.find({}, (err, citizens) => {
		if(err) { console.log(`Error getting esn.\nError: ${err}`); }
		else {
		response.render("esndirectory", {users: citizens, data: {
      userid: request.session.userId,
      fullname: request.session.fullname,
      uid: request.session.uid
    },})
}
})
});

// emitting a message when a user joins the chat
socketIO.on("connect", (socket) => {
  socketIO.emit("joined", uname);
  console.log(`${uname} has joined`);
});

// starting the server
httpServer.listen(PORT, () => {
  console.log("The server is up and running on port 4000.");
});
