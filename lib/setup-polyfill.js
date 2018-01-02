/*
This is a (inefficient) polyfill implementation of SDL_AddTimer and
SDL_WaitEvent.

This polyfill is for platforms that don't yet have the required machine code
version of the SDL_AddTimer callback.
*/

sdl.SDL_AddTimer=function(){
  // do nothing.
};

sdl.last=Date.now();
sdl.SDL_WaitEvent=function(f){
  var _=this;
  do {
    var now=Date.now();
    if(now-_.last>_.frame_interval){
      _.last=now;
      if(_.draw_frame===false){
        var e=new ArrayBuffer(32);
        var e1=new Uint8Array(e);
        e1[0]=_.SDL_USEREVENT;
        _.SDL_PushEvent(e);
      }
    }
  } while(_.SDL_PollEvent(f)===0);
  return;
};
