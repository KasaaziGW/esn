const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const flashMessage = require("connect-flash");
const sessions = require("express-session");
const { Citizen } = require("./models/Citizen");
const { Message } = require("./models/Message");
const { PrivateMessage } = require("./models/Privatemessage");
const { Announcement } = require("./models/Announcement");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');


// group 3
const { checkAdmin, checkCordinator } = require('./group3Controllers/middleware/checkPrivilege');
const { listUsers } = require('./group3Controllers/listUsers');
const { showUserProfilePage, updateUserProfile } = require('./group3Controllers/userProfile');
const { listAnnouncements, postAnnouncement } = require('./group3Controllers/announcements')

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
// const dbUrl = "mongodb://localhost:27017/misweb";


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
            privilege: 'Citizen',
            status: 'Active'
          });
          // adding the citizen to the database
          citizen.save((err) => {
            if (err) {
              request.flash("error", `Error while adding citizen ${err}`);
              response.redirect("/register");
            } else {

              // Send a welcome email to the user
              sendWelcomeEmail(email, fullname);
              request.flash(
                "success",`${fullname} successfully added to the system.`
              );
              response.redirect("/register");
            }
          });
        });
// Function to send a welcome email
function sendWelcomeEmail(email, fullname) {
  // Create a Nodemailer transporter
  let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'veveking2023@gmail.com', // Your Gmail email address
          pass: '04Jan2014', // Your Gmail password
      },
  });

  // Email content
  let mailOptions = {
      from: 'veveking2023@gmail.com', // Sender address
      to: email, // Recipient address
      subject: 'Welcome to Your App', // Subject line
      text: `Hello ${fullname},\n\nWelcome to Your App! Your account has been successfully created.\n\nBest regards,\nYour App Team`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error(`Error sending email: ${error}`);
      } else {
          console.log(`Email sent: ${info.response}`);
      }
  });
}

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
            // if the user status is Inactive, block the login
            if (userInfo.status === 'Inactive'){
              request.flash("error", "Your account is not active, please contact the administrator");
              return response.redirect("/");
            }
            session = request.session;
            session.uid = userInfo._id;
            session.userId = userInfo.username;
            session._id = userInfo._id;
            session.fullname = userInfo.fullname;
            //update online status here..
            session.privilege = userInfo.privilege;
            response.redirect("/home");

          } else {
            request.flash("error", "Incorrect password for the provided username!");
            response.redirect("/");
          }
        });
      } else {
        request.flash("error", "Citizen not found in the system!");
        //showSnackbar("Citizen not found in the system!");
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
        privilege: request.session.privilege,
        _id: request.session._id
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
        privilege: request.session.privilege,
        _id: request.session._id
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
  
  // while retrieving messages, get the users who are no longer active
  // for each inactive user, exclude their messages from the list
  const query = { status: 'Inactive' };
  Citizen.find(query, (err, users) => {
    if (err) console.log(`Error while fetching users ${err}`);
    else {
      // get the list of inactive users
      let inactiveUsers = users.map(user => user.fullname);
      // console.log(inactiveUsers);
      // get the messages from the database
      Message.find({}, (err, messages) => {
        if (err) console.log(`Error while fetching messages.\nError: ${err}`);
        else {
          // filter the messages
          let filteredMessages = messages.filter(message => !inactiveUsers.includes(message.sender));
          // console.log(filteredMessages);
          response.send(filteredMessages);
        }
      });
    }
  });

  //retrieving the messages from the db
  // Message.find({}, (err, messages) => {
  //   if (err) console.log(`Error while fetching messages.\nError: ${err}`);
  //   else response.send(messages);
  // });
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
  // get the list of active sessions
  var livesessions = request.sessionStore.sessions;
  var sessionlist = [];
  for (var key in livesessions) {
    var session = JSON.parse(livesessions[key]);
    sessionlist.push(session.userId);
  }
  
	Citizen.find({}, (err, citizens) => {
		if(err) { console.log(`Error getting esn.\nError: ${err}`); }
		else {
      var esnlist = [];
      citizens.forEach((citizen) => {
        esnlist.push({...citizen._doc, onlineoffline: sessionlist.includes(citizen.username)});
        
      })
		response.render("esndirectory", {users: esnlist, data: {
      userid: request.session.userId,
      fullname: request.session.fullname,
      uid: request.session.uid
    },})
}
})
});


// group 3 routes
app.get('/users', [checkAdmin], listUsers)
app.get('/users/:id/', [checkAdmin], showUserProfilePage)
app.post('/updateUserProfile', [checkAdmin], 
(req, res) => {
  return updateUserProfile(req, res, socketIO)
} 
// updateUserProfile
)
app.get('/announcements', listAnnouncements);
app.post('/post-announcement', [checkCordinator], postAnnouncement);

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
    if (session.userId && session.fullname) {
    res.render('searchctz.ejs', {
        citizens, messages: req.flash(),
        data: {
            userid: req.session.userId,
            fullname: req.session.fullname,
        },
         // Pass flash messages to the template
      });}

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
  if (session.userId && session.fullname) {
  res.render('statusInfo', { updatedStatus ,data: {
    userid: req.session.userId,
    fullname: req.session.fullname,
  },});}
});

//public search 
app.get('/public-search', async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const perPage = 10;
      const searchTerm = req.query.sender || '';

      // Find messages by username or all messages if no username is provided
      const query = searchTerm
          ? { sender: { $regex: new RegExp(searchTerm, 'i') } }
          : {};

      const messages = await Message.find(query)
          .sort({ sentTime: 'desc' }) // Sort in descending order based on sentTime
          .skip((page - 1) * perPage)
          .limit(perPage + 1); // Fetch one extra to determine if there are more

      const hasMore = messages.length > perPage;
      // Remove the extra message used for checking if there are more
      if (hasMore) {
          messages.pop();
      }
      if (messages.length === 0) {
        req.flash('info', 'No messages found.');
    }
      // Render a view with the messages and pagination information
      if (session.userId && session.fullname) {
      res.render('public-search.ejs', { messages, page, hasMore, searchTerm ,data: {
        userid: req.session.userId,
        fullname: req.session.fullname,
      },});}
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});
//cater for public announcement
app.get('/announcements-search', async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const perPage = 10;
      const searchTerm = req.query.posterName || '';

      // Find messages by username or all messages if no username is provided
      const query = searchTerm
          ? { posterName: { $regex: new RegExp(searchTerm, 'i') } }
          : {};

      const announc = await Announcement.find(query)
          .sort({ sentTime: 'desc' }) // Sort in descending order based on sentTime
          .skip((page - 1) * perPage)
          .limit(perPage + 1); // Fetch one extra to determine if there are more

      const hasMore = announc.length > perPage;
      // Remove the extra message used for checking if there are more
      if (hasMore) {
        announc.pop();
      }

      // Render a view with the messages and pagination information
      if (session.userId && session.fullname) {
      res.render('announcements-search.ejs', { announc, page, hasMore, searchTerm ,data: {
        userid: req.session.userId,
        fullname: req.session.fullname,
      },});}
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

// handling the private messaging

app.get('/private-search', async (req, res) => {
  try {
    
      const page = parseInt(req.query.page) || 1;
      const perPage = 10;
      const searchTerm = req.query.sender || '';
      // Find messages by username or all messages if no username is provided
      const query = searchTerm
          ? { sender: { $regex: new RegExp(searchTerm, 'i') } }
          : {};

      const privateMessages = await PrivateMessage.find(query)
          .sort({ sentTime: 'desc' }) // Sort in descending order based on sentTime
          .skip((page - 1) * perPage)
          .limit(perPage + 1); // Fetch one extra to determine if there are more

      const hasMore = PrivateMessage.length > perPage;
      // Remove the extra message used for checking if there are more
      if (hasMore) {
        privateMessages.pop();
      }
      if (privateMessages.length === 0) {
        req.flash('info', 'No messages found.');
    }
      // Render a view with the messages and pagination information
      if (session.userId && session.fullname) {
      res.render('private-search.ejs', { privateMessages, page, hasMore, searchTerm ,data: {
        userid: req.session.userId,
        fullname: req.session.fullname,
      },});}
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

// starting the server
httpServer.listen(PORT, () => {
  console.log("The server is up and running on port 4000.");
});
