/*
 (C)gjoshi(ever3stmomo@gmail.com) 4/20/2018
 psoft3.js -    Main server code for PredictSoft v3
                Handles database operations and APIs for reading/writing data
                Forked off of NoFApp v1 built for Twenty 20 Cricket 2016
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

//load configuration
const util = require('./psoft_modules/utils');
const config = util.Config;
config.init();
var log = util.Log;

const app_routes = require('./psoft_modules/routes');
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//default route (to be replaced by angular 2/5 in the future)
app.use("/", express.static(__dirname + '/web/index.html'));

app.all("/*",function (req,res,next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
    if (req.method == 'OPTIONS') {
        res.status(200).end();
    } else {
        if(config.tfLogMode === "Verbose"){
            log.info("REQUEST Params: ",req.params,"; BODY: ", req.body);
        }
        next();
    }
});
 
// All requests that start with /api/v1/* will have their token validated.
app.all('/api/v1/*', [require('./psoft_modules/requestvalidator')]);        // Auth Middleware - validates user token

app.use('/api', app_routes);                                                // Use router for all requests that start with /api

// If none of the routes matched, it must be a 404
app.use(function(req, res, next) {
    var err = new Error('Not Found!');
    err.status = 404;
    res.status(404).json({message:"404 - Not Found"});
    res.end();
});

app.listen(config.psAppPort);
log.info(config.getAppSignature()+'[Running as '+config.psRunMode+' environment]');
if(config.psIsRegistrationActive == true){
    log.info('Registration is active.');
}
else{
    log.warn('Registration period has expired');
}

if(config.psLogLevel === 'Verbose'){
    config.getUserCount()
    .then(function(numberOfUsers){
        log.info('There are '+numberOfUsers+' registered users in the game.')
    })
    .catch(function(err){
        log.warn('There were one or more errors. Check logs. \r\nDetails: ',err);
    })
}