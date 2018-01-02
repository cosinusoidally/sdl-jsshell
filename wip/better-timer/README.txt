Purpose

I just recently found out that SDL_WaitEvent has poor latency. This version
aims to remove the use of SDL_WaitEvent and instead schedule the calling of the
render function using a callback from a periodic timer.

See ./progress.txt for details of my plan to fix this plus a record of my
progress.

What is wrong with SDL_WaitEvent?

Let's take a look at the actual code:

from SDL-1.2.15/src/events/SDL_events.c :


int SDL_WaitEvent (SDL_Event *event)
{
        while ( 1 ) {
                SDL_PumpEvents();
                switch(SDL_PeepEvents(event, 1, SDL_GETEVENT, SDL_ALLEVENTS)) {
                    case -1: return 0;
                    case 1: return 1;
                    case 0: SDL_Delay(10);
                }
        }
}

I was quite surprised when I read this. When I initially wrote sdl-jsshell I
assumed that SDL_WaitEvent would get woken up in a timely manner when an event
arrived (I assumed it would, say, wait on a condition variable and then wake up
when an event came in). You can see from above that SDL_WaitEvent checks to see
if there is an event, if there is one it returns it, if not it sleeps for 10ms
and tries again. It is essentially polling 100 times per second to see if there
is an event. In my v0.0.2 code I schedule frames using a timer. When the timer
fires it puts an event in to the event queue. I assumed this would immediately
wake up my mainloop (which is sat waiting for an event using SDL_WaitEvent).
Because of this implementation of SDL_WaitEvent my code may end up waiting an
additional 10ms before drawing a frame (or more, if I'm unluck).

To illustrate the problem here are a few examples (for these we are ignoring
all other events that may end up in the event queue):

Assume frames are scheduled every 17ms (this is also problematic for other
reasons, ie SDL only really has a timer resolution of about 10ms).

In the main loop we (approximately) do the following (pseudo code):

loop {
  SDL_WaitEvent
  drain the event queue and process all events
  if( there was a frame draw event ){
    SDL_AddTimer(frame_interval,...) // to schedule the next frame
    render();
  }
}

Suppose render takes 16ms. The timer event will be added to the event queue
after 17ms. This means that when SDL_WaitEvent is called the event queue may be
empty. If this is the case SDL_WaitEvent will wait another 10ms and try again.
This time it will see the timer event and render a new frame. But this means
that the render function will only get called once every 26 ms (16+10). 

Suppose we are on an even faster machine. Lets say we can render in 6ms (let t
be the time since we scheduled the timer callback).
SDL_AddTimer schedules a timer to fire in 17ms (t=0);
render takes 6ms (t=6);
SDL_WaitEvent called. (at t=6)
No events so wait 10ms (t=16)
SDL_WaitEvent called. (at t=16)
timer event comes in at t=17
No events so wait 10ms (t=26)
SDL_WaitEvent called (at t=26)
timer event observed and render called (at t=26)

So again we end up only calling render every 26ms.

Ironically slower machines (up to a certain point) will actually get a better
framerate.  eg:

suppose render takes 17ms

SDL_AddTimer schedules a timer to fire in 17ms (t=0)
render takes 17ms (t=17)
timer fires (t=17)
SDL_WaitEvent called (at t=17)
timer event observed.
render called again (t=17).

And if render takes more than 17ms there will always be a timer event in the
queue so SDL_WaitEvent will return an event immediately.

Hopefully we are now convinced there is a problem with this approach. The next
step is to figure out a fix (see progress.txt for further info).

