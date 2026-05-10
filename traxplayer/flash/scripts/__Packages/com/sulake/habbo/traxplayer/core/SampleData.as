class com.sulake.habbo.traxplayer.core.SampleData
{
   var url;
   var length;
   var trackData;
   var sound;
   var success = false;
   function SampleData(url, length)
   {
      this.url = url;
      this.length = length;
   }
   function setTrackData(trackData)
   {
      this.trackData = trackData;
   }
   function load()
   {
      com.sulake.habbo.traxplayer.util.Logger.debug("Loading sample from url" + this.url);
      this.sound = new Sound();
      var sampleData = this;
      this.sound.onLoad = function(success)
      {
         sampleData.success = success;
         sampleData.onSampleDataLoad(success);
      };
      this.sound.loadSound(this.url,false);
   }
   function isLoaded()
   {
      return this.success;
   }
   function toString()
   {
      return "Sample{" + this.url + ", length:" + this.length + "}";
   }
   function getRepeatCount()
   {
      if(!this.success)
      {
         throw new Error("Sample has to be loaded before we can determine the repeat count!");
      }
      var _loc3_ = this.sound.getDuration();
      var _loc2_ = 0;
      if(_loc3_ < 2100)
      {
         _loc2_ = 2000;
      }
      else if(_loc3_ < 4100)
      {
         _loc2_ = 4000;
      }
      else if(_loc3_ < 6100)
      {
         _loc2_ = 6000;
      }
      else
      {
         _loc2_ = 8000;
      }
      var _loc4_ = this.length * 2000;
      var _loc5_ = _loc4_ / _loc2_;
      com.sulake.habbo.traxplayer.util.Logger.log("Sample length:" + _loc3_ + " repeat length:" + _loc4_ + " => repeat:" + _loc5_);
      return _loc5_;
   }
   function getUrl()
   {
      return this.url;
   }
   function onSampleDataLoad(succes)
   {
      com.sulake.habbo.traxplayer.util.Logger.debug("Sample loaded ok? " + this.success + " " + this);
      this.trackData.onSampleDataLoad(this.success);
   }
}
