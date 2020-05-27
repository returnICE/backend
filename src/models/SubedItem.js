/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('SubedItem', {
    customerId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Customer',
        key: 'customerId'
      }
    },
    subId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'SubItem',
        key: 'subId'
      }
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    term: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    limitTimes: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    autoPay: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: '1'
    },
    usedTimes: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: '0'
    },
    subedId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    resetDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'SubedItem'
  });
};
