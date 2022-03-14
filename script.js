"use strict";

// prettier-ignore

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const resetBtn = document.querySelector(".reset");
const deleteWorkout = document.querySelector(".workout-options");

class Workout {
  date = new Date();
  // Unique ID
  id = (Math.floor(Date.now() * Math.random()) + "").slice(-6);
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat,lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
  _setDescripton() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescripton();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescripton();
  }
  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workout = [];
  // This will run first.
  constructor() {
    // Get user's position
    this._getposition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach Even handlers
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
    // deleteWorkout.addEventListener("click", this.removeWorkout.bind(this));
    resetBtn.addEventListener("click", this.reset.bind(this));
  }

  // Get current location
  _getposition() {
    navigator.geolocation?.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("Could not get your position");
      }
    );
  }
  // Load the map with current location
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    // Set the view
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // Show the form on click
    this.#map.on("click", this._showForm.bind(this));

    this.#workout.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setInterval(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    // Helper function to check invalid inputs
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);
    e.preventDefault();

    // Get data from user
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // If workout running create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      // Validate the data
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs must be positive numbers");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If the workout is cycling then create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      // Validate the data
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Inputs must be positive numbers");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to the work out array.
    this.#workout.push(workout);
    // Render workout of the map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide the form +clear input feilds
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();

    // Display marker
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }) //"running-popup "
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <div class="workout-container" >
    <button class ="workout-options" data-id=${workout.id}>X</button>
      <li class="workout workout--${workout.type}" data-id=${workout.id}>
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
              <span class="workout__icon">⏱</span>
              <span class="workout__value">${workout.duration}</span>
              <span class="workout__unit">min</span>
          </div>

      `;
    if (workout.type === "running") {
      html += `
          <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>
          
      </i>
    </div>  `;
    }
    if (workout.type === "cycling") {
      html += `
          <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.speed.toFixed(1)}</span>
              <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${workout.elevationGain}</span>
              <span class="workout__unit">m</span>
          </div>
          
      </i>
    </div>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }
  // removeWorkouts(e) {
  //   e.preventDefault();
  //   const workoutEl = e.target.dataset.id;

  //   console.log(this.#workout.find((el) => el.id === workoutEl.dataset.id));
  // }
  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;
    const workout = this.#workout.find((el) => el.id === workoutEl.dataset.id);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pin: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workout));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workout = data;
    this.#workout.forEach((work) => {
      this._renderWorkout(work);
    });
  }
  reset(e) {
    e.preventDefault();
    this.#workout = [];
    localStorage.removeItem("workouts");
    location.reload();
  }
}
const app = new App();
