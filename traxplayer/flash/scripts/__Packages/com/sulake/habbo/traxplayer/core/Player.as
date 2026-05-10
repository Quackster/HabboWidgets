class com.sulake.habbo.traxplayer.core.Player implements com.sulake.habbo.traxplayer.TraxPlayer
{
   var movieClip;
   var songs;
   var status;
   var playerListener;
   var tickId;
   var currentSong = 0;
   var tick = 0;
   var repeat = true;
   function Player(mc)
   {
      this.movieClip = mc;
      this.songs = new Array();
      this.status = new com.sulake.habbo.traxplayer.core.Status();
   }
   function setPlayerListener(playerListener)
   {
      this.playerListener = playerListener;
   }
   function addSong(song)
   {
      this.songs.push(song);
      song.setPlayer(this);
   }
   function startPlaying()
   {
      com.sulake.habbo.traxplayer.util.Logger.log("Player start playing");
      if(this.status.isStopped())
      {
         com.sulake.habbo.traxplayer.util.Logger.log("Player playing song");
         this.status.setPlaying();
         this.getCurrentSong().play();
      }
      else
      {
         com.sulake.habbo.traxplayer.util.Logger.log("Player is not stopped " + this.status);
      }
   }
   function stopPlaying()
   {
      clearInterval(this.tickId);
      this.tick = 0;
      this.onTick();
      this.getCurrentSong().stop();
      this.status.setStopped();
   }
   function onSongComplete(song)
   {
      if(this.repeat)
      {
         this.stopPlaying();
         this.startPlaying();
      }
   }
   function onSongLoad(success, song)
   {
      if(success)
      {
         this.status.setStopped();
      }
      else
      {
         this.status.setError();
      }
      this.playerListener.onSongLoad(success,song,this);
   }
   function onSongPlaying(success, song)
   {
      this.playerListener.onSongPlaying(success,song);
      this.tickId = setInterval(this,"onTick",1000);
   }
   function onTick()
   {
      this.playerListener.onTick(this.tick++);
   }
   function getCurrentSong()
   {
      return this.songs[this.currentSong];
   }
}
