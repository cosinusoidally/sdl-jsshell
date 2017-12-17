(function (){
  var prefix="../v2/";
  var _load=load;
  load=function(x){
    return _load(prefix+x);
  }
})();
