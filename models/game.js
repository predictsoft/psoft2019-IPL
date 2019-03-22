/*
ever3stmomo 3/30/2016
game.js - Models match table in database
*/
module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'games',
    {
        ID          : {type: DataTypes.INTEGER, primaryKey: true},
        Team1       : {
            type: DataTypes.UUID,
            allowNull: false
          },
        //Team1       : DataTypes.INTEGER,
        Team2       : {
            type: DataTypes.UUID,
            allowNull: false
          },
        isActive    : DataTypes.INTEGER,
        isHidden    : DataTypes.INTEGER,
        isLocked    : DataTypes.INTEGER,	  
        matchDate   : DataTypes.DATEONLY,
        matchTime   : DataTypes.TIME,
        winningTeamID: DataTypes.INTEGER,
        gameType   : DataTypes.STRING
    });
}