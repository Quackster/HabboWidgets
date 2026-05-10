class com.sulake.habbo.traxplayer.TestPlayerListener implements com.sulake.habbo.traxplayer.PlayerListener
{
   function TestPlayerListener()
   {
   }
   function onSongLoad(success, song, player)
   {
      if(success)
      {
         com.sulake.habbo.traxplayer.util.Logger.log("Song loaded! " + song + " " + player);
      }
      else
      {
         com.sulake.habbo.traxplayer.util.Logger.log("Song loading failed!");
      }
   }
   function onTick(tick)
   {
      com.sulake.habbo.traxplayer.util.Logger.log("time:" + tick);
   }
   function onSongPlaying(success, song, player)
   {
      if(success)
      {
         com.sulake.habbo.traxplayer.util.Logger.log("Song is playing! " + song);
      }
      else
      {
         com.sulake.habbo.traxplayer.util.Logger.log("Song data loading failed!");
      }
   }
}
