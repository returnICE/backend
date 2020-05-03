/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('SubMenu', {
    smId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    subId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'SubItem',
        key: 'subId'
      }
    },
    menuId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'Menu',
        key: 'menuId'
      }
    }
  }, {
    tableName: 'SubMenu'
  });
};
