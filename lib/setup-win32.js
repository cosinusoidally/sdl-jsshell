/*

Setting up on win32.
--------------------

Get win32 jsshell binaries from:

https://github.com/cosinusoidally/jsshell-binaries-mirror

Check the signature to confirm that they are authenic versions from Mozilla (or
if you prefer, get them straight from Mozilla).

Get the win32 version of SDL 1.2 from here:

https://www.libsdl.org/download-1.2.php

direct link is:

https://www.libsdl.org/release/SDL-1.2.15-win32.zip

Extract both jsshell and SDL (to be on the safe side I'd also do a virus scan
on SDL, eg here are the results (and SHA256 sum) from Virus Total
https://www.virustotal.com/#/file/a28bbe38714ef7817b1c1e8082a48f391f15e4043402444b783952fca939edc1/detection).

Put the SDL.dll file in to the same directory as
js.exe

You should then be able to run the test.js file using:

js.exe test.js

Note that if the version of jsshell that you are using is higher than 45 there
is another step you must follow. You must put a copy of msvcp120.dll and
msvcr120.dll in the same directory as js.exe (you can just grab these dlls from
the win32 jsshell 45 zip file).

Just a quick word about WINE. This should work fine under WINE. I've tested and
jsshell 45 works perfectly fine under WINE on Ubuntu 14.04. The only problem is
if your version of jsshell is too new. I think everything above about jsshell
54 won't work on the version of WINE that ships with Ubuntu 14.04. If you want
to use the latest version of jsshell under WINE you will need the latest
stable, or possibly devel version of WINE.

*/


/*
See also setup-linux-x86_64.js . This works in a very similar way.
VirtualAlloc is an approximate win32 analogue of mmap. The machine code snippet
used was generated with GCC on Linux.
*/

kernel32.lib=ctypes.open("Kernel32.dll");

/*
LPVOID WINAPI VirtualAlloc(
  _In_opt_ LPVOID lpAddress,
  _In_     SIZE_T dwSize,
  _In_     DWORD  flAllocationType,
  _In_     DWORD  flProtect
 );
 */

kernel32.VirtualAlloc=kernel32.lib.declare("VirtualAlloc",ctypes.winapi_abi,ctypes.voidptr_t,ctypes.voidptr_t,ctypes.uint32_t,ctypes.uint32_t,ctypes.uint32_t);
kernel32.MEM_COMMIT=0x00001000;
kernel32.PAGE_EXECUTE_READWRITE=0x40;
libcb.cb=kernel32.VirtualAlloc(ctypes.voidptr_t(0),4096,kernel32.MEM_COMMIT,kernel32.PAGE_EXECUTE_READWRITE);

// now load the common machine code
load("i686-common.js");
