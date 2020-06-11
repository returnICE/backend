/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CampaignLog', {
    customerId: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    campaignId: {
      type: DataTypes.INTEGER(11),
      allowNull: false
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
