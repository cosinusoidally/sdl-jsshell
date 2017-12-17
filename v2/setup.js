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
  // We currently only support linux-x86_64 and win32
  // First detect the pointer size. This will be 4 on 32-bit and 8 on 64-bit
  sdl.ptr_size=ctypes.voidptr_t.size;
  sdl.system="unsupported";
  if(sdl.ptr_size===4){ // assume if 32 bit we are on win32
    print("32-bit, assuming win32");
    try {
      sdl.lib=ctypes.open("SDL.dll");
    } catch(e){
      print("Couldn't load SDL.dll");
      return false;
    }
  }
  if(sdl.ptr_size===8){ // assume if 32 bit we are on win32
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
// we will load the libraries into the .lib field of sdl and libc 
// sdl.lib=ctypes.open("libSDL-1.2.so.0");
// libc.lib = ctypes.open("libc.so.6");

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

// Declare required SDL functions and constants:

// Note I don't implement all the fields from SDL_Surface. I only really care
// about w, h, and *pixels (so I only implement the fields up to and including
// pixels)
sdl.SDL_Surface=new ctypes.StructType("SDL_Surface",
//typedef struct SDL_Surface {
//        Uint32 flags;                            Read-only 
                                  [{"flags":ctypes.uint32_t},
//        SDL_PixelFormat *format;                 Read-only 
                                  {"SDL_PixelFormat":ctypes.voidptr_t},
//        int w, h;                                Read-only 
                                  {"w":ctypes.uint32_t},
                                  {"h":ctypes.uint32_t},
//        Uint16 pitch;                            Read-only 
                                  {"pitch":ctypes.uint32_t},
//        void *pixels;                            Read-write 
                                  {"pixels":ctypes.voidptr_t},
//
//         clipping information 
//        SDL_Rect clip_rect;                      Read-only 
//
//         Reference count -- used when freeing surface
//        int refcount;                            Read-mostly 
//
//	 This structure also contains private fields not shown here 
//} SDL_Surface;
                                  ]);

// SDL_Init flags. These are to initialise subsystems. Later on I just init
// eveything (SDL_INIT_EVERYTHING).
sdl.SDL_INIT_VIDEO=32;
sdl.SDL_INIT_EVERYTHING=65535;

// video mode flags. SDL_SWSURFACE gives us a software surface.
sdl.SDL_SWSURFACE=0;

// event enums
sdl.SDL_QUIT=12;
sdl.SDL_MOUSEMOTION=4;
sdl.SDL_MOUSEBUTTONDOWN=5;
sdl.SDL_MOUSEBUTTONUP=6;
sdl.SDL_USEREVENT=24;

// sizeof(SDL_Event)
sdl.sizeof_SDL_Event=24;

// SDL_TimerID SDL_AddTimer(Uint32 interval, SDL_NewTimerCallback callback, void *param);
sdl.SDL_AddTimer=sdl.lib.declare("SDL_AddTimer",ctypes.default_abi, ctypes.voidptr_t, ctypes.uint32_t, ctypes.voidptr_t, ctypes.voidptr_t);

// int SDL_Init(Uint32 flags);
sdl.SDL_Init=sdl.lib.declare("SDL_Init", ctypes.default_abi, ctypes.int, ctypes.uint32_t);

// int SDL_Flip(SDL_Surface *screen);
sdl.SDL_Flip=sdl.lib.declare("SDL_Flip", ctypes.default_abi, ctypes.int, sdl.SDL_Surface.ptr);

// int SDL_PushEvent(SDL_Event *event);
sdl.SDL_PushEvent=sdl.lib.declare("SDL_PushEvent",ctypes.default_abi, ctypes.int,ctypes.voidptr_t);

// SDL_Surface *SDL_SetVideoMode(int width, int height, int bpp, Uint32 flags);
sdl.SDL_SetVideoMode=sdl.lib.declare("SDL_SetVideoMode", ctypes.default_abi, sdl.SDL_Surface.ptr, ctypes.int, ctypes.int, ctypes.int, ctypes.uint32_t);

// int SDL_PollEvent(SDL_Event *event);
sdl.SDL_PollEvent=sdl.lib.declare("SDL_PollEvent", ctypes.default_abi, ctypes.int, ctypes.uint8_t.array(sdl.sizeof_SDL_Event).ptr);

// void SDL_Quit(void);
sdl.SDL_Quit=sdl.lib.declare("SDL_Quit",ctypes.default_abi, ctypes.void_t);

// int SDL_WaitEvent(SDL_Event *event);
sdl.SDL_WaitEvent=sdl.lib.declare("SDL_WaitEvent", ctypes.default_abi, ctypes.int, ctypes.uint8_t.array(sdl.sizeof_SDL_Event).ptr);

