#include <SDL/SDL.h>
#include <SDL/SDL_thread.h>

SDL_mutex *mut;
SDL_cond *cond;

void init(void){
  mut=SDL_CreateMutex();
  cond=SDL_CreateCond();
}

SDL_cond* getcond(void){
  return cond;
}
SDL_mutex* getmut(void){
  return mut;
}

