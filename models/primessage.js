const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const primessageSchema = new Schema({
  sender: { type: String },
  message: { type: String },
  sentTime: { type: String },
});
const Primessage = mongoose.model("Primessage", primessageSchema);
module.exports = { Primessage };