class com.sulake.habbo.traxplayer.core.TrackData
{
   var sampleDatas;
   var songData;
   var success = false;
   function TrackData(sampleUrl, trackData)
   {
      com.sulake.habbo.traxplayer.util.Logger.log("Parsing " + trackData);
      var _loc7_ = trackData.split(";");
      this.sampleDatas = new Array();
      var _loc3_ = 0;
      while(_loc3_ < _loc7_.length)
      {
         var _loc5_ = _loc7_[_loc3_];
         if(_loc5_.length > 0)
         {
            var _loc2_ = _loc5_.split(",");
            com.sulake.habbo.traxplayer.util.Logger.log("Sample id:" + _loc2_[0] + " length:" + _loc2_[1]);
            var _loc6_ = sampleUrl + "sound_machine_sample_" + _loc2_[0] + ".mp3";
            var _loc4_ = new com.sulake.habbo.traxplayer.core.SampleData(_loc6_,new Number(_loc2_[1]));
            _loc4_.setTrackData(this);
            this.sampleDatas.push(_loc4_);
         }
         _loc3_ = _loc3_ + 1;
      }
      com.sulake.habbo.traxplayer.util.Logger.log("Parsed sample datas:" + this.sampleDatas);
   }
   function setSongData(songData)
   {
      this.songData = songData;
   }
   function onSampleDataLoad(success)
   {
      if(success)
      {
         this.loadSamples();
      }
      else
      {
         this.songData.onTrackDataLoad(false);
      }
   }
   function loadSamples()
   {
      var _loc2_ = 0;
      while(_loc2_ < this.sampleDatas.length)
      {
         var _loc3_ = this.sampleDatas[_loc2_];
         if(!_loc3_.isLoaded())
         {
            _loc3_.load();
            return undefined;
         }
         _loc2_ = _loc2_ + 1;
      }
      com.sulake.habbo.traxplayer.util.Logger.debug("Track data loaded!");
      this.success = true;
      this.songData.onTrackDataLoad(true);
   }
   function isLoaded()
   {
      return this.success;
   }
   function getSampleUrls()
   {
      var _loc5_ = new Array();
      var _loc4_ = 0;
      while(_loc4_ < this.sampleDatas.length)
      {
         var _loc3_ = this.sampleDatas[_loc4_];
         var _loc2_ = 0;
         while(_loc2_ < _loc3_.getRepeatCount())
         {
            _loc5_.push(_loc3_.getUrl());
            _loc2_ = _loc2_ + 1;
         }
         _loc4_ = _loc4_ + 1;
      }
      return _loc5_;
   }
}
