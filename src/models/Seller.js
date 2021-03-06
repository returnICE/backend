/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Seller', {
    sellerId: {
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
      allowNull: false,
      unique: true
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
    totalSubs: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    lat: {
      type: "DOUBLE",
      allowNull: true
    },
    lon: {
      type: "DOUBLE",
      allowNull: true
    },
    imgURL: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    info: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    minPrice: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    contractable: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '0'
    }
  }, {
    tableName: 'Seller'
  });
};
