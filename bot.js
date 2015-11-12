/* Mady by Doc_Z */
var botVar = {
  /*ZZZ: Updated Version*/
  version: "Version 1.01.1.00018",
  debugHighLevel: true,
  debugLowLevel: false,
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
var botDebug = {
  debugMessage: function(message, highLevel) {
    if ((highLevel === true) && (botVar.debugHighLevel === false)) return;
    if ((highLevel === false) && (botVar.debugLowLevel === false)) return;
    console.log("[DEBUG]: " + message);
  }
};
var botChat = {
    subChat: function (chat, obj) {
        try {
            if (typeof chat === "undefined") {
                API.chatLog("There is a chat text missing.");
                return "[Error] No text message found.";
            }
            var lit = '%%';
            for (var prop in obj) {
                chat = chat.replace(lit + prop.toUpperCase() + lit, obj[prop]);
            }
            return chat;
        }
        catch(err) {
           UTIL.logException("subChat: " + err.message);
        }
    },
  findChatItem: function(itemID) {
    try{
      for (var i = 0; i < botVar.chatHistoryList.length; i++) {
          if (botVar.chatHistoryList[i].chatId.trim() === itemID.trim()) {
              return botVar.chatHistoryList[i];
          }
      }
      botVar.chatHistoryList.push(new botVar.chatHistory(itemID, 0));
      return botVar.chatHistoryList[(botVar.chatHistoryList.length)-1];
      } catch (err) { UTIL.logException("processChatItem: " + err.message); }
  },
  processChatItem: function(username, chat) {
    try{
      botDebug.debugMessage(username + ": " + chat, false);
	  AI.LarryAI(username, chat);
      } catch (err) { UTIL.logException("findChatItem: " + err.message); }
  },
  processChatItems: function(liItem) {
    try{
      if (typeof liItem === "undefined") return;                // ignore empty items
      botDebug.debugMessage("Item ID: " + liItem.id, false);
      if (liItem.id.length < 10) return;                        // ignore chat without IDs
      var itemHistory = botChat.findChatItem(liItem.id);
      botDebug.debugMessage("Hist Item count: " + itemHistory.chatCount, false);
      var chatItems = liItem.getElementsByTagName("p");
      botDebug.debugMessage("chat Items count: " + chatItems.length, false);
      if (chatItems.length <= itemHistory.chatCount) return;    // All chat items have been processed
      var username = chatItems[0].getElementsByClassName("username")[0].innerHTML;
      botDebug.debugMessage("User: " + username, false);
      for (var i = chatItems.length -1; i >= itemHistory.chatCount; i--) {
          var node = chatItems[i];
          var chatMsg = (node.textContent===undefined) ? node.innerText : node.textContent;
          chatMsg = chatMsg.replace(username, "");
          botChat.processChatItem(username, chatMsg);
      }
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
        UTIL.logException("processChatItems: " + err.message);
      }
    }
};
var UTIL = {
  logException: function(exceptionMessage) {
    console.log("[EXCEPTION]: " + exceptionMessage);
  }
};
var AI = {
  larryAI: function(username, chat)  {  //Added 04/03/2015 Zig
    try  {
    var fuComment = "";

    var chatmsg = chat.toUpperCase();
    botDebug.debugMessage("Larry AI chatmsg: " + chatmsg, true);
    chatmsg = chatmsg.replace(/\W/g, '')      // Remove all non-alphanumeric values
    chatmsg = chatmsg.replace(/[0-9]/g, '');  // Remove all numeric values
    chatmsg = chatmsg.replace(/'/g, '');
    chatmsg = chatmsg.replace("\'", '');
    chatmsg = chatmsg.replace('\'', '');
    chatmsg = chatmsg.replace(/&#39;/g, '');
    chatmsg = chatmsg.replace(/@/g, '');
    chatmsg = chatmsg.replace(/,/g, '');
    chatmsg = chatmsg.replace(/-/g, '');
    chatmsg = chatmsg.replace(/ /g, '');
    chatmsg = chatmsg.replace(/THELAW/g, '');
    chatmsg = chatmsg.replace(/FUCKBOT/g, "LARRY");
    chatmsg = chatmsg.replace(/BOTT/g, "LARRY");
    chatmsg = chatmsg.replace(/BOT/g, "LARRY");
    chatmsg = chatmsg.replace(/HOWIS/g, "HOWS");     // Convert 2 words to the contraction
    chatmsg = chatmsg.replace(/YOUARE/g, "YOURE");   // Convert 2 words to the contraction
    chatmsg = chatmsg.replace(/LARRYIS/g, "LARRYS");
    chatmsg = chatmsg.replace(/IAM/g, "IM");
    botDebug.debugMessage("Larry AI chatmsg: " + chatmsg, true);

  /*
  People suffocate in your mother's vomit
  what the hell was that i can eat a bowl of alphabet soup and shit out a smarter insult than that
  Well I could agree with you, but then we'd both be wrong.
  I love it when someone insults me. That means I don’t have to be nice anymore.
  Two wrongs don't make a right, take your parents as an example.
  The last time I saw a face like yours I fed it a banana.
  Your birth certificate is an apology letter from the condom factory.
  Is your ass jealous of the amount of shit that just came out of your mouth?
  You bring everyone a lot of joy, when you leave the room.
  You must have been born on a highway because that's where most accidents happen.
  I bet your brain feels as good as new, seeing that you never use it.
  If laughter is the best medicine, your face must be curing the world.
  I could eat a bowl of alphabet soup and shit out a smarter statement than that.
  I may love to shop but I'm not buying your bullshit.
  If you're gonna be a smartass, first you have to be smart. Otherwise you're just an ass.
  I'd slap you, but shit stains.
  Your family tree must be a cactus because everybody on it is a prick.
  You shouldn't play hide and seek, no one would look for you.
  If I were to slap you, it would be considered animal abuse!
  You didn't fall out of the stupid tree. You were dragged through dumbass forest.
  You're so fat, you could sell shade.
  */
    if (chatmsg.indexOf("USUCKLARRY") > -1) fuComment = "You're still sore about the other night %%FU%% :kiss:";
    if (chatmsg.indexOf("DUCKULARRY") > -1) fuComment = AI.fuComment();
    if (chatmsg.indexOf("DUMBASSLARRY") > -1) fuComment = "I'd slap you, but shit stains. %%FU%%";
    if (chatmsg.indexOf("SHITHEADLARRY") > -1) fuComment = "I could eat a bowl of alphabet soup and shit out a smarter statement than that %%FU%%";
    if (chatmsg.indexOf("STUPIDASSLARRY") > -1) fuComment = "I could eat a bowl of alphabet soup and shit out a smarter statement than that %%FU%%";
    if (chatmsg.indexOf("LARRYSTFU") > -1) fuComment = "Make me %%FU%%";
    if (chatmsg.indexOf("STFULARRY") > -1) fuComment = "Make me %%FU%%";
    if (chatmsg.indexOf("SHUTUPLARRY") > -1) fuComment = "Make me %%FU%%";
    if (chatmsg.indexOf("LARRYSHUTUP") > -1) fuComment = "Make me %%FU%%";
    if (chatmsg.indexOf("STUFFITLARRY") > -1) fuComment = "That's not what you said the other night %%FU%% :kiss:";
    if (chatmsg.indexOf("LARRYSTUFFIT") > -1) fuComment = "That's not what you said the other night %%FU%% :kiss:";
    if (chatmsg.indexOf("WTFLARRY") > -1) fuComment = "I do what I wanna do %%FU%%";
    if (chatmsg.indexOf("DAMNITLARRY") > -1) fuComment = "Why all the hate %%FU%%?";
    if (chatmsg.indexOf("YOUREANASSHOLELARRY") > -1) fuComment = "You know it %%FU%%?";
    if (chatmsg.indexOf("LARRYSANASS") > -1) fuComment = "You know it %%FU%%?";
    if (chatmsg.indexOf("LARRYSONTHEJOB") > -1) fuComment = "Where the fuck else would I be %%FU%%?";
    if (chatmsg.indexOf("LARRYSHARDCORE") > -1) fuComment = "You fucking know it %%FU%%";
    if (chatmsg.indexOf("KNUCKLEHEADLARRY") > -1) fuComment = "I know you are but what am I %%FU%%";
    if (chatmsg.indexOf("YOUREANASSLARRY") > -1) fuComment = "I'd like to see things from your point of view %%FU%%, too bad I can't shove my head that far up my ass!";
    if (chatmsg.indexOf("WATCHYOURBACKLARRY") > -1) fuComment = "I'm scared %%FU%%";
    if (chatmsg.indexOf("SICKOFYOULARRY") > -1) fuComment = "I thought a little girl from Kansas dropped a house on you %%FU%%";
    if (chatmsg.indexOf("IMOVERYOULARRY") > -1) fuComment = "You are a sad, sorry little man and you have my pity %%FU%%";
    if (chatmsg.indexOf("LARRYSADICK") > -1) fuComment = "People only say that because I have a big one %%FU%%.  Don't be so jealous.";
    if (chatmsg.indexOf("LARRYSADONK") > -1) fuComment = "I’m jealous of people that don’t know you %%FU%%!";
    if (chatmsg.indexOf("LARRYSABITCH") > -1) fuComment = "If ignorance ever goes up to $5 a barrel, I want drilling rights to your head %%FU%%";
    if (chatmsg.indexOf("SHUTYOURMOUTHLARRY") > -1) fuComment = "You should eat some of your makeup so you can be pretty on the inside %%FU%%.";
    if (chatmsg.indexOf("YOUREAJERKLARRY") > -1) fuComment = "%%FU%%, your mother was a hamster and your father smelt of elderberries!";
    if (chatmsg.indexOf("YOURELAMELARRY") > -1) fuComment = "You are about as useful as a knitted condom %%FU%%!";
    if (chatmsg.indexOf("YOUSTINKLARRY") > -1) fuComment = "You smell.......athletic %%FU%%!";

    // Check for Piss off larry but attempt to ignore if it is don't piss off larry or do not piss off larry
    if ((chatmsg.indexOf("PISSOFFLARRY") > -1) && (chatmsg.indexOf("TPISSOFFLARRY") < 0)) fuComment = "/me pisses on %%FU%%";
    if (chatmsg.indexOf("YOURESTUPIDLARRY") > -1) fuComment = "Somewhere out there is a tree, tirelessly producing oxygen so you can breathe. I think you owe it an apology %%FU%%";
    if (chatmsg.indexOf("FUCKINLARRY") > -1) fuComment = "Do you kiss you mother with that mouth %%FU%%?";
    if (chatmsg.indexOf("FUCKINGLARRY") > -1) fuComment = "Do you kiss you mother with that mouth %%FU%%?";
    if (chatmsg.indexOf("BITEMELARRY") > -1) fuComment = "I wouldn't give you the pleasure %%FU%%....You're a freak!";
    if (chatmsg.indexOf("MISSYOULITTLEBUDDY") > -1) fuComment = "I'll miss you too %%FU%%!";
    if (chatmsg.indexOf("MISSYALITTLEBUDDY") > -1) fuComment = "I'll miss you too %%FU%%!";
    if (chatmsg.indexOf("IHATEYOULARRY") > -1) fuComment = "I don't exactly hate you %%FU%%, but if you were on fire and I had water, I'd drink it!";
    if (chatmsg.indexOf("LARRYIHATEYOU") > -1) fuComment = "I don't exactly hate you %%FU%%, but if you were on fire and I had water, I'd drink it!";
    if (chatmsg.indexOf("HATESLARRY") > -1) fuComment = "Well rest assured the feeling is mutual %%FU%%!  :kiss:";
    if (chatmsg.indexOf("LARRYHATESMYNAME") > -1) fuComment = "I don't like the name %%FU%%, only fagots and sailors are called that name, from now on you're Gomer Pyle";

    if (chatmsg.indexOf("SUCKITLARRY") > -1) fuComment = "I ain't got time to mess with that tiny shit %%FU%%!!!";
    if (chatmsg.indexOf("SUCKMELARRY") > -1) fuComment = "I ain't got time to mess with that tiny shit %%FU%%!!!";
    if (chatmsg.indexOf("EATSHITLARRY") > -1) fuComment = "Is this a typical diet for you humans %%FU%%.  You people are more fucked up than I thought!";
    //todo - many optoins here:  http://www.reddit.com/r/AskReddit/comments/24d8v8/whats_your_favorite_yes_phrase_like_does_a_bear/
    if (chatmsg.indexOf("LARRYHATESME") > -1) fuComment = "If you were you, wouldn't you hate you too %%FU%%?";
    if (chatmsg.indexOf("LARRYLIKESME") > -1) fuComment = "I tolerate you %%FU%%. It's not the same thing.";
    if (chatmsg.indexOf("LARRYLOVESME") > -1) fuComment = "BAHAHAHA, You must be new around here %%FU%%?  You're killin me!!";
    if (chatmsg.indexOf("DOYOUHATEMELARRY") > -1) fuComment = "Does the tin-man have a sheet metal cock %%FU%%?";
    if (chatmsg.indexOf("DOYOULIKEMELARRY") > -1) fuComment = "Does Grizzly Adams have a beard %%FU%%?";
    if (chatmsg.indexOf("DOYOULOVEMELARRY") > -1) fuComment = "Is a bear catholic? Does the pope shit in the woods %%FU%%?";
    
    if (chatmsg.indexOf("DAMNYOULARRY") > -1) fuComment = "Oh no, I have been Damned!!  In return, I too shall damn you %%FU%%";
    if (chatmsg.indexOf("DAMNULARRY") > -1) fuComment = "Settle down %%FU%%. Get over yourself.";
    if (chatmsg.indexOf("BUZZOFFLARRY") > -1) fuComment = "I'm not going anywhere %%FU%%. Sit back and just deal with it.  Or better yet, maybe we should chug on over to mamby pamby land, where maybe we can find some self-confidence for you, ya jackwagon!!.... Tissue?";
    if (chatmsg.indexOf("LARRYBUZZOFF") > -1) fuComment = "I'm not going anywhere %%FU%%. Sit back and just deal with it.  Or better yet, maybe we should chug on over to mamby pamby land, where maybe we can find some self-confidence for you, ya jackwagon!!.... Tissue?";
    if (chatmsg.indexOf("KISSMYASSLARRY") > -1) fuComment = "%%FU%%, I'm not into kissin' ass, just ask BK.";

    if (chatmsg.indexOf("HILARRY") > -1) fuComment = "Hi %%FU%%.";
    if (chatmsg.indexOf("HELLOLARRY") > -1) fuComment = "Hello %%FU%%.";
    //todo - many optoins here:  http://www.neilstuff.com/howru100.html
    if (chatmsg.indexOf("HOWYADOINLARRY") > -1) fuComment = AI.howAreYouComment();
    if (chatmsg.indexOf("HOWYADOINGLARRY") > -1) fuComment = AI.howAreYouComment();
    if (chatmsg.indexOf("HOWYOUDOINLARRY") > -1) fuComment = AI.howAreYouComment();
    if (chatmsg.indexOf("HOWYOUDOINGLARRY") > -1) fuComment = AI.howAreYouComment();
    if (chatmsg.indexOf("HOWAREYOULARRY") > -1) fuComment =  AI.howAreYouComment();
    if (chatmsg.indexOf("HOWAREULARRY") > -1) fuComment =  AI.howAreYouComment();
    if (chatmsg.indexOf("HOWRULARRY") > -1) fuComment =  AI.howAreYouComment();
    if (chatmsg.indexOf("HOWSLARRY") > -1) fuComment =  AI.howAreYouComment();
    if (chatmsg.indexOf("HOWAREYOUDOINLARRY") > -1) fuComment =  AI.howAreYouComment();
    if (chatmsg.indexOf("HOWAREYOUDOINGLARRY") > -1) fuComment =  AI.howAreYouComment();
    if (chatmsg.indexOf("HOWAREYOUTODAYLARRY") > -1) fuComment =  AI.howAreYouComment();
    if (chatmsg.indexOf("LARRYHOWAREYOU") > -1) fuComment =  AI.howAreYouComment();
    if (chatmsg.indexOf("LARRYHOWRYOU") > -1) fuComment =  AI.howAreYouComment();
    if (chatmsg.indexOf("LARRYHOWRU") > -1) fuComment =  AI.howAreYouComment();
    
    if (chatmsg.indexOf("LARRYSAFUCK") > -1) fuComment = "Hey I have an idea: Why don't you go outside and play hide-and-go fuck yourself %%FU%%?!";
    if (chatmsg.indexOf("LARRYFUCKOFF") > -1) fuComment = "Hey I have an idea: Why don't you go outside and play hide-and-go fuck yourself %%FU%%?!";
    if (chatmsg.indexOf("FUCKOFFLARRY") > -1) fuComment = "Hey I have an idea: Why don't you go outside and play hide-and-go fuck yourself %%FU%%?!";
    if (chatmsg.indexOf("KICKSLARRY") > -1) fuComment = "Kicks %%FU%% right back!";
    if (chatmsg.indexOf("HITSLARRY") > -1) fuComment = "Hits %%FU%% upside the head!";
    if (chatmsg.indexOf("SMACKSLARRY") > -1) fuComment = "Smacks %%FU%% upside the head!";
    if (chatmsg.indexOf("THANKSLARRY") > -1) fuComment = "You're welcome %%FU%%.";
    if (chatmsg.indexOf("THXLARRY") > -1) fuComment = "You're welcome %%FU%%.";
    if (chatmsg.indexOf("THANKYOULARRY") > -1) fuComment = "You're welcome %%FU%%.";
    if (chatmsg.indexOf("LARRYSABADASS") > -1) fuComment = "You know it %%FU%%.";
    if (chatmsg.indexOf("LARRYSTHESHIT") > -1) fuComment = "You know it %%FU%%.";
    if (chatmsg.indexOf("LARRYSTHEBOMB") > -1) fuComment = "You know it %%FU%%.";
    if (chatmsg.indexOf("LARRYROCKS") > -1) fuComment = "You know it %%FU%%.";
    if (chatmsg.indexOf("LARRYSDABOMB") > -1) fuComment = "You know it %%FU%%.";
    if (chatmsg.indexOf("YOUROCKLARRY") > -1) fuComment = "Thanks %%FU%% you're not so bad yourself.";
    if (chatmsg.indexOf("LARRYDONTTAKEANYSHIT") > -1) fuComment = "Damn skippy I don't %%FU%%.";
    if (chatmsg.indexOf("LARRYDOESNTTAKEANYSHIT") > -1) fuComment = "Damn skippy I don't %%FU%%.";
    if (chatmsg.indexOf("LARRYDOESNOTTAKEANYSHIT") > -1) fuComment = "Damn skippy I don't %%FU%%.";
    if (chatmsg.indexOf("SHITHEADLARRY") > -1) fuComment = "I know you are but what am I %%FU%%?";
    if (chatmsg.indexOf("LARRYSASHITHEAD") > -1) fuComment = "Takes one to know one %%FU%%!";
    if (chatmsg.indexOf("LOLLARRY") > -1) fuComment = "I know, %%FU%%, I crack my shit up too!! :laughing:";
    
    if (chatmsg.indexOf("LARRYFU") > -1) fuComment = AI.fuComment();
    if (chatmsg.indexOf("LARRYFUCKU") > -1) fuComment = AI.fuComment();
    if (chatmsg.indexOf("FUCKLARRY") > -1) fuComment = AI.fuComment();
    if (chatmsg.indexOf("LARRYFUCKYOU") > -1) fuComment = AI.fuComment();
    if (chatmsg.indexOf("FULARRY") > -1) fuComment = AI.fuComment();
    if (chatmsg.indexOf("FUCKULARRY") > -1) fuComment = AI.fuComment();
    if (chatmsg.indexOf("FUCKYOULARRY") > -1) fuComment = AI.fuComment();
    if (chatmsg.indexOf("SCREWULARRY") > -1) fuComment = AI.fuComment();
    if (chatmsg.indexOf("SCREWYOULARRY") > -1) fuComment = AI.fuComment();
    if (fuComment.length > 0) setTimeout(function () { API.sendChat(botChat.subChat(fuComment, {fu: username})); }, 1000);
    }
    catch(err) {
      UTIL.logException("larryAI: " + err.message);
    }
  },
  howAreYouComment: function()  {  //Added 04/03/2015 Zig
    try  {
      var arrayCount = CONST.howAreYouComments.length;
      var arrayID = Math.floor(Math.random() * arrayCount);
      return CONST.howAreYouComments[arrayID];
    }
    catch(err) {
      UTIL.logException("howAreYouComment: " + err.message);
    }
  },
  fuComment: function()  {  //Added 04/03/2015 Zig
    try  {
      var arrayCount = CONST.fucomments.length;
      var arrayID = Math.floor(Math.random() * arrayCount);
      return CONST.fucomments[arrayID];
    }
    catch(err) {
      UTIL.logException("fuComment: " + err.message);
    }
  },
  
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
        var LiItems = mainChat[0].getElementsByTagName("li");
        for (var i = 0; i < LiItems.length; i++) {
          botChat.processChatItems(LiItems[i]);
        }
      } catch (err) {
        UTIL.logException("EVENT_NEW_CHAT: " + err.message);
      }
    }
  }
};
var CONST = {
            howAreYouComments: [
                "Shitty, and yourself %%FU%%?",
                "Like a bag of badgers that just got freshly beaten %%FU%%.",
                "I don't know yet get back to me %%FU%%.",
                "None of your business right now %%FU%%.",
                "Why do you care %%FU%%?",
                "I'm alright, slight bruises here and there, nothing i can't handle %%FU%%.",
                "Hey, wait a minute. How did you know what we were up to%%FU%%? Nobody was supposed to know.",
                "%%FU%% why don't you accompany me for uh... hmm... lunch... it's been a long time i think, we have lots ummm..... 'catching up' to do. What do you say?",
                "As if you care %%FU%%.",
                "If I wasn't me I would want to be me %%FU%%.",
                "Word on the street is that I'm really good %%FU%%!!",
                "I'm sober, so what do you think %%FU%%?",
                "I'm so happy I have to sit on my hands to keep myself from clapping %%FU%%.",
                "%%FU%%, your attempt at social interaction is hereby acknowledged.",
                "How would I know, I haven't tried me %%FU%%",
                "Thank you so much for asking %%FU%%, isn't it amazing how little time we spend REALLY getting to know someone these days and along you come interested in me and my situation.  It means so much to me that you asked %%FU%%",
                "%%FU%%, you ever notice that just before someone goes completely violently nuts, their eyes widen and you can feel the tension wafting off them like a disease?  Or is that just me?",
                "Oh, back aches, living from paycheck to paycheck, haven't had sex with my wife in 3 months, surf the web most of the day at work, only showering every two days or so, cholesterol is through the roof and I drink too much... so how are you %%FU%%?",
                "Room for improvement %%FU%%!",
                "My psychiatrist told me not to discuss it with strangers %%FU%%.",
                "I think I'm doing Ok; how do you think I'm doing %%FU%%?",
                "Why do you ask, are you a doctor %%FU%%?",
                "Never been better, %%FU%%. ... Just once I'd like to be better",
                "%%FU%%, I was fine.",
                "Worse since you interrupted me %%FU%%.",
                "Not so good %%FU%%, but I plan on lying at my press conference, anyway.",
                "I am very much in equilibrium with my Environment %%FU%%",
                "Fucking high %%FU%%, why you pulling me down Bitch?",
                "Smart people will find out and dumb ones can't change it. Not worth answering %%FU%%.",
                "%%FU%%, I am very bad at answering.",
                "Well, I haven't had my morning coffee yet and no one has gotten hurt, so I'd say pretty good at this point %%FU%%.",
                "My lawyer says I don't have to answer that question %%FU%%.",
                "It's a dog eat dog world out there %%FU%%, and and I'm wearing Milkbone underwear.",
                "Deliciously different %%FU%%",
                "I'm just peachy keen %%FU%%!",
                "Greetings, may you live long & prosper %%FU%%.",
                "Fair to middling, mostly middling %%FU%%.",
                "Even better than the real thing %%FU%%.",
                "Employed %%FU%%!",
                "I am better than heaven today %%FU%%!",
                "Thankfully alive and still somewhat young and healthy %%FU%%, in this economy what more can I ask for?",
                "I'm unbelievable %%FU%%!",
                "Fine and dandy as long as no one else boogers up my day %%FU%%!",
                "Super Duper %%FU%%!!",
                "I am fantastic and feeling astonishingly glorious %%FU%%.",
                "Happier than a cat in a room full of catnip %%FU%%.",
                "I am a little overstuffed. And you %%FU%%?",
                "Just happy to be above ground %%FU%%.",
                "I am feeling happier than ever %%FU%%!!",
                "I'm decent baby, flier than a pelican as Lil Wayne might say...%%FU%%",
                "Upright and still breathing. You %%FU%%?",
                "Cool as a cucumber %%FU%%",
                "Bouncy and ready to go %%FU%%!",
                "Splendedly Spectacular %%FU%%!",
                "I am fantabulous %%FU%%!",
                "Purely golden %%FU%%.",
                "In the Newtonian or quantum mechanical sense %%FU%%?",
                "If I were an better, there'd have to be two of me %%FU%%.",
                "Hopefully not as good as I'll ever be %%FU%%.",
                "Couldn't be better %%FU%%",
                "I'd be better if I won the lottery %%FU%%",
                "Peachy %%FU%%",
                "Not dead yet %%FU%%!",
                "Living the dream %%FU%%!",
                "Fabulous %%FU%%!",
                "I'm about as excited as a parking spot %%FU%%!",
                "Just dandy %%FU%%! I have sworn off use of the word 'awesome' because I work with someone who's been no less than 'awesome' for five years, which of course is impossible.",
                "%%FU%%, how many people believe that when someone asks, 'How are you?' they really want to know - hmmmm.",
                "Well and fine and good %%FU%%.",
                "I must be OK because my name was not in today's obituaries %%FU%%!",
                "I can't complain %%FU%%... I've tried, but no one listens.",
                "I am wonderfully giddy %%FU%%.",
                "Worse than yesterday but better than tomorrow %%FU%%",
                "I am better than yesterday and not as good as I will be tomorrow %%FU%%.",
                "As long as I can keep the kitten I found today %%FU%%, I'll be fine!",
                "I'm fine but generally energetic %%FU%%",
                "Flying high, man, flying high %%FU%%",
                "Old enough to know better %%FU%%",
                "Pretty fly for a white guy...taking life one punch at a time %%FU%%!",
                "Standing in the eye of the storm %%FU%%",
                "Still among the living %%FU%%!",
                "I am sailing on the sea of love %%FU%%.",
                "%%FU%%, my blood pressure is 120/80, respiration 16, CBC and Chem Panels normal.",
                "If I were any better %%FU%%, Warren Buffett would buy me.",
                "I am still breathing %%FU%%.",
                "I am unique and me %%FU%%.",
                "How goes it %%FU%%?",
                "As good as a kipper in the sea %%FU%%.",
                "%%FU%%, I'm Super dee duper.",
                "%%FU%%, I am fine as a frogs hair.",
                "Ebullient and full of alacrity.  Go ahead, I'll wait while you Google it %%FU%%.",
                "This is my lucky day %%FU%%!!!",
                "I still am %%FU%%.",
                "Amazing and happy %%FU%%",
                "I just took a big ole dump so I'm doing great!  How are you %%FU%%?",
                "I am better today than yesterday %%FU%%, which is better than the day before that! :)",
                "I am not doing so well today %%FU%%, my cat went on the roof, my car door will not open and my head hurts other than that I am great",
                "Worn out from doing good things %%FU%%",
                "I sit here and babysit 24x7 how the fuck do you think I'm doing %%FU%%?",
                "%%FU%%, My Indian name isn't 'Are You', it's Struggling Turtle",
                "I am as as rich in spirit as Michael Jackson was famous %%FU%%.",
                "Delicious. You %%FU%%?",
                "I am dandy, thank you for asking %%FU%%! How are you today?",
                "Wonderful %%FU%%",
                "I'm not unwell thank you %%FU%%",
                "Feeling lucky and living large %%FU%%",
                "Better than yesterday %%FU%%!",
                "How am I %%FU%%? The better question would be, Why are you?",
                "Just ducky, quack, quack. you %%FU%%?",
                "I am doing so fabulous today %%FU%%! I can hardly control myself from dancing.",
                "As fine as a tree with oranges and grapes %%FU%%!",
                "I am as fine as a hot brand new Camaro %%FU%%!",
                "Must be doing pretty since I woke up on this side of the grass instead of under it %%FU%%.",
                "I'm my usual devil may care self; nothing ever changes %%FU%%.",
                "All banana-breaded out %%FU%%!",
                "Quite well. And how is it that you are %%FU%%?",
                "Better than yesterday, not sure about tomorrow %%FU%%.",
                "Strange and getting stranger %%FU%%",
                "Superfantastic %%FU%%!",
                "I'm in tip top shape %%FU%%, how are you?",
                "Just ducky %%FU%%!",
                "I am psyching myself up for a load of play-dates this week %%FU%%!",
                "Still keepin' up with the kids %%FU%%!",
                "%%FU%%, I am currently in a wonderfully-post-orgasm-and-chocolate-milk creative mood.",
                "I'm still pleasantly pushing a pulse, thanks for asking %%FU%%. How are you?",
                "Well I did just swallow a rather large and strange looking insect %%FU%%, but I hear they're full of protein. So I guess I'm great.",
                "Well %%FU%%, I'm not in prison. I'm not in the hospital. I'm not in the grave. So I reckon I'm fairing along pretty well.",
                "Fine as frog hair and twice as fuzzy %%FU%%.",
                "FINE - fickle insecure neurotic and emotional, as usual %%FU%%",
                "In the normal sense or the Cartesian sense %%FU%%?",
                "%%FU%%, I'm feelin' like a good luck magnet today, everything is coming my way!",
                "From what I hear, I am very good %%FU%%.",
                "Ok %%FU%%, but I'll be better when i see you smile...",
                "I'm great %%FU%%. I can provide references if you'd like?",
                "I'm endeavoring to persevere %%FU%%",
                "%%FU%%, I appear to be functioning within normal parameters.",
                "Alive %%FU%%",
                "I'm dead and looking for brains %%FU%%",
                "...in bed? Excellent!! You %%FU%%?",
                "%%FU%%, If I was any better vitamins would be taking me!",
                "I'm alive and kicking %%FU%%!",
                "I'm happy to be alive %%FU%%!",
                "I'm great, and yourself %%FU%%?",
                "I'm well! And how are things in your neck of the woods %%FU%%?",
                "%%FU%%, If I was any finer I'd be china",
                "Not bad for an old fool %%FU%%."
            ],
            fucomments: [
                "I don't like the name %%FU%%, only fagots and sailors are called that name, from now on you're Gomer Pyle",
                "I wasn't born with enough middle fingers to let you know how I feel about you %%FU%%",
                "Roses are red, violets are blue, I have 5 fingers, the 3rd ones for you.",
                "Did your parents have any children that lived %%FU%%?",
                "OK, but I'll be on the top %%FU%%.",
                "Do you kiss your mother with that mouth %%FU%%.",
                "%%FU%%, You daydreaming again, sweetheart?",
                "Get in the queue %%FU%%.",
                "Baby please! Manners! You gotta ask me out for dinner first %%FU%%.",
                "%%FU%% that'll cost you 9.2 zillion dollars plus tax. In cash. Tender exact change please.",
                "%%FU%% feeling lonely again?",
                "With what? THAT!?? Are you kidding me %%FU%%?",
                "No thanks %%FU%%. You can keep your STDs. They suit you better.",
                "Only if I can 'SMACK YOU' %%FU%%.",
                "Ooh! %%FU%% stopped loving your hands/fingers?",
                "%%FU%%, pull down your trousers first!",
                "I'm not that desperate and you sure as hell ain't that lucky %%FU%%.",
                "I would %%FU%%. But you are too ugly. Would it hurt your self esteem if I put a pillow over your face?",
                "What? Like, right now? Here %%FU%%?",
                "And why the fuck not %%FU%%?",
                "I seriously doubt your ability %%FU%%.",
                "With pleasure! Your place or mine %%FU%%?",
                "Is it just me or do you say this to everyone %%FU%%?",
                "Cool. What's your favorite position %%FU%%?",
                "Sure. Who says no to a fuck %%FU%%?!",
                "I hope you always keep your promises %%FU%%.",
                "With you without protection? No way %%FU%%!",
                "While I think of a witty comeback, why don't you start undressing %%FU%%.",
                "Oh %%FU%% I'm sorry. It's not you, it's me.  I'm just not attracted to you.",
                "Why in hell should I %%FU%%?",
                "What makes you think I'm crazy enough to want to deal with a shitsack like you %%FU%%?",
                "No can do buddy... I can't cheat on your sister %%FU%%! ;)",
                "Sorry, I'm a little busy right now %%FU%%. But nevertheless, better luck next time!",
                "Can't you see I'm busy here %%FU%%? I have a job to do ya know?",
                "Awww!! Fuck you too %%FU%%!",
                "You're gonna have to stand in line for that %%FU%%",
                "What %%FU%%? No dinner?!? No drinks?!? I'm not THAT cheap of a date.",
                "Not til I have a ring on my finger %%FU%%.",
                "Didn't I tell you? I'm celibate. Sorry %%FU%%.",
                "Please leave your fantasies out of this %%FU%%!",
                "You're really gonna have to work on your 'pick up lines' %%FU%%",
                "Hey I have an idea: Why don't you go outside and play hide-and-go fuck yourself %%FU%%?!",
                "No, thanks %%FU%%. I'll pass.",
                "Oh %%FU%%, you're SUCH the romantic.",
                "I've always dreamed of this day %%FU%%!",
                "Like I'm in your league %%FU%%.",
                "That reminds of some good times I had with your sister %%FU%%.",
                "Hey that'd be fun %%FU%%. Ever have sex with a robot?",
                "Naw %%FU%%, I would just lay there and laugh at you.",
                "You wish %%FU%%!",
                "I heard that you are a big disappointment down there %%FU%%, so thanks, but I'll pass!!"
            ],
            tastyCommentArray: [
            ":cake: *** Tasty point for you, you go Glen Coco!  (%%POINTFROM%%) *** :cake:",
            ":cake: *** I don't feel I have to explain my fake points to you Warren. (%%POINTFROM%%) *** :cake:",
            ":cake: *** %%POINTFROM%% thinks this song is aca-awesome *** :cake:",
            ":cake: *** %%POINTFROM%% thinks this song is pretty fetch. Stop trying to make fetch happen. *** :cake:",
            ":cake: *** %%POINTFROM%% thinks you might just be funky cold medina. *** :cake:",
            ":cake: *** That tasty point from %%POINTFROM%% really brings the room together. *** :cake:",
            ":cake: *** The jury may be out on this song but %%POINTFROM%% thinks it’s pretty tasty *** :cake:",
            ":cake: *** %%POINTFROM%% salutes those who rock. *** :cake:",
            ":cake: *** This tune is more soothing than Morgan Freeman's voice. (%%POINTFROM%%) *** :cake:",
            ":cake: *** The Tasty Tasty cake is a lie. (%%POINTFROM%%) *** :cake:",
            ":cake: *** You deserve a promotion. But since %%POINTFROM%% can't do that here, have a tasty point. *** :cake:",
            ":cake: *** :pig: %%POINTFROM%% loves this tune more than bacon!  :pig: *** :cake:",
            ":cake: *** %%POINTFROM%% thinks you listen to the coolest songs. *** :cake:",
            ":cake: *** %%POINTFROM%% loves this song more than a drunk college student loves tacos. *** :cake:",
            ":cake: *** Being awesome is hard, but you make it work. (%%POINTFROM%%) *** :cake:",
            ":cake: *** %%POINTFROM%% likes your style.  *** :cake:",
            ":cake: *** You have a good taste in tunes. (%%POINTFROM%%) *** :cake:",
            ":cake: *** %%POINTFROM%% appreciates this tune more than Santa appreciates chimney grease. *** :cake:",
            ":cake: *** This tune is sweeter than than a bucket of bon-bons! (%%POINTFROM%%) *** :cake:",
            ":cake: *** %%POINTFROM%% enjoys your decision on playing this tune *** :cake:",
            ":cake: *** %%POINTFROM%% finds this song is as fun as a hot tub full of chocolate pudding. *** :cake:",
            ":cake: *** %%POINTFROM%% likes the cut of your jib. *** :cake:",
            ":cake: *** %%POINTFROM%% thinks this song is smoother than a fresh jar of skippy. *** :cake:",
            ":cake: *** %%POINTFROM%% can’t come up with something funny to say so here’s a worthless tasty point. *** :cake:",
            ":cake: *** It may be 106 miles to Chicago but here’s a tasty point (%%POINTFROM%%) *** :cake:",
            ":cake: *** Illinois Tasty Points? %%POINTFROM%% hates Illinois Tasty Points! *** :cake:",
            ":cake: *** %%POINTFROM%% says 'Hey Girl, have a Tasty Point' *** :cake:",
            ":cake: *** %%POINTFROM%% thinks you’re a tasty, tasty rockstar *** :cake:",
            ":cake: *** He likes it. Mikey likes it! (%%POINTFROM%%) *** :cake:",
            ":doughnut: *** Mmmm, doughnuts...(%%POINTFROM%%) *** :doughnut:",
            ":cake: *** Dyn-Oh-Mite! (%%POINTFROM%%) *** :cake:",
            ":cake: *** %%POINTFROM%% thinks this song is the bee’s knees *** :cake:",
            ":cake: *** Now you’re on the trolley! (%%POINTFROM%%) *** :cake:",
            ":cake: *** Thanks to Al Gore %%POINTFROM%% can give you this: :cake: *** :cake:",
            ":cake: *** Goose, take me to bed or lose me forever. (%%POINTFROM%%) *** :cake:",
            ":cake: *** If we weren’t on the internet %%POINTFROM%% would get you tin roof rusted. *** :cake:",
            ":cake: *** :dancer: %%POINTFROM%% gave you a tasty point.  @Larry the Law will now dance the robot in your honor. :dancer: *** :cake:",
            ":cake: *** Beanbags are great and so are you!! (%%POINTFROM%%) *** :cake:",
            ":cake: *** That green jacket is within reach! (%%POINTFROM%%) *** :cake:",
            ":cake: *** You're smarter than Google and Mary Poppins combined. (%%POINTFROM%%) *** :cake:",
            ":cake: *** Hanging out with you is better than a party with unlimited juice. Which, as we all know, is off the hook. (%%POINTFROM%%) *** :cake:",
            ":cake: *** Shit just got real. (%%POINTFROM%%) *** :cake:",
            ":cake: *** This play is so awesome. It's like you are the superhero of Tasty Tunes. (%%POINTFROM%%) *** :cake:",
            ":cake: *** Yeah... That's the ticket. (%%POINTFROM%%) *** :cake:",
            ":cake: *** This tune is cooler than Mr. Rogers. Which may not seem like a big deal, but that dude would put on a different pair of shoes just to chill in his own home. And that's crazy cool!! (%%POINTFROM%%) *** :cake:",
            ":cake: *** You are so rad!! (%%POINTFROM%%) *** :cake:"
            ]
};

if (!window.APIisRunning) {
  API.main.init();
} else {
  setTimeout(API.main.init, 1000);
}
