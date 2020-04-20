/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Campaign', {
    campaignId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    sellerId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Seller',
        key: 'sellerId'
      }
    },
    transmitDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    info: {
      type: DataTypes.STRING(256),
      allowNull: true
    }
  }, {
    tableName: 'Campaign'
  })
}
