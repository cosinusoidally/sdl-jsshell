/*

This code is based on https://github.com/s-macke/VoxelSpace with modifications
by me (Liam Wilson).

All credit for the rendering section goes to Sebastian Macke (s-macke). if you
are interested in how the rendering works read his exelent explaination here:
https://github.com/s-macke/VoxelSpace

I don't really want to host Comanche map files on my Github, so please grab
them from his.

Further setup instructions after the license bit:

MIT License

Copyright (c) 2017 Sebastian Macke and Liam Wilson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.



jsshell's handling of script loading is a bit wonkey. It doesn't deal with
relative paths well. "load-wrap.js" hacks around this limitation so that
load("./sdl.js"); will actually work as expected.
*/
load("load-wrap.js");

load("./sdl.js");

width=640;

height=480;

// ---------------------------------------------
// Viewer information

var camera =
{
    x:        512., // x position on the map
    y:        800., // y position on the map
    height:    78., // height of the camera
    angle:      0., // direction of the camera
    horizon:  100., // horizon position (look up and down)
    distance: 1000   // distance of map
};

// ---------------------------------------------
// Landscape data

var map =
{
    width:    1024,
    height:   1024,
    shift:    10,  // power of two: 2^10 = 1024
    altitude: new Uint8Array(1024*1024), // 1024 * 1024 byte array with height information
    color:    new Uint32Array(1024*1024) // 1024 * 1024 int array with RGB colors
//    color:    createMappedArrayBuffer("C1W.ppm") // 1024 * 1024 int array with RGB colors
};


// ---------------------------------------------
// Screen data

var screendata =
{
    canvas:    {width:width,height:height},
    context:   null,
    imagedata: null,

    bufarray:  null, // color data
    buf8:      null, // the same array but with bytes
    buf32:     null, // the same array but with 32-Bit words

    backgroundcolor: 0xFFE09090
};

// ---------------------------------------------
// Keyboard and mouse interaction

var input =
{
    forwardbackward: 0,
    leftright:       0,
    updown:          0,
    lookup:          false,
    lookdown:        false,
    mouseposition:   null,
    keypressed:      false
}

var updaterunning = false;

var time = new Date().getTime();


// for fps display
var timelastframe = new Date().getTime();
var frames = 0;

// Update the camera for next frame. Dependent on keypresses
function UpdateCamera()
{
    var current = new Date().getTime();
/*
    input.keypressed = false;
    if (input.leftright != 0)
    {
        camera.angle += input.leftright*0.1*(current-time)*0.03;
        input.keypressed = true;
    }
    if (input.forwardbackward != 0)
    {
        camera.x -= input.forwardbackward * Math.sin(camera.angle) * (current-time)*0.03;
        camera.y -= input.forwardbackward * Math.cos(camera.angle) * (current-time)*0.03;
        input.keypressed = true;
    }
    if (input.updown != 0)
    {
        camera.height += input.updown * (current-time)*0.03;
        input.keypressed = true;
    }
    if (input.lookup)
    {
        camera.horizon += 2 * (current-time)*0.03;
        input.keypressed = true;
    }
    if (input.lookdown)
    {
        camera.horizon -= 2 * (current-time)*0.03;
        input.keypressed = true;
    }
*/
        camera.angle += -((sdl.mx/screendata.canvas.width)-0.5)*0.1*(current-time)*0.03;
        camera.x -= 1 * Math.sin(camera.angle) * (current-time)*0.03;
        camera.y -= 1* Math.cos(camera.angle) * (current-time)*0.03;
    // Collision detection. Don't fly below the surface.
    var mapoffset = ((Math.floor(camera.y) & (map.width-1)) << map.shift) + (Math.floor(camera.x) & (map.height-1))|0;
    if ((map.altitude[mapoffset]+10) > camera.height) camera.height = map.altitude[mapoffset] + 10;

    time = current;

}


// ---------------------------------------------
// Fast way to draw vertical lines

function DrawVerticalLine(x, ytop, ybottom, col)
{
    x = x|0;
    ytop = ytop|0;
    ybottom = ybottom|0;
    col = col|0;
    var buf32 = screendata.buf32;
    var screenwidth = screendata.canvas.width|0;
    if (ytop < 0) ytop = 0;
    if (ytop > ybottom) return;

    // get offset on screen for the vertical line
    var offset = ((ytop * screenwidth) + x)|0;
    for (var k = ytop|0; k < ybottom|0; k=k+1|0)
    {
        buf32[offset|0] = col|0;
        offset = offset + screenwidth|0;
    }
}

// ---------------------------------------------
// Basic screen handling

function DrawBackground()
{
    var buf32 = screendata.buf32;
    var color = screendata.backgroundcolor|0;
    for (var i = 0; i < buf32.length; i++) buf32[i] = 0xFFFFFFFF;
}


// ---------------------------------------------
// The main render routine


var hy=new Int32Array(screendata.canvas.width|0);
function Render()
{
    var mapwidthperiod = map.width - 1;
    var mapheightperiod = map.height - 1;

    var screenwidth = screendata.canvas.width|0;
    var sinang = Math.sin(camera.angle);
    var cosang = Math.cos(camera.angle);

//    var hiddeny = new Int32Array(screenwidth);
    var hiddeny = hy;
    for(var i=0; i<screendata.canvas.width|0; i=i+1|0)
        hiddeny[i] = screendata.canvas.height;

    var dz = 1.;

    // Draw from front to back
    for(var z=1; z<camera.distance; z+=dz)
    {
        // 90 degree field of view
        var plx =  -cosang * z - sinang * z;
        var ply =   sinang * z - cosang * z;
        var prx =   cosang * z - sinang * z;
        var pry =  -sinang * z - cosang * z;

        var dx = (prx - plx) / screenwidth;
        var dy = (pry - ply) / screenwidth;
        plx += camera.x;
        ply += camera.y;
        var invz = 1. / z * 240.;
        for(var i=0; i<screenwidth|0; i=i+1|0)
        {
            var mapoffset = ((Math.floor(ply) & mapwidthperiod) << map.shift) + (Math.floor(plx) & mapheightperiod)|0;
            var heightonscreen = (camera.height - map.altitude[mapoffset]) * invz + camera.horizon|0;
            DrawVerticalLine(i, heightonscreen|0, hiddeny[i], map.color[mapoffset]);
            if (heightonscreen < hiddeny[i]) hiddeny[i] = heightonscreen;
            plx += dx;
            ply += dy;
        }
    }
    dz += 0.01;
}


// ---------------------------------------------
// Draw the next frame

function Draw()
{
    updaterunning = true;
    UpdateCamera();
    DrawBackground();
     Render();
//    Flip();
}




function Init()
{
   var a,c;
   a=new Uint8Array(read("../../comanche-maps/C1W.ppm","binary"));
   c=new Uint8Array(read("../../comanche-maps/D1.ppm","binary"));
   var b=new Uint8Array(a);
    for(var i=0;i<map.color.length;i++){
        map.color[i]=b[i*3]<<16|b[i*3+1]<<8|b[i*3+2];
    }   
    for(var i=0;i<map.altitude.length;i++){
        map.altitude[i]=c[i*3];
    }
}

Init();

function myrender(_){
  Draw();
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

sdl.sdl_init(width,height,my_init,myrender);
screendata.bufarray=sdl.pixels_raw;
screendata.buf8=new Uint8Array(sdl.pixels_raw);
screendata.buf32=new Uint32Array(sdl.pixels_raw);

sdl.sdl_mainloop();
