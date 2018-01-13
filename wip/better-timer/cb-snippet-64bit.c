// build with gcc -fomit-frame-pointer -O2 -c -fno-stack-protector -g cb-snippet-64bit.c
#include <SDL/SDL.h>
#include <SDL/SDL_thread.h>

// int SDL_CondSignal(SDL_cond *cond);
typedef int (* my_SDL_CondSignal)(SDL_cond *cond);
// Uint32 (*SDL_NewTimerCallback)(Uint32 interval, void *param);

Uint32 cb(Uint32 interval, void *param){
  ((my_SDL_CondSignal)0xdeadbeefdeadbeef)(0x1234567890abcdef);
  return interval;
}
