#!/bin/bash

SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
 
docker run -v ${SOURCE_DIR}:/t -w /t node:6.10 bash -c "npm install && chmod ugo+rw ." || { echo "Failed running docker. Ignoring for now"; exit 0; }

