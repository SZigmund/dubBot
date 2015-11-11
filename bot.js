/* Mady by Doc_Z Version 1.01.0001 */

var API = {
    main : {
  		init : function(){
  			if ( window.APIisRunning ){
				console.log("[PlugAPI-Dubtrack] already running...")
  				return;
  			}

  			window.APIisRunning = true;
			
            
			//OnSongUpdate Events
			$('.currentSong').bind("DOMSubtreeModified", API.on.ADVANCE);
			
			
  			// [...]
  		},
	},
	
	chatLog : function(txt){
		var b = new Dubtrack.View.chatLoadingItem;
		b.$el.text(txt).appendTo(Dubtrack.room.chat._messagesEl);
	},
	
	sendChat : function(txt){
		Dubtrack.room.chat._messageInputEl.val(txt);
        Dubtrack.room.chat.sendMessage();
	},
	
	showPopup : function(title, message){
		Dubtrack.helpers.displayError(title, message);
	},
	
	on : {
		ADVANCE : function(){
			// UPDATE ON SONG UPDATE
			//Get Current song name
			var songName = $(".currentSong").text();
			var djName = $(".currentDJSong").text();
			var dubCount = $(".dubup.dub-counter").text();
			var mehCount = $(".dubdown.dub-counter").text();
				
			//If "loading..." do nothing
			if (songName == "loading...") return;
			API.sendChat(djName + " - " + songName);
			API.sendChat("[:thumbsup: " dubCount + " :thumbsdown: " + mehCount);
			//"[:thumbsup: %%WOOTS%% :star: %%GRABS%% :thumbsdown: %%MEHS%%] %%USER%% [%%ARTIST%% - %%TITLE%%]"
		}
	}
};

if(!window.APIisRunning){
  API.main.init();
}else{
    setTimeout(API.main.init, 1000);
}
