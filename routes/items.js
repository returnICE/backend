var express = require('express');
var router = express.Router();

var Item = require('mongoose').model('Item');
var mongoose = require('mongoose');

// GET ALL Item
router.get('/', function (req, res) {
  Item.find({}, function(err, item){
    if(err) return res.json({success: false, message: err});
    res.json({success:true, item: item});
  })

  });

// GET SINGLE Item
router.get('/:id', function (req, res) {
  Item.findById(req.params.id,function(err,item){
    if(err) return res.json({success: false, message: err});
    res.json({success:true, item: item});
  })
});

// CREATE Item
router.post('/', function (req, res) {
  Item.create(req.body, function (err, item) {
    if (err) return res.json({ success: false, message: err });
    res.json({ success: true });
  });
});

// UPDATE THE Item
router.put('/:id', function (req, res) {
  Item.findByIdAndUpdate(req.params.id, req.body, function(err, item){
    if(err) return res.json({success: false, message: err});
    res.json({success:true, result:req.body});
  });
});

// DELETE Item
router.delete('/:id', function (req, res) {
  Item.findByIdAndRemove(function(err){
    if(err) return res.json({success: false, message: err});
    res.json({success:true});
  });
});

module.exports = router;



/**
 * @swagger
 * tags:
 *   - name: Items
 *     description: 아이템 CRUD
 * definitions:
 *   Item_request:
 *     type: object
 *     required:
 *       - manufactdate
 *       - expirationdate
 *       - type
 *       - information
 *       - originprice
 *       - saleprice
 *     properties:
 *       manufactdate: 
 *         type: string
 *         required: true
 *         description: 제조일자
 *       expirationdate: 
 *         type: string
 *         format: date-time
 *         required: true
 *         description: 유통기한
 *       type: 
 *         type: string
 *         required: true
 *         description: 제품 종류
 *       information: 
 *         type: string
 *         required: true
 *         description: 제품 설명
 *       originprice: 
 *         type: string
 *         required: true
 *         description: 원래 가격
 *       saleprice: 
 *         type: string
 *         required: true
 *         description: 할인 가격
 *   Item_request_obj:
 *     type: object
 *     required:
 *       - manufactdate
 *       - expirationdate
 *       - type
 *       - information
 *       - originprice
 *       - saleprice
 *     properties:
 *       manufactdate: 
 *         type: string
 *         required: true
 *         description: 제조일자
 *       expirationdate: 
 *         type: string
 *         format: date-time
 *         required: true
 *         description: 유통기한
 *       type: 
 *         type: string
 *         required: true
 *         description: 제품 종류
 *       information: 
 *         type: string
 *         required: true
 *         description: 제품 설명
 *       originprice: 
 *         type: string
 *         required: true
 *         description: 원래 가격
 *       saleprice: 
 *         type: string
 *         required: true
 *         description: 할인 가격
 *   Itme_response:
 *     type: object
 *     required:
 *       - success
 *     properties:
 *       success:
 *         type: boolean
 *   Item_data_response:
 *     type: object
 *     required:
 *       - _id
 *       - manufactdate
 *       - expirationdate
 *       - type
 *       - information
 *       - originprice
 *       - saleprice
 *     properties:
 *       _id: 
 *         type: string
 *         required: true
 *         description: 아이디
 *       manufactdate: 
 *         type: string
 *         required: true
 *         description: 제조일자
 *       expirationdate: 
 *         type: string
 *         format: date-time
 *         required: true
 *         description: 유통기한
 *       type: 
 *         type: string
 *         required: true
 *         description: 제품 종류
 *       information: 
 *         type: string
 *         required: true
 *         description: 제품 설명
 *       originprice: 
 *         type: string
 *         required: true
 *         description: 원래 가격
 *       saleprice: 
 *         type: string
 *         required: true
 *         description: 할인 가격
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
 *    /items:
 *      post:
 *        tags:
 *        - "Items"
 *        summary: "CREATE Item"
 *        description: ""
 *        consumes:
 *        - "application/json"
 *        produces:
 *        - "application/json"
 *        parameters:
 *        - in: "body"
 *          name: "body"
 *          description: "item 생성"
 *          required: true
 *          schema:
 *            $ref: "#/definitions/Item_request"
 *        responses:
 *          200:
 *            description: "생성 성공"
 *            schema:
 *              $ref: "#/definitions/Item_request_obj"
 *      get:
 *        tags:
 *        - "Items"
 *        summary: "GET ALL Item"
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
 *              $ref: "#/definitions/Item_data_response"
 *    /items/{id}:
 *      get:
 *        tags:
 *        - "Items"
 *        summary: "CREATE Item"
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
 *          description: The Item ID
 *        responses:
 *          200:
 *            description: "반환"
 *            schema:
 *              $ref: "#/definitions/Item_request"
 *      put:
 *        tags:
 *        - "Items"
 *        summary: "CREATE Item"
 *        description: ""
 *        consumes:
 *        - "application/json"
 *        produces:
 *        - "application/json"
 *        requestBody:
 *          description: "item 생성"
 *          required: true
 *          schema:
 *            $ref: "#/definitions/Item_request"
 *        parameters:
 *        - in: path
 *          name: id 
 *          required: true
 *          schema:
 *            type: String
 *          description: The Item ID
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
 *        - "Items"
 *        summary: "REMOVE Item"
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
 *          description: The Item ID
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

