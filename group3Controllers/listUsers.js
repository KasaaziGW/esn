// list the users that have registered on the platform
const {Citizen}  =require ('../models/Citizen')
async function listUsers(request, response){
    // fetch the list of users from the database
    const users = await Citizen.find()

    // check for users who are currently logged in
    const activeSessions = request.sessionStore.sessions
    const activeUsers = []
    for (let session in activeSessions){
        const sessionObject = JSON.parse(activeSessions[session])
        activeUsers.push(sessionObject.userId)
    }
    // construct the list of users indicating those who are currently logged in
    let usersList = []
    for (let user of users){
      const online = activeUsers.includes(user.username)
      usersList.push({...user._doc, online})
    }

    // return the list for rendering
    response.render('listUsers',  {
        data: {
          userid: request.session.userId,
          fullname: request.session.fullname,
          privilege: request.session.privilege,
          _id: request.session._id
        },
        users: usersList
      })
}

module.exports = { listUsers }