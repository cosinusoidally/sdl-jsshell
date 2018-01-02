(function (){
  var prefix="../lib/";
  var _load=load;
  load=function(x){
    return _load(prefix+x);
  }
})();
