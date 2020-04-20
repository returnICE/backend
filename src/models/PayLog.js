/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('PayLog', {
    LogId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    customerId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Customer',
        key: 'customerId'
      }
    },
    payDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    subId: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    }
  }, {
    tableName: 'PayLog'
  })
}
