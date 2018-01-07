#include <SDL/SDL.h>
#include <SDL/SDL_thread.h>

SDL_mutex *mut;
SDL_cond *cond;

void initc(void){
  mut=SDL_CreateMutex();
  cond=SDL_CreateCond();
}

SDL_cond* getcond(void){
  return cond;
}
SDL_mutex* getmut(void){
  return mut;
}

void setcond(SDL_cond* c){
  cond=c;
}

// Uint32 (*SDL_NewTimerCallback)(Uint32 interval, void *param);

Uint32 cb(Uint32 interval, void *param){
  SDL_CondSignal(cond);
  return interval;
}
