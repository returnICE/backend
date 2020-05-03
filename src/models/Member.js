/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Member', {
    memberId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
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
    customerId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Customer',
        key: 'customerId'
      }
    }
  }, {
    tableName: 'Member'
  });
};