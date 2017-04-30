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


// App configuration
const config = {
    name: 'app',
    googleApi: 'AIzaSyBw5nAdKr_m6689UqfkIGTAG3GxAc40rjU',
    default_port: 3000,
};
// If we have an environment variable for PORT set,
// like on Heroku, then use that instead of default
config.port = process.env.PORT || config.default_port;



// Set up static assets and compression
app.use(express.static('public'));
app.use(compression());

// Configure templates
nunjucks.configure('server/views', {
    autoescape: true,
    express: app,
});

// Initialise logging
const log = bunyan.createLogger({
    name: config.name,
});

// Whenever calling the root route, log the request
app.all('/', function(req, res, next) {
    log.info(`Requesting page ${req.url}`);
    next();
});
app.get('/', function(req, res) {
    res.render('app.html', {
        googleApi: config.googleApi,
        version: pkg.version,
    });
});

app.get('/cities', function(req, res) {
    // Get the cities
    const cityList = [
        'Dease Lake',
        'Fort Nelson',
        'Terrace',
        'Prince George',
        'Whistler',
        'Revelstoke',
        'Creston',
    ];
    weather.getForCities(cityList)
    .then(cities => {
        // now render the page
        res.json(cities);
    }).catch(err => {
        log.error(`${err}`);
        res.json(err);
    });
});


// Finially, initialise the app
app.listen(config.port, function() {
    log.info(`Starting app on port ${config.port}`);
});
