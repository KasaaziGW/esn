/**
 * Check if the user is an admin
 */

async function checkAdmin (request, response, next) {
  try {
    if (request.session.privilege !== 'Administrator') {
        return response.redirect("/");
    } else {
        next()
    }
  } catch (err) {
    return response.redirect('/');
  }
}

async function checkCordinator (request, response, next) {
  try {
    if (request.session.privilege !== 'Administrator' && request.session.privilege !== 'Cordinator') {
        return response.redirect("/");
    } else {
        next()
    }
  } catch (err) {
    return response.redirect('/');
  }
}

module.exports = { checkAdmin, checkCordinator }
