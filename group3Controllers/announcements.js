// list the users that have registered on the platform
const { Announcement }  =require ('../models/Announcement')
async function listAnnouncements(request, response){
    
    // fetch the list of announcements from the database
    const announcements = await Announcement.find().sort({_id: -1})
    // return the list for rendering
    response.render('listAnnouncements',  {
        data: {
          userid: request.session.userId,
          fullname: request.session.fullname,
          privilege: request.session.privilege
        },
        announcements
      })
}

async function postAnnouncement(request, response){
    // save the record to the database
    // flash the message
    // reload the page
    const announcement = {
        announcement: request.body.announcement,
        posterName: request.session.fullname,
        sentTime: new Date().toString()
    }
    const record = new Announcement(announcement);
    record.save((err) => {
        if (err) {
            console.log(`Error while saving the announcement. \n Error: ${err}`)
            request.flash("error", "An error occurred while posting the announcement");
        } else {
            request.flash("success", "The announcement has been posted successfully.")
            response.redirect(request.get('referer'));
        }
      });
}

module.exports = { listAnnouncements, postAnnouncement }