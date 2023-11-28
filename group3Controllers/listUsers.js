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
        // users: [
        //     {fullName: 'Esau Lwanga', privilege: 'Admin', username: 'x'},
        //     {fullName: 'Hillary Tumukunde', privilege: 'Admin', username: 'x'},
        //     {fullName: 'Andrew Kataate', privilege: 'Admin', username: 'x'},
        //     {fullName: 'Racheal Nasasira', privilege: 'Admin', username: 'x'}
        // ],
        users
      })
}

module.exports = { listUsers }