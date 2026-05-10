class com.sulake.habbo.traxplayer.core.Song implements com.sulake.habbo.traxplayer.TraxSong
{
   var movieClip;
   var tracks;
   var status;
   var player;
   var songData;
   var name = "unknown";
   var author = "unknown";
   var tracksLoaded = 0;
   var tracksComplete = 0;
   function Song(movieClip)
   {
      this.movieClip = movieClip;
      this.tracks = new Array();
      this.status = new com.sulake.habbo.traxplayer.core.Status();
   }
   function getName()
   {
      return this.name;
   }
   function getAuthor()
   {
      return this.author;
   }
   function setPlayer(player)
   {
      this.player = player;
   }
   function onSongLoad(success, songData)
   {
      this.songData = songData;
      if(success)
      {
         com.sulake.habbo.traxplayer.util.Logger.debug("Song loaded ok OMG OMG OMG!!!" + this.songData);
         this.name = songData.getName();
         this.author = songData.getAuthor();
      }
      else
      {
         com.sulake.habbo.traxplayer.util.Logger.log("Song load failed!");
         this.status.setError();
      }
      this.player.onSongLoad(true,this);
   }
   function onSongDataLoad(success, songData)
   {
      if(success)
      {
         com.sulake.habbo.traxplayer.util.Logger.debug("Song data loaded ok");
         this.addTrackWithSamples(songData.getTrack1());
         this.addTrackWithSamples(songData.getTrack2());
         this.addTrackWithSamples(songData.getTrack3());
         this.addTrackWithSamples(songData.getTrack4());
         this.loadSamples();
      }
      else
      {
         com.sulake.habbo.traxplayer.util.Logger.log("Song data load failed!");
         this.status.setError();
         this.player.onSongPlaying(false,this);
      }
   }
   function onTrackLoad(success, track)
   {
      if(success && !this.status.isError())
      {
         com.sulake.habbo.traxplayer.util.Logger.debug("Track loaded ok");
         this.tracksLoaded = this.tracksLoaded + 1;
         if(this.tracksLoaded >= this.tracks.length)
         {
            this.status.setStopped();
            com.sulake.habbo.traxplayer.util.Logger.log("The whole song has loaded! " + this);
            this.play();
         }
      }
      else if(!this.status.isError())
      {
         com.sulake.habbo.traxplayer.util.Logger.log("Track load failed");
         this.status.setError();
         this.player.onSongPlaying(false,this);
      }
   }
   function onTrackComplete(track)
   {
      com.sulake.habbo.traxplayer.util.Logger.debug("Song - Track complete");
      this.player.onSongComplete(this);
   }
   function onSampleComplete(sample)
   {
      var _loc4_ = sample.getNextBeatNumber();
      if(this.isReadyForBeat(_loc4_))
      {
         var _loc2_ = 0;
         while(_loc2_ < this.tracks.length)
         {
            var _loc3_ = this.tracks[_loc2_];
            _loc3_.playBeat(_loc4_);
            _loc2_ = _loc2_ + 1;
         }
      }
   }
   function addTrack(track)
   {
      this.tracks.push(track);
      track.setSong(this);
   }
   function play()
   {
      if(!this.songData.isLoaded())
      {
         com.sulake.habbo.traxplayer.util.Logger.debug("Loading samples now " + this.songData);
         this.songData.loadSamples();
      }
      com.sulake.habbo.traxplayer.util.Logger.debug("Song.status=" + this.status);
      if(this.status.isStopped())
      {
         var _loc2_ = 0;
         while(_loc2_ < this.tracks.length)
         {
            var _loc3_ = this.tracks[_loc2_];
            _loc3_.play();
            _loc2_ = _loc2_ + 1;
         }
         this.status.setPlaying();
         this.player.onSongPlaying(true,this);
         com.sulake.habbo.traxplayer.util.Logger.debug("Now playing song");
      }
   }
   function stop()
   {
      var _loc2_ = 0;
      while(_loc2_ < this.tracks.length)
      {
         var _loc3_ = this.tracks[_loc2_];
         _loc3_.stop();
         _loc2_ = _loc2_ + 1;
      }
      this.status.setStopped();
   }
   function addTrackWithSamples(samples)
   {
      com.sulake.habbo.traxplayer.util.Logger.log("Adding track:" + samples);
      var _loc2_ = new com.sulake.habbo.traxplayer.core.Track(this.movieClip);
      this.addTrack(_loc2_);
      _loc2_.addSamples(samples);
   }
   function loadSamples()
   {
      var _loc2_ = 0;
      while(_loc2_ < this.tracks.length)
      {
         var _loc3_ = this.tracks[_loc2_];
         _loc3_.loadSamples();
         _loc2_ = _loc2_ + 1;
      }
   }
   function getSongLengthInSeconds()
   {
      var _loc4_ = 0;
      var _loc2_ = 0;
      while(_loc2_ < this.tracks.length)
      {
         var _loc3_ = this.tracks[_loc2_];
         com.sulake.habbo.traxplayer.util.Logger.log("track[" + _loc2_ + "] length " + _loc3_.getTrackLengthInSeconds());
         if(_loc3_.getTrackLengthInSeconds() > _loc4_)
         {
            _loc4_ = _loc3_.getTrackLengthInSeconds();
         }
         _loc2_ = _loc2_ + 1;
      }
      return _loc4_;
   }
   function isReadyForBeat(beatNumber)
   {
      var _loc2_ = 0;
      while(_loc2_ < this.tracks.length)
      {
         var _loc3_ = this.tracks[_loc2_];
         if(!_loc3_.isReadyForBeat(beatNumber))
         {
            com.sulake.habbo.traxplayer.util.Logger.debug("Track is not ready for beat!");
            return false;
         }
         _loc2_ = _loc2_ + 1;
      }
      return true;
   }
   function toString()
   {
      return "Song{name=" + this.name + ",length=" + this.getSongLengthInSeconds() + ",status=" + this.status + "}";
   }
}
