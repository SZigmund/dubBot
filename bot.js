/* Mady by Doc_Z */
var botVar = {
  /*ZZZ: Updated Version*/
  version: "Version 1.01.1.00015",
  songStats: {
    mehCount: 0,
    dubCount: 0,
    snagCount: 0,
    tastyCount: 0,
    currentSong: "",
    currentDj: ""
  },
  botName: "Larry The Law",
  chatHistoryList: [],
  chatHistory: function (id, count) {
      this.chatId = id;
      this.chatCount = count;
  }
};
var dubBot = {
  findChatItem: function(itemID) {
    for (var i = 0; i < botVar.chatHistoryList.length; i++) {
        if (botVar.chatHistoryList[i].chatId.trim() === itemID.trim()) {
            return botVar.chatHistoryList[i];
        }
    }
    botVar.chatHistoryList.push(new chatHistory(itemID, 0));
    return botVar.chatHistoryList[(botVar.chatHistoryList.length)-1];
  },
  processChat: function(liItem) {
    try{
      if (typeof liItem === "undefined") return;  // ignore empty items
      console.log("Item ID: " + liItem.id);
      if (liItem.id.length < 10) return;
      var itemHistory = dubBot.findChatItem(liItem.id);
      console.log("Hist Item count: " + itemHistory.chatCount);
      var chatItems = liItem.getElementsByTagName("p");
      console.log("chat Items count: " + chatItems.length);
      if (chatItems.length <= itemHistory.chatCount) return;
      //todoer Process any unprocessed messages:
      itemHistory.chatCount = chatItems.length;
      //todoer botVar.chatHistoryList.push(new botVar.chatHistoryList(chatID, chatCount));

      /*
      var streamItems = document.getElementsByClassName("stream-item-content");
      console.log("streamItems count: " + streamItems.length);
      for (var i = 0; i < streamItems.length; i++) {
        var chatItems = streamItems[i].getElementsByTagName("p");
        console.log("chatItems count: " + chatItems.length);
        var username = chatItems[0].getElementsByClassName("username")[0].innerHTML;
        console.log("User: " + username);
        for (var j = 0; j < chatItems.length; j++) {
          var node = chatItems[j];
          var chatMsg = (node.textContent===undefined) ? node.innerText : node.textContent;
          chatMsg = chatMsg.replace(username, "");
          console.log("Chat: " + chatMsg);
        }
      }
      */
      } catch (err) {
        //todoer basicBot.roomUtilities.logException("getWaitListPosition: " + err.message);
        console.log("EVENT_NEW_CHAT: " + err.message);
      }
    }
};
var UTIL = {
  logException: function(exceptionMessage) {
    console.log(exceptionMessage);
  }
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
      API.chatLog(botVar.botName + " " + botVar.version + " Online");

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
        var LiItems = mainChat[0].getElementsByTagName("li");
        for (var i = 0; i < LiItems.length; i++) {
          dubBot.processChat(LiItems[i]);
        }
      } catch (err) {
        UTIL.logException("EVENT_NEW_CHAT: " + err.message);
      }
    }
  }
};

if (!window.APIisRunning) {
  API.main.init();
} else {
  setTimeout(API.main.init, 1000);
}
