/**
 * jobs_psoftv3.js - NodeJS script for jobs functionality for PredictSoft v3.00+
 * DOES NOT ACCEPT INCOMING REQUESTS, RUNS IN DAEMON MODE
 * Jobs handled:
 *  - scheduled match locks
 *  - scheduled database backups
 *  - (OPT)scheduled match activations
 * Created by G (ever3stmomo@gmail.com) on 4/8/2017.
 *
 */
var express = require('express');
var app = express();
const fs = require('fs');
var Sequelize = require('sequelize');
var moment = require('moment');

var schedule = require('node-schedule');

var mysqlDump = require('mysqldump');

const utils = require('./psoft_modules/utils');
const config = utils.Config;
config.init();                      //need to init config before loading log and DB handles


var log = utils.Log;
var database = utils.Database;

/*==========================Load config===================================*/

const psoft_config_parameters = require('./config/psoft_config.js');
const db_config_parameters = require('./config/dbconfig.js');
const psoft_job_port = psoft_config_parameters.r00t_port;         //psoft_job_port that predictsoft r00t will run on
const lock_threshold = psoft_config_parameters.match_lock_threshold_in_minutes;        //look-ahead time in minutes
const tz_offset = psoft_config_parameters.server_timezone_offset || '+00:00';

var lock_time_table = [];
var db_bkp_time_table = [];

/*========================== OLD SCHEDULER =====================================*/
var lockMatch1_OLD_useforEmailCode = schedule.scheduleJob('Lock1','55 10 * * *',function(){      //1 hour prior to 10:30 am EST
    lockMatch(lock_threshold)
        .then(function () {
            var lock_done_msg = "*** Upcoming match has been locked successfully at 10:55 AM EDST by psoft scheduler.";
            log.info(lock_done_msg);
            /*getPredictionList()
                .then(function (pred_list) {
                    sendEmailWithPredictions(pred_list);
                    return;
                })*/
        })
        .catch(function(err){
            log.info("Error trying to lock match by schedule at 9:30 AM EDST. Description: ",err);
            return;
        });
});
/*==============================================================================*/

//read from config file and initialize the time schedule(s) when script will be run into an array
var initLockScheduler = function(){
    var config_hours = psoft_config_parameters.match_lock_times;
    if(!config_hours || !config_hours.length){
        log.error('Could not load config hours.Automatic scheduled lock will NOT run.');
        return;
    }
    config_hours.forEach(lockTime=>{
        lock_time_table.push(addLockSchedule(lockTime));
        log.info("Added new auto-lock schedule at",lockTime,"hrs to the schedule list.");
    });

    return Promise.all(lock_time_table)
        .then(lockSetupResponse =>{
            log.info('Lock time table has been initialized.');
            return;
        })
        .catch(error=>{
            log.error(error);
        });
};

/* private methods */
var lockMatch = function(threshold){
    var SP_query = "CALL sp_lock_next_match(" + threshold + ",'" + config.psTZOffset + "');";
    log.info("Running stored procedure to lock matches within the next " + threshold + " minutes...");
    return database.query(SP_query)
    .then(()=> {
        log.info('***psoft job was run by scheduler to lock the next upcoming game(s)');
    })
    .catch(err=>{
        console.error(err);
    });
};

var activateNextMatch = function(){
    log.info("Running automated stored procedure to activate next day's match(es)");
    var SP_activate_query = "CALL sp_activate_next_match();";
    return database.query(SP_activate_query);
};

var addLockSchedule = function(lockTime){
    return new Promise(function(resolve,reject){
        return schedule.scheduleJob('Lock-Active-Matches-Job @ '+lockTime,getScheduleTimeFormat(lockTime),function(){
            lockMatch(lock_threshold)
                .then(()=> {
                    var lock_done_msg = "*** Upcoming match has been locked successfully at " + lockTime + " EDST by psoft scheduler.";
                    log.info(lock_done_msg);
                    resolve(lock_done_msg);
                    return;
                })
                .catch(err => {
                    console.error(err);
                    reject("The lock scheduler encountered an error trying to lock match at " + lockTime + " hrs EDST. Description: ",err);
                    return;
                });
        });
    });
};

var getScheduleTimeFormat = function(hhmmTime){
    var timeArr = hhmmTime.split(':');
    var hour = timeArr[0].trim();
    var min = timeArr[1].trim();
    return min + " " + hour + " * * *";         //run everyday at these times
};

//mysqldump section
var sqlBackupFileFolder = __dirname + "/" + (psoft_config_parameters.db_bkp_directory_name || 'psoft_backups');

//create backup folder if it doesn't exist
if (!fs.existsSync(sqlBackupFileFolder)) {
    fs.mkdirSync(sqlBackupFileFolder);
};

var backupPsoftDatabase = function(fullBackupFilePath){
    mysqlDump({
        host    : db_config_parameters.host,
        user    : db_config_parameters.user,
        password: db_config_parameters.password,
        database: db_config_parameters.database,
        dest    : fullBackupFilePath // destination file
    },function(err){
    });
    log.info("***psoft jobs has automatically backed up the app database to file: " + fullBackupFilePath);
    return;
}

var addDBBackupSchedule = function(backupTime){
    var sqlBackupFileFullPath = '';
    return new Promise(function(resolve,reject){
        return schedule.scheduleJob('Backup-Psoft-Database-Job @ '+backupTime,getScheduleTimeFormat(backupTime),function(){
            sqlBackupFileFullPath =  sqlBackupFileFolder + "/psoft_db_fifawc_" +  moment().format('YYYY-MM-DD__HH_mm').trim() + '_hrs.sql';
            backupPsoftDatabase(sqlBackupFileFullPath);
        })
    });
};

//set up two backup schedules, one after the last match has been locked for the day, and the other one at midnight
var initDatabaseBackupScheduler = function(){
    var backup_config_hours = psoft_config_parameters.db_backup_times;

    if(!backup_config_hours || !backup_config_hours.length){
        log.warn("Database backup time(s) is missing in the config file. The database will NOT be backed up on schedule.");
        return;
    }
    backup_config_hours.forEach(dbLockTime=>{
        //db_bkp_time_table.push(addLockSchedule(dbLockTime));
        db_bkp_time_table.push(addDBBackupSchedule(dbLockTime));
        log.info("Added new database backup schedule at",dbLockTime,"hrs to the schedule list.");
    });
};

app.listen(psoft_job_port);
log.info("Predictsoft automated jobs service started on port: " + psoft_job_port);
log.info("===================================");

initLockScheduler();
initDatabaseBackupScheduler();
//backupPsoftDatabase();