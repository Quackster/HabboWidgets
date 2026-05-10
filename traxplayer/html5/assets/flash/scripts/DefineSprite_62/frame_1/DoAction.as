dragger.onPress = function()
{
   this.startDrag(true,0,0,line._width,0);
   this.onEnterFrame = function()
   {
      _root.volume = Math.round(this._x * 100 / line._width);
   };
};
dragger.onRelease = dragger.onreleaseOutside = stopDrag;
