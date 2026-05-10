class com.sulake.habbo.traxplayer.core.SongLoader
{
   var sampleUrl;
   var song;
   function SongLoader(sampleUrl)
   {
      this.sampleUrl = sampleUrl;
   }
   function load(songUrl, song)
   {
      this.song = song;
      var songData = new com.sulake.habbo.traxplayer.core.SongData(this.sampleUrl,song);
      var loadVars = new LoadVars();
      var _loc3_ = this;
      loadVars.onLoad = function(success)
      {
         for(var _loc2_ in this)
         {
            com.sulake.habbo.traxplayer.util.Logger.log("key " + _loc2_ + " = " + loadVars[_loc2_]);
         }
         if(success && loadVars.status == 0)
         {
            songData.setData(loadVars);
            song.onSongLoad(true,songData);
         }
         else
         {
            song.onSongLoad(false,songData);
         }
      };
      loadVars.load(songUrl);
   }
}
