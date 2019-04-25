## System overview

1) Acquire a running postgres database
2) Run the dataloader (database_setup)
3) Run the app (api_server) - The data loader is fine to run while the app is running

## Environment Variables / Required Customization

Modify `.env` file, or the `docker-compose.yml` if you are using docker

* SERVER_PORT
* DB_DATABASE
* DB_USERNAME
* DB_PASSWORD
* DB_PORT (typically 5432)

## Set up the database

* `cd database_setup`
* `npm install`
* `npm run migrate`

This will:

- connect to postgres
- set up the tables if they are not yet setup
- truncate any existing data
- reload the data from the `data` directory

The loader gets data from `database_setup/data` directory. Any `.xyz` files will be detected and imported. The `correlations_best_sort.csv` is hardcoded.

## Run the application

* `cd api_server && npm install`
* Run `node app.js`

The app will log where it is listening from.

## Run the application with PM2

pm2 is a process manager that will ensure the app stays up, and will fork processes to provide better resource utilization (node is single core-only).

* Modify the `pm2.config.js` in the `api_server` directory to set environment variables
* Use `npm run pm2-start` and `npm run pm2-stop` from a shell in the `api_server` to control the app

## Some notes about the database client & endpoint security:

* Database SSL is disabled
* The app should allow access from any client
* The app does not support SSL directly, to deploy with SSL it is recommended to put an SSL terminating load balancer in front of it.

