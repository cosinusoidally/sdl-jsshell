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


/*
This is a (inefficient) polyfill implementation of SDL_AddTimer and
SDL_WaitEvent.

This polyfill is for platforms that don't yet have the required machine code
version of the SDL_AddTimer callback.
*/

sdl.SDL_AddTimer=function(){
  // do nothing.
};

sdl.last=Date.now();
sdl.SDL_WaitEvent=function(f){
  var _=this;
  do {
    var now=Date.now();
    if(now-_.last>_.frame_interval){
      _.last=now;
      if(_.draw_frame===false){
        var e=new ArrayBuffer(32);
        var e1=new Uint8Array(e);
        e1[0]=_.SDL_USEREVENT;
        _.SDL_PushEvent(e);
      }
    }
  } while(_.SDL_PollEvent(f)===0);
  return;
};
