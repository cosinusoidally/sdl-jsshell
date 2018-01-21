/*

This provides functions to setup libcb, which contains our timer callback
function.

You'll see that we just check which platform we are on and then load the
platform specific setup scripts. If you want to understand how the machine code
loading and patching works setup-linux-x86_64.js is a good place to start.

The implementation of setup-linux-i686.js and setup-win32.js are also
interesting because they load exactly the same machine code (contained in
i686-common.js).

*/


libcb={};

libcb.syssetup=function(){
  if(sdl.system==="linux-i686"){
    libcb.setcond=function(){}; // just a dummy function
    // Next we must set up the linux-i686 machine code required:
    load("setup-linux-i686.js");
  } else if(sdl.system==="win32"){
    libcb.setcond=function(){}; // just a dummy function
    load("setup-win32.js");
  } else if(sdl.system==="linux-x86_64"){
    libcb.setcond=function(){}; // just a dummy function
    load("setup-linux-x86_64.js");
  } else {
    // try to load generic libcb library (this is only if all else fails).
    // I've just left this bit here in case someone wants to begin a port
    // to MacOS or something. All the currently supported platforms already
    // have machine code versions of the callback
    libcb.lib=ctypes.open("libcb.so");
    libcb.setcond=libcb.lib.declare("setcond",ctypes.default_abi, ctypes.void_t, ctypes.voidptr_t);

    // note that this is the wrong signature for libcb.cb, I only ever use its
    // address and never call it from JS so it doesn't matter.
    libcb.cb=libcb.lib.declare("cb",ctypes.default_abi, ctypes.void_t);
  }
}

// This is to initialise the library. syssetup above sets up the machine
// specific stuff.

libcb.init=function(){
  var _=this;
  _.mut=sdl.SDL_CreateMutex();
  _.cond=sdl.SDL_CreateCond();
  _.syssetup();
  _.setcond(libcb.cond); // This is only needed for the C version
                         // all other version just replace this with
                         // a dummy function that does nothing.
  sdl.SDL_mutexP(libcb.mut); // lock the mutex
}
