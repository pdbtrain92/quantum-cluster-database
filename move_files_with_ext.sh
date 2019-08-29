#!/bin/bash

# pattern to search for
PATTERN="*.jpg"
# destination dir
TO_DIR=$(pwd)/static/images
# dir to recursively search for files
FROM_DIR=$(pwd)/database_setup/data

#make dest if necessary
mkdir -p $TO_DIR;

echo "moving $(find $FROM_DIR -name $PATTERN | wc -l) files";
find $FROM_DIR -name $PATTERN | xargs -I '{}' mv '{}' $TO_DIR;
