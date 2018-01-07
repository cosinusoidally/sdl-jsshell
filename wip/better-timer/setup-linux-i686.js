/*

This sets up the machine code on linux-i686 note that the machine code is
actually identical to the win32 version. This is because the cdecl calling
convention used on win32 is very similar to the cdecl calling convention on
linux-i686 https://en.wikipedia.org/wiki/X86_calling_conventions . There are
some subtle differences that mean that this won't work in the general case, but
for this specific case it works fine.

*/


libcb.cb_bin=[
// $ objdump -d cb-snippet-32bit.o 

//cb-snippet-32bit.o:     file format elf32-i386


// Disassembly of section .text:

// 00000000 <cb>:
//   0:	83 ec 18             	sub    $0x18,%esp
  0x83,0xec,0x18,
//   3:	b8 ef be ad de       	mov    $0xdeadbeef,%eax
  0xb8,0xef,0xbe,0xad,0xde,
//   8:	68 ef cd ab 01       	push   $0x1abcdef
  0x68,0xef,0xcd,0xab,0x01,
//   d:	ff d0                	call   *%eax
  0xff,0xd0,
//   f:	8b 44 24 20          	mov    0x20(%esp),%eax
  0x8b,0x44,0x24,0x20,
//  13:	83 c4 1c             	add    $0x1c,%esp
  0x83,0xc4,0x1c,
//  16:	c3                   	ret    
  0xc3
];

libcb.cb_raw=new ArrayBuffer(libcb.cb_bin.length);

// convert sdl.cb_bin in to a Uint8Array view onto sdl.cb_raw

(function(){
 var o=new Uint8Array(libcb.cb_raw);
  for(var i=0;i<libcb.cb_bin.length;i++){
    o[i]=libcb.cb_bin[i];
  }
  libcb.cb_bin=o;
})();

// We now need to patch in the address of SDL_PushEvent.

// First we must get the address of SDL_PushEvent

sdl.address_SDL_CondSignal=ctypes.cast(sdl.SDL_CondSignal,ctypes.uint8_t.array(4));
libcb.address_cond=ctypes.cast(libcb.cond,ctypes.uint8_t.array(4));

// Now patch the address of SDL_CondSignal in to the relevant offset into libcb.cb_bin
(function(){
  for(var i=0;i<4;i++){
    libcb.cb_bin[i+0x4]=sdl.address_SDL_CondSignal[i];
 }
})();
// Patch in address of cond var
(function(){
  for(var i=0;i<4;i++){
    libcb.cb_bin[i+0x9]=libcb.address_cond[i];
 }
})();
// We will allocate 4096 bytes (intended to be the memory page size ... I think
// that's the size of a page on Linux).

libcb.cb=libc.mmap(                       sdl.voidptr,
                                               4096,
  libc.PROT_READ | libc.PROT_WRITE | libc.PROT_EXEC,
              libc.MAP_ANONYMOUS | libc.MAP_PRIVATE,
                                                  0,
                                                  0);

// Next we copy our machine code in to our sdl.cb buffer.
// surely it should be sdl.cb_raw???????
libc.memcpy(libcb.cb,libcb.cb_raw,libcb.cb_bin.length);
