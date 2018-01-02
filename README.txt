sdl-jsshell - Simple Spidermonkey Shell (jsshell) jsctypes bindings to SDL 

Ever wanted to write multimedia apps in JavaScript without being stuck inside a
web browser? No? Well, don't knock it until you have tried it. This library
allows you to do exactly that.

Source code and extensive documentation are in lib/sdl.js . There is also
lib/test.js which contains a simple example of how to use the API. There are
some demo apps in demos/ (note demos must be run from the demos/ dir).

This code works on win32, linux-i686 and linux-x86_64


directory structure:

* demos/ this contains some demos of using the library
* lib/ this is where the current version lives
* old-versions/ this contains an archive of old versions, plus possibly some
  critique of those versins.
* wip/ work in progress branch. Contains any experimental work in progress code

(yes I could have used git branches and tags but I was getting bored of
juggling branches, if this layout doesn't work out I'll revert to a more
traditional branches/tags approach).
