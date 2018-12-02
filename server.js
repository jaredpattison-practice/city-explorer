'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// API Routes
app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/yelp', getYelp);
app.get('/movies', getMovies);
app.get('/trails', getTrails);
app.get('/meetups', getMeetup);

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// ++++++++++++ MODELS ++++++++++++++++

// Location model
function Location(query, res) {
  this.tableName = 'locations';
  this.search_query = query;
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
  this.created_at = Date.now();
}

Location.lookupLocation = location => {
  const SQL = `SELECT * FROM locations WHERE search_query=$1;`;
  const values = [location.query];

  return client
    .query(SQL, values)
    .then(result => {
      if (result.rowCount > 0) {
        location.cacheHit(result);
      } else {
        location.cacheMiss();
      }
    })
    .catch(console.error);
};

// Location.prototype.save = function() and so on
Location.prototype = {
  save: function() {
    const SQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id;`;
    const values = [
      this.search_query,
      this.formatted_query,
      this.latitude,
      this.longitude
    ];

    return client.query(SQL, values).then(result => {
      this.id = result.rows[0].id;
      return this;
    });
  }
};

// Weather model
function Weather(day) {
  this.tableName = 'weathers';
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
  this.created_at = Date.now();
}

Weather.tableName = 'weathers';
Weather.lookup = lookup;
Weather.deleteByLocationId = deleteByLocationId;

Weather.prototype = {
  save: function(location_id) {
    const SQL = `INSERT INTO ${
      this.tableName
    } (forecast, time, created_at, location_id) VALUES ($1, $2, $3, $4);`;
    const values = [this.forecast, this.time, this.created_at, location_id];

    client.query(SQL, values);
  }
};

// Yelp Model
function Yelp(business) {
  this.tableName = 'businesses';
  this.name = business.name;
  this.image_url = business.image_url;
  this.rating = business.rating;
  this.price = business.price;
  this.url = business.url;
  this.created_at = Date.now();
}

Yelp.tableName = 'businesses';
Yelp.lookup = lookup;
Yelp.deleteByLocationId = deleteByLocationId;

Yelp.prototype = {
  save: function(location_id) {
    const SQL = `INSERT INTO ${
      this.tableName
    } (name, image_url, rating, price, url, created_at, location_id) VALUES ($1, $2, $3, $4, $5, $6, $7);`;
    const values = [
      this.name,
      this.image_url,
      this.rating,
      this.price,
      this.url,
      this.created_at,
      location_id
    ];

    client.query(SQL, values);
  }
};

// Movie Model
function Movie(movie) {
  this.tableName = 'movies';
  this.title = movie.title;
  this.released_on = movie.released_on;
  this.total_votes = movie.total_votes;
  this.average_votes = movie.average_votes;
  this.overview = movie.overview;
  this.image_url = `https://image.tmdb.org/t/p/w500/${movie.poster_path}`;
  this.created_at = Date.now();
}

Movie.tableName = 'movies';
Movie.lookup = lookup;
Movie.deleteByLocationId = deleteByLocationId;

Movie.prototype = {
  save: function(location_id) {
    const SQL = `INSERT INTO ${
      this.tableName
    } (title, released_on, total_votes, average_votes, overview, image_url, created_at, location_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;
    const values = [
      this.title,
      this.released_on,
      this.total_votes,
      this.average_votes,
      this.overview,
      this.image_url,
      this.created_at,
      location_id
    ];

    client.query(SQL, values);
  }
};

// Trails Model
function Trails(trail) {
  this.tableName = 'trails';
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.condition_date = Date(trail.conditionDate).slice(0, 10);
  this.condition_time = Date(trail.conditionDate).slice(16, 21);
  this.conditions = trail.conditionDetails ? `${trail.conditionStatus}, ${trail.conditionDetails}` : trail.conditionStatus;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
  this.created_at = Date.now();
}
Trails.tableName = 'trails'; Trails.lookup = lookup; Trails.deleteByLocationId = deleteByLocationId;
Trails.prototype = {
  save: function(location_id) {
    const SQL = `INSERT INTO ${this.tableName} (name, location, length, condition_date, condition_time, conditions, stars, star_votes, summary, trail_url, created_at, location_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`;
    const values = [
      this.name,
      this.location,
      this.length,
      this.condition_date,
      this.condition_time,
      this.conditions,
      this.stars,
      this.star_votes,
      this.summary,
      this.trail_url,
      this.created_at,
      location_id
    ];

    client.query(SQL, values);
  }
};

// Meetup Model
function Meetup(event) {
  this.tableName = 'meetups';
  this.link = event.link;
  this.name = event.name;
  this.host = event.group.name;
  this.creation_date = new Date(event.created * 1000).toString().slice(0,10);
  this.created_at = Date.now();
}

Meetup.tableName = 'meetups'; Meetup.lookup = lookup; Meetup.deleteByLocationId = deleteByLocationId;
Meetup.prototype = {
  save: function(location_id) {
    const SQL = `INSERT INTO ${this.tableName} (link, name, host, creation_date, created_at, location_id) VALUES ($1, $2, $3, $4, $5, $6);`;
    const values = [
      this.link,
      this.name,
      this.host,
      this.creation_date,
      this.created_at,
      location_id
    ];

    client.query(SQL, values);
  }
};

// ++++++++++++ HELPERS +++++++++++++++
// These functions are assigned to properties on the models

// Checks to see if there is DB data for a given location
function lookup(options) {
  const SQL = `SELECT * FROM ${options.tableName} WHERE location_id=$1;`;
  const values = [options.location];

  client
    .query(SQL, values)
    .then(result => {
      if (result.rowCount > 0) {
        options.cacheHit(result);
      } else {
        options.cacheMiss();
      }
    })
    .catch(error => handleError(error));
}

// Clear the DB data for a location if it is stale
function deleteByLocationId(table, city) {
  const SQL = `DELETE FROM ${table} WHERE location_id=${city};`;
  return client.query(SQL);
}

// ++++++++++++ HANDLERS ++++++++++++++++

// Error handler
function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

// Location handler
function getLocation(request, response) {
  Location.lookupLocation({
    tableName: Location.tableName,

    query: request.query.data,

    cacheHit: function(result) {
      response.send(result.rows[0]);
    },

    cacheMiss: function() {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${
        this.query
      }&key=${process.env.GEOCODE_API_KEY}`;

      return superagent
        .get(url)
        .then(result => {
          const location = new Location(this.query, result);
          location.save().then(location => response.send(location));
        })
        .catch(error => handleError(error));
    }
  });
}

// Weather handler
function getWeather(request, response) {
  Weather.lookup({
    tableName: Weather.tableName,

    location: request.query.data.id,

    cacheHit: function(result) {
      let ageOfResultsInMinutes =
        (Date.now() - result.rows[0].created_at) / (1000 * 60);
      if (ageOfResultsInMinutes > 30) {
        Weather.deleteByLocationId(Weather.tableName, request.query.data.id);
        this.cacheMiss();
      } else {
        response.send(result.rows);
      }
    },

    cacheMiss: function() {
      const url = `https://api.darksky.net/forecast/${
        process.env.WEATHER_API_KEY
      }/${request.query.data.latitude},${request.query.data.longitude}`;

      return superagent
        .get(url)
        .then(result => {
          const weatherSummaries = result.body.daily.data.map(day => {
            const summary = new Weather(day);
            summary.save(request.query.data.id);
            return summary;
          });
          response.send(weatherSummaries);
        })
        .catch(error => handleError(error, response));
    }
  });
}

// Yelp Handler
function getYelp(request, response) {
  Yelp.lookup({
    tableName: Yelp.tableName,

    location: request.query.data.id,

    cacheHit: function(result) {
      let ageOfResultsInMinutes =
        (Date.now() - result.rows[0].created_at) / (1000 * 60);
      if (ageOfResultsInMinutes > 1000) {
        Yelp.deleteByLocationId(Yelp.tableName, request.query.data.id);
        this.cacheMiss();
      } else {
        response.send(result.rows);
      }
    },

    cacheMiss: function() {
      const url = `https://api.yelp.com/v3/businesses/search?location=${
        request.query.data.search_query
      }`;

      return superagent
        .get(url)
        .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
        .then(result => {
          const YelpBusinesses = result.body.businesses.map(newBusiness => {
            const business = new Yelp(newBusiness);
            business.save(request.query.data.id);
            return business;
          });
          response.send(YelpBusinesses);
        })
        .catch(error => handleError(error, response));
    }
  });
}

// Movie Handler
function getMovies(request, response) {
  Movie.lookup({
    tableName: Movie.tableName,

    location: request.query.data.id,

    cacheHit: function(result) {
      let ageOfResultsInMinutes =
        (Date.now() - result.rows[0].created_at) / (1000 * 60);
      if (ageOfResultsInMinutes > 10000) {
        Movie.deleteByLocationId(Movie.tableName, request.query.data.id);
        this.cacheMiss();
      } else {
        response.send(result.rows);
      }
    },

    cacheMiss: function() {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIES_API_KEY}&query=${request.query.data.search_query}`;

      return superagent
        .get(url)
        .then(result => {
          const moviesFilmed = result.body.results.map(film => {
            const movie = new Movie(film);
            movie.save(request.query.data.id);
            return movie;
          });
          response.send(moviesFilmed);
        })
        .catch(error => handleError(error, response));
    }
  });
}

// Trail Handler
function getTrails(request, response) {
  Trails.lookup({
    tableName: Trails.tableName,

    location: request.query.data.id,

    cacheHit: function(result) {
      let ageOfResultsInMinutes =
        (Date.now() - result.rows[0].created_at) / (1000 * 60);
      if (ageOfResultsInMinutes > 100) {
        Trails.deleteByLocationId(Trails.tableName, request.query.data.id);
        this.cacheMiss();
      } else {
        response.send(result.rows);
      }
    },

    cacheMiss: function() {
      const url = `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&maxDistance=10&key=${process.env.TRAILS_API_KEY}`;

      return superagent
        .get(url)
        .then(result => {
          const trailsReturned = result.body.trails.map(trail => {
            const trails = new Trails(trail);
            trails.save(request.query.data.id);
            return trails;
          });
          response.send(trailsReturned);
        })
        .catch(error => handleError(error, response));
    }
  });
}

// Meetup Handler
function getMeetup(request, response) {
  Meetup.lookup({
    tableName: Meetup.tableName,

    location: request.query.data.id,

    cacheHit: function(result) {
      let ageOfResultsInMinutes =
        (Date.now() - result.rows[0].created_at) / (1000 * 60);
      if (ageOfResultsInMinutes > 1000) {
        Meetup.deleteByLocationId(Meetup.tableName, request.query.data.id);
        this.cacheMiss();
      } else {
        response.send(result.rows);
      }
    },

    cacheMiss: function() {
      const url = `https://api.meetup.com/find/upcoming_events?key=${process.env.MEETUP_API_KEY}&lat=${request.query.data.latitude}&lon=${request.query.data.longitude}`;
      return superagent
        .get(url)
        .then(result => {
          const meetups = result.body.events.map(newEvent => {
            const event = new Meetup(newEvent);
            event.save(request.query.data.id);
            return event;
          });
          response.send(meetups);
        })
        .catch(error => handleError(error, response));
    }
  });
}
