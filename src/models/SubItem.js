/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('SubItem', {
    subId: {
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
    subName: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    price: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    limitTimes: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    term: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    subs: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    info: {
      type: DataTypes.STRING(256),
      allowNull: true
    }
  }, {
    tableName: 'SubItem'
  });
};
