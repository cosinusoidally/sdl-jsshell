/*
First we must load the SDL library and define the required functions. We will
also need to load libc (for memcpy and mmap).
*/
sdl={};
libc={};
kernel32={}; // Only used on win32

/*
At this point we are ready to start trying to load libraries. In order to load the right libraries we must detect which system we are on.
*/
sdl.detect_system=function(){
  // We currently support linux-i686, linux-x86_64 and win32
  // First detect the pointer size. This will be 4 on 32-bit and 8 on 64-bit
  sdl.voidptr=ctypes.voidptr_t(0); // null pointer, needed in several places
  sdl.cb=ctypes.voidptr_t(0); // This is a callback to pass in to SDL_AddTimer.
                              // Here we set it initially to a null pointer

  sdl.ptr_size=ctypes.voidptr_t.size;
  sdl.system="unsupported";
  if(sdl.ptr_size===4){ // 32 bit pointer, either win32 or linux-i686
    print("32-bit");
    try {
      try {
        libc.lib = ctypes.open("libc.so.6");
      } catch(e){
        print("Couldn't load libc.so.6 (not on linux-i686, either no 32 bit libs or on win32)");
        throw "not linux-i686";
      };
      // try and load libc
      try {
        sdl.lib=ctypes.open("libSDL-1.2.so.0");
        sdl.system="linux-i686";
        return true;
      } catch(e){
        print("Couldn't load libSDL-1.2.so.0");
        throw "no sdl";
      };
    } catch(e){ };
    try {
      sdl.lib=ctypes.open("SDL.dll");
    } catch(e){
      print("Couldn't load SDL.dll");
      return false;
    };
    try {
      libc.lib=ctypes.open("msvcr120.dll");
    } catch(e){
      print("Couldn't load msvcr120.dll");
      return false;
    };
    sdl.system="win32";
    return true;
  };
  if(sdl.ptr_size===8){
    print("64-bit, assuming linux-x86_64");
    // try and load sdl
    try {
      sdl.lib=ctypes.open("libSDL-1.2.so.0");
    } catch(e){
      print("Couldn't load libSDL-1.2.so.0");
      return false;
    };
    // try and load libc
    try {
      libc.lib = ctypes.open("libc.so.6");
    } catch(e){
      print("Couldn't load libc.so.6");
      return false;
    };
    sdl.system="linux-x86_64";
    return true;
  }
  return false;
};


if(!sdl.detect_system()){
  print("ERROR: Unsupported system");
  quit();
};

print("System type: "+sdl.system);
if(sdl.system==="linux-i686"){
  // This is system specific setup code
  // Declare required libc functions and constants:

  libc.PROT_READ=1;
  libc.PROT_WRITE=2;
  libc.PROT_EXEC=4;
  libc.MAP_ANONYMOUS=32;
  libc.MAP_PRIVATE=2;

  // void *memcpy(void *dest, const void *src, size_t n);
  libc.memcpy= libc.lib.declare("memcpy",ctypes.default_abi,ctypes.voidptr_t,ctypes.voidptr_t, ctypes.voidptr_t,ctypes.uint32_t);

  // void *mmap(void *addr, size_t length, int prot, int flags,
  //                  int fd, off_t offset);
  libc.mmap=libc.lib.declare("mmap",ctypes.default_abi, ctypes.voidptr_t,ctypes.voidptr_t,ctypes.uint32_t,ctypes.int,ctypes.int,ctypes.int,ctypes.uint32_t);
  
  // setup sdl (common code) 
  load("setup-sdl.js");
};
if(sdl.system==="linux-x86_64"){
  // This is system specific setup code
  // Declare required libc functions and constants:

  libc.PROT_READ=1;
  libc.PROT_WRITE=2;
  libc.PROT_EXEC=4;
  libc.MAP_ANONYMOUS=32;
  libc.MAP_PRIVATE=2;

  // void *memcpy(void *dest, const void *src, size_t n);
  libc.memcpy= libc.lib.declare("memcpy",ctypes.default_abi,ctypes.voidptr_t,ctypes.voidptr_t, ctypes.voidptr_t,ctypes.uint64_t);

  // void *mmap(void *addr, size_t length, int prot, int flags,
  //                  int fd, off_t offset);
  libc.mmap=libc.lib.declare("mmap",ctypes.default_abi, ctypes.voidptr_t,ctypes.voidptr_t,ctypes.uint64_t,ctypes.int,ctypes.int,ctypes.int,ctypes.uint64_t);
  
  // setup sdl (common code) 
  load("setup-sdl.js");
  // Next we must set up the x86_64 machine code required:
  load("setup-linux-x86_64.js");
};

if(sdl.system==="win32"){
  // void *memcpy(void *dest, const void *src, size_t n);
  libc.memcpy= libc.lib.declare("memcpy",ctypes.default_abi,ctypes.voidptr_t,ctypes.voidptr_t, ctypes.voidptr_t,ctypes.uint32_t);
  load("setup-sdl.js");
}
