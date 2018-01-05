#include <SDL/SDL.h>
#include <SDL/SDL_thread.h>

SDL_mutex *mut;
SDL_cond *cond;

void init(void){
  mut=SDL_CreateMutex();
  cond=SDL_CreateCond();
}
