# Shenanibot-public
Shenanibot is going to be a free twitch chat bot developed for streamers playing LevelHead. Its purpose is to help streamers manage their level queues.

_Sooo... what does it do?_

It adds levels directly to your bookmarks so you don't type them. Then you just control the level queue by using the commands.

_Do you want to change the commands or add some of your own?_

Well JavaScript is easy to learn and here you have the source code. So... you now have it all. Although forking the git and then helping us make the bot even better would be nice, you can just keep your changes to yourself. Just have fun!

The bot has the following commands;

**FOR THE STREAMER:**

_QUEUE MANAGEMENT_
    
!prev : Sets the index queue to the previous level. Now the current level would be the previous one.    
!next : Sets the index queue to the next level    
!current : Shows information about the current level being played    
!clear : Mark a level as beaten    
!skip : Mark a level as skipped or not beaten    
!add [level code] : Adds a level to the viewer level queue    
!q or !queue : Shows up to 5 next levels in the queue    
!totalq : Shows the total number of levels in the queue as well as the quantity of levels beaten and unbeaten.    
    
_MISC_    
    
!cmd : Shows some quick commands for viewers    
!about : Shows customized message    
!bot : Shows bot description    
    
_VIEWERS INTERACTION_    
Viewers can only use the following commands:    
    
!add    
!current    
!q or !queue    
!totalq    
    
    
DB integration TBD.    



**References:
Cprice1771 RumpusAPI.js
https://github.com/Cprice1771/Rumpus-CE/blob/master/js-client/RumpusAPI.js
