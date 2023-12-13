// list the users that have registered on the platform
const {Citizen}  =require ('../models/Citizen')
async function listUsers(request, response){
    // fetch the list of users from the database
    const users = await Citizen.find()
    // return the list for rendering
    response.render('listUsers',  {
        data: {
          userid: request.session.userId,
          fullname: request.session.fullname,
          privilege: request.session.privilege,
          _id: request.session._id
        },
        users
      })
}

module.exports = { listUsers }