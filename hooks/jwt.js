var env = require('../env')
var jwt = require('jsonwebtoken');

function isAuthenticate(req) {
  var token = req.headers['x-access-token'];
  return jwt.verify(token, env.jwtKey, function (err, decoded) {
    if (err) return err;
    else {
      return decoded.user
    }
  });
}

module.exports = { isAuthenticate }