// to build use ./mk_cb
#include <SDL/SDL.h>
#include <SDL/SDL_thread.h>

SDL_cond *cond;

void setcond(SDL_cond* c){
  cond=c;
}

// Uint32 (*SDL_NewTimerCallback)(Uint32 interval, void *param);

Uint32 cb(Uint32 interval, void *param){
  SDL_CondSignal(cond);
  return interval;
}
