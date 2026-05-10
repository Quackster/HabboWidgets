onClipEvent(enterFrame){
   _root.globalSound.setVolume(_root.volume * 2);
   this._parent.VolIcon.VolumeMask._width = _root.volume * 0.63;
}
