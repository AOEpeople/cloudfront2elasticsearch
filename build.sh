#!/bin/bash

SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
 

cd ${SOURCE_DIR}
rm -rf node_modules
rm index.zip
docker run -v ${SOURCE_DIR}:/t -w /t node:6.10 bash -c "npm install && chmod ugo+rw ."
zip -r index.zip index.js node_modules/

