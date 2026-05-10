on(press){
   _root.player.stopPlaying();
   with(this._parent.led_anim)
   {
      gotoAndPlay(43);
   }
   gotoAndStop(1);
}
