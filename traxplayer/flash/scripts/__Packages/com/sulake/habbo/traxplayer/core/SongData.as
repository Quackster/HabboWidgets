class com.sulake.habbo.traxplayer.core.SongData
{
   var sampleUrl;
   var song;
   var track1;
   var track2;
   var track3;
   var track4;
   var name;
   var author;
   var loaded;
   function SongData(sampleUrl, song)
   {
      this.sampleUrl = sampleUrl;
      this.song = song;
   }
   function setData(loadVars)
   {
      this.track1 = new com.sulake.habbo.traxplayer.core.TrackData(this.sampleUrl,loadVars.track1);
      this.track1.setSongData(this);
      this.track2 = new com.sulake.habbo.traxplayer.core.TrackData(this.sampleUrl,loadVars.track2);
      this.track2.setSongData(this);
      this.track3 = new com.sulake.habbo.traxplayer.core.TrackData(this.sampleUrl,loadVars.track3);
      this.track3.setSongData(this);
      this.track4 = new com.sulake.habbo.traxplayer.core.TrackData(this.sampleUrl,loadVars.track4);
      this.track4.setSongData(this);
      this.name = loadVars.name;
      this.author = loadVars.author;
   }
   function loadSamples()
   {
      com.sulake.habbo.traxplayer.util.Logger.debug("Loading tracks");
      if(!this.track1.isLoaded())
      {
         com.sulake.habbo.traxplayer.util.Logger.debug("Loading track 1");
         this.track1.loadSamples();
         return undefined;
      }
      if(!this.track2.isLoaded())
      {
         com.sulake.habbo.traxplayer.util.Logger.debug("Loading track 2");
         this.track2.loadSamples();
         return undefined;
      }
      if(!this.track3.isLoaded())
      {
         com.sulake.habbo.traxplayer.util.Logger.debug("Loading track 3");
         this.track3.loadSamples();
         return undefined;
      }
      if(!this.track4.isLoaded())
      {
         com.sulake.habbo.traxplayer.util.Logger.debug("Loading track 4");
         this.track4.loadSamples();
         return undefined;
      }
      com.sulake.habbo.traxplayer.util.Logger.debug("All tracks are loaded");
      this.loaded = true;
      this.song.onSongDataLoad(true,this);
   }
   function onTrackDataLoad(success)
   {
      if(success)
      {
         this.loadSamples();
      }
      else
      {
         this.song.onSongDataLoad(false,this);
      }
   }
   function getTrack1()
   {
      return this.track1.getSampleUrls();
   }
   function getTrack2()
   {
      return this.track2.getSampleUrls();
   }
   function getTrack3()
   {
      return this.track3.getSampleUrls();
   }
   function getTrack4()
   {
      return this.track4.getSampleUrls();
   }
   function getName()
   {
      return this.name;
   }
   function getAuthor()
   {
      return this.author;
   }
   function isLoaded()
   {
      return this.loaded;
   }
}
