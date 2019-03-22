/**
 * (C)grjoshi 4/20/2018
 * psoft_config.js - handles application config options
 * First-run instructions: Rename this file to psoft_config.js in the /config folder
 //==================================================================================
 */

module.exports = {
	app_port: 8990,
	app_name: 'Predictsoft',
    app_version: '3.0.0',
    app_description: '',
    app_environment: 'Dev',
    log_directory_name  : 'psoftv3_logs',
    //admin config ahead
    r00t_port: 8999,
    allow_registration: true,                       //'true' to allow new user registration
    match_lock_threshold_in_minutes: 15,			//defines the number of minutes before the match time to lock
    server_timezone_offset: 'US/Eastern',           //change to whatever timezone the service runs in (mysql running on WINDOWS: use '-04:00' format instead)
    match_lock_times : ['08:00:00','10:00:00'],     //all times in server standard time
    db_bkp_directory_name : 'psoftv3_db_backups',
    db_backup_times : ['00:00:00','10:00:00'],     //once at midnight, and once after the last match of the day has been locked
    //diagnostics etc
    run_mode: 'dev',                                    //dev or prod (dev by default)
    log_level: 'Verbose'                                                                 
};
