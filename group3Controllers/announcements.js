// list the users that have registered on the platform
const { Announcement }  =require ('../models/Announcement')
async function listAnnouncements(request, response){
    
    // fetch the list of users from the database
    const announcements = await Announcement.find()
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

module.exports = { listAnnouncements }