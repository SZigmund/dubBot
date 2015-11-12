/* Mady by Doc_Z */
var dubBot = {
        /*ZZZ: Updated Version*/
        version: "Version 1.01.1.00001",
	songStats: {
            mehCount: 0,
            dubCount: 0,
            snagCount: 0,
            tastyCount: 0,
            currentSong: "",
            currentDj: ""
        },
        botName: "Larry The Law"
};
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
			$('.chat-main').bind("DOMSubtreeModified", API.on.NEWCHATMAIN);
			$('.chat-messages ps-container').bind("DOMSubtreeModified", API.on.NEWCHATX);
			API.chatLog(dubBot.botName + " " + dubBot.version + " Online");
			
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
			API.sendChat("[ :thumbsup: " + dubCount + " :thumbsdown: " + mehCount + " ]");
			//"[:thumbsup: %%WOOTS%% :star: %%GRABS%% :thumbsdown: %%MEHS%%] %%USER%% [%%ARTIST%% - %%TITLE%%]"
		},
		NEWCHATMAIN : function(){
			API.sendChat("NEW CHAT MAIN");
		},
		NEWCHATX : function(){
			API.sendChat("NEW CHATX");
		}
	}
};

if(!window.APIisRunning){
  API.main.init();
}else{
    setTimeout(API.main.init, 1000);
}
