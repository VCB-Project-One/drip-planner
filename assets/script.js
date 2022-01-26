// gets denver city center
var lat = 39.736762;
var lon = -104.963855;

var getForecast = function() {
    var apiUrl = "https://api.weather.gov/points/" + lat + "," + lon;

    //connect to weather.gov
    fetch(apiUrl)
        .then(function(response) {
            if (response.ok) {
                console.log("Connection made successfully");

                response.json().then(function(data) {
                    // log data object
                    console.log(data)
                    console.log("Retrieving forcast for " + data.properties.relativeLocation.properties.city + ", " + data.properties.relativeLocation.properties.state + "...");

                    // get forecast link 
                    fetch(data.properties.forecast)
                        .then(function(response) {
                            console.log("Forcast retrieved!")
                            console.log(data);

                            // get seven-day forecast
                            response.json().then(function(data) {
                                var sevenDay = data.properties.periods;

                                // log each array index
                                for (i=0; i < sevenDay.length; i++) {
                                console.log(sevenDay[i].name + ": " + sevenDay[i].shortForecast);
                                }
                            })
                        })
                        .catch(function(error) {
                            console.log("Error! Unable to retrieve forecast");
                        })
                })
            }
            else {
                console.log("Error connecting to weather.gov api");
            }
        })
        .catch(function(error) {
            console.log("Unable to connect to weather.gov");
        })

}

getForecast();