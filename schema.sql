DROP TABLE locations, weathers, businesses, movies, trails, meetups; 

COMMIT;

CREATE TABLE IF NOT EXISTS locations ( 
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC(8, 6),
    longitude NUMERIC(9, 6)
  );

CREATE TABLE IF NOT EXISTS weathers ( 
    id SERIAL PRIMARY KEY,
    forecast VARCHAR(255), 
    time VARCHAR(255),
    created_at BIGINT,
    location_id INTEGER NOT NULL REFERENCES locations(id)
  );

  CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    image_url VARCHAR(255),
    rating VARCHAR(8),
    price VARCHAR(8),
    url VARCHAR(255),
    created_at BIGINT,
    location_id INTEGER NOT NULL REFERENCES locations(id)
  );

    CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    released_on VARCHAR(255),
    total_votes INTEGER,
    average_votes INTEGER,
    overview VARCHAR(1023),
    image_url VARCHAR(255),
    created_at BIGINT,
    location_id INTEGER NOT NULL REFERENCES locations(id)
  );

    CREATE TABLE IF NOT EXISTS trails (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    location VARCHAR(255),
    length FLOAT,
    condition_date VARCHAR(255),
    condition_time VARCHAR(255),
    conditions VARCHAR(1023),
    stars FLOAT,
    star_votes INTEGER,
    summary VARCHAR(1023),
    trail_url VARCHAR(255),
    created_at BIGINT,
    location_id INTEGER NOT NULL REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS meetups (
    id SERIAL PRIMARY KEY,
    link VARCHAR(255),
    name VARCHAR(255),
    host VARCHAR(255),
    creation_date VARCHAR(255),
    created_at BIGINT,
    location_id INTEGER NOT NULL REFERENCES locations(id)
  );