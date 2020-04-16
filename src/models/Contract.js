/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Contract', {
    contractId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true
    },
    sellerId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Seller',
        key: 'sellerId'
      }
    },
    enterpriseId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Enterprise',
        key: 'enterpriseId'
      }
    },
    approval: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    }
  }, {
    tableName: 'Contract'
  })
}
