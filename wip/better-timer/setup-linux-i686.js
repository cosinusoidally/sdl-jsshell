/*

This sets up the machine code on linux-i686 note that the machine code is
actually identical to the win32 version. This is because the cdecl calling
convention used on win32 is very similar to the cdecl calling convention on
linux-i686 https://en.wikipedia.org/wiki/X86_calling_conventions . There are
some subtle differences that mean that this won't work in the general case, but
for this specific case it works fine.

*/

// We will allocate 4096 bytes (intended to be the memory page size ... I think
// that's the size of a page on Linux).

libcb.cb=libc.mmap(                       sdl.voidptr,
                                               4096,
  libc.PROT_READ | libc.PROT_WRITE | libc.PROT_EXEC,
              libc.MAP_ANONYMOUS | libc.MAP_PRIVATE,
                                                  0,
                                                  0);

load("i686-common.js");
