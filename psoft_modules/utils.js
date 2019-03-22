/*
 ever3stmomo - 5/1/2018
 utils.js  - utility functions (with config object) for psoftv3
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
var Sequelize = require('sequelize');
const md5 = require('md5');
const moment = require('moment');

var Utils = module.exports = {
    Log: null,
    Database: {
        DBConnection: null,
        QueryList   : null,
        Game        : null,
        Team        : null,
        Prediction  : null,
        User        :  null,
        loadModels  : function(dbconnect){
            this.Game =  dbconnect.import(__dirname + '/../models/game');
            this.User = dbconnect.import(__dirname + '/../models/user');
            this.Team = dbconnect.import(__dirname + '/../models/team');
            this.Prediction = dbconnect.import(__dirname + '/../models/prediction');

            this.Game.hasMany(this.Team, {foreignKey: 'ID'});
            this.Team.belongsTo(this.Game,{foreignKey: 'ID', as: 'Team1iD', targetKey: 'ID'});
            //this.Team.belongsTo(this.Game,{foreignKey: 'Team2', as: 'Team2ID'});
        },
        query: function(queryString,queryType){
            //DANGER: validate that this.DBCOnnection has been initialized before this step!
            return new Promise(function(resolve,reject){
                if(Utils.isEmptyObject(Utils.Database.DBConnection)){
                    Utils.Log.warn('DBConnection was not initialized, so the query cannot be executed');
                    resolve({});
                    return;
                }
                Utils.Database.DBConnection.query(queryString,{type: queryType})
                .then(queryResponse =>{
                    resolve(queryResponse);
                    return;
                })
            .catch(e=>{
                reject(e);
                })
            })
        }
    },
    Config: {
        psAppName: '',
        psAppVersion: '',
        psAppPort: 0,
        psAppEnvironment: '',
        psLogDir: '',
        psLogMode: '',
        psIsRegistrationActive: false,
        psRunMode: '',
        psManualLockThreshold: '',
        psTZOffset: 0,     //timezone offset (use to convert time in DB into this offset when running compare queries
        /* init(): if this function fails, the application will quit with a message to the console */
        init: function () {
            //read and fill self from config files
            var psoftConfig = '';

            try {
                psoftConfig = require('../config/psoft_config');
                dbConfig = require('../config/dbconfig');
                //internal service stuff
                this.psAppName = psoftConfig.app_name || 'PSOFT_CONFIG_READ_ERROR';
                this.psAppVersion = psoftConfig.app_version || '???';
                this.psAppPort = psoftConfig.app_port || 8080;

                this.psIsRegistrationActive = psoftConfig.allow_registration || false;
                this.psRunMode = psoftConfig.run_mode || 'N/A';
                this.psLogLevel = psoftConfig.log_level || '';

                this.psManualLockThreshold = psoftConfig.match_lock_threshold_in_minutes || '15';     //15 minute by default

                //setup log config
                this.psLogDir = psoftConfig.log_directory_name || 'psoftv3_logs';
                if (!fs.existsSync(this.psLogDir)) {
                    // Create the directory if it does not exist
                    fs.mkdirSync(this.psLogDir);
                };
                this.psLogMode = psoftConfig.log_level || '';           //quiet (production mode) by default
                Utils.Log = new (winston.Logger)({
                    transports: [
                        new (winston.transports.Console)({
                            'timestamp': function () { return moment().format('YYYY-MM-DD HH:mm:ss').trim(); },
                            'colorize': true
                        }),
                        new (winston.transports.File)({
                            filename: path.join(this.psLogDir, '/Log-psoft(' + this.psAppVersion + ').log'),
                            'timestamp': function () { return moment().format('YYYY-MM-DD HH:mm:ss').trim(); }
                        })
                    ]
                });

                //load Sequelize config and setup DB connection...
                Utils.Database.DBConnection = new Sequelize(
                    dbConfig.database,    //Predictsoft DB
                    dbConfig.user,
                    dbConfig.password,
                    {
                        host: dbConfig.host,
                        dialect: 'mysql',
                        logging: dbConfig.logAll || false,
                        timestamps: false,
                        define: {
                            //freezeTableName: true          //so table names won't be assumed pluralized by the ORM
                        },
                        pool: {
                            max: 50,
                            min: 0,
                            idle: 10000
                        }
                    }
                );
                //if date/time on server is in EST, use 'US/Eastern' (or -04:00' in Windows) to bring it to UTC; useful for comparing (and locking, etc)
                this.psTZOffset = psoftConfig.server_timezone_offset || '00:00';        //UTC by default

                //...then load DB models
                Utils.Database.loadModels(Utils.Database.DBConnection);
                Utils.Log.info('Utils loaded...');
                
                //finally, load queries from external file
                Utils.Database.QueryList = require('../config/query_list');
            }
            catch (e) {
                console.error('Error trying to parse one or more config file(s). Details: \r\n', e);
                process.exit(1);
            }
        },
        getAppSignature: function () {
            //returns app details in a signature similar to "Tablefest Service - Core v1.00"
            return this.psAppName + ' v' + this.psAppVersion + ' [Port ' + this.psAppPort + ']';
        },
        getUserCount: function(){
            return new Promise(function(resolve,reject){
                Utils.Database.User.count()
                .then(c => {
                    resolve(c);
                })
                .catch(e => {
                    Utils.Log.error('Error trying to get number of users. Details: ',e);
                    reject(e);
                })                
            });
        },
        checkIfEmailIsRegistered: function(user_email){
            return new Promise(function(resolved,reject){
                Utils.Database.User.find({
                    where: {
                        email: user_email,
                    }
                })
                .then(c => {
                    resolve(c);
                })
                .catch(e => {
                    Utils.Log.error('Error trying to check if user email has been registered. Details: ',e);
                    reject(e);
                })
            })
        }
    },    
    ping: function (req, res) {
        {
            res.status(200).json({
                status: 'Ping! psoftv3 (SERVICE: ' + Utils.Config.getAppSignature() + ') is up and running',
                requestedBy: (req.psoftUser) ? req.psoftUser.name + '(is_admin: ' + req.psoftUser.admin + ')' : 'N/A'     //to support both auth and non-auth pings
            });
            Utils.Log.info('Ping successful!');
            res.end();
            return;
        }
    },
    hashString: function (message) {
        return md5(message);
    },
    isEmptyObject: function (obj) {
        return (!obj || obj === undefined ||  Object.keys(obj).length === 0);
    },
    isEmptyString: function (str) {
        return (this.isEmptyObject(str) || str === '');
    },
    parseAuthToken: function(bearer_token) {
        var words = bearer_token.split(' ');
        return words[1];
    },
    lockNextActiveMatch: function(req,res){
        Utils.Database.query("CALL sp_lock_next_match('" + Utils.Config.psManualLockThreshold + "','" + Utils.Config.psTZOffset + "');")
            .then(function(result){
                Utils.Log.info('Manual lock has run successfully, requested by user ',req.psoftUser.name);
                res.status(200).json({
                    success         : true,
                    message         : "Upcoming active matches have been locked!",
                    lock_threshold  :  Utils.Config.psManualLockThreshold,
                    server_offset_tz: Utils.Config.psTZOffset
                });
                res.end();
                return;
            })
            .catch(function(err){
            Utils.Log.warn("Could not manually lock upcoming active match(es). Details: \r\n",err);
                res.status(500).json({
                    success         : true,
                    message         : "Manual lock attempt for active match(es) failed.",
                    error_details   : err
                });
                res.end();
                return;
            });
    },
    lockAllActiveMatches: function(){
      log.info("Manual lock mode triggered for ALL ACTIVE MATCHES!!");
        //var SP_query = "CALL lock_tables('" + threshold + "');";
        //return sqlConn.query(SP_query);
        return database.Game.update(
            { isLocked: 1 },
            {returning: true, where: {isActive: 1} }
        )
            .then(function([updateGame,rowsUpdated]) {
                //console.log(">>",updatedGame);
                Utils.Log.info("##Updated rows: ",rowsUpdated);
                res.status(200).json({
                    status  : true,
                    message : rowsUpdated + ' rows were updated'
                });
                res.end();
                return;
            })
            .catch(function(err){
                Utils.Log.error("Unable to manually lock active match(es). Details: \r\n",JSON.stringify(err));
                res.status(200).json({
                    status  : false,
                    message : 'Could not update match(es). Please check error log.'
                });
                res.end();
                return;
            });
    },
    activateNextDayMatches: function(req,res){
        Utils.Log.info("Manually running stored procedure to activate next day's match(es)");
        Utils.Database.query('CALL sp_activate_next_match();')
            .then(function(){
                res.status(200).json({
                    success : true,
                    message : "Next day's match(es) activated successfully!"
                });
                res.end();
                return;
            })
            .catch(err =>{
                log.warn("Could not lock next day's match(es). Details: \r\n",JSON.parse(err));
                res.status(500).json({
                    success         : true,
                    message         : "Could not activate next day's match.",
                    error_details   : err
                });
                res.end();
                return;
            });
    },
    updateScores : function(req,res){
        if(!req.body || !req.body.match_id || !req.body.winning_team_id){
            res.status(500).json({
                success : true,
                message : "Invalid or missing parameter(s)"
            });
            res.end();
            return;
        }
        Utils.Log.info("Updating match ID "+req.body.match_id+", winning team ID: " + req.body.winning_team_id);
        Utils.Database.query('CALL sp_update_scores(' + req.body.match_id + ',' + req.body.winning_team_id + ');')
            .then(function(){
                res.status(200).json({
                    success         : true,
                    message         : "Updated successfully!",
                    match_id        : req.body.match_id,
                    winning_team_id : req.body.winning_team_id
                });
                res.end();
                return;
            })
            .catch(err =>{
            log.warn("Could not update score for match ID " + req.body.match_id + ". Details: \r\n",JSON.parse(err));
            res.status(500).json({
                success         : true,
                message         : "Could not update scores",
                match_id        : req.body.match_id,
                winning_team_id : req.body.winning_team_id,
                error_details   : err
            });
            res.end();
            return;
        });
    }
};
