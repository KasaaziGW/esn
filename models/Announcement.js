const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const announcementSchema = new Schema({
  posterName: { type: String },
  announcement: { type: String },
  sentTime: { type: String },
});
const Announcement = mongoose.model("Announcement", announcementSchema);
module.exports = { Announcement };
