/*

Setting up on win32.
--------------------

Get win32 jsshell binaries from:

https://github.com/cosinusoidally/jsshell-binaries-mirror

Check the signature to confirm that they are authenic versions from Mozilla (or
if you prefer, get them straight from Mozilla).

Get the win32 version of SDL 1.2 from here:

https://www.libsdl.org/download-1.2.php

direct link is:

https://www.libsdl.org/release/SDL-1.2.15-win32.zip

Extract both jsshell and SDL. Put the SDL.dll file in to the same directory as
js.exe

You should then be able to run the test.js file using:

js.exe test.js

*/


load("setup-polyfill.js");
