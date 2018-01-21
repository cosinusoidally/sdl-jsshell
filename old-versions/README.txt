This is where all the old versions of the code lives. Whenever I do some major
bit of refactoring I'll put the old version in here. 

I'll try and follow semver for previous versions.

v0.0.1/ this version only supports linux-x86_64. This version has the nice property
of being in a single file. It made a couple of hard coded assumptions that made
it difficult to port to other arches without some major refactoring.

v0.0.2/ similar to v0.0.1 but this version supports supports multiple
archtectures (win32, linux-i686 and linux-x86_64). This version was retired
when I learnt about issues with timers and the latency of SDL_WaitEvent. The
current version in ../lib does not suffer from that issue.
