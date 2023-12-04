CREATE DATABASE exercisetracker;

CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255)
);

CREATE TABLE exercises(
    exercise_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    description VARCHAR (255),
    duration INT,
    date DATE
);

ALTER TABLE exercises
ALTER COLUMN date SET DEFAULT CURRENT_DATE;