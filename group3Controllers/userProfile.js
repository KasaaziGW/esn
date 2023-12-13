// list the users that have registered on the platform
const {Citizen}  =require ('../models/Citizen')
const bcrypt = require("bcryptjs");

async function showUserProfilePage(request, response){
    
    // fetch the list of users from the database
    const user = await Citizen.findOne({
        _id: request.params.id
    })

    // return the list for rendering
    response.render('userProfile',  {
        data: {
          userid: request.session.userId,
          fullname: request.session.fullname,
          privilege: request.session.privilege,
          _id: request.session._id
        },
        userId: request.params.id,
        userProfile: user
      })
}

async function updateUserProfile(request, response, socketIO) {
    const {_id, username, password, confirmPassword, status, privilege} = request.body
    let updateInfo = {}
    
    // check if the username is a duplicate
    
    if (username !== undefined && username.length > 1) {
      const checkDuplicate = await Citizen.findOne({ username })
      if (checkDuplicate !== null){
        if(checkDuplicate._id != _id){
          request.flash("error", "Username already taken")
          return response.redirect(request.get('referer'))
        }
      } else {
        updateInfo.username = username
      }
    }

    // if the account status has been set to Inactive, notify the user in case and log them out
    if (status.length > 1){
      updateInfo.status = status
      const eventId = `deactivated_${_id}`
      // const eventId = 'dd'
      console.info(eventId)
      socketIO.emit(eventId);
    }
  
    if (status.length > 1){
      updateInfo.privilege = privilege
    }
    
    // if the password has been updated, hash the password
    if (password !== undefined && password.length > 1){
      // check if the password has been confirmed
      if(confirmPassword !== password){
        request.flash("error", "Passwords do not match")
        return response.redirect(request.get('referer'))
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      updateInfo.password = hashedPassword
    }

    await Citizen.findOneAndUpdate(
      { _id },
      updateInfo
    )
    request.flash("success", "The user profile has been updated successfully.")
    response.redirect(request.get('referer'))
    
}

module.exports = { showUserProfilePage, updateUserProfile }