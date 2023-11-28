
// function to seed an administrator for the application
const mongoose = require('mongoose')
const { Citizen } = require('../models/Citizen');

async function seedAdmin(){

    const dbUrl = "mongodb+srv://umumis:umu123@cluster0.odksibj.mongodb.net/";
    // const dbUrl = "mongodb://localhost:27017/misweb";
    mongoose.connect(dbUrl, (err) => {
    if (err) console.log(`Couldn't connect to MongoDB \n${err}.`);
    else console.log("Succesfully connected to MongoDB.");
    });

    const seededAdmin = {
        username: 'ESNAdmin',
        fullname: 'Seed Administrator',
        password: 'admin',
        privilege: 'Administrator',
        status: 'OK'
    }

    // check if an initial admin is present
    const checkDuplicate = await Citizen.findOne({ username: seededAdmin.username })
    if (checkDuplicate !== null){
        console.error('ERR! The default administrator is already present')
        process.exit()
    }
    // create the admin using the citizen model
    const defaultAdmin = new Citizen(seededAdmin)
    defaultAdmin.save((err) => {
        if(err) {
            console.error('ERR! Unable to add the default admin')
        } else {
            console.info('OK! Default Administrator has been added successfully.')
        }
        process.exit()
    })
}

seedAdmin()