class com.sulake.habbo.traxplayer.core.Sample extends Sound
{
   var url;
   var track;
   var getDuration;
   var onSoundComplete;
   var beatNumber;
   function Sample(movieClip, url)
   {
      super(movieClip);
      this.url = url;
   }
   function setTrack(track)
   {
      this.track = track;
   }
   function onLoad(success)
   {
      this.track.onSampleLoad(success,this);
   }
   function getSampleLength()
   {
      var _loc2_ = this.getDuration();
      if(_loc2_ < 2100)
      {
         return 1;
      }
      if(_loc2_ < 4100)
      {
         return 2;
      }
      if(_loc2_ < 6100)
      {
         return 3;
      }
      if(_loc2_ < 8100)
      {
         return 4;
      }
      throw new Error("Sample is too long:" + this);
   }
   function play()
   {
      com.sulake.habbo.traxplayer.util.Logger.debug("Playing sample " + this);
      var sample = this;
      this.onSoundComplete = function()
      {
         sample.track.onSampleComplete(this);
      };
      super.start(0,1);
   }
   function getNextBeatNumber()
   {
      return this.beatNumber + this.getSampleLength();
   }
   function toString()
   {
      return "Sound{" + this.url + "}";
   }
   function load()
   {
      com.sulake.habbo.traxplayer.util.Logger.debug("Loading sample " + this.url);
      this.loadSound(this.url,false);
   }
}
