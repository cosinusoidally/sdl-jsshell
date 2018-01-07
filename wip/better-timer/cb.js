libcb={};
libcb.lib=ctypes.open("libcb.so");
libcb.setcond=libcb.lib.declare("setcond",ctypes.default_abi, ctypes.void_t, ctypes.voidptr_t);

// note that this is the wrong signature for libcb.cb, I only ever use its
// address and never call it from JS so it doesn't matter.
libcb.cb=libcb.lib.declare("cb",ctypes.default_abi, ctypes.void_t);

libcb.init=function(){
  var _=this;
  _.mut=sdl.SDL_CreateMutex();
  _.cond=sdl.SDL_CreateCond();
  _.setcond(libcb.cond);
  sdl.SDL_mutexP(libcb.mut); // lock the mutex
}
