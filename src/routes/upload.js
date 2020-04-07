const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
var express = require('express')
var router = express.Router()

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: 'ap-northeast-1'
})

const upload = multer({
  storage: multerS3({
    s3,
    acl: 'public-read',
    bucket: 'ajoucapston',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname })
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
})

router.post('/', upload.array('imgFile'), (req, res) => {
  try {
    var location = req.files.map(file => file.location)
    res.json({ success: true, location })
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
})

module.exports = router
