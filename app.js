'use strict';

const fs = require('fs');
const express = require('express');
const nunjucks = require('nunjucks');
const compression = require('compression')
const bunyan = require('bunyan');




const pkg = require('./package');
const weather = require('./server/lib/weather');


// Initialise the application
const app = express();

const config = {
    name: 'app',
    googleApi: 'AIzaSyBw5nAdKr_m6689UqfkIGTAG3GxAc40rjU',
    default_port: 3000,
};
config.port = process.env.PORT || config.default_port;


app.use(express.static('public'));
app.use(compression());

nunjucks.configure('server/views', {
    autoescape: true,
    express: app,
});


const log = bunyan.createLogger({
    name: config.name,
});


app.all('/', function(req, res, next) {
    log.info(`Requesting page ${req.url}`);
    next();
});

app.get('/', function(req, res) {

    const cityList = ['Comox', 'Vancouver'];
    weather.getForCities(cityList)
    .then(cities => {
        res.render('app.html', {
            cities: JSON.stringify(cities, null, 2),
            googleApi: config.googleApi,
            version: pkg.version,
        });
    }).catch(err => {
        res.render('error.html', {
            error: err,
        });
    });
});

app.listen(config.port, function() {
    log.info(`Starting app on port ${config.port}`);
});
