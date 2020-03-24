var mongoose = require('mongoose');


var reserveSchema = mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  item_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Item' },
  reserveprice: { type: Number, required: true },
  win: { type: String, require: true, default: 'reserve' },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date }
});

reserveSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  this.model('User').update({ _id: this.user_id },
    { $push: { reserve_id: this._id } }).exec();
  this.model('Item').update({ _id: this.item_id },
    { $push: { reserve_id: this._id } }).exec();

  next();
});

reserveSchema.pre('remove', function (next) {
  console.log('asdasd')

  this.model('User').update({_id:this.user_id},
    { $pull: {reserve_id: this._id} }).exec();
  this.model('Item').update({_id:this.item_id},
    { $pull: {reserve_id: this._id} }).exec();
  next();
});

module.exports = mongoose.model('Reserve', reserveSchema);