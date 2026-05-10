class com.sulake.habbo.traxplayer.ui.Initializer
{
   function Initializer()
   {
   }
   static function initialize()
   {
      _root.globalSound = new Sound();
      _root.volume = 50;
      _root.controlbuttons.play.enabled = false;
      _root.volumecontrol.dragger.enabled = false;
      _root.playerListener = new com.sulake.habbo.traxplayer.ui.UiPlayerListener(_root);
      _root.player = com.sulake.habbo.traxplayer.Configuration.createTraxPlayer(_root,_root.playerListener);
   }
}
