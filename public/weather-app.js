
$(document).ready(function() {

    var map;

    function getConditionIcon( condition ) {
        var conditions = [{
            condition: 'Sunny',
            icon: '/icons/weather/2.svg',
        }, {
            condition: 'Light Rain',
            icon: '/icons/weather/17.svg',
        }, {
            condition: 'Light Rainshower',
            icon: '/icons/weather/18.svg',
        }, {
            condition: 'Cloudy',
            icon: '/icons/weather/14.svg',
        }, {
            condition: 'Mostly Cloudy',
            icon: '/icons/weather/25.svg',
        }];
        for( var i=0; i< conditions.length; i++) {
            if( condition === conditions[i].condition ) {
                return conditions[i].icon;
            }
        }
        // we don't know - so return a big N/A
        return '/icons/weather/45.svg'
    }



    // Initialize the map and the custom overlay.
    function initMap() {
        // initialise map
        var britishColumbia = { lat: 54.591662, lng: -125.136171 };
        map = new google.maps.Map(document.getElementById('map'), {
          center: britishColumbia,
          zoom: 5,
        });
    }

    function initCities(cities) {
        cities.forEach( function(city) {
            var location = { lat: city.latitude, lng: city.longitude };
            var image = {
              url: getConditionIcon(city.condition),
              // the icons are 512x512, but let's resize them
              size: new google.maps.Size(512, 512),
              scaledSize: new google.maps.Size(48, 48),
              origin: new google.maps.Point(0, 0),
              // Set the icon to appear above the city  LIKE REAL WEATHER
              anchor: new google.maps.Point(24, 64),
            };

            var marker = new google.maps.Marker({
                position: location,
                map: map,
                icon: image,
                title: city.city,
            });
            marker.addListener('click', function() {
                map.panTo(new google.maps.LatLng(this.position.lat(), this.position.lng()));
                console.log(city);
                $('#temperature').text(city.temperature);
                $('#condition').text(city.condition);
                $('#cityName').text(city.city);
                $('#info').show('fast');
            });
        });
    }

    // First let's init the map so we have something to show
    initMap();

    // Get all the cities, then show them
    $.get('/cities', {}, function(response) {
        initCities(response);
    });
});
