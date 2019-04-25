## Steps to run:

1) Acquire a running postgres database and a user/password with access to create tables
2) Run the (database_setup) which parses data and loads the database.
3) Run the (api_server) which serves content

## Getting started

1) Install node.js 10+ and npm. Typically node.js installations include npm.

  - See platform specific options here https://nodejs.org/en/download/package-manager/

2) Configure the .env file within this directory. There are comments in the file to provide guidance.
3) Run the application with the start.sh script in this directory. You may need to modify the permissions with `chmod +x-w start.sh`
4) Stop the application with the stop.sh script, this may also need `chmod +x-w stop.sh`
5) You can view the logs in the `logs` directory