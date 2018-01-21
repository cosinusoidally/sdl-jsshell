/*

In this file we load and setup our timer callback function for linux-x86_64.

First we need some machine code. We generate the machine code by compiling
cb-snippet-64bit.c . This gives us cb-snippet-64bit.o . We then disasseble the
machine code with objdump and use it to create at libcb.cb_bin array containing
the machine code.

See below for the current version of our machine code:

*/


libcb.cb_bin=[
//$ objdump -d -S cb-snippet-64bit.o 

//cb-snippet-64bit.o:     file format elf64-x86-64


//Disassembly of section .text:

//0000000000000000 <cb>:

// // int SDL_CondSignal(SDL_cond *cond);
//typedef int (* my_SDL_CondSignal)(SDL_cond *cond);
// // Uint32 (*SDL_NewTimerCallback)(Uint32 interval, void *param);

// Uint32 cb(Uint32 interval, void *param){
//   0:	53                   	push   %rbx
	0x53,
//   1:	89 fb                	mov    %edi,%ebx
        0x89,0xfb,
//  ((my_SDL_CondSignal)0xdeadbeefdeadbeef)(0x1234567890abcdef);
//   3:	48 b8 ef be ad de ef 	movabs $0xdeadbeefdeadbeef,%rax
	0x48, 0xb8, 0xef, 0xbe, 0xad, 0xde, 0xef,
//   a:	be ad de 
	0xbe, 0xad, 0xde, 
//   d:	48 bf ef cd ab 90 78 	movabs $0x1234567890abcdef,%rdi
	0x48, 0xbf, 0xef, 0xcd, 0xab, 0x90, 0x78,
//  14:	56 34 12 
	0x56, 0x34, 0x12, 
//  17:	ff d0                	callq  *%rax
	0xff, 0xd0, 
//  return interval;
//}
//  19:	89 d8                	mov    %ebx,%eax
	0x89, 0xd8,
//  1b:	5b                   	pop    %rbx
	0x5b,
//  1c:	c3                   	retq   
	0xc3];

// Now we need to do a bit of a dance to get the machine code into an
// ArrayBuffer

libcb.cb_raw=new ArrayBuffer(libcb.cb_bin.length);

// convert libcb.cb_bin in to a Uint8Array view onto libcb.cb_raw

(function(){
 var o=new Uint8Array(libcb.cb_raw);
  for(var i=0;i<libcb.cb_bin.length;i++){
    o[i]=libcb.cb_bin[i];
  }
  libcb.cb_bin=o;
})();

// At this point libcb.cb_raw is our ArrayBuffer and libcb.cb_bin is now
// a Uint8Array view onto that ArrayBuffer.

/*


First we must get the address of SDL_CondSignal and the condition variables

*/

sdl.address_SDL_CondSignal=ctypes.cast(sdl.SDL_CondSignal,ctypes.uint8_t.array(8));
libcb.address_cond=ctypes.cast(libcb.cond,ctypes.uint8_t.array(8));

/*
Next we must patch up our machine code. The relevant part of the above machine code is:

((my_SDL_CondSignal)0xdeadbeefdeadbeef)(0x1234567890abcdef);
   3:	48 b8 ef be ad de ef 	movabs $0xdeadbeefdeadbeef,%rax
   a:	be ad de 
   d:	48 bf ef cd ab 90 78 	movabs $0x1234567890abcdef,%rdi
  14:	56 34 12 

Now 0xdeadbeefdeadbeef needs to be replaced with the address of SDL_CondSignal.
We can see that 0xdeadbeefdeadbeef is at offset 5

With this offset we then patch in address of SDL_CondSignal
*/

(function(){
  for(var i=0;i<8;i++){
    libcb.cb_bin[i+5]=sdl.address_SDL_CondSignal[i];
  }
})();

/*

Now, the 0x1234567890abcdef above needs to be the address of our Condition Variable.
As we can see, the offset of 0x1234567890abcdef is 0xf

Patch in address off condition variable (libcb.address_cond):

*/
(function(){
  for(var i=0;i<8;i++){
    libcb.cb_bin[i+0xf]=libcb.address_cond[i];
  }
})();

/*

Now we must prepare some executable memory for our machine code

*/

libcb.cb=libc.mmap(                       sdl.voidptr,
                                               4096,
  libc.PROT_READ | libc.PROT_WRITE | libc.PROT_EXEC,
              libc.MAP_ANONYMOUS | libc.MAP_PRIVATE,
                                                  0,
                                                  0);

// Finally we copy our machine code in to our executable memory

libc.memcpy(libcb.cb,libcb.cb_raw,libcb.cb_bin.length);

/*
For security purposes we should now mprotect the memory to make it read only
and executable, but for now we just leave it as executable and read/writable.

Speficially we should initially map the memory as r/w. Copy across the machine
code, and then mprotect the memory to make it execute only.

It's not a major risk at the moment (since we are not running untrusted JS code),
but if I add the ability to run untrusted code I would probably need to fix this.
*/
