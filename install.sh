#!/bin/bash

# Be VERY Careful. This script may be executed with admin privileges.

echo "Openframe -- install.sh"

# Some limited platform detection might be in order... though at present we're targeting the Pi
os=$(uname)
arq=$(uname -m)

# copy default .ofrc to user dir
sudo mkdir -p ~/.openframe/artwork
sudo chmod -R +wr ~/.openframe
cp .ofrc ~/.openframe/.ofrc

if [ $os == "Linux" ]; then

    # on Debian Linux distributions

    if [ $arq == "armv7l" ]; then
        # on RaspberryPi
        echo "armv7l"

        # disable overscan
        # sudo sed -i 's/.*overscan.*/#&/' /boot/config.txt

        # rotate the display
        # sudo echo "display_rotate=1" >> /boot/config.txt

        # disable screen blanking
        sudo sed -i -r 's/BLANK_TIME=[0-9]+/BLANK_TIME=0/' /etc/kbd/config
        sudo sed -i -r 's/POWERDOWN_TIME=[0-9]+/POWERDOWN_TIME=0/' /etc/kbd/config

        # sudo reboot
    else
        # Non-arm7 Debian...
        echo "non armv7l"
    fi

elif [ $os == "Darwin" ]; then
    # OSX
    echo "osx"
fi
