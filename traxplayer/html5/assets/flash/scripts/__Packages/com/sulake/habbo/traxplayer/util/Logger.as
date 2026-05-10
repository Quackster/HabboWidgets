class com.sulake.habbo.traxplayer.util.Logger
{
   var mc;
   static var logger;
   static var logEnabled = false;
   static var debugEnabled = false;
   function Logger(mc)
   {
      this.mc = mc;
   }
   static function log(message)
   {
      if(com.sulake.habbo.traxplayer.util.Logger.logEnabled)
      {
         if(com.sulake.habbo.traxplayer.util.Logger.logger == null)
         {
            com.sulake.habbo.traxplayer.util.Logger.logger = new com.sulake.habbo.traxplayer.util.Logger(_root);
         }
         com.sulake.habbo.traxplayer.util.Logger.logger._log(message);
      }
   }
   static function debug(message)
   {
      if(com.sulake.habbo.traxplayer.util.Logger.debugEnabled)
      {
         if(com.sulake.habbo.traxplayer.util.Logger.logger == null)
         {
            com.sulake.habbo.traxplayer.util.Logger.logger = new com.sulake.habbo.traxplayer.util.Logger(_root);
         }
         com.sulake.habbo.traxplayer.util.Logger.logger._log(message);
      }
   }
   function _log(message)
   {
      trace(message);
   }
}
