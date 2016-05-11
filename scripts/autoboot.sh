#!/bin/bash

# If n has been pressed, don't start openframe
read -t 1 -n 1 key
    if [[ $key = n ]]
then
    echo "no openframe"
else
    # start up openframe as a background process
    nohup openframe 2>&1 /dev/null &
    # set the terminal text color to black
    setterm --foreground black --background black --cursor off --clear all
    # hide the prompt:
    export PS1=""
fi