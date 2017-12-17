sdl.voidptr=ctypes.voidptr_t(0); // null pointer, needed in several places
sdl.cb=ctypes.voidptr_t(0); // This is a callback to pass in to SDL_AddTimer.
                            // Here we set it initially to a null pointer

/*

In _.cb we must store a pointer to a function to be called by SDL_AddTimer
whenever a timer fires. _.cb will be the location of an executable mmapped
buffer. We must fill that buffer with the required machine code. To do this we
will create and disassemble a C function:

#include <stdint.h>

typedef int (*my_SDL_PushEvent)(char *);


uint32_t my_SDL_NewTimerCallback(uint32_t interval,void *param){
  char a[24];
  a[0]=24;
  // This is the absolute address SDL_PushEvent, we need to patch in this value
  // at runtime.
  ((my_SDL_PushEvent)0xdeadbeefdeadbeef)(a); 
  return 0;
}

Note that the signatures for my_SDL_PushEvent and my_SDL_NewTimerCallback match
SDL_PushEvent and SDL_NewTimerCallback respectively.

We then build the object code as follows:

gcc -fomit-frame-pointer -O2 -c -fno-stack-protector cb.c

Note the -fno-stack-protector flag. That is to prevent gcc from emitting a
bunch of unnecessary code.

We then use objdump to disassemble the function:

objdump -D cb.o

cb.o:     file format elf64-x86-64


Disassembly of section .text:

0000000000000000 <my_SDL_NewTimerCallback>:
   0:   48 83 ec 28             sub    $0x28,%rsp
   4:   48 b8 ef be ad de ef    movabs $0xdeadbeefdeadbeef,%rax
   b:   be ad de 
   e:   c6 04 24 18             movb   $0x18,(%rsp)
  12:   48 89 e7                mov    %rsp,%rdi
  15:   ff d0                   callq  *%rax
  17:   31 c0                   xor    %eax,%eax
  19:   48 83 c4 28             add    $0x28,%rsp
  1d:   c3                      retq   

The above also gives us a hex dump of the function. We can convert this to an
array and add it to our sdl object.
*/

sdl.cb_bin=[
//0000000000000000 <my_SDL_NewTimerCallback>:
//   0:   48 83 ec 28             sub    $0x28,%rsp
          0x48,0x83,0xec,0x28,
//   4:   48 b8 ef be ad de ef    movabs $0xdeadbeefdeadbeef,%rax
          0x48,0xb8,0xef,0xbe,0xad,0xde,0xef,
//   b:   be ad de 
          0xbe,0xad,0xde, 
//   e:   c6 04 24 18             movb   $0x18,(%rsp)
          0xc6,0x04,0x24,0x18,
//  12:   48 89 e7                mov    %rsp,%rdi
          0x48,0x89,0xe7,
//  15:   ff d0                   callq  *%rax
          0xff,0xd0,
//  17:   31 c0                   xor    %eax,%eax
          0x31,0xc0,
//  19:   48 83 c4 28             add    $0x28,%rsp
          0x48,0x83,0xc4,0x28,
//  1d:   c3                      retq   
          0xc3];

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

sdl.address_SDL_PushEvent=ctypes.cast(sdl.SDL_PushEvent,ctypes.uint8_t.array(8));

// Now patch the address of SDL_PushEvent in to the relevant offset into sdl.cb_bin
// This is the relevant instruction
//   4:   48 b8 ef be ad de ef    movabs $0xdeadbeefdeadbeef,%rax
//   b:   be ad de

// The movabs instruction is 2 bytes long in this case. That mean we must patch
// 8 bytes from offset 6

(function(){
  for(var i=0;i<8;i++){
    sdl.cb_bin[i+6]=sdl.address_SDL_PushEvent[i];
  }
})();

// Next we need some executable memory in to which we will copy our machine
// code. We will create this with mmap.

// mmap invocation from:
// http://burnttoys.blogspot.co.uk/2011/04/how-to-allocate-executable-memory-on.html

// mmap(
//       NULL,
//       codeBytes,
//       PROT_READ | PROT_WRITE | PROT_EXEC,
//       MAP_ANONYMOUS | MAP_PRIVATE,
//       0,
//       0);

// We will allocate 4096 bytes (intended to be the memory page size ... I think
// that's the size of a page on Linux).

sdl.cb=libc.mmap(                       sdl.voidptr,
                                               4096,
  libc.PROT_READ | libc.PROT_WRITE | libc.PROT_EXEC,
              libc.MAP_ANONYMOUS | libc.MAP_PRIVATE,
                                                  0,
                                                  0);


// Next we copy our machine code in to our sdl.cb buffer.
libc.memcpy(sdl.cb,sdl.cb_bin,sdl.cb_bin.length);

