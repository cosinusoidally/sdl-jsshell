/*

    sdl-jsshell simple SDL bindings to the Spidermonkey shell
    Copyright (C) 2017  Liam Wilson

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Lesser General Public
    License as published by the Free Software Foundation; either
    version 2.1 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public
    License along with this library; if not, write to the Free Software
    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301
    USA

*/
/*
Using jsctypes and SDL to build graphical applications on top of the
SpiderMonkey Shell.

This file is the implementation and also comprehensive design documentation. As
such it contains large blocks of comments. This might be a bit awkward to read
on GitHub since they choose to display comments in an almost unreadable grey
font.  If you find it difficult to read you can either go in to your browser
devtools and set the font colour to black, or you could use the Raw button
above to view the file as plain text (but using the Raw button may mean you end
up with a stale version of the file due to browser caching, maybe just git
clone and view in your own text editor :) ).

This library allows us to write multimedia applications purely in JS, without
depending on a web browser. jsctypes allows us to call in to C shared libraries
from JS, eliminating the need to write any wrapper code (jsctypes docs are
here: https://developer.mozilla.org/en-US/docs/Mozilla/js-ctypes/ unfortunately
docs are not great).

Spidermonkey is the JavaScript VM from Mozilla Firefox. Mozilla distribute
a stand alone versions of Spidermonkey for Linux (x86,x86_64), Windows
(x86,x86_64) and Mac OS (x86_64). Mozilla call this shell build jsshell.

jsshell is available from https://archive.mozilla.org/pub/firefox/releases/ for
all releases beyond 58.0b4 (since
https://bugzilla.mozilla.org/show_bug.cgi?id=1336514 was fixed). Earlier
versions are also available from
https://archive.mozilla.org/pub/firefox/candidates/ (but note that the
candidate builds are only available for a fixed amount of time, iirc 18
months).

release/ builds live in jsshell/ and can be verified using SHA512SUMS and
SHA512SUMS.asc

candidate/ builds live in . and can be verified using the relevant en-US
firefox*.checksums and firefox*.checksums.asc files. Later candidate builds are
actually copies of the release builds (if you get the right one).

Note that with the candidate builds Mozilla messed up and stopped providing
signatures at around the time of 45.8.0esr. You can still get the later
versions. This will only really affect you if you want to mirror the binaries
on your own hosting (since users cannot verify the authenticity without the
signature files). I'll probably mirror the 45.8.0esr binaries and signatures on
GitHub before they disappear. This problem will go away once the release/
builds of jsshell are available for a stable release of Firefox (they are only
currently there for FF 58, which is still in beta).

Setting Up
----------

This was written and tested on a x86_64 Ubuntu 14.04 system (but it should work
on any x86_64 Linux distro with SDL 1.2 from CentOS 6 up). The below code makes
assumptions about being on an x86_64 Linux system (specifically struct
alignment, calling convention, etc). It probably will not work anywhere else.
It could be ported though. I do plan to get a win32 version going, but I
haven't ported it yet. 

This code should work on pretty much any version of jsshell, but the version I
have used is 45.8.0 .

Getting jsshell
---------------
wget https://archive.mozilla.org/pub/firefox/candidates/45.8.0esr-candidates/build2/jsshell-linux-x86_64.zip
wget https://archive.mozilla.org/pub/firefox/candidates/45.8.0esr-candidates/build2/linux-x86_64/en-US/firefox-45.8.0esr.checksums
wget https://archive.mozilla.org/pub/firefox/candidates/45.8.0esr-candidates/build2/linux-x86_64/en-US/firefox-45.8.0esr.checksums.asc

gpg --verify firefox-45.8.0esr.checksums.asc
gpg: Signature made Thu Mar  2 03:40:50 2017 UTC using RSA key ID 5E9905DB                     gpg: Good signature from "Mozilla Software Releases <release@mozilla.com>" 
gpg: Note: This key has expired! 
Primary key fingerprint: 14F2 6682 D091 6CDD 81E3  7B6D 61B7 B526 D98F 0353 
     Subkey fingerprint: F2EF 4E6E 6AE7 5B95 F11F  1EB5 1C69 C4E5 5E99 05DB

If it says:

gpg --verify firefox-45.8.0esr.checksums.asc 
gpg: Signature made Thu Mar  2 03:40:50 2017 UTC using RSA key ID 5E9905DB 
gpg: Can't check signature: public key not found 

You will need to get the key with:

gpg --recv-key F2EF4E6E6AE75B95F11F1EB51C69C4E55E9905DB

You will then need to grep for the sha512 sum of jsshell-linux-x86_64.zip

sha512sum jsshell-linux-x86_64.zip
a62c6fa15e46de1099b989ea664356cedfe47042f98dec62c0f302a59039f075ca1347089a5eec0961c38bdedc06625fcae96f5394833c2a7926c0980f45ad47  jsshell-linux-x86_64.zip

grep a62c6fa15e46de1099b989ea664356cedfe47042f98dec62c0f302a59039f075ca1347089a5eec0961c38bdedc06625fcae96f5394833c2a7926c0980f45ad47 firefox-45.8.0esr.checksums

If that comes back ok we then need to extract the zip file.

mkdir bin
cd bin
unzip ../jsshell-linux-x86_64.zip

Then set LD_LIBRARY_PATH and PATH

export LD_LIBRARY_PATH=${PWD}
export PATH=${PWD}:$PATH

Then check it is working:

js --version 
JavaScript-C45.8.0                        

Getting SDL 1.2
---------------

I'm using SDL 1.2. This is because it is available as a part of every current
Linux distro. It also supports software rendering which is important for Linux
distros (far too many buggy OpenGL drivers). I may eventually also add SDL 2
bindings which could be dynamically loaded at initialisation time.

apt-get install libsdl1.2debian 

It is also handy to get libsdl1.2-dev just in case you need to write any SDL C
code to figure out structure sizes, field offsets, etc (only useful if you are
doing dev work on this code itself).

Documentation is here https://www.libsdl.org/release/SDL-1.2.15/docs/ . The
docs are very good. We will be referring to these a lot.

General structure
-----------------

First we must put a window on the screen (details lower down). After this is
done we sit in a loop and wait for things to happen. SDL has the concept of an
event loop. Events include mouse movement, keystrokes, and timer events.
Generated events go in to an event queue which we consume. We sit in a loop
waiting for events and responding accordingly. We must also periodically draw a
frame. We will use a periodic timer to trigger the drawing of a frame. These
timer events will be generated by SDL and fed into the event queue (since
jsshell does not have setInterval or setTimout (it does have Date.now, but that
means we would need to poll to measure time, which is inefficient (yes I know
nested parentheticals in writing are bad))).


In pseudo code our structure will be something like this

* Load libsdl, and libc *
* bind relevant functions to js *


We first set up SDL. This involes running it's init function (SDL_Init), and
creating an on-screen window  with SDL_SetVideoMode

function sdl_init(width,height){
  SDL_Init(SDL_INIT_EVERYTHING);
  // 32 is the bits per pixel. We just hard code this. SDL_SWSURFACE creates us
  // a software surface
  return SDL_SetVideoMode(width, height, 32, SDL_SWSURFACE);
}

A couple of useful globals:
running=true; // self explanatory, if it goes false we stop running our program

draw_frame=true; // set to true if we need to draw a frame

event_raw=new ArrayBuffer(24); // this is where the raw event data is written
                               // to. It is 24 bytes long on Linux x86_64

event=new Uint8Array(event_raw); // this is an Uint8Array view onto the raw
				 // event data. We can then decode the bytes
				 // our self

frame_interval=50; // How frequently we will attempt to draw frames (in ms). In
		   // this case we will do 50ms, which will give us a target of
		   // 20Hz

This is our main loop. Note that we use both SDL_WaitEvent and SDL_PollEvent.
SDL_WaitEvent blocks until an event comes in. This allows us to yield to the
event loop and idle until we need to actually do work. This saves wasting CPU
time. When we wake up we then need to drain the event queue and dispatch all
events to the relevant event listeners. The while loop containing SDL_PollEvent
is used to drain the event queue. SDL_PollEvent will return false (or whatever
the numerical equivalent is) once the queue has been drained. process_event
will be used to process the events. The user provided render function will
actually paint our frame. The render function will only be triggered if
draw_frame is true (which is set when the frame timer has fired). If running is
set to false we will stop looping and call SDL_Quit to cleanly shut down SDL.
 
function sdl_mainloop(surface){ // takes the surface from init_sdl 
  SDL_AddTimer(frame_interval,...); // schedule first frame to be drawn 
  while(running){
    SDL_WaitEvent(event_raw);
    process_event(); 
    while(SDL_PollEvent(event_raw)){
      process_event(); 
    };
    if(draw_frame){
      SDL_AddTimer(frame_interval,...); // schedule another frame event callback
                                        // in frame_interval ms
      if(render()){ // only actually flip buffers if we have painted a frame
        SDL_Flip(surface); 
      }
      draw_frame=false; // reset draw_frame
    }
  };
  SDL_Quit();
}


Our process_event function processes events. See definition of SDL_Event here
https://www.libsdl.org/release/SDL-1.2.15/docs/html/sdlevent.html . SDL_Event
is a union type of all SDL events. First byte indicates the event type, the
rest is event specific data.

function process_event(){
  var type=event[0]; // recall event is a Uint8Array view on to event_raw.
  // event[0] is the type of event, see SDL_Event ctype
  if(type===SDL_QUIT){ // does what is says on the tin, ie quit
    running=false;
  };
  if(type===SDL_MOUSEMOTION){
    var mx=event[4]+(event[5]<<8); // pluck out the 16 bit absolute x value
    var my=event[6]+(event[7]<<8); // pluck out the 16 bit absolute y value
    onmousemove(mx,my); // trigger the onmousemove handler provided by the user
  };
  if(type===SDL_MOUSEBUTTONDOWN){
    onmousedown(); // user event handler
  }
  if(type===SDL_MOUSEBUTTONUP){
    onmouseup(); // user event handler
  }
  if(type===SDL_USEREVENT){ // This will be the event type of our timer (we
			    // will SDL_PushEvent an event of this type from
			    // our timer callback).
   draw_frame=true; 
  }
}

Our render function will paint to the back buffer: 

function render(surface){
... do some rendering ...
  libc.memcpy(surface.pixels,...); // copy our pixel data into surface.pixels
				   // Note that in the real implementation the
				   // memcpy is actually in the mainloop
  return true; // tell the mainloop to flip the buffers
}

Now I have glossed over some details above. The main one is to do with
SDL_AddTimer. The SDL_AddTimer function takes 3 arguments:

SDL_TimerID SDL_AddTimer(Uint32 interval, SDL_NewTimerCallback callback, void *param);

The callback argument is a pointer to a function. We can define callbacks using
jsctypes, but in this case it will not work. The callback will be called from a
different thread. According to the jsctypes docs
(https://developer.mozilla.org/en-US/docs/Mozilla/js-ctypes/Using_js-ctypes/Declaring_and_Using_Callbacks)
we are not allowed to define jsctypes callbacks that call in to JS from a
different thread. If we do that we will crash (or corrupt memory or other bad
things). This leaves us with a few options:

* Write the callback in C, build it as a shared library and use jsctypes to
  load it. When the callback is called it would use SDL_PushEvent to add a
  event to the event queue to indicate that the timer event has fired.

  The disadvantage to this approach is that we would require a C compiler to be
  installed (or we would need to ship a shared library binary). Ideally I would
  like to avoid such a dependency.

* Somehow generate some x86_64 machine code at runtime and call it from
  jsctypes. The generated machine code would need to call SDL_PushEvent to put
  the time event into the event queue.

  The disadvantage to this approach is that we will require platform specific
  machine code.

There are other options, but the above were the ones I considered. I decided to
take the runtime machine code generation option. To do this I mmap some
executable memory, generate some machine code into that memory, and then call
in to that memory using jsctypes. Exact implementation details are further down
this document.


The implementation
------------------
From this point onwards I will intermingle code and commentary.

First we must load the SDL library and define the required functions. We will
also need to load libc (for memcpy and mmap).
*/
sdl={};
libc={};

// we will load the libraries into the .lib field of sdl and libc 
sdl.lib=ctypes.open("libSDL-1.2.so.0");
libc.lib = ctypes.open("libc.so.6");

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


/*

At this point I am ready to start implementing my "sdl_init" function and my
"sdl_mainloop". To avoid polluting the global namespace I should attach them to
an object. The sensible object to attach them to would be the sdl object
itself.

sdl.sdl_init=function(width,height,init,render) (Implementation below)

The init function will be installed on the sdl object and then run. This init
function can set up callbacks for mouse movement and button presses (by adding
onmousemove, etc to this object).

The render function will be installed on the sdl object and called every time a
frame is required.

*/

sdl._init=function(){print("Init called")}; // this the init callback defined by
                                            // your app 
sdl.render=function(){print("render called")}; // this is the render
                                               // callback defined by
                                               // your app.
sdl.onmousemove=function(mx,my){print("mousemove:"+mx+","+my)};
sdl.onmousedown=function(){print("mousedown")};
sdl.onmouseup=function(mx,my){print("mouseup")};

sdl.voidptr=ctypes.voidptr_t(0); // null pointer, just handy to have
sdl.cb=ctypes.voidptr_t(0); // This is a callback to pass in to SDL_AddTimer.
                            // Here we set it initially to a null pointer


sdl.sdl_init=function(width,height,init,render){
  var _=this;
  _.frame_interval=17; // aim for approx 60 frames per second.
                       // Annoyingly the interval SDL_AddTimer takes is an
                       // integer number of ms which means you cannot
                       // represent 1000/60 (16.6666....). 
  _.width=width;
  _.height=height;
  _.running=true;
  _.event_raw=new ArrayBuffer(_.sizeof_SDL_Event);
  _.event=new Uint8Array(_.event_raw);
  _.draw_frame=false; // initially false since the 1st frame is scheduled
                      // inside sdl_mainloop. If we had set this to true
                      // we will end up with each frame being drawn twice
  if(init){_._init=init};
  if(render){_.render=render};
  _.SDL_Init(_.SDL_INIT_EVERYTHING);
  _._init();
  _.surface=_.SDL_SetVideoMode(width, height, 32, _.SDL_SWSURFACE);
  _.cpixels=_.surface.contents.pixels; // this is a void pointer to the pixels
                                       // in the SDL_Surface
  _.pixels_raw=new ArrayBuffer(_.width*_.height*4);
  // pixels_raw is an ArrayBuffer backing our JS pixels array
  // pixels_raw will be memcpy'd to cpixels prior to calling SDL_Flip
  _.pixels=new Uint8Array(_.pixels_raw);  // this will be the JS array where we
                                          // paint our pixels
}


sdl.sdl_mainloop=function(){
  var _=this;
  sdl.SDL_AddTimer(_.frame_interval,_.cb,_.voidptr); // schedule first frame to be drawn 
  while(_.running){
    _.SDL_WaitEvent(_.event_raw);
    _.process_event(); 
    while(_.SDL_PollEvent(_.event_raw)){
      _.process_event(); 
    };
    if(_.draw_frame){
      sdl.SDL_AddTimer(_.frame_interval,_.cb,_.voidptr); // schedule another
                                                         // frame event callback
                                                         // in frame_interval ms
      if(_.render(_)){ // only actually flip buffers if we have painted a frame
        libc.memcpy(_.cpixels,_.pixels_raw,_.pixels.length);
        _.SDL_Flip(_.surface); 
      }
      _.draw_frame=false; // reset draw_frame
    }
  };
  _.SDL_Quit();

}

sdl.process_event=function(){
  var _=this;
  var type=_.event[0]; // recall event is a Uint8Array view on to event_raw.
  // event[0] is the type of event, see SDL_Event ctype
  if(type===_.SDL_QUIT){ // does what is says on the tin, ie quit
    _.running=false;
  };
  if(type===_.SDL_MOUSEMOTION){
    var mx=_.event[4]+(_.event[5]<<8); // pluck out the 16 bit x value
    var my=_.event[6]+(_.event[7]<<8); // pluck out the 16 bit y value
    _.onmousemove(mx,my); // trigger the onmousemove handler provided by the user
  };
  if(type===_.SDL_MOUSEBUTTONDOWN){
    _.onmousedown(); // user event handler
  }
  if(type===_.SDL_MOUSEBUTTONUP){
    _.onmouseup(); // user event handler
  }
  if(type===_.SDL_USEREVENT){ 
    // This will be the event type of our timer (we will SDL_PushEvent an event
    // of this type from our timer callback).
   _.draw_frame=true; 
  }


}

/*

In _.cb we must store a pointer to a function to be called by SDL_AddTimer
whenever a timer fires. _.cb will be the location of an executable mmapped
buffer. We must fill that buffer with the required machine code. To do this we
will create and disassemble a C function:

#include <stdint.h>

typedef int (*my_SDL_PushEvent)(char *);


uint32_t my_SDL_NewTimerCallback(uint32_t interval,void *param){
  char a[24];
  a[0]=24;
  // This is the absolute address SDL_PushEvent, we need to patch in this value
  // at runtime.
  ((my_SDL_PushEvent)0xdeadbeefdeadbeef)(a); 
  return 0;
}

Note that the signatures for my_SDL_PushEvent and my_SDL_NewTimerCallback match
SDL_PushEvent and SDL_NewTimerCallback respectively.

We then build the object code as follows:

gcc -fomit-frame-pointer -O2 -c -fno-stack-protector cb.c

Note the -fno-stack-protector flag. That is to prevent gcc from emitting a
bunch of unnecessary code.

We then use objdump to disassemble the function:

objdump -D cb.o

cb.o:     file format elf64-x86-64


Disassembly of section .text:

0000000000000000 <my_SDL_NewTimerCallback>:
   0:   48 83 ec 28             sub    $0x28,%rsp
   4:   48 b8 ef be ad de ef    movabs $0xdeadbeefdeadbeef,%rax
   b:   be ad de 
   e:   c6 04 24 18             movb   $0x18,(%rsp)
  12:   48 89 e7                mov    %rsp,%rdi
  15:   ff d0                   callq  *%rax
  17:   31 c0                   xor    %eax,%eax
  19:   48 83 c4 28             add    $0x28,%rsp
  1d:   c3                      retq   

The above also gives us a hex dump of the function. We can convert this to an
array and add it to our sdl object.
*/

sdl.cb_bin=[
//0000000000000000 <my_SDL_NewTimerCallback>:
//   0:   48 83 ec 28             sub    $0x28,%rsp
          0x48,0x83,0xec,0x28,
//   4:   48 b8 ef be ad de ef    movabs $0xdeadbeefdeadbeef,%rax
          0x48,0xb8,0xef,0xbe,0xad,0xde,0xef,
//   b:   be ad de 
          0xbe,0xad,0xde, 
//   e:   c6 04 24 18             movb   $0x18,(%rsp)
          0xc6,0x04,0x24,0x18,
//  12:   48 89 e7                mov    %rsp,%rdi
          0x48,0x89,0xe7,
//  15:   ff d0                   callq  *%rax
          0xff,0xd0,
//  17:   31 c0                   xor    %eax,%eax
          0x31,0xc0,
//  19:   48 83 c4 28             add    $0x28,%rsp
          0x48,0x83,0xc4,0x28,
//  1d:   c3                      retq   
          0xc3];

sdl.cb_raw=new ArrayBuffer(sdl.cb_bin.length);

// convert sdl.cb_bin in to a Uint8Array view onto sdl.cb_raw

(function(){
 var o=new Uint8Array(sdl.cb_raw);
  for(var i=0;i<sdl.cb_bin.length;i++){
    o[i]=sdl.cb_bin[i];
  }
  sdl.cb_bin=o;
})();

// We now need to patch in the address of SDL_PushEvent.

// First we must get the address of SDL_PushEvent

sdl.address_SDL_PushEvent=ctypes.cast(sdl.SDL_PushEvent,ctypes.uint8_t.array(8));

// Now patch the address of SDL_PushEvent in to the relevant offset into sdl.cb_bin
// This is the relevant instruction
//   4:   48 b8 ef be ad de ef    movabs $0xdeadbeefdeadbeef,%rax
//   b:   be ad de

// The movabs instruction is 2 bytes long in this case. That mean we must patch
// 8 bytes from offset 6

(function(){
  for(var i=0;i<8;i++){
    sdl.cb_bin[i+6]=sdl.address_SDL_PushEvent[i];
  }
})();

// Next we need some executable memory in to which we will copy our machine
// code. We will create this with mmap.

// mmap invocation from:
// http://burnttoys.blogspot.co.uk/2011/04/how-to-allocate-executable-memory-on.html

// mmap(
//       NULL,
//       codeBytes,
//       PROT_READ | PROT_WRITE | PROT_EXEC,
//       MAP_ANONYMOUS | MAP_PRIVATE,
//       0,
//       0);

// We will allocate 4096 bytes (intended to be the memory page size ... I think
// that's the size of a page on Linux).

sdl.cb=libc.mmap(                       sdl.voidptr,
                                               4096,
  libc.PROT_READ | libc.PROT_WRITE | libc.PROT_EXEC,
              libc.MAP_ANONYMOUS | libc.MAP_PRIVATE,
                                                  0,
                                                  0);


// Next we copy our machine code in to our sdl.cb buffer.
libc.memcpy(sdl.cb,sdl.cb_bin,sdl.cb_bin.length);

/*

And that's it. We now have a sdl global that we can use to create a window,
draw to the screen and listen for mouse events. We are currently missing code
to handle keyboard events, but that can be added fairly simply.

See test.js for a simple example program using this library.

*/



//Misc junk:
//----------

// Just a dummy version of SDL_AddTimer that I used during development.

/*
sdl.SDL_AddTimer=function(){
  var _=this;
  print("Dummy SDL_AddTimer");
}
*/

