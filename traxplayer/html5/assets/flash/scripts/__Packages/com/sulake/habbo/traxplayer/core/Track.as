class com.sulake.habbo.traxplayer.core.Track
{
   var movieClip;
   var samples;
   var trackId;
   var song;
   var currentSample;
   var trackComplete;
   var firstSample;
   var soundComplete;
   var lastSample;
   var samplesLoaded = 0;
   var trackLength = 0;
   static var trackIdIndex = 1;
   function Track(movieClip)
   {
      this.movieClip = movieClip;
      this.samples = new Array();
      this.trackId = com.sulake.habbo.traxplayer.core.Track.trackIdIndex++;
   }
   function setSong(song)
   {
      this.song = song;
   }
   function getTrackLengthInSeconds()
   {
      return this.trackLength * 2;
   }
   function addSample(url)
   {
      com.sulake.habbo.traxplayer.util.Logger.debug("Adding sample from url: " + url);
      var _loc4_ = this.samples.length;
      var _loc2_ = new com.sulake.habbo.traxplayer.core.Sample(this.movieClip,url);
      _loc2_.setTrack(this);
      this.samples.push(_loc2_);
   }
   function loadSamples()
   {
      var _loc2_ = 0;
      while(_loc2_ < this.samples.length)
      {
         var _loc3_ = this.samples[_loc2_];
         _loc3_.load();
         _loc2_ = _loc2_ + 1;
      }
   }
   function addSamples(urls)
   {
      var _loc2_ = 0;
      while(_loc2_ < urls.length)
      {
         var _loc3_ = urls[_loc2_];
         this.addSample(_loc3_);
         _loc2_ = _loc2_ + 1;
      }
   }
   function play()
   {
      this.currentSample.play();
      this.trackComplete = false;
   }
   function stop()
   {
      this.currentSample.stop();
      this.currentSample = this.firstSample;
   }
   function isReadyForBeat(beatNumber)
   {
      if(this.currentSample.getNextBeatNumber() > beatNumber)
      {
         return true;
      }
      return this.soundComplete;
   }
   function playBeat(beatNumber)
   {
      if(beatNumber == this.currentSample.getNextBeatNumber())
      {
         this.currentSample = this.currentSample.nextSample;
         com.sulake.habbo.traxplayer.util.Logger.debug(this.trackId + "Playing sample on beat:" + beatNumber + " " + this.currentSample);
         com.sulake.habbo.traxplayer.util.Logger.debug(this.trackId + "Next sample on beat:" + this.currentSample.getNextBeatNumber());
         this.currentSample.play();
      }
   }
   function onSampleLoad(success, sample)
   {
      this.samplesLoaded = this.samplesLoaded + 1;
      if(success)
      {
         this.trackLength += sample.getSampleLength();
         if(this.samplesLoaded >= this.samples.length)
         {
            var _loc4_ = 0;
            this.firstSample = this.samples[0];
            this.lastSample = this.samples[this.samples.length - 1];
            var _loc2_ = 0;
            while(_loc2_ < this.samples.length)
            {
               var _loc3_ = this.samples[_loc2_];
               if(_loc2_ < this.samples.length - 1)
               {
                  _loc3_.nextSample = this.samples[_loc2_ + 1];
               }
               else
               {
                  _loc3_.nextSample = null;
               }
               _loc3_.beatNumber = _loc4_;
               _loc4_ += _loc3_.getSampleLength();
               _loc2_ = _loc2_ + 1;
            }
            com.sulake.habbo.traxplayer.util.Logger.debug("Track is ready!");
            this.currentSample = this.firstSample;
            this.soundComplete = true;
            this.song.onTrackLoad(true,this);
         }
      }
      else
      {
         com.sulake.habbo.traxplayer.util.Logger.log("Sample load failed " + sample);
         this.song.onTrackLoad(false,this);
      }
   }
   function onSampleComplete(sample)
   {
      com.sulake.habbo.traxplayer.util.Logger.debug(this.trackId + "next beat:" + sample.getNextBeatNumber() + " track length:" + this.trackLength);
      sample.stop();
      if(sample.nextSample == null)
      {
         com.sulake.habbo.traxplayer.util.Logger.debug(this.trackId + " Track is finished");
         this.currentSample = this.firstSample;
         this.trackComplete = true;
         this.soundComplete = true;
         this.song.onTrackComplete(this);
      }
      else
      {
         com.sulake.habbo.traxplayer.util.Logger.debug(this.trackId + "Current Sample is complete");
         this.soundComplete = true;
         this.song.onSampleComplete(sample);
      }
   }
   function isTrackComplete()
   {
      return this.trackComplete;
   }
}
