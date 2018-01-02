This is where work in progress or experimental work lives.

better-timer/ SDL_WaitEvent has poor latency. This version aims to remove the
use of SDL_WaitEvent and instead schedule the calling of the render function
using a callback from a periodic timer (for more detail see the README.txt
inside better-timer/).
