var express = require('express');
var passport = require('passport');
//jwt 인증 
var jwt = require('jsonwebtoken');

var router = express.Router();
var User = require('mongoose').model('User');

var LocalStrategy = require('passport-local').Strategy;
passport.use('local-login',
  new LocalStrategy({
    usernameField: 'ID',
    passwordField: 'PW',
    session: true,
    passReqToCallback: true
  },
    function (req, ID, PW, done) {
      User.findOne({ 'ID': ID }, function (err, user) {
        if (err) return done(err);
        if (!user) {
          return done(null, false);
        }
        if (!user.authenticate(PW)) {
          return done(null, false);
        }
        return done(null, user);
      });
    })
);

router.get('/', function (req, res, next) {

  // 후에 사용하게될 복호화 부분
  var token = req.headers['x-access-token'];

  jwt.verify(token, "abcd", function (err, decoded) {
    if (err) return res.json({ success: false, message: err });
    else {
      return  res.json({ success: true, user:decoded.user });
    }
  });
});


router.post('/', function (req, res, next) {
  if (req.body.ID.length === 0 || req.body.PW.length === 0) {
    res.json({ success: false, message: "check input value" });
  }
  else {
    passport.authenticate('local-login', function (err, user, info) {
      if (err) return next(err);
      if (!user) return res.json({ success: false, message: "login fail" });
      req.logIn(user, function (err) {
        if (err) return res.json({ success: false, message: "login fail" });

        // login 성공
        // payload -> 토큰에 들어갈정보 이것이 암호화되서 토큰에 실린다.
        var payload = {
          user: user
        };
        var secretOrPrivateKey = "abcd"
        var options = { expiresIn: 60 * 60 * 24 };// 10분 동안만 로그인 유효 -> 후에 수정 
        jwt.sign(payload, secretOrPrivateKey, options, function (err, token) {
          if (err) return res.json({ success: false, message: "jwt인증 토큰 생성에러" });

          return res.send({ success: true, token });
        });
      });
    })(req, res, next);
  }
});

router.get('/logout', function (req, res) {
  req.session.destroy();
  res.json({ success: true });
}); // logout


module.exports = router;

/**
 * @swagger
 * tags:
 *   - name: Login
 *     description: 로그인 처리, 로그아웃
 * definitions:
 *   Login_request:
 *     type: object
 *     required:
 *       - ID
 *       - PW
 *     properties:
 *       ID:
 *         type: string
 *         description: 아이디
 *       PW:
 *         type: string
 *         description: 비밀번호
 *   Login_response:
 *     type: object
 *     required:
 *       - success
 *       - user
 *     properties:
 *       success:
 *         type: boolean
 *         description: 로그인 성공 여부- True, False
 *       user:
 *         type: object
 *         properties:
 *           interestlist:
 *             type: array
 *             items:
 *               type: integer
 *           buylist:
 *             type: array
 *             items:
 *               type: integer
 *           _id:
 *              type: string
 *           ID:
 *             type: string
 *           PW:
 *             type: string
 *           name:
 *             type: string
 *           birth:
 *             type: string
 *             format: date-time
 *           address:
 *             type: string
 *           phone:
 *             type: string
 *           __v:
 *             type: integer
 *   Response_error:
 *     type: object
 *     required:
 *       - success
 *       - message
 *     properties:
 *       success:
 *         type: boolean
 *         description: 로그인 성공 여부- True, False
 *       message:
 *         type: string
 *         description: 오류 사유
 */

/**
 * @swagger
 *  paths:
 *    /login:
 *      get:
 *        tags:
 *        - "Login"
 *        summary: "check login"
 *        description: ""
 *        consumes:
 *        - "application/json"
 *        produces:
 *        - "application/json"
 *        parameters:
 *        - in: "header"
 *          name: x-access-token
 *          type: string
 *          description: "로그인 Token을 받고 User정보를 Return"
 *          required: true
 *        responses:
 *          200:
 *            description: "로그인 성공"
 *            schema:
 *              $ref: "#/definitions/Login_response"
 *          400:
 *            description: "잘못된 데이터"
 *            schema:
 *              $ref: "#/definitions/Response_error"
 *          500:
 *            description: "로그인 오류 & 실패"
 *            schema:
 *              $ref: "#/definitions/Response_error"
 *      post:
 *        tags:
 *        - "Login"
 *        summary: "Login process"
 *        description: ""
 *        consumes:
 *        - "application/json"
 *        produces:
 *        - "application/json"
 *        parameters:
 *        - in: "body"
 *          name: "body"
 *          description: "로그인 ID & PW 를 받고 User정보를 Return"
 *          required: true
 *          schema:
 *            $ref: "#/definitions/Login_request"
 *        responses:
 *          200:
 *            description: "로그인 성공"
 *            schema:
 *              $ref: "#/definitions/Login_response"
 *          400:
 *            description: "잘못된 데이터"
 *            schema:
 *              $ref: "#/definitions/Response_error"
 *          500:
 *            description: "로그인 오류 & 실패"
 *            schema:
 *              $ref: "#/definitions/Response_error"
 *    /login/logout:
 *      get:
 *        tags:
 *        - "Login"
 *        summary: "Login process"
 *        consumes:
 *        - "application/json"
 *        produces:
 *        - "application/json"
 *        parameters:
 *        - in: "body"
 *          name: "body"
 *          description: "로그인 session 삭제"
 *          required: false
 *        responses:
 *          200:
 *            description: "로그아웃 성공"
 *            example:
 *              success:
 *                type: boolean
 *            schema:
 *            -  success:
 *                 type: boolean
 *          400:
 *            description: "잘못된 데이터"
 *            schema:
 *              $ref: "#/definitions/Response_error"
 *          500:
 *            description: "로그아웃 오류 & 실패"
 *            schema:
 *              $ref: "#/definitions/Response_error"

 */