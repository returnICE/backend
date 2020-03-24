var express = require('express');
var router = express.Router();

var Reserve = require('mongoose').model('Reserve');
var jwt = require('../hooks/jwt')


// GET ALL Reserve
router.get('/', function (req, res) {
  var user= jwt.isAuthenticate(req)
  Reserve.find({user_id:user._id}, function(err, data){
    if(err) return res.json({success: false, message: err});
    res.json({success:true, data});
  })

  });

// GET SINGLE Reserve
router.get('/:id', function (req, res) {
  Reserve.findById(req.params.id,function(err,data){
    if(err) return res.json({success: false, message: err});
    res.json({success:true, data: data});
  })
});

// CREATE Reserve
router.post('/', function (req, res) {
  var user= jwt.isAuthenticate(req)
  console.log(user._id)
  Reserve.create({...req.body,user_id:user._id}, function (err, data) {
    if (err) return res.json({ success: false, message: err });
    res.json({ success: true, data });
  });
});

// UPDATE THE Reserve
router.put('/:id', function (req, res) {
  Reserve.findByIdAndUpdate(req.params.id, req.body, function(err, data){
    if(err) return res.json({success: false, message: err});
    res.json({success:true, result:req.body});
  });
});

// DELETE Reserve
router.delete('/:id', function (req, res) {
  Reserve.findById(req.params.id, function(err,data){
    if(err) return res.json({success: false, message: err});
    data.remove()
    res.json({success:true});
  });
});

module.exports = router;



/**
 * @swagger
 * tags:
 *   - name: Reserve
 *     description: 장바구니 CRUD
 * definitions:
 *   Reserve_request:
 *     type: object
 *     required:
 *       - item_id
 *       - reserveprice
 *     properties:
 *       item_id: 
 *         type: string
 *         required: true
 *         description: 제품 아이디
 *       reserveprice: 
 *         type: number
 *         required: true
 *         description: 제품 설명
 *   Reserve_request_obj:
 *     type: object
 *   Itme_response:
 *     type: object
 *     required:
 *       - success
 *     properties:
 *       success:
 *         type: boolean
 *   Reserve_data_response:
 *     type: object
 *   Response_error:
 *     type: object
 *     required:
 *       - success
 *       - message
 *     properties:
 *       success:
 *         type: boolean
 *       message:
 *         type: string
 */

/**
 * @swagger
 *  paths:
 *    /reserve:
 *      post:
 *        tags:
 *        - "Reserve"
 *        summary: "CREATE Reserve"
 *        description: ""
 *        consumes:
 *        - "application/json"
 *        produces:
 *        - "application/json"
 *        parameters:
 *        - in: "body"
 *          name: "body"
 *          description: "Reserve 생성"
 *          required: true
 *          schema:
 *            $ref: "#/definitions/Reserve_request"
 *        - in: "header"
 *          name: x-access-token
 *          type: string
 *          description: "로그인 Token을 받고 User정보를 Return"
 *          required: true
 *        responses:
 *          200:
 *            description: "생성 성공"
 *            schema:
 *              $ref: "#/definitions/Reserve_request_obj"
 *      get:
 *        tags:
 *        - "Reserve"
 *        summary: "GET ALL Reserve"
 *        consumes:
 *        - "application/json"
 *        produces:
 *        - "application/json"
 *        parameters:
 *        - in: "body"
 *          name: "body"
 *          description: "모든 item 목록들을 반환"
 *          required: false
 *        responses:
 *          200:
 *            description: "반환"
 *            schema:
 *              $ref: "#/definitions/Reserve_data_response"
 *    /reserve/{id}:
 *      get:
 *        tags:
 *        - "Reserve"
 *        summary: "CREATE Reserve"
 *        description: ""
 *        consumes:
 *        - "application/json"
 *        produces:
 *        - "application/json"
 *        parameters:
 *        - in: path
 *          name: id 
 *          required: true
 *          schema:
 *            type: String
 *          description: The Reserve ID
 *        responses:
 *          200:
 *            description: "반환"
 *            schema:
 *              $ref: "#/definitions/Reserve_request"
 *      put:
 *        tags:
 *        - "Reserve"
 *        summary: "CREATE Reserve"
 *        description: ""
 *        consumes:
 *        - "application/json"
 *        produces:
 *        - "application/json"
 *        requestBody:
 *          description: "item 생성"
 *          required: true
 *          schema:
 *            $ref: "#/definitions/Reserve_request"
 *        parameters:
 *        - in: path
 *          name: id 
 *          required: true
 *          schema:
 *            type: String
 *          description: The Reserve ID
 *        - in: body
 *          name: body
 *          description: "모든 item 목록들을 반환"
 *          required: false
 *        responses:
 *          200:
 *            description: "수정"
 *            schema:
 *              $ref: "#/definitions/Itme_response"
 *      delete:
 *        tags:
 *        - "Reserve"
 *        summary: "REMOVE Reserve"
 *        description: ""
 *        consumes:
 *        - "application/json"
 *        produces:
 *        - "application/json"
 *        parameters:
 *        - in: path
 *          name: id 
 *          required: true
 *          schema:
 *            type: String
 *          description: The Reserve ID
 *        responses:
 *          200:
 *            description: "수정"
 *            schema:
 *              $ref: "#/definitions/Itme_response"
 * 
 * 
 * 
 * 
 */


 /*
  *     type: object
 *     required:
 *       - ID
 *       - createdAt
 *       - updatedAt
 *       - address
 *       - phone
 *       - list
 *       - originprice
 *       - currentprice 
 *       - payment
 *     properties:
 *       ID: 
 *         type: string
 *         required: true
 *       createdAt: 
 *         type: string
 *         format: date-time
 *         required: true
 *       updatedAt: 
 *         type: string
 *         format: date-time
 *       address: 
 *         type: string
 *         required: true
 *         description: 배송지
 *       phone: 
 *         type: string
 *         required: true
 *         description: 배송 번호
 *       list: 
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             item:
 *               type:string
 *             count:
 *               type:string
 *         description: 제품,수량
 *       originprice: 
 *         type: number
 *         required: true
 *         description: 제품 설명
 *       currentprice: 
 *         type: number
 *         required: true
 *         description: 원래 가격
 *       payment: 
 *         type: boolean
 *         required: true
 *         description: 구매 여부
 *  */

// {
//   "createdAt": "2020-03-12T17:20:20.305Z",
//   "updatedAt": "2020-03-12T17:20:20.305Z",
//   "address": "string",
//   "phone": "string",
//   "list": [
//     {item:"5e5f0dedbd59824ed8db90dd",count:3}
//   ],
//   "originprice": 0,
//   "currentprice": 0,
//   "payment": true
// }
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImludGVyZXN0bGlzdCI6WyJzdHJpbmciXSwiYnV5bGlzdCI6WyJzdHJpbmciXSwiX2lkIjoiNWU0ZjY1YWU0MWEyNjI2YzgwMjFmNjI5IiwiSUQiOiJzdHJpbmciLCJQVyI6IiQyYSQxMCRzRnM3T3hOOW1PLmJqSFRYVkk4ck5PT1BULy85MFZSUEhTUkVwLzFLQ0h3S1B5SHJnRmJjbSIsIm5hbWUiOiJzdHJpbmciLCJiaXJ0aCI6IjIwMjAtMDItMjFUMDU6MDc6NTEuMjgxWiIsImFkZHJlc3MiOiJzdHJpbmciLCJwaG9uZSI6InN0cmluZyIsIl9fdiI6MH0sImlhdCI6MTU4NDAzMzY0MSwiZXhwIjoxNTg0MTIwMDQxfQ.a5rupyL1za2Q7W0TD-reth_6NaQDHQRVkR_5so9uDiM