#!/bin/bash
set -e;

#cd database_setup && npm run packages && npm run migrate;
#cd ..;

# commented out and doing a manual update
# cd api_server && npm run packages

# make sure pm2 in-memory version is up to date
echo "Updating process manager";
UPDATE=`npm run pm2-update`;

# check for status online
STARTED=`npm run pm2-status`;
if [[ "$STARTED" == *"online"*  ]]; then
 echo "App is already running, restarting the server.";
 npm run pm2-restart;
 else
 npm run pm2-start;
fi;
echo "Triggered startup - when running you can see the logs in $(pwd)/logs"
echo "Giving app time to boot";
sleep 10;
echo "Confirming app stayed up (port binding success)";
STARTED=`npm run pm2-status`;
if [[ "$STARTED" == *"errored"* ]]; then
  echo "The app failed to start";
  npm run pm2-logs;
  else 
  echo;
  echo;
  npm run pm2-status;
  echo;
  echo;
  echo "App is loaded and running. you can see the logs in $(pwd)/logs"
fi
