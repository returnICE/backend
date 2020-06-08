/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CampaignLog', {
    customerId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: {
        model: 'Customer',
        key: 'customerId'
      }
    },
    campaignId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'Campaign',
        key: 'campaignId'
      }
    },
    ccId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    }
  }, {
    tableName: 'CampaignLog'
  });
};
