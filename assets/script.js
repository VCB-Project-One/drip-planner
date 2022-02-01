var forecastContainer = document.querySelector("#forecast-container");
var forecastArray = [];
var forecastHeader = document.querySelector("#forecast-header");
var forecastLocation = {
    city: null,
    state: null
};
var modalOverlay = document.querySelector("#modal-overlay");
var savedTrips = [];
var tripsContainer = document.querySelector("#trip-container")
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
                    forecastLocation.city = data.properties.relativeLocation.properties.city;
                    forecastLocation.state = data.properties.relativeLocation.properties.state;
                    console.log("Retrieving forecast for " + forecastLocation.city + ", " + forecastLocation.state + "...");
                    console.log("Forecast link: " + data.properties.forecast);

                    // fetch forecast link 
                    fetch(data.properties.forecast)
                        .then(function(response) {
                            console.log("Forecast retrieved!")

                            // get seven-day forecast
                            response.json().then(function(data) {
                                var sevenDay = data.properties.periods;
                                forecastArray = [];

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
                                        isDaytime: sevenDay[i].isDaytime,
                                        icon: sevenDay[i].icon,

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

    
    //TODO: make forecast appear in a modal

    // make modal invisible
    modalOverlay.style.visibility = "visible";
    
    // make map iframe invisible (???)
    MapDivEl.style.visibility = "hidden";

    // close button functionality
    $("#forecast-close-btn").on("click", function() {
        modalOverlay.style.visibility = "hidden";
        MapDivEl.style.visibility = "visible";
    });

    // set forecast header to relativeLocation city and state
    document.querySelector("#forecast-header").textContent = "Showing forecast for: " + forecastLocation.city + ", " + forecastLocation.state;
    
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
        timeContainer.style = "display: inline-block; background-image: url(" + array[i].icon + ");";
        dayContainer.appendChild(timeContainer);

        var infoContainer = document.createElement("div");
        infoContainer.className = "info-container card";
        timeContainer.appendChild(infoContainer);

        var dayName = document.createElement("h3");
        dayName.className = "";
        dayName.innerHTML = array[i].name + " (" + array[i].date + ")";
        infoContainer.appendChild(dayName);

        var dayDetails = document.createElement("p");
        dayDetails.className = "";
        dayDetails.innerHTML = "Skies: " + array[i].shortForecast + 
            "</br>Temperature: " + array[i].temperature +
            "</br>Wind Speed: " + array[i].windSpeed;
        infoContainer.appendChild(dayDetails);

        var detailsBtn = document.createElement("button");
        detailsBtn.className = "details-btn";
        detailsBtn.dataset.forecastIndex = i;
        detailsBtn.textContent = "More Details";
        infoContainer.appendChild(detailsBtn);

        var addBtn = document.createElement("button");
        addBtn.className = "add-btn";
        addBtn.dataset.forecastIndex = i;
        addBtn.textContent = "Add to Trip";
        infoContainer.appendChild(addBtn);   

    }

    $(".details-btn").on("click", function() {
        let modalText = forecastArray[$(this).data("forecastIndex")].detailedForecast;
        var detailsText = document.querySelector("#detailed-forecast");

        //make details modal visible
        $("#details-overlay").css("visibility", "visible");

        //modal close button
        $("#details-close-btn").on("click", function(){
            $("#details-overlay").css("visibility", "hidden");
        });

        //set text to detailed forecast
        detailsText.textContent = JSON.stringify(modalText);
    })

    $(".add-btn").on("click", function() {
        console.log("add button with data-forecastIndex of [" + $(this).data("forecastIndex") + "] has been clicked");
    })
}

var saveTrip = function() {
    console.log("Trip saved")
}

var loadTrips = function() {
    //get savedTrips from local storage
    savedTrips = localStorage.getItem("trips");

    if (savedTrips = [] || savedTrips == null) {
        console.log("You don't have any saved trips!")

        var noTripsMessage = document.createElement("h4");
        noTripsMessage.className = "";
        noTripsMessage.textContent = "You don't have any saved trips!";
        tripsContainer.appendChild(noTripsMessage);
    }
    else {
        console.log("Saved trips: " + savedTrips)

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
        var mapLat = (e.latlng.lat);
        var mapLon = (e.latlng.lng);
        getForecast(mapLat, mapLon);
    }

    map.on("click", mapClick);
};



/////////////////// CALL FUNCTIONS //////////////////
// getForecast();
loadTrips();
locationInputEl.addEventListener("submit", getLocation);

