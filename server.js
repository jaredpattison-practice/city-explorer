'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// API Routes
app.get('/location', (request, response) => {
  searchToLatLong(request.query.data)
  // console.log(request.query.data)
    .then(location => response.send(location))
    .catch(error => handleError(error, response));
})

app.get('/weather', getWeather);

app.get('/yelp', getYelp);

app.get('/movies', getMovies);

app.get('/trails', getTrails);

app.get('/meetups', getMeetup);

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Error handler
function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

// Models
function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function Yelp(business) {
  this.name = business.name;
  this.image_url = business.image_url;
  this.rating = business.rating;
  this.price = business.price;
  this.url = business.url;
}

function Meetup(event) {
  this.link = event.link;
  this.name = event.name;
  this.host = event.venue.name;
  this.creation_date = new Date(event.created * 1000).toString().slice(0,10);
}

function Trails(trail) {
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.condition_date = trail.condition_date;
  this.condition_time = trail.condition_time;
  this.conditions = trail.conditions;
  this.stars = trail.stars;
  this.star_votes = trail.star_votes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
}

function Movie(movie) {
  this.title = movie.title;
  this.released_on = movie.released_on;
  this.total_votes = movie.total_votes;
  this.average_votes = movie.average_votes;
  this.overview = movie.overview;
  this.image_url = `https://image.tmdb.org/t/p/w500/${movie.poster_path}`;
}

// Helper Functions
function searchToLatLong(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then(res => {
      return new Location(query, res);
    })
    .catch(error => handleError(error));
}

function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(result => {
      const weatherSummaries = result.body.daily.data.map(day => {
        return new Weather(day);
      });

      response.send(weatherSummaries);
    })
    .catch(error => handleError(error, response));
}

function getMovies(request, response) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIES_API_KEY}&query=${request.query.data.search_query}`;
  
  superagent.get(url)
    .then(result => {
      const moviesFilmed = result.body.results.map(film => {
        // console.log(film);
        return new Movie(film);
      });
      response.send(moviesFilmed);
    })
    .catch(error => handleError(error, response));
}

function getTrails(request, response) {
  const url = `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&maxDistance=10&key=${process.env.TRAILS_API_KEY}`;

  superagent.get(url)
    .then(result => {
      // console.log(result.body.trails);
      const trails = result.body.trails.map(path => {
        return new Trails(path);
      });
      response.send(trails);
    })
    .catch(error => handleError(error, response));
}

function getMeetup(request, response) {
  const url = `https://api.meetup.com/find/upcoming_events?key=${process.env.MEETUP_API_KEY}&lat=${request.query.data.latitude}&lon=${request.query.data.longitude}`;

  superagent.get(url)
    .then(result => {
      const meetups = result.body.events.map(event => {
        
        // console.log(event.venue);
        return new Meetup(event);
      })
      response.send(meetups);

    })
    .catch(error => handleError(error, response));
}

function getYelp(request, response) {
  const url = `https://api.yelp.com/v3/businesses/search?location=${request.query.data.search_query}`;

  superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(result => {
      const yelpBusinesses = result.body.businesses.map(business => {
        // console.log(result.body.businesses)
        return new Yelp(business);
      });
      response.send(yelpBusinesses);
    })
    .catch(error => handleError(error, response));
}
