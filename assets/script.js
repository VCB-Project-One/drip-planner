var forecastContainer = document.querySelector("#forecast-container");
var forecastArray = [];
var savedCards = [];
var forecastHeader = document.querySelector("#forecast-header");
var forecastLocation = {
    city: null,
    state: null
};
var modalOverlay = document.querySelector("#modal-overlay");
var modalActive = false;
var savedTrips = [];
var currentTrip = null;
var newTripNum = 1;
var tripsContainer = document.querySelector("#trip-container");
var listContainer = null;
var locationInputEl = document.querySelector("#destination-form");
var cityInputEl = document.querySelector("#destination");
var stateInputEl = document.querySelector("#state");
var MapDivEl = document.querySelector("#map");

// map variable
var map = null;
// lat/lon variables for nashville
var lat = null;
var lon = null;

// initialize modals
$('#tripModal').modal({ show: false});

// function to get the city name from input
var getLocation = function(event) {
    event.preventDefault();
    
    var city = cityInputEl.value.trim();
    var state = stateInputEl.value.trim();

    getCoords(city, state);
}

// function to get city lat/lon
var getCoords = function(city, state) {
    
    var apiUrl = "http://api.openweathermap.org/geo/1.0/direct?q=" + city + "," + state +  ",US&appid=9f22897565b785c5e1809cff5dde2ef9";

    fetch(apiUrl)
        .then(function(response) {
            if (response.ok) {
                response.json().then(function(data) {
                    console.log(data);
                    var lat = (data[0].lat);
                    var lon = (data[0].lon);
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
                console.log("Connection made successfully.");

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
    if (currentTrip === null) {
        // display alert modal
        let modalText = "Please select a trip first, or make a new one"
        var detailsText = document.querySelector("#detailed-forecast");
    
        //make details modal visible
        $("#details-overlay").css("visibility", "visible");
        //make map invisible
        MapDivEl.style.visibility = "hidden";
    
        //modal close button
        $("#details-close-btn").on("click", function(){
            $("#details-overlay").css("visibility", "hidden");
            if (modalActive == false) {
                MapDivEl.style.visibility = "visible";
            }
        });
    
        //set text to detailed forecast
        detailsText.textContent = JSON.stringify(modalText);

    } 
    else { // generate forecast

        // delete existing content
        var content = document.getElementsByClassName("day-container");
        while(content.length > 0){
            content[0].parentNode.removeChild(content[0]);
        }

        // GENERATE FORECAST MODAL
        modalOverlay.style.visibility = "visible";
        modalActive = true;
        
        // make map iframe invisible (???) - was causing issues
        MapDivEl.style.visibility = "hidden";

        // close button functionality
        $("#forecast-close-btn").on("click", function() {
            modalOverlay.style.visibility = "hidden";
            MapDivEl.style.visibility = "visible";
            modalActive = false;
            generateTrip();
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

            var btnContainer = document.createElement("div");
            btnContainer.className = "row d-flex justify-content-start pl-3";
            infoContainer.appendChild(btnContainer);

            var detailsBtn = document.createElement("button");
            detailsBtn.className = "details-btn";
            detailsBtn.dataset.details = array[i].detailedForecast;
            detailsBtn.textContent = "More Details";
            btnContainer.appendChild(detailsBtn);

            var addBtn = document.createElement("button");
            addBtn.className = "add-btn";
            addBtn.dataset.forecastIndex = i;
            addBtn.dataset.details = array[i].detailedForecast;
            addBtn.dataset.toggle = "modal";
            addBtn.dataset.target = "#exampleModal";
            addBtn.textContent = "Add to Trip";
            btnContainer.appendChild(addBtn);  
        }
        
        // See additional details for forecast card
        $(".details-btn").on("click", detailsButtonHandler)

        // ADD FORECAST CARD TO TRIP
        $(".add-btn").on("click", addButtonHandler)
    }
}

var detailsButtonHandler = function(event) {
    let modalText = event.target.dataset.details;
    var detailsText = document.querySelector("#detailed-forecast");

    //make details modal visible
    $("#details-overlay").css("visibility", "visible");
    //make map invisible
    MapDivEl.style.visibility = "hidden";

    //modal close button
    $("#details-close-btn").on("click", function(){
        $("#details-overlay").css("visibility", "hidden");
        if (modalActive == false) {
            MapDivEl.style.visibility = "visible";
        }
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
        var tripName = "New Trip " + (savedTrips.length + 1);

        // Make new trip object
        var newTrip = {
            name: tripName,
            stops: [], //STOP is an object; going to make a function to generate cards based on stop
            index: savedTrips.length
        }

        // Make trip stops object
        var newStop = forecastArray[forecastIndex];

        newTrip.stops.push(newStop);
    
        newTrip.stops.sort(function(a, b){return a.relativeDate - b.relativeDate});

        //update currentTrip and savedTrips
        currentTrip = newTrip;
        savedTrips.push(currentTrip);

        // Set to localStorage
        saveTrips();

        // Generate HTML
        generateTrip();
    } 
    else if (savedTrips.length > 0) {
        // if no trip selected, tell them to select one
        if (currentTrip === null ) {
            console.log("No trip selected. Select a trip first!")
        }
        else if (currentTrip) {
            var newStop = forecastArray[forecastIndex];

            currentTrip.stops.push(newStop); 

            currentTrip.stops.sort(function(a, b){return a.relativeDate - b.relativeDate});

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
    if (savedTrips.length > 0) {
        var listTitle = document.createElement("h3");
        listTitle.className = "text-center";
        listTitle.id = "trip-title";
        listTitle.textContent = "Saved Trips";
        tripsContainer.appendChild(listTitle);
    } 
    else if (savedTrips.length === 0) {     
        var noTripsMessage = document.createElement("h4");
        noTripsMessage.className = "no-trips";
        noTripsMessage.id = "no-trips-message";
        noTripsMessage.textContent = "You don't have any saved trips! Click the " + '"' + 'New Trip" button to get started!';
        tripsContainer.appendChild(noTripsMessage);
    }

    var btnContainer = document.createElement("div");
    btnContainer.className = "row d-flex justify-content-center"
    tripsContainer.appendChild(btnContainer);

    // generate newTrip button
    var newTripBtn = document.createElement("btn");
    newTripBtn.className = "btn btn-primary trip-btn";
    newTripBtn.style = "width: fit-content;"
    newTripBtn.id = "new-trip-btn";
    newTripBtn.textContent = "New Trip";
    btnContainer.appendChild(newTripBtn);

    newTripBtn.addEventListener("click", newTripHandler)

    // generate list container
    var listContainer = document.createElement("div");
    listContainer.className = "m-3 w-95";
    listContainer.id = "list-container";
    tripsContainer.appendChild(listContainer);

    // generate list of trips from savedTrips
    for (i=0; i<savedTrips.length; i++) {
        var workingListItem = document.createElement("div");
        workingListItem.className = "bg-white border border-dark rounded w-95 m-1";
        workingListItem.id = "trip-list-item-" + i;
        workingListItem.dataset.id = i;
        // listContainer.appendChild(workingListItem);

        var workingListTitle = document.createElement("h4");
        workingListTitle.style = "overflow: hidden; text-overflow: ellipsis; padding-bottom: 1em";
        workingListTitle.textContent = savedTrips[i].name;
        workingListItem.appendChild(workingListTitle);

        //make container for h4 element
        var savedTripContainer = document.createElement("div");
        savedTripContainer.id = "trip-container-" + i;
        savedTripContainer.appendChild(workingListItem);

        //edit & delete buttons
        var editBtn = document.createElement("button");
        editBtn.className = "edit-btn btn btn-primary";
        editBtn.textContent = "Edit"
        workingListItem.appendChild(editBtn);

        var deleteBtn =  document.createElement("button");
        deleteBtn.className = "btn btn-secondary delete-btn";
        deleteBtn.dataset.index = i;
        deleteBtn.textContent = "Delete";
        workingListItem.appendChild(deleteBtn);

        listContainer.appendChild(savedTripContainer);

        editBtn.addEventListener("click", generateTrip);
        deleteBtn.addEventListener("click", deleteListItem);
    }
}

var newTripHandler = function(event) {
    //increase newTripNum
    newTripNum ++;

    // make empty trip object
    var newTrip = {
        name: "New Trip " + (newTripNum),
        stops: [],
        index: savedTrips.length
    }

    // push to savedTrips array
    savedTrips.push(newTrip);

    currentTrip = newTrip;

    generateTrip();
}

var deleteListItem = function(event) {
    //remove html element
    var elementIndex = event.target.getAttribute("data-index");
    
    $("#trip-container-" + elementIndex).remove()

    // splice from savedTrips array
    savedTrips.splice(elementIndex, 1);

    saveTrips();
}

var generateTrip = function(event) {
    // delete everything but trip title
    $("#trip-container").children().remove();

    //reinforce modalActive being set to false; causes map appearance issues if not
    modalActive = false;

    if (currentTrip === null) {
        // get data-id of trip
        var tripsIndex = event.target.parentNode.dataset.id;

        // pick the trip matching the data-id
        currentTrip = savedTrips[tripsIndex]
    }

    //get array of forecast cards to pull from
    var stops = currentTrip.stops;

    // create input element
    var inputContainer = document.createElement("div");
    inputContainer.className = "w-100 pt-2 d-flex justify-content-center"
    tripsContainer.appendChild(inputContainer);

    var titleEdit = document.createElement("input");
    titleEdit.type = "text";
    titleEdit.className = "text-center";
    titleEdit.id = "title-edit"
    titleEdit.style = "width: fit-content;"
    titleEdit.value = currentTrip.name;
    inputContainer.appendChild(titleEdit);    

    // increase margin-bottom of input container to accomodate for mobile keyboard pop-up
    $("#title-edit").focus(function() {
        console.log("focus")
        $(window).resize(function() {
            if (window.matchMedia("(max-width: 767px)").matches) {
                console.log("mobile keyboard has popped up.");
                $("#input-container").css("padding-bottom", "200px");
            }
        })
    })

    // reset margin-top of trip container on blur
    $("#title-edit").blur(function() {
        console.log("blur")
        $(window).resize(function() {
            if (window.matchMedia("(max-width: 767px)").matches) {
                $("#input-container").css("padding-bottom", "16px");
            }
        })
    })

    // get rid of lists
    if ($("#list-container")) {
        $("#list-container").remove();
    }

    // Body (generate cards)
    for (i=0; i < stops.length; i++) {
        
        if (stops[i].isDayTime === true || !document.querySelector("#d" + stops[i].date)) {
            var dayContainer = document.createElement("div");
            dayContainer.className = "day-container d-flex flex-column";
            dayContainer.innerHTML = "<h6>" + stops[i].name + " (" + stops[i].date + ")" + "</h6>"
            dayContainer.id = "d" + stops[i].date
            $("#trip-container").append(dayContainer);

            var cardRow = document.createElement("div");
            cardRow.className = "row";
            cardRow.id = dayContainer.id + "-row";
            dayContainer.appendChild(cardRow);
        }

        var timeContainer = document.createElement("div");
        timeContainer.className = "time-container";
        timeContainer.id = "t" + stops[i].absoluteDate;
        timeContainer.dataset.isDayTime = "t" + stops[i].absoluteDate.toString();
        timeContainer.dataset.index = i.toString();
        timeContainer.dataset.relativeDate = stops[i].relativeDate;
        timeContainer.dataset.absoluteDate = stops[i].absoluteDate;
        timeContainer.style = "display: inline-block; background-image: url(" + stops[i].icon + "); background-size: cover";
        cardRow.appendChild(timeContainer);

        var infoContainer = document.createElement("div");
        infoContainer.className = "info-container card";
        timeContainer.appendChild(infoContainer);

        var cityName = document.createElement("h3");
        cityName.style = "padding-bottom: 1.1em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
        cityName.textContent = stops[i].city + ", " + stops[i].state;
        infoContainer.appendChild(cityName);

        var dayDetails = document.createElement("p");
        dayDetails.style = "margin-top: auto;";
        dayDetails.innerHTML = "Skies: " + stops[i].shortForecast + 
            "</br>Temperature: " + stops[i].temperature +
            "</br>Wind Speed: " + stops[i].windSpeed;
        infoContainer.appendChild(dayDetails);

        var btnContainer = document.createElement("div");
        btnContainer.className = "row d-flex justify-content-start pl-3";
        infoContainer.appendChild(btnContainer);

        var detailsBtn = document.createElement("button");
        detailsBtn.className = "details-btn";
        detailsBtn.dataset.details = stops[i].detailedForecast;
        detailsBtn.textContent = "More Details";
        btnContainer.appendChild(detailsBtn);

        var deleteBtn = document.createElement("button")
        deleteBtn.className = "delete-btn";
        deleteBtn.id = "t" + stops[i].absoluteDate + '-deleteBtn';
        deleteBtn.dataset.index = i.toString();
        deleteBtn.textContent = "Delete";
        btnContainer.appendChild(deleteBtn);

        // delete forecast container
        deleteBtn.addEventListener("click", function(event) {
            var forecastCard = document.getElementById(event.target.parentNode.parentNode.id);
            var cardRowContainer = document.getElementById(event.target.parentNode.parentNode.parentNode.id);

            // remove card
            cardRowContainer.removeChild(forecastCard);

            // if cardRowContainer is empty, delete dayContainer
            if (cardRowContainer.childElementCount === 0) {
                document.getElementById(cardRowContainer.parentNode.id).remove();
            }

            // update array
            currentTrip.stops.splice(event.target.dataset.index, 1);

            console.log("before loop: " + JSON.stringify(currentTrip.stops));

            // update data-index attributes of deleteBtn's
            for (i=0; i<stops.length; i++) {
                var currentTimeCard = document.getElementById("t" + currentTrip.stops[i].absoluteDate.toString());
                var currentDeleteBtn = document.getElementById(currentTimeCard.id + "-deleteBtn");

                currentTimeCard.setAttribute("data-index", i);
                currentDeleteBtn.setAttribute("data-index", i);
            }
        });
    }

    // make container for buttons
    var btnContainer = document.createElement("div");
    btnContainer.className = "row mt-4 mb-4 d-flex justify-content-around";
    tripsContainer.appendChild(btnContainer);

    // add save button to allow user to return to trips list
    var saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary trip-btn";
    saveBtn.textContent = "Save"
    btnContainer.appendChild(saveBtn);

    saveBtn.addEventListener("click", function() {
        // Update trip name
        currentTrip.name = $("#title-edit").val();

        // update savedTrips index
        savedTrips[currentTrip.index].name = currentTrip.name;

        // save trips
        saveTrips();

        // go back to list
        generateList();
    });

    var resetBtn = document.createElement("button");
    resetBtn.className = "btn btn-danger trip-btn";
    resetBtn.textContent = "Reset Trip";
    btnContainer.appendChild(resetBtn);

    var backBtn = document.createElement("button");
    backBtn.className = "btn btn-secondary trip-btn";
    backBtn.textContent = "Back";
    btnContainer.appendChild(backBtn);


    backBtn.addEventListener("click", function() {
        // go back to list
        generateList();
    });

    resetBtn.addEventListener("click", function() {
        // remove all day containers from trip
        $(".day-container").remove();

        // reset stops array
        currentTrip.stops = [];
    });

    // See additional details for forecast card
    $(".details-btn").on("click", detailsButtonHandler)

}

var saveTrips = function() {
    localStorage.setItem("Trips", JSON.stringify(savedTrips));
};

var loadTrips = function() {
    //get savedTrips from local storage
    savedTrips = localStorage.getItem("Trips");

    if (savedTrips === null) {
        savedTrips = [];

        generateList();
    }
    else {
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

    // update newTripNum
    newTripNum = savedTrips.length;
}

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

var mapClick = function(e) {
    // get lat and lon from the mouse click location
    var lat = e.latlng.lat;
    var lon = e.latlng.lng;
    // generate
    getForecast(lat, lon);
}

/////////////////// CALL FUNCTIONS //////////////////
getMap(36.1627, -86.7816); //hardcoded set to nashville
loadTrips();
locationInputEl.addEventListener("submit", getLocation);
map.on("click", mapClick);