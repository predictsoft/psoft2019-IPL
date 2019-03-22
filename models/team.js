/*
ever3stmomo 3/30/2016
team.js - Models team table in database
*/
module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'team', 
    {
      ID: {type: DataTypes.INTEGER, primaryKey: true},
      Name:   {type: DataTypes.INTEGER, primaryKey: true}
    },
    {
    // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false
    // other configuration here    
    }
  );
}