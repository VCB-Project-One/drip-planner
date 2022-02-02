var forecastContainer = document.querySelector("#forecast-container");
var forecastArray = [];
var savedCards = [];
var forecastHeader = document.querySelector("#forecast-header");
var forecastLocation = {
    city: null,
    state: null
};
var modalOverlay = document.querySelector("#modal-overlay");
var savedTrips = [];
var currentTrip = null;
var tripsContainer = document.querySelector("#trip-container")
var locationInputEl = document.querySelector("#destination-form");
var CityInputEl = document.querySelector("#destination");
var MapDivEl = document.querySelector("#map");

// lat/lon variables
var lat = null;
var lon = null;

// initialize modals
$('#tripModal').modal({ show: false});

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
                                        city: forecastLocation.city,
                                        state: forecastLocation.state,
                                        shortForecast: sevenDay[i].shortForecast,
                                        temperature: sevenDay[i].temperature + "°" + sevenDay[i].temperatureUnit,
                                        windSpeed: sevenDay[i].windSpeed,
                                        detailedForecast: sevenDay[i].detailedForecast,
                                        isDaytime: sevenDay[i].isDaytime,
                                        icon: sevenDay[i].icon,
                                        relativeDate: sevenDay[i].number, // for resetTrip function
                                        absoluteDate: sevenDay[i].startTime // for updateTrip function
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

    // GENERATE FORECAST MODAL
    modalOverlay.style.visibility = "visible";
    
    // make map iframe invisible (???) - was causing issues
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

    for (i=0; i<array.length; i++) {
        // create container for individual forecast
        if (array[i].isDaytime == true || dayContainer == null) {
            var dayContainer = document.createElement("div");
            dayContainer.className = "day-container";
            forecastContainer.appendChild(dayContainer);
        }

        var timeContainer = document.createElement("div");
        timeContainer.className = "time-container";
        timeContainer.id = "tempCard-" + i;
        timeContainer.dataset.id = "timeCard-" + i;
        timeContainer.dataset.isDayTime = array[i].isDayTime;
        timeContainer.dataset.relativeDate = array[i].relativeDate;
        timeContainer.dataset.absoluteDate = array[i].absoluteDate;
        timeContainer.style = "display: inline-block; background-image: url(" + array[i].icon + ");";
        dayContainer.appendChild(timeContainer);

        var infoContainer = document.createElement("div");
        infoContainer.className = "info-container card";
        timeContainer.appendChild(infoContainer);

        var dateEl = document.createElement("h3");
        dateEl.className = "";
        dateEl.innerHTML = array[i].name + " (" + array[i].date + ")";
        infoContainer.appendChild(dateEl);

        var dayDetails = document.createElement("p");
        dayDetails.className = "";
        dayDetails.innerHTML = "Skies: " + array[i].shortForecast + 
            "</br>Temperature: " + array[i].temperature +
            "</br>Wind Speed: " + array[i].windSpeed;
        infoContainer.appendChild(dayDetails);

        var detailsBtn = document.createElement("button");
        detailsBtn.className = "details-btn";
        detailsBtn.dataset.details = array[i].detailedForecast;
        detailsBtn.textContent = "More Details";
        infoContainer.appendChild(detailsBtn);

        var addBtn = document.createElement("button");
        addBtn.className = "add-btn";
        addBtn.dataset.forecastIndex = i;
        addBtn.dataset.details = array[i].detailedForecast;
        addBtn.dataset.toggle = "modal";
        addBtn.dataset.target = "#exampleModal";
        addBtn.textContent = "Add to Trip";
        infoContainer.appendChild(addBtn);  
    }
    
    // See additional details for forecast card
    $(".details-btn").on("click", detailsButtonHandler)

    // ADD FORECAST CARD TO TRIP
    $(".add-btn").on("click", addButtonHandler)
}

var detailsButtonHandler = function(event) {
    console.log("details button clicked");
    console.log(event.target.dataset.details)

    let modalText = event.target.dataset.details;
    var detailsText = document.querySelector("#detailed-forecast");

    //make details modal visible
    $("#details-overlay").css("visibility", "visible");
    //make map invisible
    MapDivEl.style.visibility = "hidden";

    //modal close button
    $("#details-close-btn").on("click", function(){
        $("#details-overlay").css("visibility", "hidden");
        MapDivEl.style.visibility = "visible";
    });

    //set text to detailed forecast
    detailsText.textContent = JSON.stringify(modalText);
}


var addButtonHandler = function(event) {  
    // hide modal, show map
    modalOverlay.style.visibility = "hidden";
    MapDivEl.style.visibility = "visible"

    //create new variable using clicked object
    forecastIndex = event.target.dataset.forecastIndex;


    //GET trip you need; if no trips, make a new one
    if (savedTrips.length === 0) {
    
        // set trip name
        var tripName = "Trip " + (savedTrips.length + 1);

        // Make new trip object
        var newTrip = {
            name: tripName,
            stops: [], //STOP is an object; going to make a function to generate cards based on stop
            index: savedTrips.length
        }

        // Make trip stops object
        var newStop = forecastArray[forecastIndex];

        newTrip.stops.push(newStop);

        console.log("newTrip: " + JSON.stringify(newTrip));
    
        newTrip.stops.sort(function(a, b){return a.relativeDate - b.relativeDate});

        //update currentTrip and savedTrips
        currentTrip = newTrip;
        savedTrips.push(newTrip);

        // Set to localStorage
        saveTrips();

        // TODO: Generate HTML
        // generateTrip(currentTrip);
    } 
    else if (savedTrips.length > 0) {
        // if no trip selected, tell them to select one
        if (currentTrip === null ) {
            console.log("No trip selected. Select a trip first!")
        }
        else if (currentTrip) {
            var newStop = forecastArray[forecastIndex];
            console.log(newStop)

            currentTrip.stops.push(newStop); //
            console.log("Updated currentTrip: " + JSON.stringify(currentTrip.stops))

            currentTrip.stops.sort(function(a, b){return a.relativeDate - b.relativeDate});
            console.log("Sorted currentTrip: " + JSON.stringify(currentTrip.stops));

            //update savedTrips
            savedTrips[currentTrip.index] = currentTrip;

            saveTrips;
        }
        else (console.log("Error dealing with currentTrip"))
    } 
    else {
        console.log("Error loading savedTrips")
    }
}

var generateList = function() {
    // generate list of trips from savedTrips
    for (i=0; i<savedTrips.length; i++) {
        var workingListItem = document.createElement("h4");
        workingListItem.className = "";
        workingListItem.id = "trip-list-item-" + i;
        workingListItem.textContent = savedTrips[i].name;
        tripsContainer.appendChild(workingListItem);

        //TODO: make container for h4 element

        //TODO: make edit & delete buttons
    }
}

var generateTrip = function(chosenTrip) {
    //// GENERATE HTML ////
    // Title
    $("#trip-title").text(chosenTrip.name);

    // Body
    var dayContainer = document.createElement("div");
    dayContainer.className = "day-container col-12";
    dayContainer.innerHTML = "<h6>" + newStop.name +"</h6>"
    dayContainer.dataset.date = newStop.date
    $("#trip-container").append(dayContainer);

    var cardContainer = document.createElement("div");
    cardContainer.className = "container";
    dayContainer.appendChild(cardContainer);

    var cardRow = document.createElement("div");
    cardRow.className = "row";
    cardContainer.appendChild(cardRow);

    var timeContainer = document.createElement("div");
    timeContainer.className = "time-container";
    timeContainer.dataset.isDayTime = newStop.isDayTime;
    timeContainer.dataset.relativeDate = newStop.relativeDate;
    timeContainer.dataset.absoluteDate = newStop.absoluteDate;
    timeContainer.style = "display: inline-block; background-image: url(" + newStop.icon + ");";
    cardRow.appendChild(timeContainer);

    var infoContainer = document.createElement("div");
    infoContainer.className = "info-container card";
    timeContainer.appendChild(infoContainer);

    var dayName = document.createElement("h3");
    dayName.className = "";
    dayName.innerHTML = newStop.city, newStop.state;
    infoContainer.appendChild(dayName);

    var dayDetails = document.createElement("p");
    dayDetails.className = "";
    dayDetails.innerHTML = "Skies: " + newStop.shortForecast + 
        "</br>Temperature: " + newStop.temperature +
        "</br>Wind Speed: " + newStop.windSpeed;
    infoContainer.appendChild(dayDetails);

    var detailsBtn = document.createElement("button");
    detailsBtn.className = "details-btn";
    detailsBtn.dataset.details = newStop.detailedForecast;
    detailsBtn.textContent = "More Details";
    infoContainer.appendChild(detailsBtn);

    // See additional details for forecast card
    // TODO: bug causing details modal to appear underneath other modal
    $(".details-btn").on("click", detailsButtonHandler)
}

var saveTrips = function() {
    localStorage.setItem("Trips", JSON.stringify(savedTrips));
};

var loadTrips = function() {
    //get savedTrips from local storage
    savedTrips = localStorage.getItem("Trips");

    if (savedTrips === [] || savedTrips === null) {
        console.log("You don't have any saved trips!")

        savedTrips = [];

        var noTripsMessage = document.createElement("h4");
        noTripsMessage.className = "";
        noTripsMessage.id = "no-trips-message";
        noTripsMessage.textContent = "You don't have any saved trips! Input a city to get started.";
        tripsContainer.appendChild(noTripsMessage);
    }
    else {
        console.log("Saved trips: " + savedTrips)
        savedTrips = localStorage.getItem("Trips");

        //check if any trips; if not, set to empty array
        if (savedTrips === null) {
            savedTrips = [];
        } else {
            // turn from string back into js object
            savedTrips = JSON.parse(savedTrips);
        }
        // Generate HTML inside trip container
        generateList();
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