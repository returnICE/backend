/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Menu', {
    menuId: {
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
    menuNaem: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    price: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    info: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    avgScore: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    tableName: 'Menu'
  })
}
