class com.sulake.habbo.traxplayer.Configuration
{
   function Configuration()
   {
   }
   static function createTraxPlayer(movieClip, playerListener)
   {
      var _loc2_ = com.sulake.habbo.traxplayer.Configuration.getSampleUrl();
      var _loc4_ = com.sulake.habbo.traxplayer.Configuration.getSongUrl();
      com.sulake.habbo.traxplayer.util.Logger.debug("songUrl=" + _loc4_ + " sampleUrl=" + _loc2_);
      var _loc1_ = new com.sulake.habbo.traxplayer.core.Player(movieClip);
      _loc1_.setPlayerListener(playerListener);
      var _loc3_ = new com.sulake.habbo.traxplayer.core.Song(movieClip);
      _loc1_.addSong(_loc3_);
      var _loc5_ = new com.sulake.habbo.traxplayer.core.SongLoader(_loc2_);
      _loc5_.load(_loc4_,_loc3_);
      return _loc1_;
   }
   static function getSampleUrl()
   {
      var _loc2_ = _root.sampleUrl;
      return _loc2_;
   }
   static function getSongUrl()
   {
      var _loc2_ = _root.songUrl;
      return _loc2_;
   }
   static function main(mc)
   {
      _root.sampleUrl = "http://images.habbogroup.com/dcr/hof_furni/mp3/";
      _root.songUrl = "http://export.habbo.fr/trax/song/31708";
      var _loc3_ = new com.sulake.habbo.traxplayer.TestPlayerListener();
      var _loc2_ = com.sulake.habbo.traxplayer.Configuration.createTraxPlayer(mc,new com.sulake.habbo.traxplayer.TestPlayerListener());
      setInterval(_loc2_,"startPlaying",10000);
      setInterval(_loc2_,"stopPlaying",15000);
   }
}
