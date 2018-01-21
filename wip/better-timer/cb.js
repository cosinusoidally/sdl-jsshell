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

libcb.init=function(){
  var _=this;
  _.mut=sdl.SDL_CreateMutex();
  _.cond=sdl.SDL_CreateCond();
  _.syssetup();
  _.setcond(libcb.cond);
  sdl.SDL_mutexP(libcb.mut); // lock the mutex
}
