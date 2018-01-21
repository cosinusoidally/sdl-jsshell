// build with gcc -m32 -fomit-frame-pointer -O2 -c -fno-stack-protector -g cb-snippet-32bit.c
// This code is only needed if you want to modify or regenerate the machine
// code contained in i686-common.js

// If you do rebuild this code and you start seeing "instruction-name ds:..."
// gunk in the disassembly it is because GCC is generating TLS crap or
// something similar. You'll then have to figure out which flags to use to stop
// GCC doing that. I think I just got luck with the version of GCC I used (I
// think it was the 32 bit version from a Debian Jessie i386 install).

// The reason you don't want that "ds: ..." stuff (DS is a segment register,
// you'll possibly also see "es:...") is that the code won't work on win32
// (plus it will probably also screw up on Linux because of the way we load it)

#include <SDL/SDL.h>
#include <SDL/SDL_thread.h>

// int SDL_CondSignal(SDL_cond *cond);
typedef int (* my_SDL_CondSignal)(SDL_cond *cond);
// Uint32 (*SDL_NewTimerCallback)(Uint32 interval, void *param);

Uint32 cb(Uint32 interval, void *param){
  ((my_SDL_CondSignal)0xdeadbeef)(0x01abcdef);
  return interval;
}
