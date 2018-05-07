Components.utils.import("resource://gre/modules/ctypes.jsm");
(function(){
utils={};
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
//  print(l.toString());
  l=parseInt(l.toString(),10);
  var b=new Uint8Array(l);
//  print(b.length.toString());
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
//  print(o);
  return o;
};

})();
load(exe);
