// to run do js ./test.js
load("./sdl.js");

function myrender(_){
//  print("myrender called");
  var l=_.pixels.length;
  var p=_.pixels;
  var w=_.width;
  var h=_.height;
  for(var y=0;y<h;y++){
    for(var x=0;x<w;x++){
      var o=4*(y*w+x);
      p[o]=255*Math.sqrt(Math.pow(x-_.mx,2)+Math.pow(y-_.my,2));
      p[o+1]=0;
      p[o+2]=0;
    }
  }
  return true;
}

function mousemove(mx,my){
  var _=this;
  _.mx=mx;
  _.my=my;
}

function my_init(){
  var _=this;
  _.mx=0;
  _.my=0;
  print("my init called");
  _.onmousemove=mousemove;
}

sdl.sdl_init(640,480,my_init,myrender);

sdl.sdl_mainloop();
