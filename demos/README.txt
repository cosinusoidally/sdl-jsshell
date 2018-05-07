Run with:

js demo-name.js (where js is your copy of jsshell)

List of demos:

Demos are public domain unless indicated otherwise in the source code.

text.js - a simple bitmap font text display demo

voxelspace.js - a port of:
https://github.com/s-macke/VoxelSpace

Note you can also run these demos using a stock Firefox (by using the -xpcshell
flag to turn Firefox in to a JavaScript shell). To do so simply:

./run-in-firefox.sh demo-name.js

Note xpc.js is the wrapper code that polyfills the API functions missing from
Firefox, but present in xpcshell (so far, just "read")
