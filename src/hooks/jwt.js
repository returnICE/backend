var jwt = require('jsonwebtoken')

function isAuthenticate (req, res) {
  jwt.verify(process.env.JWT_KEY, function (err, decoded) {
    return err || decoded
  })
}

module.exports = { isAuthenticate }
