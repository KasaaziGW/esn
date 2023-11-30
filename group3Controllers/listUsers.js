// list the users that have registered on the platform
const {Citizen}  =require ('../models/Citizen')
async function listUsers(request, response){
    session = request.session;
  uname = request.session.fullname;

    // check if the user is an administrator

    // fetch the list of users from the database
    const users = await Citizen.find()
    // return the list for rendering
    response.render('listUsers',  {
        data: {
          userid: request.session.userId,
          fullname: request.session.fullname,
        },
        users
      })
}

module.exports = { listUsers }