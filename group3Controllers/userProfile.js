// list the users that have registered on the platform
const {Citizen}  =require ('../models/Citizen')

async function showUserProfilePage(request, response){
    session = request.session;
  uname = request.session.fullname;

    // check if the user is an administrator

    // fetch the list of users from the database
    // const users = await Citizen.findOne({
    //     _id: request.params.id
    // })
    // return the list for rendering
    response.render('userProfile',  {
        data: {
          userid: request.session.userId,
          fullname: request.session.fullname,
        },
        userId: request.params.id
      })
}

module.exports = { showUserProfilePage }