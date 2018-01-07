// Declare required SDL functions and constants:

// Note these SDL declarations are actually identical for all our currently
// supported platforms

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

// int SDL_mutexP(SDL_mutex *mutex);
sdl.SDL_mutexP=sdl.lib.declare("SDL_mutexP", ctypes.default_abi, ctypes.int, ctypes.voidptr_t);

// int SDL_CondWait(SDL_cond *cond, SDL_mutex *mut);
sdl.SDL_CondWait=sdl.lib.declare("SDL_CondWait", ctypes.default_abi, ctypes.int, ctypes.voidptr_t, ctypes.voidptr_t);

// SDL_mutex *SDL_CreateMutex(void);
sdl.SDL_CreateMutex=sdl.lib.declare("SDL_CreateMutex", ctypes.default_abi, ctypes.void_t);

// SDL_cond *SDL_CreateCond(void);
sdl.SDL_CreateCond=sdl.lib.declare("SDL_CreateCond", ctypes.default_abi, ctypes.void_t);
