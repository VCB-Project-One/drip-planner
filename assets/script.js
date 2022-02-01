var forecastContainer = document.querySelector("#forecast-container");
var locationInputEl = document.querySelector("#destination-form");
var CityInputEl = document.querySelector("#destination");
var MapDivEl = document.querySelector("#map");

// lat/lon variables
var lat = null;
var lon = null;

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
                    getMap(lat, lon);
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
                    console.log("Retrieving forecast for " + data.properties.relativeLocation.properties.city + ", " + data.properties.relativeLocation.properties.state + "...");
                    console.log("Forecast link: " + data.properties.forecast);

                    // fetch forecast link 
                    fetch(data.properties.forecast)
                        .then(function(response) {
                            console.log("Forecast retrieved!")

                            // get seven-day forecast
                            response.json().then(function(data) {
                                var sevenDay = data.properties.periods;
                                var forecastArray = [];

                                // log each array index
                                for (i=0; i < sevenDay.length; i++) {

                                    //convert date to MM/dd
                                    let date = sevenDay[i].startTime;
                                    var formattedDate = date.substring(5, 10);

                                    // creates objects using forecast data
                                    var tempObject = {
                                        name: sevenDay[i].name,
                                        date: formattedDate,
                                        shortForecast: sevenDay[i].shortForecast,
                                        temperature: sevenDay[i].temperature + "°" + sevenDay[i].temperatureUnit,
                                        windSpeed: sevenDay[i].windSpeed,
                                        detailedForecast: sevenDay[i].detailedForecast,
                                        isDaytime: sevenDay[i].isDaytime
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
    // var dayContainer = null;

    for (i=0; i<array.length; i++) {
        // create container for individual forecast
        if (array[i].isDaytime == true || dayContainer == null) {
            var dayContainer = document.createElement("div");
            dayContainer.className = "day-container";
            forecastContainer.appendChild(dayContainer);
        }

        var timeContainer = document.createElement("div");
        timeContainer.className = "time-container";
        dayContainer.appendChild(timeContainer);

        var dayName = document.createElement("h3");
        dayName.className = "";
        dayName.innerHTML = array[i].name + " (" + array[i].date + ")";
        timeContainer.appendChild(dayName);

        var dayDetails = document.createElement("p");
        dayDetails.className = "";
        dayDetails.innerHTML = "Skies: " + array[i].shortForecast + 
            "</br>Temperature: " + array[i].temperature +
            "</br>Wind Speed: " + array[i].windSpeed;
        timeContainer.appendChild(dayDetails);
    }
}

var getMap = function(lat, lon) {
    MapDivEl.innerHTML = "";

    var map = L.map('map').setView([lat, lon], 13);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1Ijoid2luZ3JhbTEiLCJhIjoiY2t5dzl6Z2t1MDYyNjJucXBiNHdvcTd5diJ9.GqWwwJ4INQXw49NCNZuEQQ'
    }).addTo(map);
    function mapClick(e) {
        console.log(e.latlng);
    }

    map.on("click", mapClick);
};



/////////////////// CALL FUNCTIONS //////////////////
// getForecast();
locationInputEl.addEventListener("submit", getLocation);

