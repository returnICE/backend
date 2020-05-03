/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Menu', {
    menuId: {
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
    menuName: {
      type: DataTypes.STRING(16),
      allowNull: true
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
  });
};
