/*

Did you know that Firefox has a special mode that allows turns it in to a
JavaScript shell [2]

Try running the following [1]:

firefox -xpcshell -i

You get a JS REPL! This is really handy as it means that you can use the stock
system copy of Firefox to run these demos (so long as Mozilla doesn't break
xpcshell, if they do you can simply grab an old tarball (or the last working
ESR) and use that).

This is really handy as stock Firefox builds are much more widely available
than jsshell builds. For example, if you're on Raspbian on a Raspberry PI
you'll be able to get the latest ESR version of Firefox, but the latest version
of jsshell is 24 (which is also totally bust on the latest version of Raspbian,
see https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=848190). Mozilla also do
not ship official ARM versions of jsshell (or Firefox for that matter, but
distros *do* ship up to date ARM versions of Firefox).

This file has to do 3 things:

* load the js-ctypes module

* polyfill the jsshell "read" function, since xpcshell doesn't have it built in
  (you can probably polyfill with some XPCOM API, but I've just used fopen,
  fread, etc, from libc)

* load the demo specified by the exe variable (which gets filled in by
  run-in-firefox.sh)

[1] Note this also works on Windows, but for some reason it doesn't seem to
work through cmd.exe. The work around I found was to run Firefox through the
git-bash shell. Another (probably better) way is to grab a node.js binary (I
used the win32 version of 0.10) and use child_process.spawn.

[2] xpcshell is a test harness that Mozilla use to test (JS parts of) Firefox.
Since Firefox 47 is it a standard component of Firefox release builds. The
-xpcshell flag was added under
https://bugzilla.mozilla.org/show_bug.cgi?id=1238769

*/

// load the js-ctypes module
Components.utils.import("resource://gre/modules/ctypes.jsm");

/*

Polyfill the read function

read(filename, type) -- if type is "binary" we read it in binary mode into a Uint8Array

The basic process is:

fopen
fseek to the end of the file
ftell to give the length of the file
rewind back to the start of the file
allocate an output buffer of the right size
fread the file in to the buffer
if we are in "binary" mode return the buffer as a Uint8Array
else convert the buffer to a string and return that

*/

(function(){

// Note this is assuming we are on Linux, we should check our OS and load the correct libc
var c=ctypes.open("libc.so.6");

// FILE * fopen ( const char * filename, const char * mode );
var fopen=c.declare("fopen",
                        ctypes.default_abi, /* call ABI */
                        ctypes.voidptr_t,         /* return type */
                        ctypes.char.ptr,  /* argument type */
                        ctypes.char.ptr);   /* argument type */
// int fseek(FILE *stream, long offset, int whence);
var fseek=c.declare("fseek",
                        ctypes.default_abi, /* call ABI */
                        ctypes.int,         /* return type */
                        ctypes.voidptr_t,  /* argument type */
                        ctypes.long,   /* argument type */
                        ctypes.int);   /* argument type */
// void rewind(FILE *stream);
var rewind=c.declare("rewind",
                        ctypes.default_abi, /* call ABI */
                        ctypes.void_t,
                        ctypes.voidptr_t);
var SEEK_END=2;
// int fclose ( FILE * stream );
var fclose=c.declare("fclose",
                        ctypes.default_abi, /* call ABI */
                        ctypes.int,
                        ctypes.voidptr_t);

// long int ftell ( FILE * stream );
var ftell=c.declare("ftell",
                        ctypes.default_abi, /* call ABI */
                        ctypes.long,
                        ctypes.voidptr_t);

// size_t fread(void *ptr, size_t size, size_t nmemb, FILE * stream );
var fread=c.declare("fread",
                        ctypes.default_abi, /* call ABI */
                        ctypes.int,
                        ctypes.voidptr_t,
                        ctypes.int,
                        ctypes.int,
                        ctypes.voidptr_t);

read=function(n,t){
  var f=fopen(n,"rb");
  fseek(f,0,SEEK_END);
  var l=ftell(f);
  rewind(f);
  l=parseInt(l.toString(),10);
  var b=new Uint8Array(l);
  fread(b,1,l,f);
  fclose(f);
  if(t==="binary"){
    return b;
  };
  
  var o=[];
  for(var i=0;i<l;i++){
    o.push(String.fromCharCode(b[i]));
  }
  o=o.join("");
  return o;
};

})();

// Actually load our demo
load(exe);
