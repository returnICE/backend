/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('EatenLog', {
    eatenId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true
    },
    eatenDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    customerId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Customer',
        key: 'customerId'
      }
    },
    menuId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Menu',
        key: 'menuId'
      }
    },
    score: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    enterpriseId: {
      type: DataTypes.STRING(16),
      allowNull: true
    }
  }, {
    tableName: 'EatenLog'
  })
}
