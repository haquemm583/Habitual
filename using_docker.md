# Using Docker

This app uses docker to containerize the app.
This is to help keep the code isolated and modular
and easy to deploy on a live server.

There are 3 containers:

- frontend
- backend
- db

## Using the containers

1. `docker compose up --build -d`
2. go to http://localhost:3000/api/health to test the backend container
3. go to http://localhost:9000/ to test the frontend container

The frontend and backend containers use watch, so changes made
to the backend or frontend files should be shown in real time
without having to rebuild the containers after each change.

When installing new packages, you'll need to run `docker compose up --build -d -V`.
`-V` recreates the containers' `node_modules` volumes so new packages show up.
It does not touch the `db-data` volume, so your database is safe.

## Removing the containers

Removing the containers stops them and removes them on your local device.
You can optionally remove the volumes too, which will destroy the
database and will require you to re-initialize the db when you rebuild
containers again from scratch.

Running `docker compose down` will stop and remove thee containers on your local device
and will keep the db volume persistent across builds.

Running `docker compose down --volumes` will remove the volumes as well, meaning
the database and all of its data will be destroyed and no longer exist.
