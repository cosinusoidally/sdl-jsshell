/*

This sets up the machine code on linux-i686 note that the machine code is
actually identical to the win32 version. This is because the cdecl calling
convention used on win32 is very similar to the cdecl calling convention on
linux-i686 https://en.wikipedia.org/wiki/X86_calling_conventions . There are
some subtle differences that mean that this won't work in the general case, but
for this specific case it works fine.

*/


sdl.cb_bin=[
//  a.o:     file format pe-i386

//  Disassembly of section .text:

//  00000000 <_my_SDL_NewTimerCallback>:

//  0:   83 ec 3c                sub    $0x3c,%esp
         0x83,0xec,0x3c,

//  3:   8d 44 24 18             lea    0x18(%esp),%eax
         0x8d,0x44,0x24,0x18,

//  7:   c6 44 24 18 18          movb   $0x18,0x18(%esp)
         0xc6,0x44,0x24,0x18,0x18,

//  c:   89 04 24                mov    %eax,(%esp)
         0x89,0x04,0x24,

//  f:   b8 ef be ad de          mov    $0xdeadbeef,%eax
         0xb8,0xef,0xbe,0xad,0xde,

// 14:   ff d0                   call   *%eax
         0xff,0xd0, 

// 16:   31 c0                   xor    %eax,%eax
         0x31,0xc0,

// 18:   83 c4 3c                add    $0x3c,%esp
         0x83,0xc4,0x3c, 

// 1b:   c3                      ret    
         0xc3

// 1c:   90                      nop

// 1d:   90                      nop

// 1e:   90                      nop

// 1f:   90                      nop

];

sdl.cb_raw=new ArrayBuffer(sdl.cb_bin.length);

// convert sdl.cb_bin in to a Uint8Array view onto sdl.cb_raw

(function(){
 var o=new Uint8Array(sdl.cb_raw);
  for(var i=0;i<sdl.cb_bin.length;i++){
    o[i]=sdl.cb_bin[i];
  }
  sdl.cb_bin=o;
})();

// We now need to patch in the address of SDL_PushEvent.

// First we must get the address of SDL_PushEvent

sdl.address_SDL_PushEvent=ctypes.cast(sdl.SDL_PushEvent,ctypes.uint8_t.array(4));

// Now patch the address of SDL_PushEvent in to the relevant offset into sdl.cb_bin
(function(){
  for(var i=0;i<4;i++){
    sdl.cb_bin[i+0x10]=sdl.address_SDL_PushEvent[i];  
 }
})();
// We will allocate 4096 bytes (intended to be the memory page size ... I think
// that's the size of a page on Linux).

sdl.cb=libc.mmap(                       sdl.voidptr,
                                               4096,
  libc.PROT_READ | libc.PROT_WRITE | libc.PROT_EXEC,
              libc.MAP_ANONYMOUS | libc.MAP_PRIVATE,
                                                  0,
                                                  0);

// Next we copy our machine code in to our sdl.cb buffer.
// surely it should be sdl.cb_raw???????
libc.memcpy(sdl.cb,sdl.cb_bin,sdl.cb_bin.length);
