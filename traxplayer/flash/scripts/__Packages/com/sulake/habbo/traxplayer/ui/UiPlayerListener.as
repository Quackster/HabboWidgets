class com.sulake.habbo.traxplayer.ui.UiPlayerListener implements com.sulake.habbo.traxplayer.PlayerListener
{
   var movieClip;
   function UiPlayerListener(mc)
   {
      this.movieClip = mc;
   }
   function onSongLoad(success, song, player)
   {
      this.movieClip.loadanimation._x = -1500;
      this.movieClip.loadanimation._y = -1500;
      if(success)
      {
         this.movieClip.songName.text = song.getName();
         this.movieClip.songAuthor.text = song.getAuthor();
         this.movieClip.controlbuttons.play.enabled = true;
         this.movieClip.controlbuttons.enabled = true;
      }
      else
      {
         this.movieClip.songName.text = "Load failed!";
      }
   }
   function onSongPlaying(success, song, player)
   {
      if(success)
      {
         this.movieClip.songLength.text = "(" + this.secondsToString(song.getSongLengthInSeconds()) + ")";
         this.movieClip.songPlayed.text = this.secondsToString(0);
         this.movieClip.volumecontrol.dragger.enabled = true;
      }
      else
      {
         this.movieClip.songName.text = "Load failed!";
         this.movieClip.songAuthor.text = "";
      }
   }
   function onTick(tick)
   {
      this.movieClip.songPlayed.text = this.secondsToString(tick);
   }
   function secondsToString(seconds)
   {
      var _loc3_ = (seconds - seconds % 60) / 60;
      seconds %= 60;
      var _loc1_ = "0" + _loc3_ + ":";
      if(seconds < 10)
      {
         _loc1_ += "0";
      }
      _loc1_ += "" + seconds;
      return _loc1_;
   }
}
