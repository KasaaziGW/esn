const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const PrivateMessageSchema = new Schema({
  participant1: { type: String },
  participant2: { type: String },
  sender: { type: String },
  message: { type: String },
  sentTime: { type: String },
});
const PrivateMessage = mongoose.model("PrivateMessage", PrivateMessageSchema);
module.exports = { PrivateMessage };