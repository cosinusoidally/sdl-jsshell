load("load-wrap.js"); // needed to load sdl.js because of jsshell's bad path handling 
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
};

function mousemove(mx,my){
  var _=this;
  _.mx=mx;
  _.my=my;
};

function mousedown(){
  // do nothing
};

function mouseup(){
  // do nothing
};

function decodeppm(f){
  var o=0;
  var type=[];
  while(f[o]!==0xa){type.push(f[o]);o++};
  type=type.map(function(x){return String.fromCharCode(x)}).join("");
  if(type!=="P6"){
    throw "Not a P6 ppm";
  };
  print(type);
}

function loadfont(){
  // font from here http://bjh21.me.uk/bedstead/
  // I've converted it to a ppm for easy loading
  var f="bedstead-20-df.ppm";
  var font=decodeppm(read(f,"binary"));
}


function my_init(){
  var _=this;
  _.mx=0;
  _.my=0;
  print("Text display demo");
  loadfont();
  _.onmousemove=mousemove;
  _.onmousedown=mousedown;
  _.onmouseup=mouseup;
}

sdl.sdl_init(640,480,my_init,myrender);

sdl.sdl_mainloop();
