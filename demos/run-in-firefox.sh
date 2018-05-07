#!/bin/bash
echo "This is a wrapper that allows you to run these demos in a stock copy of Firefox."
echo "Simply run: ./run-in-firefox.sh filename.js"
firefox -xpcshell -e "exe='$@'" xpc.js
