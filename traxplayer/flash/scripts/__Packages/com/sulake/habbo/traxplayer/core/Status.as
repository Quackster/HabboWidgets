class com.sulake.habbo.traxplayer.core.Status
{
   var code;
   static var UNLOADED = 0;
   static var STOPPED = 1;
   static var PLAYING = 2;
   static var PAUSED = 3;
   static var ERROR = -1;
   function Status()
   {
      this.code = com.sulake.habbo.traxplayer.core.Status.UNLOADED;
   }
   function setStopped()
   {
      if(!this.isError())
      {
         this.code = com.sulake.habbo.traxplayer.core.Status.STOPPED;
      }
   }
   function setError()
   {
      this.code = com.sulake.habbo.traxplayer.core.Status.ERROR;
   }
   function setPlaying()
   {
      if(this.isStopped() || this.isPaused())
      {
         this.code = com.sulake.habbo.traxplayer.core.Status.PLAYING;
      }
   }
   function setPaused()
   {
      if(this.isPlaying())
      {
         this.code = com.sulake.habbo.traxplayer.core.Status.PAUSED;
      }
   }
   function isUnloaded()
   {
      return this.code == com.sulake.habbo.traxplayer.core.Status.UNLOADED;
   }
   function isStopped()
   {
      return this.code == com.sulake.habbo.traxplayer.core.Status.STOPPED;
   }
   function isPlaying()
   {
      return this.code == com.sulake.habbo.traxplayer.core.Status.PLAYING;
   }
   function isPaused()
   {
      return this.code == com.sulake.habbo.traxplayer.core.Status.PAUSED;
   }
   function isError()
   {
      return this.code == com.sulake.habbo.traxplayer.core.Status.ERROR;
   }
   function toString()
   {
      return "Status{code=" + this.code + "}";
   }
}
