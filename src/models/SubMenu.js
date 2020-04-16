/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('SubMenu', {
    smId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true
    },
    subId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'SubItem',
        key: 'subId'
      }
    },
    menuId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Menu',
        key: 'menuId'
      }
    }
  }, {
    tableName: 'SubMenu'
  })
}
