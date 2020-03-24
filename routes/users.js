var express = require('express');
var router = express.Router();

var User = require('mongoose').model('User');
var async = require('async');
var mongoose = require('mongoose');

router.post('/', checkUserRegValidation, function(req, res, next){
  User.create(req.body, function(err,user){
    if(err) return res.json({success: false, message: err});
    res.json({success:true});
  });
});// user 생성

router.get('/check',checkId, function (req, res){
  //print(req.query.id)
  console.log("test log1")
  res.json({success:true}); 
}); // ID 중복체크

router.get('/:id', isLoggedIn, function(req, res, next) {
  User.findById(req.params.id,function(err,user){
    if(err) return res.json({success: false, message: err});
    res.json({success:true, user: user});
  })
}); // user 정보 보기

router.put('/:id', isLoggedIn, checkUserRegValidation, function(req, res){
  User.findById(req.params.id, req.body, function(err,user){
    if(err) return res.json({success: false, message: err});
    if(user.authenticate(req.body.PW)){
      if(req.body.newPW){
        req.body.PW = user.hash(req.body.newPW);
      } else{
        delete req.body.PW;
      }
      User.findByIdAndUpdate(req.params.id, req.body, function(err, user){
        if(err) return res.json({success: false, message: err});
        res.json({success:true, result:req.body});
      });
    } else{
      res.json({success:false, message:"Check ID or Password"});
    }
  });
}); // user 정보 수정

module.exports = router;

function checkUserRegValidation(req,res,next){//중복 확인
  var isValid=true;

  async.waterfall(
      [function(callback){
          User.findOne({ID: req.body.ID, _id:{$ne: mongoose.Types.ObjectId(req.params.id)}},
              function(err,user){
                  if(user){
                      isValid=false;
                  }
                  callback(null,isValid);
              }
          );
      }, function(isValid,callback){
          User.findOne({phone: req.body.phone, _id:{$ne:mongoose.Types.ObjectId(req.params.id)}},
              function(err,user){
                  if(user){
                      isValid=false;
                  }
                  callback(null,isValid);
              }
          );
      }], function(err,isValid){
          if(err) return res.json({success:false, message:err});
          if(isValid){
              return next();
          } else{
              res.json({success:false, message:"already ID or email"});
          }
      }
  );
}
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.json({success:false, message:"required login"});
}

function checkId(req, res, next){
  var isValid=true;

  console.log(req.query.ID)

  async.waterfall(
      [function(callback){
          User.findOne({ID: req.query.ID},
              function(err,user){
                  if(user){
                      isValid=false;
                  }
                  callback(null,isValid);
              }
          );
      }], function(err,isValid){
          if(err) return res.json({success:false, message:err});
          if(isValid){
              return next();
          } else{
              res.json({success:false, message:"already ID or email"});
          }
      }
  );
}


/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: 회원가입, 아이디 조회, 아이디 수정
 * definitions:
 *   Signup_request:
 *     type: object
 *     required:
 *       - ID
 *       - PW
 *       - name
 *       - birth
 *       - address
 *       - phone
 *     properties:
 *       ID: 
 *         type: string
 *         required: true
 *       PW: 
 *         type: string
 *         required: true
 *       name: 
 *         type: string
 *         required: true
 *       birth: 
 *         type: string
 *         format: date-time
 *         required: true
 *       address: 
 *         type: string
 *         required: true
 *       phone: 
 *         type: string
 *         required: true
 *   Signup_response:
 *     type: object
 *     required:
 *       - success
 *     properties:
 *       success:
 *         type: boolean
 *         description: 회원가입 성공 여부- True
 *   Response_error:
 *     type: object
 *     required:
 *       - success
 *       - message
 *     properties:
 *       success:
 *         type: boolean
 *         description: 회원가입 성공 여부- False
 *       message:
 *         type: string
 *         description: 오류 사유
 */

/**
 * @swagger
 *  paths:
 *    /users:
 *      post:
 *        tags:
 *        - "Users"
 *        summary: "회원가입"
 *        description: ""
 *        consumes:
 *        - "application/json"
 *        produces:
 *        - "application/json"
 *        parameters:
 *        - in: "body"
 *          name: "body"
 *          description: "회원가입 ID & PW 를 받고 User정보를 Return"
 *          required: true
 *          schema:
 *            $ref: "#/definitions/Signup_request"
 *        responses:
 *          200:
 *            description: "로그인 성공"
 *            schema:
 *              $ref: "#/definitions/Signup_response"
 *          400:
 *            description: "잘못된 데이터"
 *            schema:
 *              $ref: "#/definitions/Response_error"
 *          500:
 *            description: "로그인 오류 & 실패"
 *            schema:
 *              $ref: "#/definitions/Response_error"
 */

