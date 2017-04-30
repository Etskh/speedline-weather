'use strict';

const request = require('request');
const parseXml = require('xml2js').parseString;
const _ = require('lodash');
const bunyan = require('bunyan');

const log = bunyan.createLogger({
    name: 'server/lib/weather',
});

// Returns a promise
// then: parsed XML object from a URL
// catch: either error from URL or parsing XML
const parseXmlFromUrl = (url) => {
    return new Promise( (resolve, reject ) => {
        // Get the data from the url
        request(url, (err, response, data) => {
            log.info(`Making request to ${url} with status ${response.statusCode}`);
            if( err ) {
                return reject(err);
            }

            // Now parse the data we get back
            parseXml(data, function (err, result) {
                if( err ) {
                    return reject(err);
                }

                return resolve(result);
            });
        });
    });
};



// Transforms an array of values from sites
const translateSiteList = (siteList) => {
    // Cull the places we don't want first of all... this will speed up how many operations we need to do
    siteList = _.filter(siteList, {'provinceCode': ['BC']});
    // Flatten the results from {
    //    '$': { code: '' },
    //    nameEn: [''],
    //    nameFr: [''],
    //    provinceCode: ['']
    // }
    // to { name: code }

    const sites = {};
    siteList.forEach( site => {
        sites[site.nameEn[0]] = site.$.code;
    });

    return sites;
};


// gets the list of sites from environment canada
const getBCSiteList = () => {
    const url = 'http://dd.weather.gc.ca/citypage_weather/xml/siteList.xml';

    return parseXmlFromUrl(url).then(result => {
        // Transform from their format to something more useful for us!
        return translateSiteList(result.siteList.site);
    });
};


// gets the weather for a given site
const getWeatherForSite = (city, siteCode) => {
    const url = 'http://dd.weather.gc.ca/citypage_weather/xml/BC/' + siteCode + '_e.xml';
    return parseXmlFromUrl(url).then(result => {
        // Transform from their format to something more useful for us!
        const weather = result.siteData.currentConditions[0];

        // take the longitude and latitude, but cut the last character which is the cardinal direction
        // the cardinal direction will flip the sign of the number
        var longitude = weather.station[0].$.lon;
        var latitude = weather.station[0].$.lat;
        //                     is it south?                            parse the number
        latitude = (latitude[latitude.length-1]=='S'?-1:1) * parseFloat(latitude.slice(0, -1));
        longitude = (longitude[longitude.length-1]=='W'?-1:1) * parseFloat(longitude.slice(0, -1));

        return {
            city: city,
            // don't need> siteCode: siteCode,
            condition: weather.condition[0],
            temperature: weather.temperature[0]._, // denotes text
            latitude: latitude,
            longitude: longitude,
        };
    });
};


// gets the weather for a list of cities
const getWeatherForCities = ( cities ) => {
    return getBCSiteList().then( siteList => {
        const sitesWeather = [];
        cities.forEach( city => {
            const siteCode = siteList[city];
            if( !siteCode ) {
                throw Error(`No site code for city: "${city}"`);
            }

            sitesWeather.push( getWeatherForSite(city, siteCode));
        });

        return Promise.all(sitesWeather).then( results => {
            return results;
        });
    });
};



module.exports.getForCities = getWeatherForCities;
