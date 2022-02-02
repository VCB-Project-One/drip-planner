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
var tripsContainer = document.querySelector("#trip-container");
var listContainer = null;
var locationInputEl = document.querySelector("#destination-form");
var cityInputEl = document.querySelector("#destination");
var stateInputEl = document.querySelector("#state");
var MapDivEl = document.querySelector("#map");

// map variable
var map = null;
// lat/lon variables
var lat = null;
var lon = null;

// initialize modals
$('#tripModal').modal({ show: false});

// function to get the city name from input
var getLocation = function(event) {
    event.preventDefault();
    var city = cityInputEl.value.trim();
    var state = stateInputEl.value.trim();
    console.log(state);
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
        timeContainer.style = "display: inline-block; saveground-image: url(" + array[i].icon + ");";
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
        savedTrips.push(currentTrip);

        // Set to localStorage
        saveTrips();

        // TODO: Generate HTML
        generateTrip();
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

            // set to localStorage
            saveTrips();

            //generate updated array
            generateTrip();
        }
        else (console.log("Error dealing with currentTrip"))
    } 
    else {
        console.log("Error loading savedTrips")
    }
}

var generateList = function() {
    // reset currentTrip
    if (currentTrip != null) {
        currentTrip = null;

        // delete everything but trip title
        $("#trip-container").children().remove();
    }

    //generate title
    var containerTitle = document.createElement("h3");
    containerTitle.className = "text-center";
    containerTitle.id = "trip-title";
    containerTitle.textContent = "Saved Trips"
    tripsContainer.appendChild(containerTitle);

    // generate list container
    var listContainer = document.createElement("div");
    listContainer.className = "container-lg col-md-4 bg-white border border-dark rounded m-3";
    listContainer.id = "list-container";
    listContainer.style = "width: 100%";
    tripsContainer.appendChild(listContainer);

    // generate list of trips from savedTrips
    for (i=0; i<savedTrips.length; i++) {
        var workingListItem = document.createElement("div");
        workingListItem.className = "";
        workingListItem.id = "trip-list-item-" + i;
        workingListItem.dataset.id = i;
        listContainer.appendChild(workingListItem);

        var workingListTitle = document.createElement("h4");
        workingListTitle.className = "";
        workingListTitle.textContent = savedTrips[i].name;
        workingListItem.appendChild(workingListTitle);

        //TODO: make container for h4 element
        var savedTripContainer = document.createElement("div");
        savedTripContainer.appendChild(workingListItem);
        //TODO: make edit & delete buttons
        var editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit"
        workingListItem.appendChild(editBtn);

        var deleteBtn =  document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        workingListItem.appendChild(deleteBtn);

        listContainer.appendChild(savedTripContainer);

        editBtn.addEventListener("click", generateTrip);
        deleteBtn.addEventListener("click", deleteListItem);
    }
}

var deleteListItem = function() {
    console.log("Delete trip button clicked")
}

var generateTrip = function(event) {
    // delete everything but trip title
    $("#trip-container").children().remove();
    // $("#trip-container").children().filter(":not(#trip-title)").remove();

    if (currentTrip === null) {
        // get data-id of trip
        var tripsIndex = event.target.parentNode.dataset.id;

        // pick the trip matching the data-id
        currentTrip = savedTrips[tripsIndex]
    }

    //get array of forecast cards to pull from
    var stops = currentTrip.stops;
    
    console.log(stops);

    // create input element
    var inputContainer = document.createElement("div");
    inputContainer.className = "d-flex justify-content-center"
    tripsContainer.appendChild(inputContainer);

    var titleEdit = document.createElement("input");
    titleEdit.type = "text";
    titleEdit.className = "text-center";
    titleEdit.id = "title-edit"
    titleEdit.value = currentTrip.name;
    inputContainer.appendChild(titleEdit);    

    // get rid of lists
    if ($("#list-container")) {
        $("#list-container").remove();
    }

    // Body (generate cards)
    for (i=0; i < stops.length; i++) {
        
        var dayContainer = document.createElement("div");
        dayContainer.className = "day-container col-12";
        dayContainer.innerHTML = "<h6>" + stops[i].name +"<h6>"
        dayContainer.dataset.date = currentTrip.date
        $("#trip-container").append(dayContainer);

        var cardContainer = document.createElement("div");
        cardContainer.className = "container";
        dayContainer.appendChild(cardContainer);

        var cardRow = document.createElement("div");
        cardRow.className = "row";
        cardContainer.appendChild(cardRow);

        var timeContainer = document.createElement("div");
        timeContainer.className = "time-container";
        timeContainer.dataset.isDayTime = stops[i].isDayTime;
        timeContainer.dataset.relativeDate = stops[i].relativeDate;
        timeContainer.dataset.absoluteDate = stops[i].absoluteDate;
        timeContainer.style = "display: inline-block; saveground-image: url(" + stops[i].icon + ");";
        cardRow.appendChild(timeContainer);

        var infoContainer = document.createElement("div");
        infoContainer.className = "info-container card";
        timeContainer.appendChild(infoContainer);

        var dayName = document.createElement("h3");
        dayName.className = "";
        dayName.textContent = stops[i].city, stops[i].state;
        infoContainer.appendChild(dayName);

        var dayDetails = document.createElement("p");
        dayDetails.className = "";
        dayDetails.innerHTML = "Skies: " + stops[i].shortForecast + 
            "</br>Temperature: " + stops[i].temperature +
            "</br>Wind Speed: " + stops[i].windSpeed;
        infoContainer.appendChild(dayDetails);

        var detailsBtn = document.createElement("button");
        detailsBtn.className = "details-btn";
        detailsBtn.dataset.details = stops[i].detailedForecast;
        detailsBtn.textContent = "More Details";
        infoContainer.appendChild(detailsBtn);
    }

    // add save button to allow user to return to trips list
    var saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Save"
    tripsContainer.appendChild(saveBtn);

    saveBtn.addEventListener("click", function() {
        // Update trip name
        var newTripTitle = $("#title-edit").val();
        currentTrip.name = newTripTitle;

        generateList();
    });

    // See additional details for forecast card
    $(".details-btn").on("click", detailsButtonHandler)
}

var saveTrips = function() {
    if (currentTrip != null) {
        var newName = $("#tripNameEdit").val();
        currentTrip.name = newName;
    }

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
            // turn from string save into js object
            savedTrips = JSON.parse(savedTrips);
        }
        // Generate HTML inside trip container
        generateList();
    }
}

// var renameTrip = function(event) {
//     if (currentTrip != null) {
//         // set up variables for oldName and textArea
//         var oldName = $(this).text()
//         console.log(oldName);

//         var textInput = $("<textarea>")
//             .addClass("form-control text-center")
//             .attr("id", "title-edit")
//             .val(oldName);

//         // replace text with textInput
//         $(this).replaceWith(textInput);
//         textInput.trigger("focus");

//         // update and save task
//         $("#title-edit").on("blur", "textarea", function() {

//             console.log("blur happening");

//             // get the textarea's current value/text
//             var newText = $(this)
//                 .val();

//             // recreate h3 element
//             var titleH3 = $("<h3>")
//                 .addClass("text-center")
//                 .attr("id", "trip-title")
//                 .text(newText);
            
//             // replace textarea with <h3>
//             $(this).replaceWith(titleH3);
            
//             // save trips
//             saveTrips();

//         })
//     }
// }


var getMap = function(lat, lon) {
    // if map is not initiated, generate map. otherwise set new View and add marker
    if (map === null) {
        map = L.map('map').setView([lat, lon], 13);

        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1Ijoid2luZ3JhbTEiLCJhIjoiY2t5dzl6Z2t1MDYyNjJucXBiNHdvcTd5diJ9.GqWwwJ4INQXw49NCNZuEQQ'
        }).addTo(map);

        L.marker([lat, lon]).addTo(map);
    } else {
        map.setView([lat, lon], 13);

        L.marker([lat, lon]).addTo(map);
    }
};

/////////////////// CALL FUNCTIONS //////////////////
loadTrips();
// $("#trip-title").on("click", renameTrip);
locationInputEl.addEventListener("submit", getLocation);