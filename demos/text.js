/*

Yes the below code is horrible. This is a rough and ready proof of concept for
bitmap text drawing.

*/

load("load-wrap.js"); // needed to load sdl.js because of jsshell's bad path handling 
load("./sdl.js");

function pset(_,x,y,r,g,b){ // draw a rgb pixel at x,y _ must be the sdl object
  var o=4*(y*_.width+x);
  var p=_.pixels;
  if(x<0 | x>_.width){ return};
  if(y<0 | y>_.height){ return};
  p[o]=b;
  p[o+1]=g;
  p[o+2]=r;
};

function getpixel(p,x,y,w,h){
  var o=4*(y*w+x);
  if(x<0 | x>w){return [0,0,0]};
  if(y<0 | y>h){return [0,0,0]};
  return [p[o],p[o+1],p[o+2]];
}

function drawchar(p,x,y,c){
  var cc=c.charCodeAt(0);
  var yi=20*(Math.floor(cc/16));
  var xi=12*(cc % 16);
  for(var yy=0;yy<20;yy++){
    for(var xx=0;xx<12;xx++){
      var col=getpixel(font,xi+xx,yi+yy,192,320);
      if(col[0]===255 && col[1]===255 && col[2]===255){
        pset(p,x+xx,y+yy,col[0],col[1],col[2]);
      }
    }
  }
}

function myrender(_){
//  print("myrender called");
  var l=_.pixels.length;
  var p=_.pixels;
  var w=_.width;
  var h=_.height;
  for(var y=0;y<h;y++){
    for(var x=0;x<w;x++){
      pset(_,x,y,Math.floor(255*x/w),Math.floor(255*y/h),Math.floor(255*(1-x/w)));
/*
      var c=getpixel(font,x,y,192,320);
      pset(_,x+_.mx,y+_.my,c[0],c[1],c[2]);
*/
    }
  }
  var str="Hello world. This is a text drawing demo.".split("");

  for(j=0;j<str.length;j++){
    drawchar(_,100+12*j,100+Math.floor(10*Math.sin(((Date.now()-st)/100+j/2)% (2*Math.PI))),str[j]);
  };
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
  // we are expecting the ppm to be a binary rgb 192x320 (width x height) image
  // the header should look like:
  // "P6\n192 320\n255\n"
  // code below is a bit verbose, but it works.
  var o=0;
  var type=[];
  while(f[o]!==0x0a){type.push(f[o]);o++}; // 0x0a is \n
  o++;
  type=type.map(function(x){return String.fromCharCode(x)}).join("");
  if(type!=="P6"){
    throw "Not a P6 ppm";
  };
  print(type);
  var width=[];
  while(f[o]!==0x20){width.push(f[o]);o++}; // consume all chars up to space
                                            // (0x20 is space) 
  o++;
  width=width.map(function(x){return String.fromCharCode(x)}).join("");
  print(width);
  if(width!=="192"){
    throw "width is not 192";
  };
  var height=[];
  while(f[o]!==0x0a){height.push(f[o]);o++}; // consume all chars up to newline
                                            // (0x0x is newline (\n)) 
  o++;
  height=height.map(function(x){return String.fromCharCode(x)}).join("");
  if(height!=="320"){
    throw "height is not 320";
  };
  print(height);

  var cd=[]; // channel depth
  while(f[o]!==0x0a){cd.push(f[o]);o++}; // consume all chars up to newline
                                            // (0x0x is newline (\n)) 
  o++;
  cd=cd.map(function(x){return String.fromCharCode(x)}).join("");
  if(cd!=="255"){
    throw "channel depth is not 255";
  };
  print(cd);
  var out=new Uint8Array(192*320*4);
  var oo=0;
  for(var i=o;i<f.length;i=i+3){
    out[oo]=f[i];
    out[oo+1]=f[i+1];
    out[oo+2]=f[i+2];
    out[oo+3]=255;
    oo=oo+4;
  }
  return out;
}

function loadfont(){
  // font from here http://bjh21.me.uk/bedstead/
  // I've converted it to a ppm for easy loading
  var f="bedstead-20-df.ppm";
  font=decodeppm(read(f,"binary"));
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

st=Date.now();

sdl.sdl_init(640,480,my_init,myrender);

sdl.sdl_mainloop();
