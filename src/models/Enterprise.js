/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Enterprise', {
    enterpriseId: {
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
    address: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    info: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    enterpriseCode: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    amountPerDay: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    amountPerMonth: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    lat: {
      type: "DOUBLE",
      allowNull: true
    },
    lon: {
      type: "DOUBLE",
      allowNull: true
    }
  }, {
    tableName: 'Enterprise'
  });
};
