/*
ever3stmomo 3/30/2016
user.js - Models users table in database
*/
module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'user', 
    {
      userID  : {type: DataTypes.INTEGER, primaryKey: true},
      name    : DataTypes.STRING,
      email   : DataTypes.STRING,
      password: DataTypes.STRING,
      avatar  : DataTypes.STRING,
      auth_key: DataTypes.STRING,
      isr00t  : DataTypes.INTEGER,
      points  : DataTypes.INTEGER
    });
}