var forecastContainer = document.querySelector("#forecast-container");

// gets denver city center
var lat = 39.736762;
var lon = -104.963855;


// function to get forecast for given lat/lon
var getForecast = function() {

    // set api URL
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
                            console.log("Forecast retrieved!")
                            console.log(data);

                            // get seven-day forecast
                            response.json().then(function(data) {
                                var sevenDay = data.properties.periods;
                                var forecastArray = [];

                                // log each array index
                                for (i=0; i < sevenDay.length; i++) {
                                    // creates objects using forecast data
                                    var tempObject = {
                                        day: sevenDay[i].name,
                                        shortForecast: sevenDay[i].shortForecast
                                    };

                                    // push tempObject to forecastArray
                                    forecastArray.push(tempObject);
                                }

                                //generate HTML
                                generateForecast(forecastArray)
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

var generateForecast = function(array) {
    // convert array from JSON object to string
    JSON.stringify(array);

    for (i=0; i<array.length; i++) {
        console.log("Working array: " + JSON.stringify(array[i]) );

        // create container for individual forecast
        var forecastEl = document.createElement("div");
        forecastEl.className = "";
        forecastEl.id = "";
        forecastContainer.appendChild(forecastEl);

        var dayName = document.createElement("h3");
        dayName.className = "";
        dayName.textContent = array[i].day;
        forecastEl.appendChild(dayName);

        var dayDetails = document.createElement("p");
        dayDetails.className = "";
        dayDetails.textContent = array[i].shortForecast;
        forecastEl.appendChild(dayDetails);
    }
}




/////////////////// CALL FUNCTION //////////////////
getForecast();