const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const citizenSchema = new Schema({
  username: { type: String },
  fullname: { type: String },
  password: { type: String },
  privilege: { type: String},
  status: { type: String,default: 'undefined'},
  loginstatus: {type: String}, 
});
const Citizen = mongoose.model("Citizen", citizenSchema);
module.exports = { Citizen };
