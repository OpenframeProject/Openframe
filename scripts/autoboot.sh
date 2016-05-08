#!/bin/bash

# If n has been pressed, don't start openframe
read -t 1 -n 1 key
    if [[ $key = n ]]
then
    echo "no openframe"
else
    # start up openframe as a background process
    nohup openframe 2>&1 /dev/null &
    # change virtual terminal so that we don't see stray output:
    sudo chvt 4
fi