// list the users that have registered on the platform
const {Citizen}  =require ('../models/Citizen')

async function showUserProfilePage(request, response){
    session = request.session;
  uname = request.session.fullname;

    // check if the user is an administrator

    // fetch the list of users from the database
    const user = await Citizen.findOne({
        _id: request.params.id
    })

    // return the list for rendering
    response.render('userProfile',  {
        data: {
          userid: request.session.userId,
          fullname: request.session.fullname,
        },
        // userId: request.params.id,
        userProfile: user
      })
}

async function updateUserProfile(request, response) {
    console.log(request.body)
    request.flash("error", "The user profile has been updated successfully.")
    response.redirect(request.get('referer'))
}

module.exports = { showUserProfilePage, updateUserProfile }