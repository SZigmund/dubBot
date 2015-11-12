/* Mady by Doc_Z */
var dubBot = {
  /*ZZZ: Updated Version*/
  version: "Version 1.01.1.00007",
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
  main: {
    init: function() {
      if (window.APIisRunning) {
        console.log("[PlugAPI-Dubtrack] already running...")
        return;
      }

      window.APIisRunning = true;


      //OnSongUpdate Events
      $('.currentSong').bind("DOMSubtreeModified", API.on.EVENT_SONG_ADVANCE);
      $('.chat-main').bind("DOMSubtreeModified", API.on.EVENT_NEW_CHAT);
      API.chatLog(dubBot.botName + " " + dubBot.version + " Online");

      // [...]
    },
  },

  chatLog: function(txt) {
    var b = new Dubtrack.View.chatLoadingItem;
    b.$el.text(txt).appendTo(Dubtrack.room.chat._messagesEl);
  },

  sendChat: function(txt) {
    Dubtrack.room.chat._messageInputEl.val(txt);
    Dubtrack.room.chat.sendMessage();
  },

  showPopup: function(title, message) {
    Dubtrack.helpers.displayError(title, message);
  },

  on: {
    EVENT_SONG_ADVANCE: function() {
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
    EVENT_NEW_CHAT: function() {
      try {
        var mainChat = document.getElementsByClassName("chat-main");
        console.log("mainChat count: " + mainChat.length);
        //get all getElementsByTagName("stream-item-content");
        //get user: getElementsByTagName("username");
        //get all comments: getElementsByTagName("p");
        var streamItems = document.getElementsByClassName("stream-item-content");
        console.log("streamItems count: " + streamItems.length);
        for (var i = 0; i < streamItems.length; i++) {
          var chatItems = streamItems[i].getElementsByTagName("p");
          console.log("chatItems count: " + chatItems.length);
          var chatItems = streamItems[i].active - row.text.getElementsByTagName("p");
          console.log("chatItems count: " + chatItems.length);
          for (var j = 0; j < chatItems.length; j++) {
            var username = chatItems.getElementById("demo")
            console.log("User: " + username);
          }
        }
      } catch (err) {
        //todoer basicBot.roomUtilities.logException("getWaitListPosition: " + err.message);
        console.log("EVENT_NEW_CHAT: " + err.message);
      }
    }
  }
};

if (!window.APIisRunning) {
  API.main.init();
} else {
  setTimeout(API.main.init, 1000);
}
