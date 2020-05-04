/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Customer', {
    customerId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true
    },
    pw: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    salt: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true
    },
    birth: {
      type: DataTypes.STRING(32),
      allowNull: false
    }
  }, {
    tableName: 'Customer'
  });
};
