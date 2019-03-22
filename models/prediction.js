/*
ever3stmomo 3/30/2016
prediction.js - Models predictions table in database
*/
module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'prediction', 
    {
      playerID        : {type: DataTypes.INTEGER, primaryKey: true},
      matchID         : {type: DataTypes.INTEGER, primaryKey: true},
      predictedTeamID : DataTypes.INTEGER
    });
}