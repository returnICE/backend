const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
var express = require('express')
var router = express.Router()

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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

router.post('/', upload.single('imgFile'), (req, res) => {
  try {
    console.log(req.file)
    res.json({ success: true, location: req.file.location })
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
})

module.exports = router
