var forecastContainer = document.querySelector("#forecast-container");
var locationInputEl = document.querySelector("#destination-form");
var CityInputEl = document.querySelector("#destination");

// lat/lon variables
var lat = "";
var lon = "";

// function to get the city name from input
var getLocation = function(event) {
    event.preventDefault();
    var city = CityInputEl.value.trim();
    getCoords(city);
}

// function to get city lat/lon
var getCoords = function(city) {

    var apiUrl = "http://api.openweathermap.org/geo/1.0/direct?q=" + city + "&appid=9f22897565b785c5e1809cff5dde2ef9";

    fetch(apiUrl)
        .then(function(response) {
            if (response.ok) {
                response.json().then(function(data) {
                    var lat = (data[0].lat);
                    var lon = (data[0].lon);
                    console.log(lat);
                    console.log(lon);
                    getForecast(lat, lon);
                });
            } else {
                console.log("Error connecting to openweather.com");
            }
    });
};

// function to get forecast for given lat/lon
var getForecast = function(lat, lon) {

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
                                        name: sevenDay[i].name,
                                        shortForecast: sevenDay[i].shortForecast,
                                        temperature: sevenDay[i].temperature + "\U+00B0" + sevenDay[i].temperatureUnit,
                                        windSpeed: sevenDay[i].windSpeed,
                                        detailedForecast: sevenDay[i].detailedForecast,
                                        isDayTime: sevenDay[i].isDayTime
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
    // delete existing content
    var content = document.getElementsByClassName("day-container");
    while(content.length > 0){
        content[0].parentNode.removeChild(content[0]);
    }

    // convert array from JSON object to string
    JSON.stringify(array);
    var forecastEl = null;

    for (i=0; i<array.length; i++) {
        console.log("Working array: " + JSON.stringify(array[i]) );

        // create container for individual forecast
        if (array[i].isDayTime == true || forecastEl == null) {
            forecastEl = document.createElement("div");
            forecastEl.className = "day-container";
            forecastEl.id = "forecastEl-" + i;
            forecastContainer.appendChild(forecastEl);
        }

        var dayName = document.createElement("h3");
        dayName.className = "";
        dayName.textContent = array[i].name;
        forecastEl.appendChild(dayName);

        var dayDetails = document.createElement("p");
        dayDetails.className = "";
        dayDetails.textContent = array[i].shortForecast;
        forecastEl.appendChild(dayDetails);
    }
}


var map = L.map('map').setView([36.162, -86.781], 13);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoid2luZ3JhbTEiLCJhIjoiY2t5dzl6Z2t1MDYyNjJucXBiNHdvcTd5diJ9.GqWwwJ4INQXw49NCNZuEQQ'
}).addTo(map);


/////////////////// CALL FUNCTIONS //////////////////
// getForecast();
locationInputEl.addEventListener("submit", getLocation);