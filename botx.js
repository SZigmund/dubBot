// Written by: DocZ
//[EXCEPTION]: defineRoomUser: Object doesn't support property or method 'trim'
//[EXCEPTION]: EVENT_SONG_ADVANCE: Unable to get property 'songsPlayed' of undefined or null reference
//TODO LIST:
// - Record all Bans/Unbans
// - Permissions
// - AFK DJ
// - Bot DJ
// - Last Played

//SECTION Var: All global variables:
var botVar = {
  version: "Version  1.01.0020.0082",
  ImHidden: false,
  botName: "larry_the_law",
  botID: -1,
  botStatus: false, 
  botMuted: false,
  botRunning: false,
  currentDJ: "",
  currentSong: "",
  tastyCount: 0,
  previousSong: "",
  previousStats: "",
  songStats: {
    mehCount: 0,
    dubCount: 0,
    snagCount: 0,
    tastyCount: 0,
    currentSong: "",
    currentDj: ""
  },
  room: {
    autoskip: false,
    autoskipTimer: null,
    allcommand: true,
    usercommand: true,
    mutedUsers: [],
    voteSkipEnabled: true,
    voteSkipLimit: 4,
    etaRestriction: false,
    filterChat: true,
    currentMehCount: 0,
    botRoomUrl: "",
    roomstats: {
        accountName: null,
        totalWoots: 0,
        totalCurates: 0,
        totalMehs: 0,
        tastyCount: 0,
        launchTime: null,
        songCount: 0,
        chatmessagescnt: 0
    },
    repeatSongs: true,
    repeatSongTime: 180,
    maximumDc: 90,
    maximumDcOutOfRoom: 10,
    commandCooldown: 30
  },
  chatHistoryList: [],
  chatHistory: function (id, count) {
      this.chatId = id;
      this.chatCount = count;
  }
};

//SECTION ROOM: All room settings:
var dubBot = {
  room: {
    debug: true,
    afkList: [],
    mutedUsers: [],
    bannedUsers: [],
    skippable: true,
    usercommand: true,
    allcommand: true,
    blacklistInterval: null,
    queueing: 0,
    queueable: true,
    currentDJID: null,
    currentMediaCid: 999,
    currentMediaStart: 999,
    historyList: [],
    cycleTimer: setTimeout(function () {
    }, 1),
    queue: {
        id: [],
        position: []
    },
    newBlacklist: [],
    newBlacklistIDs: [],
    blacklistLoaded: false,
  },
  queue: {
	dubQueue: null,
	dubQueueResp: null,
	tastyQueue: null,
  },

  validateCurrentSong: function () {
    try {
      botVar.room.currentMehCount = 0;
        botVar.currentSong = API.currentSongName();
      botVar.currentDJ   = API.currentDjName();
      
      botDebug.debugMessage(true, "[ API.getSongLength() ] = ", API.getSongLength());
      if (API.getSongLength() >= SETTINGS.settings.maximumSongLength) {
        API.sendChat(botChat.subChat(botChat.getChatMessage("timelimit"), {name: botVar.currentDJ, maxlength: SETTINGS.settings.maximumSongLength}));
        dubBot.skipBadSong(botVar.currentDJ, botVar.botName, "Song too long");
      }
      //todoer check blacklist
    }
      catch(err) { UTIL.logException("validateCurrentSong: " + err.message); }
  },

  skipBadSong: function (userName, skippedBy, reason) {
    try {
      API.chatLog("Skip: [" + botVar.currentSong + "] dj id: " + userName + ": skiped by: " + skippedBy + " Reason: " + reason);
      var tooMany = false;
      //tooMany = dubBot.tooManyBadSongs(userName);
      //if (tooMany) API.botDjNow();
      API.moderateForceSkip();
      //if (tooMany) setTimeout(function () { API.removeDJ(userName); }, 1 * 1000);
      //if (tooMany) setTimeout(function () { UTIL.setBadSongCount(userName, 0); }, 1 * 1500);
    }
      catch(err) { UTIL.logException("skipBadSong: " + err.message); }
  }

};

String.prototype.splitBetween = function (a, b) {
    var self = this;
    self = this.split(a);
    for (var i = 0; i < self.length; i++) {
        self[i] = self[i].split(b);
    }
    var arr = [];
    for (var i = 0; i < self.length; i++) {
        if (Array.isArray(self[i])) {
            for (var j = 0; j < self[i].length; j++) {
                arr.push(self[i][j]);
            }
        }
        else arr.push(self[i]);
    }
    return arr;
};

//SECTION USERS: All User data
var USERS = {
  usersImport: [],
  users: [],
  loadUserInterval: null,
  getLastActivity: function (usrObjectID) {
      try {
        if (typeof usrObjectID === "object") return usrObjectID;
        var roomUser = USERS.lookupUserName(usrObjectID);
        if (roomUser === false) roomUser = USERS.lookupUserID(usrObjectID);
        roomuser.lastActivity;
	  }
      catch(err) { UTIL.logException("getLastActivity: " + err.message); }
  },
  //removes one MIA User that has no UserID and is not in the room.
  removeMIANonUsers: function () {
    try {
      var i = 0;
      while (i < USERS.users.length) {
        if ((USERS.users[i].id === "new") && (USERS.users[i].inRoom === false)) {
                USERS.users.splice(i, 1);
        }
        else {
          i++;
        }
      }
    }
    catch(err) { UTIL.logException("removeMIANonUsers: " + err.message); }
  },
  updateUserID: function (uid, username) {
    try {
        var user = USERS.lookupUserID(uid);
        if (user !== false) {
          user.username = username;
          return;
        }
        user = USERS.lookupUserName(username);
        if (user !== false) {
          user.id = uid;
          return;
        }
    }
    catch(err) { UTIL.logException("updateUserID: " + err.message); }
  },
  setLastActivityID: function (userId, dispMsg) {
    var user = USERS.lookupUserID(userId);
    if (user === false) return;
    USERS.setLastActivity(user, dispMsg);
  },
//todoer afk activity TEST:
  setLastActivity: function (user, dispMsg) {
    user.lastActivity = Date.now();
    if ((user.afkWarningCount > 0) && (dispMsg === true)) API.sendChat(botChat.subChat(botChat.getChatMessage("afkUserReset"), {name: user.username}));
    user.afkWarningCount = 0;
    //clearTimeout(user.afkCountdown);
  },

  // This will return a room user from: Object, Username, UserID
  defineRoomUser: function (usrObjectID) {
      try {
        if (typeof usrObjectID === "object") return usrObjectID;
        var roomUser = USERS.lookupUserName(usrObjectID);
        if (roomUser === false) roomUser = USERS.lookupUserID(usrObjectID);
        return roomUser;
      }
      catch(err) {
        UTIL.logException("defineRoomUser: " + err.message); 
        return false;
      }
  },

  lookupUserName: function (username) {
    try {
      //botDebug.debugMessage(true, "username: [" + username + "]");
	  var usermatch = username.trim().toLowerCase();
	  usermatch = usermatch.replace(/@/g, '');
      for (var i = 0; i < USERS.users.length; i++) {
        if (USERS.users[i].username.trim().toLowerCase() == usermatch) return USERS.users[i];
      }
      return false;
	}
    catch(err) {
		UTIL.logException("lookupUserName: " + err.message); 
		return false;
	  }
  },
  lookupUserID: function (id) {   //getroomuser
  //todoer TEST: 
        for (var i = 0; i < USERS.users.length; i++) {
            if (USERS.users[i].id === id) {
                return USERS.users[i];
            }
        }
        return false;
    },
    importUserList: function() { // userlistimport << command
        try {
            USERS.usersImport = [];
            $.get(CONST.userlistLink, function (json) {
                if (json !== null && typeof json !== "undefined") {
                    UTIL.logObject(json, "USR");
                    for (var idx in json) {
                        var newUser = json[idx];
                        //USERS.usersImport.push(new USERS.User(user.id, user.username, "UNDEFINED"));
                        USERS.usersImport.push(newUser);
                    }
                }
            });
            botDebug.debugMessage(true, "LIST COUNT: " + USERS.usersImport.length);
        }
        catch(err) { UTIL.logException("importBlackList: " + err.message); }
    },
    User: function (userID, username, userRole) {
        this.id = userID;
        this.username = username;
        this.jointime = Date.now();
        this.firstActivity = Date.now();
        this.lastActivity = Date.now();
        this.isMehing = false;
        this.userRole = userRole;
        this.votes = {
            songsPlayed: 0,
            tastyRcv: 0,
            tastyGiv: 0,
            woot: 0,
            meh: 0,
            curate: 0
        };
        this.tastyVote = false;
        this.rolled = false;
        this.lastEta = null;
        this.bootable = false;
        this.beerRun = false;
        this.inMeeting = false;
        this.atLunch = false;
        this.afkWarningCount = 0;
        this.badSongCount = 0;
        this.afkCountdown = null;
        this.inRoom = false;
        this.inRoomUpdated = false;
        this.dubDown = false;
        this.isMuted = false;
        this.rollStats = {
            lifeWoot: 0,
            lifeTotal: 0,
            dayWoot: 0,
            dayTotal: 0,
            DOY: -1
        };
        this.lastDC = {
            time: null,
            leftroom: null,
            resetReason: "",
            position: -1,
            songCount: 0
        };
        this.lastKnownPosition = -1;
        this.lastSeenInLine = null;
    },

    welcomeUser: function (roomUser, newUser) {
      try {
        var welcomeMessage = "";
        newUser ? welcomeMessage = botChat.subChat(botChat.getChatMessage("welcome"), {name: roomUser.username})
                : welcomeMessage = botChat.subChat(botChat.getChatMessage("welcomeback"), {name: roomUser.username});
        //if ((!staffMember) && (!welcomeback)) welcomeMessage += newUserWhoisInfo;
        roomUser.lastActivity = Date.now();
        roomUser.jointime = Date.now();
        if (roomUser.username === botVar.botName) return;
        setTimeout(function () { API.sendChat(welcomeMessage); }, 1 * 1000);
        
      }
      catch(err) { UTIL.logException("welcomeUser: " + err.message); }
    },
    defineUserRole: function (userElement, username) {
      try {
        // SAMPLE: "user-levis_homer dj manager currentDJ"
        botDebug.debugMessage(false, userElement);
        userElement = userElement.replace("user-", "");
        userElement = userElement.replace(username, "");
        userElement = userElement.replace("currentDJ", "");
        userElement = userElement.replace("downdub", "");
        userElement = userElement.trim();
        userElement = userElement.toLowerCase();
        var space = userElement.indexOf(' ');
        var dispRole;
        if (space === -1) dispRole = userElement;
        if (space !== -1) dispRole = userElement.substring(0, space);
        botDebug.debugMessage(false, "DISP ROLE: " + dispRole);
        switch (dispRole) {
            case "creator":     return "creator";
            case "co-owner":    return "co-owner";
            case "manager":     return "manager";
            case "mod":         return "mod";
            case "vip":         return "vip";
            case "resident-dj": return "resident-dj";
            case "dj":          return "dj";
        }
        // SAMPLE: "user-levis_homer dj manager"
        // SAMPLE: "dj manager"
        if (userElement.substring(userElement.length - 8,  userElement.length) === " creator")           return "creator"
        if (userElement.substring(userElement.length - 17, userElement.length) === " creator co-owner")  return "creator co-owner"
        if (userElement.substring(userElement.length - 9,  userElement.length) === " co-owner")          return "co-owner"
        if (userElement.substring(userElement.length - 8,  userElement.length) === " manager")           return "manager"
        if (userElement.substring(userElement.length - 4,  userElement.length) === " mod")               return "mod"
        if (userElement.substring(userElement.length - 4,  userElement.length) === " vip")               return "vip"
        if (userElement.substring(userElement.length - 12, userElement.length) === " resident-dj")       return "resident-dj"
        if (userElement.substring(userElement.length - 3,  userElement.length) === " dj")                return "dj"
        return "";
      }
      catch(err) { UTIL.logException("defineUserRole: " + err.message); }
    },
    // Resets all users data on song advance:
    resetUserSongStats: function () {
      try {
        for (var i = 0; i < USERS.users.length; i++) {
          USERS.users[i].dubDown = false;
          USERS.users[i].rolled = false;
          USERS.users[i].tastyVote = false;
        }
      }
      catch(err) { UTIL.logException("resetUserSongStats: " + err.message); }
    },
    resetInRoomUpdated: function () {
      try {
        for (var i = 0; i < USERS.users.length; i++) { USERS.users[i].inRoomUpdated = false; }
      }
      catch(err) { UTIL.logException("resetInRoomUpdated: " + err.message); }
    },
    removeMissingUsersFromRoom: function () {
      try {
        for (var i = 0; i < USERS.users.length; i++) {
          if ((USERS.users[i].inRoom === true) && (USERS.users[i].inRoomUpdated === false)) {
            USERS.users[i].inRoom = false;
            API.logInfo(USERS.users[i].username + " left the room");
          }
        }
      }
      catch(err) { UTIL.logException("removeMissingUsersFromRoom: " + err.message); }
    },
    resetAllUsersOnStartup: function () {
      try {
        for (var i = 0; i < USERS.users.length; i++) {
          USERS.users[i].inRoom = false;
          USERS.users[i].inRoomUpdated = false;
          USERS.users[i].dubDown = false;
        }
      }
      catch(err) { UTIL.logException("resetAllUsersOnStartup: " + err.message); }
    },

    //<img src="https://api.dubtrack.fm/user/542465ce43f5a10200c07f11/image" alt="doc_z" onclick="Dubtrack.app.navigate('/doc_z', {trigger: true});" class="cursor-pointer" onerror="Dubtrack.helpers.image.imageError(this);">
    // DOC_Z: <li class="user-542465ce43f5a10200c07f11 current-chat-user isCo-owner" id="542465ce43f5a10200c07f11-1447537103945">
    // bcav:  <li class="user-562ba5be67a3641400ebabfb isMod" id="562ba5be67a3641400ebabfb-1447628453068">
    // MKay:  <li class="user-56009988bfb6340300a2dc6a isManager" id="56009988bfb6340300a2dc6a-1447628469537">
    // 

//       Sample object:
//    <div class="tabsContainer">
//        <div class="tabItem ps-container" id="main-user-list-room">
//            <ul class="avatar-list" id="avatar-list">
//                <li rel="17412" class="co-owner user-doc_z updub"><p class="username">doc_z</p><p class="dubs"><span>17431</span> dubs</p></li>
//                <li rel="17151" class="co-owner user-barstoolsaints updub"><p class="username">barstoolsaints</p><p class="dubs"><span>17158</span> dubs</p></li>
//                <li rel="16885" class="manager user-deeznutzzzz"><p class="username">deeznutzzzz</p><p class="dubs"><span>16885 </span> dubs</p></li>
//                <li rel="8155" class="mod user-bcav currentDJ"><p class="username">bcav</p><p class="dubs"><span>8167</span> dubs</p></li>
//                <li rel="7069" class="mod user-larry_the_law updub"><p class="username">larry_the_law</p><p class="dubs"><span>7076</span> dubs</p></li>
//                <li rel="4669" class="creator co-owner user-balloon_knot updub"><p class="username">balloon_knot</p><p class="dubs"><span>4676</span> dubs</p></li>
//            </ul>
//        </div>
//    </div>
//USERS.loadUsersInRoom(true);
  loadUsersInRoom: function (welcomeMsg) {  //ererererer
    try {
      //Username path:
      //document.getElementsByClassName("tabsContainer")[0].getElementsByTagName("li")[0].getElementsByClassName("username")[0].innerHTML;
      USERS.resetInRoomUpdated();
      var tabsContainer = document.getElementsByClassName("tabsContainer");
      var usernameList = tabsContainer[0].getElementsByTagName("li");
      botDebug.debugMessage(false, "usernameList count: " + usernameList.length);
      
      for (var i = 0; i < usernameList.length; i++) {
        var newUser = false;
        var username = usernameList[i].getElementsByClassName("username")[0].innerHTML;
        botDebug.debugMessage(false, "USER: " + username);
        var userInfo = usernameList[i].className;
        userRole = USERS.defineUserRole(userInfo, username);
        var userMehing = false;
        if (userInfo.indexOf("downdub") >= 0) userMehing = true;
        var roomUser = USERS.lookupUserName(username);
        if (roomUser === false) {
          var roomUser = new USERS.User("new", username, userRole);
          USERS.users.push(roomUser);
          newUser = true;
        }
        //USERS.users[i].username 
        //
        // clearInterval(USERS.loadUserInterval);
        if ((roomUser.inRoom === false) && (welcomeMsg === true) && (botVar.ImHidden === false)) USERS.welcomeUser(roomUser, newUser);
        roomUser.inRoom = true;
        botDebug.debugMessage(false, "USERS IN THE ROOM: " + roomUser.username);
        roomUser.userRole = userRole;
        if (userMehing && !roomUser.isMehing && (roomUser.username !== botVar.botName) && (botVar.ImHidden === false)) {
          API.sendChat(botChat.subChat(botChat.getChatMessage("whyyoumeh"), {name: roomUser.username, song: botVar.currentSong}));
        }
        roomUser.isMehing = userMehing;
        roomUser.inRoomUpdated = true;
      }
      USERS.removeMissingUsersFromRoom();
      botDebug.debugMessage(false, "USERS.users Count: " + USERS.users.length);
    }
    catch(err) { UTIL.logException("loadUsersInRoom: " + err.message); }
  }
};

//SECTION SETTINGS: All bot commands:
var SETTINGS = {
    settings: {
        autoWootBot: false,
        autoHopUp: true,
        autoHopUpCount: 1,
        autoHopDownCount: 4,
        botRoomUrl: "",
        hoppingDownNow: false,
        language: "english",
        chatLink: "https://rawgit.com/SZigmund/dubBot/master/lang/en.json",
        bouncerPlus: true,
        blacklistEnabled: true,
        gifEnabled: true,
        lockdownEnabled: false,
        maximumLocktime: 10,
        cycleGuard: true,
        maximumCycletime: 10,
        voteSkipEnabled: true,
        voteSkipLimit: 4,
        welcomeForeignerMsg: false,
        timeGuard: true,
        maximumSongLength: 8,
        skipSound5Days: false,
        skipSound7Days: false,
        skipSoundStart: 7,
        skipSoundEnd: 15,
        skipSoundRange: "Monday-Friday between 7AM and 3PM EST",
        autodisable: false,
        commandCooldown: 30,
        usercommandsEnabled: true,
        lockskipPosition: 3,
        lockskipReasons: [
            ["theme", "This song does not fit the room theme. "],
            ["op", "This song is on the OP list. "],
            ["history", "This song is in the history. "],
            ["mix", "You played a mix, which is against the rules. "],
            ["sound", "The song you played had bad sound quality or no sound. "],
            ["nsfw", "The song you contained was NSFW (image or sound). "],
            ["unavailable", "The song you played was not available for some users. "]
        ],
        motdEnabled: false,
        motdInterval: 5,
        motd: "Temporary Message of the Day",
        etaRestriction: false,
        welcome: true,
        opLink: null,
        rulesLink: "http://tinyurl.com/TastyTunesRules",
        themeLink: null,
        fbLink: "https://www.facebook.com/groups/226222424234128/",
        youtubeLink: null,
        website: null,
        intervalMessages: [],
        messageInterval: 5,
        songstats: true,
        suppressSongStats: false,
        commandLiteral: "."
    },

    retrieveSettings: function () {
      try {
        var settings = JSON.parse(localStorage.getItem("dubBotSettings"));
        if (settings !== null) {
            for (var prop in settings) {
                SETTINGS.settings[prop] = settings[prop];
            }
        }
      }
      catch(err) { UTIL.logException("retrieveSettings: " + err.message); }
    },

    retrieveFromStorage: function () {
        try {
        var info = localStorage.getItem("dubBotStorageInfo");
        if (info === null) API.chatLog(botChat.getChatMessage("nodatafound"));
        else {
            var settings = JSON.parse(localStorage.getItem("dubBotSettings"));
            var room = JSON.parse(localStorage.getItem("dubBotRoom"));
            USERS.users = JSON.parse(localStorage.getItem("dubBotUsers"));
            botDebug.debugMessage(true, "users.length: " + USERS.users.length);
            if (localStorage.getItem("BLACKLIST") !== null) {
              var myBLList = localStorage["BLACKLIST"];
              var myBLIDs = localStorage["BLACKLISTIDS"];
              API.logInfo(JSON.parse(localStorage["BLACKLIST"]));
              API.logInfo(JSON.parse(localStorage["BLACKLISTIDS"]));
              API.logInfo("LEN (" + myBLList.length + ") " + myBLList);
              API.logInfo("LEN (" + myBLIDs.length + ") " + myBLIDs);

              dubBot.room.newBlacklist = JSON.parse(localStorage["BLACKLIST"]);
              dubBot.room.newBlacklistIDs = JSON.parse(localStorage["BLACKLISTIDS"]);
              
              botDebug.debugMessage(true, "BL LOAD:   BL Count: " + dubBot.room.newBlacklist.length);
              botDebug.debugMessage(true, "BL LOAD: BLID Count: " + dubBot.room.newBlacklistIDs.length);
            }
            dubBot.room.blacklistLoaded = true;
            botDebug.debugMessage(true, "BL LOADED: TRUE");
            var elapsed = Date.now() - JSON.parse(info).time;
            dubBot.room.historyList = room.historyList;
            if ((elapsed < 1 * 60 * 60 * 1000)) {
                API.logInfo(botChat.getChatMessage("retrievingdata"));
                for (var prop in settings) {
                    SETTINGS.settings[prop] = settings[prop];
                }
                dubBot.room.afkList = room.afkList;
                dubBot.room.mutedUsers = room.mutedUsers;
                dubBot.room.autoskip = room.autoskip;
                dubBot.room.roomstats = room.roomstats;
                dubBot.room.queue = room.queue;
                //dubBot.room.newBlacklist = room.newBlacklist;
                API.logInfo(botChat.getChatMessage("datarestored"));
            }
        }
        }
        catch(err) { UTIL.logException("retrieveFromStorage: " + err.message); }

    },
    storeToStorage: function () {
        try {
        botDebug.debugMessage(true, "START: storeToStorage");
        localStorage.setItem("dubBotSettings", JSON.stringify(SETTINGS.settings));
        localStorage.setItem("dubBotRoom", JSON.stringify(dubBot.room));
        localStorage.setItem("dubBotUsers", JSON.stringify(USERS.users));

        botDebug.debugMessage(true, "STORED DATA: " + JSON.stringify(dubBot.room));
        botDebug.debugMessage(true, "STORED USERS: " + JSON.stringify(USERS.users));
        var dubBotStorageInfo = {
            time: Date.now(),
            stored: true,
            version: botVar.version
        };
        botDebug.debugMessage(true, "DONE: storeToStorage - UserCnt: " + USERS.users.length + " TIME: " + dubBotStorageInfo.time);
        localStorage.setItem("dubBotStorageInfo", JSON.stringify(dubBotStorageInfo));
        }
        catch(err) {
           UTIL.logException("storeToStorage: " + err.message);
        }
    }
    
};

//SECTION COMMANDS: All bot commands:
var COMMANDS = {
    botChatcommand: function (command) {
        // This is triggered when a chat starting with a '/' character is entered
            try {
                if (command === "/bot") {
                    botVar.botRunning = (!botVar.botRunning);
                    API.chatLog("Running Bot: " + botVar.botRunning);
                    return;
                }
                //if (command === "/whois") return;  // Handled by Origem
                //if (command === "/grab") return;   // Prevent infinite loop as /grab is handled by Origem.
                //if (command === "/reload") return;   // Handled by Origem
                botChat.commandChat.cid = "";
                botChat.commandChat.message = CONST.commandLiteral + command.substring(1, command.length);
                botChat.commandChat.sub = -1;
                botChat.commandChat.un = botVar.botName;
                botChat.commandChat.uid = botVar.botID;
                botChat.commandChat.type = "message";
                botChat.commandChat.timestamp = Date.now();
                botChat.commandChat.sound = "mention";
                COMMANDS.commandCheck(botChat.commandChat);
            }
            catch(err) { UTIL.logException("botChatcommand: " + err.message); }
    },
    checkCommands: function (chat) {
        try {
            //if (!botVar.botRunning) return;
            botDebug.debugMessage(false, "STEP 001");
            chat.message = UTIL.linkFixer(chat.message);
            botDebug.debugMessage(false, "STEP 002");
            chat.message = chat.message.trim();
            USERS.setLastActivityID(chat.uid, true);
            botDebug.debugMessage(false, "STEP 003");
            if (botChat.chatFilter(chat)) return void (0);
            botDebug.debugMessage(false, "STEP 004");
            if (COMMANDS.commandCheck(chat)) return;
            botDebug.debugMessage(false, "STEP 005");
            botChat.action(chat);  //user
            botDebug.debugMessage(false, "STEP 006");
        }
        catch(err) { UTIL.logException("checkCommands: " + err.message); }
    },
    
    commandCheck: function (chat) {
    //chat.uid chat.message chat.cid chat.un
        try {
            var cmd;
        botDebug.debugMessage(false, "STEP 201");
            if (chat.message.substring(0,1) != CONST.commandLiteral) return false;
            
            var space = chat.message.indexOf(' ');
            if (space === -1) {
                cmd = chat.message.toLowerCase();
            }
            else cmd = chat.message.substring(0, space).toLowerCase();

            botDebug.debugMessage(false, "STEP 202");
            var userPerm = API.getPermission(chat.uid);
            if (chat.message.toLowerCase() !== ".join" && chat.message.toLowerCase() !== ".leave" && (!TASTY.bopCommand(cmd))) {
                if (userPerm === 0 && !botVar.room.usercommand) return void (0);
                if (!botVar.room.allcommand) return void (0);
            }
        botDebug.debugMessage(false, "STEP 203");
            
            //if (chat.message.toLowerCase() === '.eta' && botVar.room.etaRestriction) {
            //    if (userPerm < 2) {
            //        var u = USERS.lookupUserID(chat.uid);
            //        if (u.lastEta !== null && (Date.now() - u.lastEta) < 1 * 60 * 60 * 1000) {
            //            if (chat.cid.length > 0) API.moderateDeleteChat(chat.cid);
            //            return void (0);
            //        }
            //        else u.lastEta = Date.now();
            //    }
            //}

            var executed = false;
        botDebug.debugMessage(false, "STEP 204");

            for (var comm in BOTCOMMANDS.commands) {
                var cmdCall = BOTCOMMANDS.commands[comm].command;
                if (!Array.isArray(cmdCall)) {
                    cmdCall = [cmdCall]
                }
                for (var i = 0; i < cmdCall.length; i++) {
                    if (CONST.commandLiteral + cmdCall[i] === cmd) {
                        BOTCOMMANDS.commands[comm].functionality(chat, CONST.commandLiteral + cmdCall[i]);
                        executed = true;
                        break;
                    }
                }
            }

        botDebug.debugMessage(false, "STEP 205");
            if (executed && userPerm === 0) {
                botVar.room.usercommand = false;
                setTimeout(function () { botVar.room.usercommand = true; }, botVar.room.commandCooldown * 1000);
            }
        botDebug.debugMessage(false, "STEP 206");
            if (executed) {
                if (chat.cid.length > 0) API.moderateDeleteChat(chat.cid);
                botVar.room.allcommand = false;
                setTimeout(function () { botVar.room.allcommand = true; }, 5 * 1000);
            }
        botDebug.debugMessage(false, "STEP 207");
            return executed;
        }
        catch(err) { UTIL.logException("commandCheck: " + err.message); }
    }
};
//SECTION Chat: All bot chat functionality:
var botChat = {
  lastMessageCount: 0,
  commandChat: {
        cid: "",
        message: "",
        sub: -1,
        un: "",
        uid: -1,
        type: "message",
        timestamp: null,
        sound: "mention"
  },
  action: function (chat) {
        botDebug.debugMessage(false, "STEP 101");
        if (chat.type === 'message' || chat.type === 'emote')  {
            botDebug.debugMessage(false, "STEP 102");
            USERS.setLastActivityID(chat.uid, false);
            botDebug.debugMessage(false, "STEP 103");
        }
        else if (chat.type !== 'log')  {
          botDebug.debugMessage(true, "CHAT.TYPE: " + chat.type);
        }
        botDebug.debugMessage(false, "STEP 104");
        AI.larryAI(chat.message, chat.un);
        botDebug.debugMessage(false, "STEP 105");
        botVar.room.roomstats.chatmessagescnt++;
        botDebug.debugMessage(false, "STEP 106");
  },
  chatcleaner: function (chat) {
    if (!botVar.room.filterChat) return false;
    if (API.getPermission(chat.uid) > 1) return false;
    var msg = chat.message;
    var containsLetters = false;
    for (var i = 0; i < msg.length; i++) {
        ch = msg.charAt(i);
        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === ':' || ch === '^') containsLetters = true;
    }
    if (msg === '') {
        return true;
    }
    if (!containsLetters && (msg.length === 1 || msg.length > 3)) return true;
    msg = msg.replace(/[ ,;.:\/=~+%^*\-\\"'&@#]/g, '');
    var capitals = 0;
    var ch;
    for (var i = 0; i < msg.length; i++) {
        ch = msg.charAt(i);
        if (ch >= 'A' && ch <= 'Z') capitals++;
    }
    if (capitals >= 40) {
        API.sendChat(botChat.subChat(botChat.getChatMessage("caps"), {name: chat.un}));
        return true;
    }
    msg = msg.toLowerCase();
    if (msg === 'skip') {
        API.sendChat(botChat.subChat(botChat.getChatMessage("askskip"), {name: chat.un}));
        return true;
    }
    for (var j = 0; j < botChat.spam.length; j++) {
        if (msg === botChat.spam[j]) {
            API.sendChat(botChat.subChat(botChat.spam, {name: chat.un}));
            return true;
        }
    }
    return false;
  },
  spam: [
        'hueh', 'hu3', 'brbr', 'heu', 'brbr', 'kkkk', 'spoder', 'mafia', 'zuera', 'zueira',
        'zueria', 'aehoo', 'aheu', 'alguem', 'algum', 'brazil', 'zoeira', 'fuckadmins', 'affff', 'vaisefoder', 'huenaarea',
        'hitler', 'ashua', 'ahsu', 'ashau', 'lulz', 'huehue', 'hue', 'huehuehue', 'merda', 'pqp', 'puta', 'mulher', 'pula', 'retarda', 'caralho', 'filha', 'ppk',
        'gringo', 'fuder', 'foder', 'hua', 'ahue', 'modafuka', 'modafoka', 'mudafuka', 'mudafoka', 'ooooooooooooooo', 'foda'],
  curses: ['nigger', 'faggot', 'nigga', 'niqqa', 'motherfucker', 'modafocka'],
  //chatMessages: null,

  loadChat: function () {
   botChat.chatMessages.push(["nodatafound", "No previous data found."]);
   botChat.chatMessages.push(["retrievingdata", "Retrieving previously stored data."]);
   botChat.chatMessages.push(["datarestored", "Previously stored data successfully retrieved."]);
   botChat.chatMessages.push(["greyuser", "Only bouncers and up can run a bot."]);
   botChat.chatMessages.push(["bouncer", "The bot can't move people when it's run as a bouncer."]);
   botChat.chatMessages.push(["online", " %%BOTNAME%% %%VERSION%% online!"]);

   botChat.chatMessages.push(["validgiftags", " [@%%NAME%%] http://media.giphy.com/media/%%ID%%/giphy.gif [Tags: %%TAGS%%]"]);
   botChat.chatMessages.push(["invalidgiftags", " [@%%NAME%%] Invalid tags, try something different. [Tags: %%TAGS%%]"]);
   botChat.chatMessages.push(["validgifrandom", " [@%%NAME%%] http://media.giphy.com/media/%%ID%%/giphy.gif [Random GIF]"]);
   botChat.chatMessages.push(["invalidgifrandom", " [@%%NAME%%] Invalid request, try again."]);
   botChat.chatMessages.push(["logout", " [@%%NAME%%] Logging out %%BOTNAME%%"]);

   botChat.chatMessages.push(["welcome", "Welcome to Tasty Tunes @%%NAME%%.  Check out our room rules here: http://tinyurl.com/TastyTunesRules"]);
   botChat.chatMessages.push(["welcomeback", "Welcome back, @%%NAME%%"]);
   botChat.chatMessages.push(["songknown", " :repeat: This song has been played %%PLAYS%% time(s) in the last %%TIMETOTAL%%, last play was %%LASTTIME%% ago. :repeat:"]);
   botChat.chatMessages.push(["songknown2", " :repeat: @%%NAME%% - This song was just played %%LASTTIME%% ago. :repeat:"]);
   botChat.chatMessages.push(["timelimit", " @%%NAME%% your song is longer than %%MAXLENGTH%% minutes, you need permission to play longer songs."]);
   botChat.chatMessages.push(["permissionownsong", " :up: @%%NAME%% has permission to play their own production!"]);
   botChat.chatMessages.push(["isblacklisted", " @%%NAME%% [%%SONG%%]] is banned in this room! Skipping song...Please read the rules before you play your next play."]);
   botChat.chatMessages.push(["whois", " [%%NAME1%%] Username: %%NAME2%%, ID: %%ID%%, Rank: %%RANK%%, Joined: %%JOINED%%, Level: %%LEVEL%%, Language: %%LANGUAGE%%, Avatar: %%AVATAR%%%%PROFILE%%"]);

   botChat.chatMessages.push(["notghosting", "[%%NAME1%%] %%NAME2%% is not ghosting."]);
   botChat.chatMessages.push(["ghosting", "[%%NAME1%%] %%NAME2%% is either ghosting or not here."]);

   botChat.chatMessages.push(["isopen", " @djs - The roulette is now open! Type .join to participate!"]);
   botChat.chatMessages.push(["winnerpicked", " A winner has been picked! @%%NAME%% to position %%POSITION%%."]);


   botChat.chatMessages.push(["alreadyadding", " User is already being added! Changed the desired position to %%POSITION%%."]);
   botChat.chatMessages.push(["adding", " Added @%%NAME%% to the queue. Current queue: %%POSITION%%."]);


   botChat.chatMessages.push(["usernotfound", " User not found."]);
   botChat.chatMessages.push(["notdisconnected", " @%%NAME%% did not disconnect during my time here."]);
   botChat.chatMessages.push(["noposition", " No last position known. The waitlist needs to update at least once to register a user's last position."]);
   botChat.chatMessages.push(["toolongago", " @%%NAME%%'s last disconnect (DC or leave) was too long ago: %%TIME%%."]);
   botChat.chatMessages.push(["valid", " @%%NAME%% disconnected %%TIME%% ago and should be at position %%POSITION%%."]);
   botChat.chatMessages.push(["meetingreturn", " @%%NAME%% how was your meeting?  You left %%TIME%% ago and should be at position %%POSITION%%."]);
   botChat.chatMessages.push(["lunchreturn", " @%%NAME%% how was lunch?  You left %%TIME%% ago and should be at position %%POSITION%%."]);
   botChat.chatMessages.push(["beerrunreturn", " @%%NAME%% What kind of :beer: did you buy?  You left %%TIME%% ago and should be at position %%POSITION%%."]);
   botChat.chatMessages.push(["meetingleave", " @%%NAME%% enjoy your meeting. :sleeping: (Position: %%POS%%)"]);
   botChat.chatMessages.push(["lunchleave", " @%%NAME%% enjoy your lunch. :pizza: Hurry back. (Position: %%POS%%)"]);
   botChat.chatMessages.push(["beerrunleave", " @%%NAME%% Going to get some :beer:. (Position: %%POS%%)"]);


   botChat.chatMessages.push(["warning1", " @%%NAME%% you have been afk for %%TIME%%, please respond within 2 minutes or you will be removed."]);
   botChat.chatMessages.push(["warning2", " @%%NAME%% you will be removed due to AFK soon if you don't respond."]);
   botChat.chatMessages.push(["afkremove", " @%%NAME%% you have been removed for being afk for %%TIME%%. You were at position %%POSITION%%. Chat at least once every %%MAXIMUMAFK%% minutes if you want to play a song."]);
   botChat.chatMessages.push(["afkUserReset", "Thanks @%%NAME%% your afk status has been reset. "]);


   botChat.chatMessages.push(["caps", "@%%NAME%% unglue your capslock button please."]);
   botChat.chatMessages.push(["askskip", "@%%NAME%% don't ask for skips."]);
   botChat.chatMessages.push(["spam", "@%%NAME%% please don't spam."]);
   botChat.chatMessages.push(["roomadvertising", "@%%NAME%% don't post links to other rooms please."]);
   botChat.chatMessages.push(["adfly", "@%%NAME%% please change your autowoot program. We suggest PlugCubed: http://plugcubed.net/"]);


   botChat.chatMessages.push(["invalidtime", "[@%%NAME%%] Invalid time specified."]);
   botChat.chatMessages.push(["nouserspecified", "[@%%NAME%%] No user specified."]);
   botChat.chatMessages.push(["invaliduserspecified", "[@%%NAME%%] Invalid user specified."]);
   botChat.chatMessages.push(["nolistspecified", "[@%%NAME%%] No list specified."]);
   botChat.chatMessages.push(["invalidlistspecified", "[@%%NAME%%] Invalid list specified."]);
   botChat.chatMessages.push(["novaliduserspecified", "[@%%NAME%%] No valid user specified."]);
   botChat.chatMessages.push(["nolimitspecified", "[@%%NAME%%] No limit specified."]);
   botChat.chatMessages.push(["invalidlimitspecified", "[@%%NAME%%] Invalid limit."]);
   botChat.chatMessages.push(["invalidpositionspecified", "[@%%NAME%%] Invalid position specified."]);
   botChat.chatMessages.push(["toggleon", "[@%%NAME%%] %%FUNCTION%% enabled."]);
   botChat.chatMessages.push(["toggleoff", "[@%%NAME%%] %%FUNCTION%% disabled."]);
   botChat.chatMessages.push(["afkremoval", "AFK removal"]);
   botChat.chatMessages.push(["afksremoved", "AFK's removed"]);
   botChat.chatMessages.push(["afklimit", "AFK limit"]);
   botChat.chatMessages.push(["repeatSongs", "Skip History"]);
   botChat.chatMessages.push(["repeatSongLimit", "Skip History limit"]);
   botChat.chatMessages.push(["autoskip", "autoskip"]);
   botChat.chatMessages.push(["newblacklisted", "[@%%NAME%%] Adding song to ban list: [ %%AUTHOR%% - %%TITLE%% - %%MID%% ]"]);
   botChat.chatMessages.push(["blinfo", "[@%%NAME%%] Song info - author: %%AUTHOR%%, title: %%TITLE%%, mid: %%SONGID%%"]);
   botChat.chatMessages.push(["blacklist", "blacklist"]);
   botChat.chatMessages.push(["cycleguard", "cycleguard"]);
   botChat.chatMessages.push(["timeguard", "timeguard"]);
   botChat.chatMessages.push(["chatfilter", "chatfilter"]);
   botChat.chatMessages.push(["lockdown", "lockdown"]);
   botChat.chatMessages.push(["lockguard", "lockguard"]);
   botChat.chatMessages.push(["usercommands", "usercommands"]);
   botChat.chatMessages.push(["motd", "MotD"]);
   botChat.chatMessages.push(["welcomemsg", "welcome message"]);
   botChat.chatMessages.push(["songstats", "song statistics"]);
   botChat.chatMessages.push(["etarestriction", "eta restriction"]);
   botChat.chatMessages.push(["voteskip", "voteskip"]);
   botChat.chatMessages.push(["whyyoumeh", "[@%%NAME%%] mehed this song [%%SONG%%]"]);
   botChat.chatMessages.push(["voteskiplimit", "[@%%NAME%%] Voteskip limit is currently set to %%LIMIT%% mehs."]);
   botChat.chatMessages.push(["voteskipexceededlimit", "@%%NAME%% your song has exceeded the voteskip limit (%%LIMIT%% mehs)."]);
   botChat.chatMessages.push(["voteskipinvalidlimit", "[@%%NAME%%] Invalid voteskip limit, please try again using a number to signify the number of mehs."]);
   botChat.chatMessages.push(["voteskipsetlimit", "[@%%NAME%%] Voteskip limit set to %%LIMIT%%."]);
   botChat.chatMessages.push(["activeusersintime", "[@%%NAME%% There have been %%AMOUNT%% users chatting in the past %%TIME%% minutes."]);
   botChat.chatMessages.push(["maximumafktimeset", "[@%%NAME%%] Maximum afk duration set to %%TIME%% minutes."]);
   botChat.chatMessages.push(["afkstatusreset", "[@%%NAME%%] Reset the afk status of @%%USERNAME%%."]);
   botChat.chatMessages.push(["inactivefor", "[@%%NAME%%] @%%USERNAME%% has been inactive for %%TIME%%."]);
   botChat.chatMessages.push(["autowoot", "We recommend DubX for autowooting. Dub X Button: https://dubx.net/"]);
   botChat.chatMessages.push(["autowootx", "Or the DubX chome extension: https://chrome.google.com/webstore/detail/dubx/oceofndagjnpebjmknefoelcpcnpcedm"]);
   botChat.chatMessages.push(["brandambassador", "A Brand Ambassador is the voice of the plug.dj users. They promote events, engage the community and share the plug.dj message around the world. For more info: https://plug.dj/ba"]);
   botChat.chatMessages.push(["origem", "To install Origem-Woot go here: http://origem-woot.com/Instalation/"]);
   botChat.chatMessages.push(["bouncerplusrank", "[@%%NAME%%] You have to be manager or up to enable Bouncer+."]);
   botChat.chatMessages.push(["chatcleared", "[@%%NAME%%] Cleared the chat."]);
   botChat.chatMessages.push(["deletechat", "[@%%NAME%%] Cleared the chat of %%USERNAME%%."]);
   botChat.chatMessages.push(["commandslink", "%%BOTNAME%% commands: %%LINK%%"]);
   botChat.chatMessages.push(["eatcookie", "/me eats a cookie."]);
   botChat.chatMessages.push(["nousercookie", "/me doesn't see %%NAME%% in room and eats a cookie himself."]);
   botChat.chatMessages.push(["selfcookie", "@%%NAME%% you're a bit greedy, aren't you? Giving cookies to yourself, bah. Share some with other people!"]);
   botChat.chatMessages.push(["cookie", "@%%NAMETO%%, @%%NAMEFROM%% %%COOKIE%%"]);
   botChat.chatMessages.push(["cycleguardtime", "[@%%NAME%%] The cycleguard is set to %%TIME%% minute(s)."]);
   botChat.chatMessages.push(["dclookuprank", "[@%%NAME%%] Only bouncers and above can do a lookup for others."]);
   botChat.chatMessages.push(["bootrank", "[@%%NAME%%] Only bouncers and above can boot other users."]);
   botChat.chatMessages.push(["bootableDisabled", "[@%%NAME%%] line removal canceled. %%USERBYNAME%%"]);
   botChat.chatMessages.push(["bootableEnabled", "By request [@%%NAME%%] will get removed from line after next song. %%USERBYNAME%%"]);
   botChat.chatMessages.push(["emojilist", "Emoji list: %%LINK%%"]);
   botChat.chatMessages.push(["notinwaitlist", "@%%NAME%% you are not on the waitlist."]);
   botChat.chatMessages.push(["doubleroll", "@%%NAME%% you already rolled. Sorry no double dipping."]);
   botChat.chatMessages.push(["rollresults", "@%%NAME%% you rolled a %%ROLL%%"]);
   botChat.chatMessages.push(["rollresultsgood", "Nice %%NAME%% you rolled a %%ROLL%%"]);
   botChat.chatMessages.push(["rollresultsbad", "Bummer %%NAME%% you rolled a %%ROLL%%"]);
   botChat.chatMessages.push(["notcurrentdj", "@%%NAME%% you are not the current dj."]);
   botChat.chatMessages.push(["eta", "@%%NAME%% you will reach the booth in approximately %%TIME%%."]);
   botChat.chatMessages.push(["facebook", "Like us on facebook: %%LINK%%"]);
   botChat.chatMessages.push(["starterhelp", "This image will get you started on plug: %%LINK%%"]);
   botChat.chatMessages.push(["roulettejoin", "@%%NAME%% joined the roulette! (.leave if you regret it.)"]);
   botChat.chatMessages.push(["jointime", "[@%%NAMEFROM%%] @%%USERNAME%% has been in the room for %%TIME%%."]);
   botChat.chatMessages.push(["kickrank", "[@%%NAME%%] you can't kick users with an equal or higher rank than you!"]);
   botChat.chatMessages.push(["kick", "[@%%NAME%%], @%%USERNAME%% you are being kicked from the community for %%TIME%% minutes."]);
   botChat.chatMessages.push(["kill", "/me Shutting down."]);
   botChat.chatMessages.push(["rouletteleave", "@%%NAME%% left the roulette!"]);
   botChat.chatMessages.push(["songlink", "[@%%NAME%%] Link to current song: %%LINK%%"]);
   botChat.chatMessages.push(["usedlockskip", "[%%NAME%% used lockskip.]"]);
   botChat.chatMessages.push(["lockskippos", "[@%%NAME%%] Lockskip will now move the dj to position %%POSITION%%."]);
   botChat.chatMessages.push(["lockguardtime", "[@%%NAME%%] The lockguard is set to %%TIME%% minute(s)."]);
   botChat.chatMessages.push(["maxlengthtime", "[@%%NAME%%] The maximum song duration is set to %%TIME%% minutes."]);
   botChat.chatMessages.push(["motdset", "MotD set to:  %%MSG%%"]);
   botChat.chatMessages.push(["motdintervalset", "MotD interval set to %%INTERVAL%%."]);
   botChat.chatMessages.push(["addbotwaitlist", "@%%NAME%% don't try to add me to the waitlist, please."]);
   botChat.chatMessages.push(["move", "[%%NAME%% used move.]"]);
   botChat.chatMessages.push(["mutednotime", "[@%%NAME%%] Muted @%%USERNAME%%."]);
   botChat.chatMessages.push(["mutedmaxtime", "[@%%NAME%%] You can only mute for maximum %%TIME%% minutes."]);
   botChat.chatMessages.push(["mutedtime", "[@%%NAME%%] Muted @%%USERNAME%% for %%TIME%% minutes."]);
   botChat.chatMessages.push(["unmuted", "[@%%NAME%%] Unmuted @%%USERNAME%%."]);
   botChat.chatMessages.push(["muterank", "[@%%NAME%%] You can't mute persons with an equal or higher rank than you."]);
   botChat.chatMessages.push(["oplist", "OP list: %%LINK%%"]);
   botChat.chatMessages.push(["pong", "Pong!"]);
   botChat.chatMessages.push(["reload", "Be right back."]);
   botChat.chatMessages.push(["removenotinwl", "[@%%NAME%%] Specified user @%%USERNAME%% is not in the waitlist."]);
   botChat.chatMessages.push(["roomrules", "This is an English speaking community for English speaking music. We play a wide variety of music. Please avoid Dubstep, EDM, Mashups, and children music. Check out all of our rules: %%LINK%%"]);
   botChat.chatMessages.push(["sessionstats", "[@%%NAME%%] Total woots: %%WOOTS%%, total mehs: %%MEHS%%, total grabs: %%GRABS%%."]);
   botChat.chatMessages.push(["skip", "[%%NAME%% used skip.]"]);
   botChat.chatMessages.push(["madeby", "This bot was made by %%NAME%%."]);
   botChat.chatMessages.push(["activefor", "I have been active for %%TIME%%."]);
   botChat.chatMessages.push(["swapinvalid", "[@%%NAME%%] Invalid user specified. (No names with spaces!)"]);
   botChat.chatMessages.push(["swapwlonly", "[@%%NAME%%] Please only swap users that are in the waitlist!"]);
   botChat.chatMessages.push(["swapping", "Swapping %%NAME1%% with %%NAME2%%."]);
   botChat.chatMessages.push(["genres", "Please find the permissible room genres here: %%LINK%%"]);
   botChat.chatMessages.push(["notbanned", "[@%%NAME%%] The user was not banned."]);
   botChat.chatMessages.push(["unmutedeveryone", "[@%%NAME%%] Unmuted everyone."]);
   botChat.chatMessages.push(["unmuteeveryonerank", "[@%%NAME%%] Only managers and up can unmute everyone at once."]);
   botChat.chatMessages.push(["notmuted", "[@%%NAME%%] that user wasn't muted."]);
   botChat.chatMessages.push(["unmuterank", "[@%%NAME%%] You can't unmute persons with an equal or higher rank than you."]);
   botChat.chatMessages.push(["commandscd", "[@%%NAME%%] The cooldown for commands by users is now set to %%TIME%% seconds."]);
   botChat.chatMessages.push(["voteratio", "[@%%NAME%%] @%%USERNAME%% ~ woots: %%WOOT%%, mehs: %%MEHS%%, ratio (w/m): %%RATIO%%."]);
   botChat.chatMessages.push(["website", "Please visit our website: %%LINK%%"]);
   botChat.chatMessages.push(["youtube", "[%%NAME%%] Subscribe to us on youtube: %%LINK%%"]);
   botChat.chatMessages.push(["songstatistics", "[ :thumbsup: %%WOOTS%% :heart: %%GRABS%% :thumbsdown: %%MEHS%%] %%USER%% [%%ARTIST%% - %%TITLE%%]"]);
   botChat.chatMessages.push(["mystats", "%%NAME%% [ :musical_note: %%SONGS%% :thumbsup: %%WOOT%% :heart: %%GRABS%% :thumbsdown: %%MEHS%% :cake: %%TASTY%%]"]);
   botChat.chatMessages.push(["mystatsXX", "%%NAME%% [ :musical_note: %%SONGS%% :thumbsup: %%WOOT%% :heart: %%GRABS%% :thumbsdown: %%MEHS%% :cake: %%TASTY%%]"]);
   botChat.chatMessages.push(["tastyvote", "[%%NAME%%  gave you a fake point for this tasty tune :cake:]"]);
   botChat.chatMessages.push(["songstatisticstasty", "[ :thumbsup: %%WOOTS%% :heart: %%GRABS%% :thumbsdown: %%MEHS%% :cake: %%TASTY%%] %%USER%% [%%SONG%%]"]);
   //botChat.chatMessages.push(["songstatisticstasty", "[ :thumbsup: %%WOOTS%% :heart: %%GRABS%% :thumbsdown: %%MEHS%% :cake: %%TASTY%%] %%USER%% [%%ARTIST%% - %%TITLE%%]"]);
   botChat.chatMessages.push(["eightballquestion", "%%NAME%% Question: [%%QUESTION%%]"]);
   botChat.chatMessages.push(["eightballresponse1", "%%RESPONSE%%"]);
   //botChat.chatMessages.push(["eightballresponse1", "The all knowing Larry says: %%RESPONSE%%"]);
   botChat.chatMessages.push(["eightballresponse2", "%%NAME%% The all knowing Larry says: %%RESPONSE%%"]);
   botChat.chatMessages.push(["lastplayed0", ":notes: This is the 1st time this song has been played! :notes:"]);
   botChat.chatMessages.push(["lastplayed1", ":notes: This song has only been played one other time. [first time: %%LASTPLAYED%% ago] :notes:"]);
   botChat.chatMessages.push(["lastplayed2", ":notes: This song has been played %%PLAYCOUNT%% other times. [first time: %%FIRSTPLAYED%% ago] [last time: %%LASTPLAYED%% ago] :notes:"]);
  },
  //botChat.getChatMessage("adfly")
  //botChat.chatMessages.adfly
  getChatMessage: function (messageKey) {
    for( var i = 0, len = botChat.chatMessages.length; i < len; i++ ) {
      if( botChat.chatMessages[i][0] === messageKey ) {
        return botChat.chatMessages[i][1];
      }
    }  
    return "undefined message";
  },
  loadChatA: function (cb) {
        if (!cb) cb = function () {
        };
        $.get("https://rawgit.com/SZigmund/dubBot/master/lang/langIndex.json", function (json) {
            var link = CONST.chatMessagesLink;
            if (json !== null && typeof json !== "undefined") {
                langIndex = json;
                link = langIndex[SETTINGS.settings.language.toLowerCase()];
                $.get(link, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        botChat.chatMessages = json;
                        cb();
                    }
                });
            }
            else {
                $.get(CONST.chatMessagesLink, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        botChat.chatMessages = json;
                        cb();
                    }
                });
            }
        });
    },

  loadChatX: function (chat, obj) {
    $.get(CONST.chatMessagesLink, function (json) {
        if (json !== null && typeof json !== "undefined") {
            if (typeof json === "string") json = JSON.parse(json);
            botChat.chatMessages = json;
            cb();
        }
    });
  },
    chatFilter: function (chat) {
        var msg = chat.message;
        var perm = API.getPermission(chat.uid);
        var user = USERS.lookupUserID(chat.uid);
        var isMuted = false;
        for (var i = 0; i < botVar.room.mutedUsers.length; i++) {
            if (botVar.room.mutedUsers[i] === chat.uid) isMuted = true;
        }
        if (isMuted) {
            API.moderateDeleteChat(chat.cid);
            return true;
        }
        if (SETTINGS.settings.lockdownEnabled) {
            if (perm === 0) {
                API.moderateDeleteChat(chat.cid);
                return true;
            }
        }
        if (botChat.chatcleaner(chat)) {
            API.moderateDeleteChat(chat.cid);
            return true;
        }
        if (msg.indexOf('http://adf.ly/') > -1) {
            API.moderateDeleteChat(chat.cid);
            API.sendChat(botChat.subChat(botChat.getChatMessage("adfly"), {name: chat.un}));
            return true;
        }
        if (msg.indexOf('autojoin was not enabled') > 0 || msg.indexOf('AFK message was not enabled') > 0 || msg.indexOf('.afkdisable') > 0 || msg.indexOf('.joindisable') > 0 || msg.indexOf('autojoin disabled') > 0 || msg.indexOf('AFK message disabled') > 0) {
            API.moderateDeleteChat(chat.cid);
            return true;
        }

        var rlJoinChat = botChat.getChatMessage("roulettejoin");
        var rlLeaveChat = botChat.getChatMessage("rouletteleave");

        var joinedroulette = rlJoinChat.split('%%NAME%%');
        if (joinedroulette[1].length > joinedroulette[0].length) joinedroulette = joinedroulette[1];
        else joinedroulette = joinedroulette[0];

        var leftroulette = rlLeaveChat.split('%%NAME%%');
        if (leftroulette[1].length > leftroulette[0].length) leftroulette = leftroulette[1];
        else leftroulette = leftroulette[0];

        if ((msg.indexOf(joinedroulette) > -1 || msg.indexOf(leftroulette) > -1) && chat.uid === botVar.botID) {
            setTimeout(function (id) {
                API.moderateDeleteChat(id);
            }, 2 * 1000, chat.cid);
            return true;
        }
        return false;
    },

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
      //Only scan up to the last 10 items in history:
      if (botVar.chatHistoryList.length > 10) {
        botDebug.debugMessage(false, "BEFORE LEN: " + botVar.chatHistoryList.length);
        botVar.chatHistoryList.splice(0, botVar.chatHistoryList.length - 10);
        botDebug.debugMessage(false, " AFTER LEN: " + botVar.chatHistoryList.length);
      }
      for (var i = 0; i < botVar.chatHistoryList.length; i++) {
          if (botVar.chatHistoryList[i].chatId.trim() === itemID.trim()) {
              return botVar.chatHistoryList[i];
          }
      }
      botVar.chatHistoryList.push(new botVar.chatHistory(itemID, 0));
      return botVar.chatHistoryList[(botVar.chatHistoryList.length)-1];
      } catch (err) { UTIL.logException("findChatItem: " + err.message); }
  },
  formatChat: function(chatMessage, username, uid) {
    botChat.commandChat.cid = "";
    botChat.commandChat.message = chatMessage;
    botChat.commandChat.sub = -1;
    botChat.commandChat.un = username;
    botChat.commandChat.uid = uid;
    botChat.commandChat.type = "message";
    botChat.commandChat.timestamp = Date.now();
    botChat.commandChat.sound = "mention";
    return botChat.commandChat;
  },
  processChatItem: function(chatMessage, username, uid) {
    try{
      //botDebug.debugMessage(true, "processChatItem:: " + username + ": {" + chatMessage + "}");
      var chat = botChat.formatChat(chatMessage, username, uid);
      //botDebug.debugMessage(true, "processChatItem:: " + username + ": {" + chat.message + "}");
      COMMANDS.checkCommands(chat);
      //botDebug.debugMessage(true, "processChatItem:: " + username + ": {" + chat.message + "}");
      } catch (err) { UTIL.logException("processChatItem: " + err.message); }
  },
  getChatUserId: function(className) {
    try{
      //document.getElementsByClassName("chat-main")[0].getElementsByTagName("li")[1].className
      //"user-5600a9dbde199903001ae7be chat-id-5600a9dbde199903001ae7be-1448994390982"
      var idx = className.indexOf("user-");
      if (idx < 0) return "";
      var userID = className.substring(idx + 5);
      idx = userID.indexOf(" ");
      if (idx > 0) userID = userID.substring(0, idx);
	  return userID;
    //
    } catch (err) { UTIL.logException("getChatUserId: " + err.message); }
  },
  getChatId: function(className) {
    try{
      // SAMPLE:
      //document.getElementsByClassName("chat-main")[0].getElementsByTagName("li")[1].className
      //"user-5600a9dbde199903001ae7be chat-id-5600a9dbde199903001ae7be-1448994390982"
      var idx = className.indexOf("chat-id-");
      if (idx < 0) return null;
      return className.substring(idx + 8)
    } catch (err) { UTIL.logException("getChatId: " + err.message); }
  },
  processChatItems: function(liItem) {
    try{
      if (typeof liItem === "undefined") return;                // ignore empty items
      var chatId = botChat.getChatId(liItem.className);
      var userId = botChat.getChatUserId(liItem.className);
      if(chatId === null) return null;
      botDebug.debugMessage(false, "CHAT - Item ID: " + chatId);
      if (chatId.length < 10) return;                        // ignore chat without IDs
      var itemHistory = botChat.findChatItem(chatId);
      botDebug.debugMessage(false, "CHAT - Hist Item count: " + itemHistory.chatCount);
      var chatItems = liItem.getElementsByTagName("p");
      botDebug.debugMessage(false, "CHAT - Items count: " + chatItems.length);
      if (chatItems.length <= itemHistory.chatCount) return;    // All chat items have been processed
      var username = chatItems[0].getElementsByClassName("username")[0].innerHTML;
      //<li class="user-560be6cbdce3260300e40770 current-chat-user chat-id-560be6cbdce3260300e40770-1450885488091">
      botDebug.debugMessage(false, "CHAT - User: " + username);
      if (userId.length > 0) USERS.updateUserID(userId, username);
      var historyChatCount = itemHistory.chatCount;
      itemHistory.chatCount = chatItems.length;
      
      //Process any unprocessed messages:
      for (var i = chatItems.length -1; i >= historyChatCount; i--) {
          var node = chatItems[i];
          var chatMsg = (node.textContent===undefined) ? node.innerText : node.textContent;
          chatMsg = chatMsg.replace(username, "");
          botDebug.debugMessage(false, "CHAT - MSG: " + chatMsg);
          botChat.processChatItem(chatMsg, username, userId);
      }
      } catch (err) { UTIL.logException("processChatItems: " + err.message); }
    },
  chatMessages: []
};

//SECTION EIGHTBALL: Core 8 ball functionality:
var EIGHTBALL = {
    EightBallArray: [
    "As I See It Yes", 
    "Ask Again Later", 
    "Better Not Tell You Now", 
    "Cannot Predict Now", 
    "Concentrate and Ask Again", 
    "Don't Count On It", 
    "It Is Certain", 
    "It Is Decidedly So", 
    "Most Likely", 
    "My Reply Is No", 
    "My Sources Say No", 
    "Outlook Good", 
    "Outlook Not So Good", 
    "Reply Hazy Try Again", 
    "Signs Point to Yes", 
    "Very Doubtful", 
    "Without A Doubt", 
    "Yes", 
    "Yes - Definitely", 
    "You May Rely On It",
    "Absolutely", 
    "Answer Unclear Ask Later", 
    "Cannot Foretell Now", 
    "Can't Say Now", 
    "Chances Aren't Good", 
    "Consult Me Later", 
    "Don't Bet On It", 
    "Focus And Ask Again", 
    "Indications Say Yes", 
    "Looks Like Yes", 
    "No", 
    "No Doubt About It", 
    "Positively", 
    "Prospect Good", 
    "So It Shall Be", 
    "The Stars Say No", 
    "Unlikely", 
    "Very Likely", 
    "You Can Count On It",
    "As If",
    "Ask Me If I Care",
    "Dumb Question Ask Another",
    "Forget About It",
    "Get A Clue",
    "In Your Dreams",
    "Not A Chance",
    "Obviously",
    "Oh Please",
    "Sure",
    "That's Ridiculous",
    "Well Maybe",
    "What Do You Think?",
    "Whatever",
    "Who Cares?",
    "Yeah And I'm The Pope",
    "Yeah Right",
    "You Wish",
    "You've Got To Be Kidding",
    "You Look Marvelous", 
    "Your Breath Is So Minty", 
    "You're 100% Fun!", 
    "You're A Winner",
    "At Least I Love You",
    "Have You Lost Weight?",
    "Go flip a quarter",
    "Never gonna happen",
    "Smells like a Yes",
    "Si Amigo, like cheese on nachos",
    "When pigs fly!",
    "No, but I still love you",
    "Give me a dollar, then I'll answer",
    "I got yes written on my forehead",
    "Sorry, but no way",
    "I know, but I'm not telling",
    "I guess so, maybe",
    "Yes! Hooray, Yippee!",
    "Ha Ha Ha, no!",
    "Of course silly",
    "My dog thinks so",
    "Um.. Ok, sure, why not?",
    "Will the sun rise tomorrow?",
    "Yep, like a bird has feathers",
    "You can bet your ass on it",
    "Hell No",
    "Are you stupid?",
    "Hell Yes",
    "Give it up",
    "Maybe if you weren't so lazy",
    "Make it happen",
    "No way, sucka!",
    "Wow, you are an idiot!",
    "Yes, now stop asking!",
    "Ha Ha Ha! Nope!",
    "Don't you have something better to do?",
    "Of course, shit head",
    "5 letters, LOL NO!",
    "Go ask your mama",
    "Just a wild guess, but yes",
    "I really don't care",
    "Damn Right",
    "Boring! Ask something exciting",
    "Swear on my 8 balls it's true",
    "Shit Happens",
    "F*ck Yeah",
    "F*ck No",
    "What the F*ck?",
    "Hell F*cking Yes",
    "Hell F*cking No",
    "You F*cking Crazy?",
    "Of course F*cker",
    "No way F*cker",
    "Who F*cking cares",
    "God Damn F*cking Right!",
    "Not a F*cking chance",
    "I don't F*cking know",
    "No F*cking doubt",
    "No F*cking way",
    "Seriously F*cker?",
    "F*ck, why not.",
    "Don't F*cking count on it",
    "It could F*cking happen",
    "You must be out of your F*cking mind",
    "Sure F*cking thing",
    "F*cking Right",
    "Signs point to F*cking Yes",
    "It is F*cking certain"
    ],

  eightBallSelect: function()  {  //Added 04/01/2015 Zig
    try  {
        var arrayCount = EIGHTBALL.EightBallArray.length;
        var arrayID = Math.floor(Math.random() * arrayCount);
        return EIGHTBALL.EightBallArray[arrayID];
    }
    catch(err) {
      UTIL.logException("eightBallSelect: " + err.message);
    }
  }
};

//SECTION UTIL: Core functionality:
var UTIL = {
    numberToIcon: function(intValue) {
        switch (intValue) {
            case 0: return ":zero:";
            case 1: return ":one:";
            case 2: return ":two:";
            case 3: return ":three:";
            case 4: return ":four:";
            case 5: return ":five:";
            case 6: return ":six:";
            case 7: return ":seven:";
            case 8: return ":eight:";
            case 9: return ":nine:";
            case 10: return ":keycap_ten:";
        }
        return intValue;
    },
    formatPercentage: function(a, b) {
        if (a === 0) return "0%";
        if (b === 0) return "100%";
        return (((a / b).toFixed(2)) * 100).toFixed(0) + "%";
    },
    getDOY: function() {
      var now = new Date();
      var start = new Date(now.getFullYear(), 0, 0);
      var diff = now - start;
      var oneDay = 1000 * 60 * 60 * 24;
      var day = Math.floor(diff / oneDay);
      return day;
    },
  killbot: function () {
        clearInterval(AFK.afkInterval);
        clearInterval(RANDOMCOMMENTS.randomInterval);
        clearInterval(USERS.loadUserInterval);
        botVar.botStatus = false;
  },
  linkFixer: function (msg) {
        var parts = msg.splitBetween('<a href="', '<\/a>');
        for (var i = 1; i < parts.length; i = i + 2) {
            var link = parts[i].split('"')[0];
            parts[i] = link;
        }
        var m = '';
        for (var i = 0; i < parts.length; i++) {
            m += parts[i];
        }
        return m;
   },
  msToStr: function (msTime) {
    var ms, msg, timeAway;
    msg = '';
    timeAway = {
        'days': 0,
        'hours': 0,
        'minutes': 0,
        'seconds': 0
    };
    ms = {
        'day': 24 * 60 * 60 * 1000,
        'hour': 60 * 60 * 1000,
        'minute': 60 * 1000,
        'second': 1000
    };
    if (msTime > ms.day) {
        timeAway.days = Math.floor(msTime / ms.day);
        msTime = msTime % ms.day;
    }
    if (msTime > ms.hour) {
        timeAway.hours = Math.floor(msTime / ms.hour);
        msTime = msTime % ms.hour;
    }
    if (msTime > ms.minute) {
        timeAway.minutes = Math.floor(msTime / ms.minute);
        msTime = msTime % ms.minute;
    }
    if (msTime > ms.second) {
        timeAway.seconds = Math.floor(msTime / ms.second);
    }
    if (timeAway.days !== 0) {
        msg += timeAway.days.toString() + 'd';
    }
    if (timeAway.hours !== 0) {
        msg += timeAway.hours.toString() + 'h';
    }
    if (timeAway.minutes !== 0) {
        msg += timeAway.minutes.toString() + 'm';
    }
    if (timeAway.minutes < 1 && timeAway.hours < 1 && timeAway.days < 1) {
        msg += timeAway.seconds.toString() + 's';
    }
    if (msg !== '') {
        return msg;
    } else {
        return false;
    }
  },
   
  rankToNumber: function (rankString) {
    var rankInt = null;
    switch (rankString) {
        case "admin":
            rankInt = 10;
            break;
        case "ambassador":
            rankInt = 7;
            break;
        case "host":
            rankInt = 5;
            break;
        case "cohost":
            rankInt = 4;
            break;
        case "manager":
            rankInt = 3;
            break;
        case "bouncer":
            rankInt = 2;
            break;
        case "residentdj":
            rankInt = 1;
            break;
        case "user":
            rankInt = 0;
            break;
    }
    return rankInt;
  },
  logObject: function (objectToLog, objectName) {
    try {
        for (var prop in objectToLog) {
            if (typeof objectToLog[prop] === "object") 
                UTIL.logObject(objectToLog[prop], objectName + "." + prop);
            else
                botDebug.debugMessage(false, "Prop->" + objectName + ": "  + prop + " value: " + objectToLog[prop]);
        }
    }
    catch(err) { UTIL.logException("logObject: " + err.message); }
  },

  logException: function(exceptionMessage) {
    console.log("[EXCEPTION]: " + exceptionMessage);
  }
};
//SECTION TASTY: All Tasty functionality:
//SECTION ROLL: All Roll functionality
var TASTY = {
    settings: {
      rolledDice: false
    },
    resetDailyRolledStats: function (roomUser) {
        try {
        var DOY = UTIL.getDOY();
        if (roomUser.rollStats.DOY !== DOY) {
             roomUser.rollStats.DOY = DOY;
             roomUser.rollStats.dayWoot = 0;
             roomUser.rollStats.dayTotal = 0;
        }
      }
        catch(err) {
          UTIL.logException("resetDailyRolledStats: " + err.message);
          return "";
        }
    },
	displayLeaderBoard: function(leaderBoard, username, dispPct, caption) {
		try {
			console.table(leaderBoard);
			var MsgA = "";
			var MsgB = "";
			var MsgC = "";
			MsgA = caption;
			for (var leaderIdx = 0; leaderIdx < leaderBoard.length; leaderIdx++) {
				var strData = "[" + UTIL.numberToIcon(leaderIdx+1) + " " + leaderBoard[leaderIdx].username + " ";
				if (dispPct)
					strData += leaderBoard[leaderIdx].winCount + "/" + leaderBoard[leaderIdx].rollCount + " " + leaderBoard[leaderIdx].rollPct + "] "
				else
					strData += leaderBoard[leaderIdx].rollCount + "] "
				if (leaderIdx < 3)
					MsgA += strData;
				else if (leaderIdx < 7)
					MsgB += strData;
				else
					MsgC += strData;
			}
			API.sendChat(MsgA);
			setTimeout(function () { API.sendChat(MsgB); }, 500);
			setTimeout(function () { API.sendChat(MsgC); }, 1000);
		}
		catch(err) { UTIL.logException("displayLeaderBoard: " + err.message); }
	},
	loadRollPct: function(loadingTop) {
		try {
			userIDs = [];
			leaderBoard = [];
			var addUserIdx = -1;
			for (var leaderIdx = 0; leaderIdx < 10; leaderIdx++) {
				addUserIdx = -1;
				var rollPct = 0.0;
				if (loadingTop === false) rollPct = 101.00;
				for (var userIdx = 0; userIdx < USERS.users.length; userIdx++) {
					var skipUser = false;
					var roomUser = USERS.users[userIdx];
					if (userIDs.indexOf(roomUser.id) > -1) skipUser = true;  // Already in the leader list
					//botDebug.debugMessage(true, "Scanning User: " + roomUser.username + ": " + roomUser.rollStats.lifeTotal);
					if (roomUser.rollStats.lifeTotal < 50) skipUser = true;  // Require 50 rolls to get on the leader board
					if (!skipUser) {
					  var UserPct = roomUser.rollStats.lifeWoot / roomUser.rollStats.lifeTotal;
					// Skip user if higher or lower than the current high/low score:
					  if (UserPct < rollPct && loadingTop === true) skipUser = true;
					  if (UserPct > rollPct && loadingTop === false) skipUser = true;
					}
					if (!skipUser) {
						//botDebug.debugMessage(true, "New Leader: " + roomUser.username + ": " + roomUser.rollStats.lifeTotal + "-" + UserPct);
						addUserIdx = userIdx;
						rollPct = UserPct;
					}
				}
				if (addUserIdx > -1) {
					var topStats = {
						username: "",
						rollCount: 0,
						winCount: 0,
						rollPct: ""
					};
					//botDebug.debugMessage(true, "Adding User: " + USERS.users[addUserIdx].username + ": " + USERS.users[addUserIdx].rollStats.lifeTotal);
					topStats.username = USERS.users[addUserIdx].username;
					topStats.rollCount = USERS.users[addUserIdx].rollStats.lifeTotal;
					topStats.winCount = USERS.users[addUserIdx].rollStats.lifeWoot;
					topStats.rollPct = UTIL.formatPercentage(USERS.users[addUserIdx].rollStats.lifeWoot, USERS.users[addUserIdx].rollStats.lifeTotal);
					leaderBoard.push(topStats);
					userIDs.push(USERS.users[addUserIdx].id);
				}
			}
			return leaderBoard;
		}
		catch(err) { UTIL.logException("loadRollPct: " + err.message); }
	},
	loadRollPoints: function(loadingTop) {
		try {
			userIDs = [];
			leaderBoard = [];
			for (var leaderIdx = 0; leaderIdx < 10; leaderIdx++) {
				var rollCount = 0;
				if (loadingTop === false) rollCount = 10000;
				var addUserIdx = -1;
				for (var userIdx = 0; userIdx < USERS.users.length; userIdx++) {
					var skipUser = false;
					var roomUser = USERS.users[userIdx];
					//botDebug.debugMessage(true, "Scanning User: " + roomUser.username + ": " + roomUser.rollStats.lifeTotal);
					if (userIDs.indexOf(roomUser.id) > -1) skipUser = true;  // Already in the leader list
					if (roomUser.rollStats.lifeTotal < 50) skipUser = true;  // Require 50 rolls to get on the leader board
					// Skip user if higher or lower than the current high/low score:
					if (roomUser.rollStats.lifeTotal < rollCount && loadingTop === true) skipUser = true;
					if (roomUser.rollStats.lifeTotal > rollCount && loadingTop === false) skipUser = true;
					if (!skipUser) {
						addUserIdx = userIdx;
						//botDebug.debugMessage(true, "New Leader: " + roomUser.username + ": " + roomUser.rollStats.lifeTotal);
						rollCount = roomUser.rollStats.lifeTotal;
					}
				}
				
				if (addUserIdx > -1) {
					var topStats = {
						username: "",
						rollCount: 0,
						winCount: 0,
						rollPct: ""
					};
					//botDebug.debugMessage(true, "Adding User: " + USERS.users[addUserIdx].username + ": " + USERS.users[addUserIdx].rollStats.lifeTotal);
					topStats.username = USERS.users[addUserIdx].username;
					topStats.rollCount = USERS.users[addUserIdx].rollStats.lifeTotal;
					topStats.winCount = USERS.users[addUserIdx].rollStats.lifeWoot;
					topStats.rollPct = UTIL.formatPercentage(USERS.users[addUserIdx].rollStats.lifeWoot, USERS.users[addUserIdx].rollStats.lifeTotal);
					leaderBoard.push(topStats);
					userIDs.push(USERS.users[addUserIdx].id);
				}
			}
			return leaderBoard;
		}
		catch(err) { UTIL.logException("loadRollPoints: " + err.message); }
	},
    getRolledStats: function (roomUser) {
        try {
           var rollStats = " [Today: " + roomUser.rollStats.dayWoot + "/" + roomUser.rollStats.dayTotal;
           rollStats +=  " " + UTIL.formatPercentage(roomUser.rollStats.dayWoot, roomUser.rollStats.dayTotal) + "]";
           rollStats += " [Lifetime: " + roomUser.rollStats.lifeWoot + "/" + roomUser.rollStats.lifeTotal;
           rollStats +=  " " + UTIL.formatPercentage(roomUser.rollStats.lifeWoot, roomUser.rollStats.lifeTotal) + "]";
           return rollStats;
        }
        catch(err) {
          UTIL.logException("getRolledStats: " + err.message);
          return "";
        }
    },
    updateRolledStats: function (usrObjectID, wooting) {
        try {
          var roomUser = USERS.defineRoomUser(usrObjectID);
          TASTY.resetDailyRolledStats(roomUser);
          if (wooting) {
             roomUser.rollStats.lifeWoot++;
             roomUser.rollStats.dayWoot++;
          } 
          roomUser.rollStats.lifeTotal++;
          roomUser.rollStats.dayTotal++;
          return TASTY.getRolledStats(roomUser);
        }
        catch(err) {
          UTIL.logException("updateRolledStats: " + err.message);
          return "";
        }
    },
    setRolled: function (usrObjectID, value, wooting) {
        var roomUser = USERS.defineRoomUser(usrObjectID);
        if (roomUser === false) return;
        roomUser.rolled = value;
    },
    getRolled: function (usrObjectID) {
        var user = USERS.defineRoomUser(usrObjectID);
        if (user === false) return false;
        return user.rolled;
    },
    tastyVote: function (usrObjectID, cmd) {
        try {
        var roomUser = USERS.defineRoomUser(usrObjectID);
        if (roomUser.tastyVote) return;
        roomUser.votes.tastyGiv++;
        if (API.currentDjName() === roomUser.username)
        {
            API.sendChat("I'm glad you find your own play tasty @" + roomUser.username);
            return;
         }
        var tastyComment = TASTY.tastyComment(cmd);
        roomUser.tastyVote = true;
        setTimeout(function () { API.sendChat(botChat.subChat(tastyComment, {pointfrom: roomUser.username})); }, 250);
    
        botVar.tastyCount++;
        var currdj = API.getDJ();
        currdj.votes.tastyRcv++;
        }
        catch(err) { UTIL.logException("tastyVote: " + err.message); }
    },
    bopCommand: function (cmd) {
        try {
            //TODO: menorah xmas dreidel plus many other holiday commands  (Only work if the month is 12)
            var commandList = ['tasty', 'rock', 'props', 'woot', 'groot', 'groovy', 'jam','nice','bop','cowbell','sax','ukulele','tango','samba','disco','waltz','metal',
                      'bob','boogie','cavort','conga','flit','foxtrot','frolic','gambol','hop','hustle','jig','jitter','jitterbug','jive','jump','leap','prance',
                      'promenade','rhumba','shimmy','strut','sway','swing','great','hail','good','acceptable','bad','excellent','exceptional','favorable','marvelous',
                      'positive','satisfactory','satisfying','superb','valuable','wonderful','ace','boss','bully','choice','crack','pleasing','prime','rad',
                      'sound','spanking','sterling','super','superior','welcome','worthy','admirable','agreeable','commendable','congenial','deluxe','first-class',
                      'first-rate','gnarly','gratifying','honorable','neat','precious','recherché','reputable','select','shipshape','splendid','stupendous','keen',
                      'nifty','swell','sensational','fine','cool','perfect','wicked','fab','heavy','incredible','outstanding','phenomenal','remarkable','special',
                      'terrific','unique','aces','capital','dandy','enjoyable','exquisite','fashionable','lovely','love','solid','striking','top-notch',
                      'slick','pillar','exemplary','alarming','astonishing','awe-inspiring','beautiful','breathtaking','fearsome','formidable','frightening','winner',
                      'impressive','intimidating','facinating','prodigious','magnificent','overwhelming','shocking','stunning','stupefying','majestic','grand','velvet','icecream',
                      'creamy','easy','effortless','fluid','gentle','glossy','peaceful','polished','serene','sleek','soft','tranquil','velvety','soothing','fluent','frictionless',
                      'lustrous','rhythmic','crackerjack','laudable','peachy','praiseworthy','rare','super-duper','unreal','chill','savvy','smart','ingenious','genious',
                      'sweet','delicious','lucious','bonbon','fetch','fetching','appealing','delightful','absorbing','alluring','cute','electrifying',
                      'awesome','bitchin','fly','pleasant','relaxing','mellow','nostalgia','punk','like','fries','cake','drum','guitar','bass','tune','pop',
                      'apple','fantastic','spiffy','yes','fabulous','happy','smooth','classic','mygirlfriend','skank','jiggy','funk','funky','jazz','jazzy','dance','elvis',
                      'hawt','extreme','dude','babes','fun','reggae','party','drums','trumpet','mosh','bang','blues','heart','feels','dope','makeitrain','wumbo',
                      'firstclass','firstrate','topnotch','aweinspiring','superduper','dabomb','dashit','badass','bomb','popcorn','awesomesauce','awesomeness','sick',
                      'sexy','brilliant','steampunk','bagpipes','piccolo','whee','vibe','banjo','harmony','harmonica','flute','dancing','dancin','ducky','approval','winning','okay',
                      'hunkydory','peach','divine','radiant','sublime','refined','foxy','allskate','rush','boston','mumford','murica','2fer','boom','bitches','oar','hipster',
                      'hip','soul','soulful','cover','yummy','ohyeah','twist','shout','trippy','hot','country','stellar','smoove','pantydropper','baby','mmm','hooters',
                      'tmbg','rhythm','kool','kewl','killer','biatch','woodblock','morecowbell','lesbian','lesbians','niceconnect','connect','kazoo','win','webejammin',
                      'bellyrub','groove','gold','golden','twofer','phat','punkrock','punkrocker','merp','derp','herp-a-derp','narf','amazing','doabarrellroll','plusone',
                      '133t','roofus','rufus','schway','shiz','shiznak','shiznik','shiznip','shiznit','shiznot','shizot','shwanky','shway',
                      'sic','sicc','skippy','slammin','slamming','slinkster','smack','smashing','smashingly','snizzo','spiffylicious','superfly',
                      'swass','tender','thrill','tight','tits','tizight','todiefor','to die for','trill','tuff','vicious','whizz-bang','wick',
                      'wow','omg','A-1','ace','aces','aight','allthatandabagofchips','all that and a bag of chips','alrighty','alvo','amped',
                      'A-Ok','ass-kicking','awesome-possum','awesome possum','awesomepossum','awesomesauce','awesome sauce','awesome-sauce',
                      'awsum','bad-ass','badassical','badonkadonk','bananas','bang','bangupjob','bang up job','beast','beastly','bees-knees',
                      'bees knees','beesknees','bodacious','bomb','bomb-ass','bomb diggidy','bomb-diggidy','bombdiggidy','bonkers','bonzer',
                      'boomtown','bostin','brill','bumping','capitol','cats ass','cats-ass','catsass','chilling','choice','clutch',
                      'coo','coolage','cool beans','cool-beans','coolbeans','coolness','cramazing','cray-cray','crazy','crisp','crucial','da bomb',
                      'da shit','da-bomb','da-shit','dashiznit','dabomb','dashit','da shiznit','da-shiznit','dope','ear candy','ear-candy','earcandy',
                      'easy','epic','fan-fucking-tastic','fantabulous','far out','far-out','farout','fly','fresh','funsies','gangstar','gangster',
                      'gansta','solidgold','golden','gr8','hardcore','hellacious','hoopla','hype','ill','itsallgood','its all good','jiggy','jinky','jiggity',
                      'jolly good','jolly-good','jollygood','k3w1','kickass','kick-ass','kick ass','kick in the pants','kickinthepants','kicks','kix','legendary',
                      'legit','like a boss','like a champ','like whoa','likeaboss','likeachamp','likewhoa','lush','mint','money','neato','nice','off da hook',
                      'off the chain','off the hook','out of sight','peachy keen','peachy-keen','offdahook','offthechain','offthehook','outofsight',
                      'peachykeen','perf','phatness','phenom','prime-time','primo','rad','radical','rage','rancid','random','nice cover','nicecover','raw',
                      'redonkulus','righteous','rocking','rock-solid','rollin','3fer','4fer','threefer','fourfer','nice2fer','amazeballs','craycray',
                      'whizzbang','a1','aok','asskicking','bombass','fanfuckingtastic','primetime','rocksolid','instrumental','rockin','star','rockstar',':metal:',
                      '10s','00s','90s','80s','70s','60s','50s','40s','30s','20s','insane','clever',':heart:',':heart_decoration:',':heart_eyes:',':heart_eyes_cat:',':heartbeat:',
                      ':heartpulse:',':hearts:',':yellow_heart:',':green_heart:',':two_hearts:',':revolving_hearts:',':sparkling_heart:',':blue_heart:','giddyup','rockabilly',
                      'nicefollow',':beer:',':beers:','niceplay','oldies','oldie','pj','slayer','kinky',':smoking:','jewharp','talkbox','oogachakaoogaooga','oogachaka',
                      'ooga-chaka','snag','snagged','yoink','classy','ska','grunge','jazzhands','verycool','ginchy','catchy','grab','grabbed','yes','hellyes',
                      'hellyeah','27','420','toke','fatty','blunt','joint','samples','doobie','oneeyedwilly','bongo','bingo','bangkok','tastytits','=w=',':guitar:','cl','carbonleaf',
                      'festive','srv','motorhead','motörhead','pre2fer','pre-2fer','future2fer','phoenix','clhour','accordion','schwing','schawing','cool cover','coolcover',
                      'boppin','bopping','jammin','jamming','tuba','powerballad','jukebox','word','classicrock','throwback','soultrain','train','<3','bowie'];
            // If a command if passed in validate it and return true if it is a Tasty command:
            if (cmd.length > 0) {
                if (commandList.indexOf(cmd) < 0) return true;
                return false;
            }
            // Else return a random Tasty command for Larry to use on his tasty points:
            var idx = Math.floor(Math.random() * commandList.length);
            return commandList[idx];
        }
        catch(err) { UTIL.logException("bopCommand: " + err.message); }
    },
    tastyComment: function(cmd)  {  //Added 04/03/2015 Zig
        try  {
            var arrayCount = CONST.tastyCommentArray.length;
            var arrayID = Math.floor(Math.random() * arrayCount);
            if (cmd === "tasty") return CONST.tastyCommentArray[arrayID];
            var tastyCmt = "[" + cmd.replace(CONST.commandLiteral, '') + "] " + CONST.tastyCommentArray[arrayID];
            var djName = API.currentDjName();
            if (djName.length > 0) tastyCmt += " @"  + djName;
            return tastyCmt;
        }
        catch(err) { UTIL.logException("tastyComment: " + err.message);        }
    },
};
//SECTION Debug: All Debug functionality:
var botDebug = {
  settings: {
    debugHighLevel: true,
    debugLowLevel: false
  },

  debugMessage: function(highLevel, message) {
    if ((highLevel === true) && (botDebug.settings.debugHighLevel === false)) return;
    if ((highLevel === false) && (botDebug.settings.debugLowLevel === false)) return;
    console.log("[DEBUG]: " + message);
  }
};

//SECTION AFK: All AFK functionality:
var AFK = {
  afkInterval: null,
  afkList: [],
  settings: {
    maximumAfk: 60,
    afkRemoval: true,
    afk5Days: true,
    afk7Days: true,
    afkRemoveStart: 0,
    afkRemoveEnd: 24,
    afkpositionCheck: 30,
    afkRankCheck: "ambassador"
  },
  afkCheck: function () {
    try {
    if (!botVar.botStatus || !AFK.settings.afkRemoval) return void (0);
    if (!AFK.afkRemovalNow()) return void (0);
    var rank = UTIL.rankToNumber(AFK.settings.afkRankCheck);
    var djlist = API.getWaitList();
    var lastPos = Math.min(djlist.length, AFK.settings.afkpositionCheck);
    if (lastPos - 1 > djlist.length) return void (0);
    for (var i = 0; i < lastPos; i++) {
        if (typeof djlist[i] !== 'undefined') {
            var id = djlist[i].id;
            var user = USERS.lookupUserID(id);
            if (typeof user !== 'boolean') {
                var dubUser = API.getDubUser(user);
                if (rank !== null) {
                    var name = dubUser.username;
                    var lastActive = USERS.getLastActivity(user);
                    var inactivity = Date.now() - lastActive;
                    var time = UTIL.msToStr(inactivity);
                    var warncount = user.afkWarningCount;
					//todoer GET AFK WORKING:
                    if (inactivity > AFK.settings.maximumAfk * 60 * 1000) {
                        if (warncount === 0) {
                            API.sendChat(botChat.subChat(botChat.getChatMessage("warning1"), {name: name, time: time}));
                            user.afkWarningCount = 3;
                            user.afkCountdown = setTimeout(function (userToChange) {
                                userToChange.afkWarningCount = 1;
                            }, 90 * 1000, user);
                        }
                        else if (warncount === 1) {
                            API.sendChat(botChat.subChat(botChat.getChatMessage("warning2"), {name: name}));
                            user.afkWarningCount = 3;
                            user.afkCountdown = setTimeout(function (userToChange) {
                                userToChange.afkWarningCount = 2;
                            }, 30 * 1000, user);
                        }
                        else if (warncount === 2) {
                            var pos = API.getWaitListPosition(id);
                            if (pos !== -1) {
                                pos++;
                                AFK.afkList.push([id, Date.now(), pos]);
                                AFK.resetDC(user);
                                API.moderateRemoveDJ(id);
                                user.lastDC.resetReason = "Disconnect status was reset. Reason: You were removed from line due to afk.";
                                API.sendChat(botChat.subChat(botChat.getChatMessage("afkremove"), {name: name, time: time, position: pos, maximumafk: AFK.settings.maximumAfk}));
                            }
                            user.afkWarningCount = 0;
                        }
                    }
                }
            }
        }
    }
    }
    catch(err) { UTIL.logException("afkCheck: " + err.message); }
  },
  resetDC: function (user) {
    user.lastDC.time = null;
    user.lastDC.position = -1;
    user.lastDC.leftroom = null;
    user.lastKnownPosition = -1;
    user.lastSeenInLine = null;
    user.lastDC.songCount = 0;
    user.beerRun = false;
    user.inMeeting = false;
    user.atLunch = false;
  },

  afkRemovalNow: function () {
    try {
        if (!AFK.settings.afk5Days && !AFK.settings.afk7Days) return false;
        var currDate = new Date();
        //Not on Saturday/Sunday if not monitoring 7 days a week
        if (!AFK.settings.afk7Days) {
            var dayofweek = currDate.getDay();  // [Day of week Sun=0, Mon=1...Sat=6]
            if (dayofweek === 6 || dayofweek === 0) return false;
        }
        var hourofday = currDate.getHours();
        if (hourofday >= AFK.settings.afkRemoveStart && hourofday < AFK.settings.afkRemoveEnd) return true;
        return false;
    }
    catch(err) { UTIL.logException("afkRemovalNow: " + err.message); }
  },
};

// Will not currently work as Larry cannot move people in the line
//SECTION ROULETTE: All roulette functionality:
var ROULETTE = {
  settings: {
    roulette5Days: true,
    roulette7Days: false,
    rouletteStart: 9,
    rouletteEnd: 17,
    randomRoulette: false,
    rouletteStatus: false,
    randomRouletteMin: 45,
    randomRouletteMax: 120,
    nextRandomRoulette: null,
    participants: [],
    countdown: null
  },

  startRoulette: function () {
    try  {
        //if (ROULETTE.rouletteStatus) return;
        //ROULETTE.rouletteStatus = true;
        //ROULETTE.countdown = setTimeout(function () { ROULETTE.endRoulette(); }, 60 * 1000);
        //API.sendChat(botChat.getChatMessage("isopen"));
        API.sendChat("Roulette is not functional yet.... But...it's COMING SOON!!!");
    }
    catch(err) { UTIL.logException("startRoulette: " + err.message); }
  },
  randomRouletteCheck: function() {
    try  {
        if (ROULETTE.nextRandomRoulette <= Date.now())
        {
            ROULETTE.randomRouletteSetTimer();
            if (ROULETTE.randomRoulette === false) return;
            if (ROULETTE.rouletteTimeRange()) ROULETTE.startRoulette();
        }
    }
    catch(err) { UTIL.logException("randomRouletteCheck: " + err.message); }
  },

  
  rouletteTimeRange: function () {
    try {
        if (!ROULETTE.roulette5Days && !ROULETTE.roulette7Days) return false;
        if (ROULETTE.randomRoulette === false) return false;
        var currDate = new Date();
        //Not on Saturday/Sunday if not monitoring 7 days a week
        if (!ROULETTE.roulette7Days) {
            var dayofweek = currDate.getDay();  // [Day of week Sun=0, Mon=1...Sat=6]
            if (dayofweek === 6 || dayofweek === 0) return false;
        }
        var hourofday = currDate.getHours();
        if (hourofday >= ROULETTE.rouletteStart && hourofday < ROULETTE.rouletteEnd) return true;
        return false;
    }
    catch(err) { UTIL.logException("rouletteTimeRange: " + err.message); }
  },

  randomRouletteSetTimer: function () {
    try  {
        var randomRange = (ROULETTE.randomRouletteMax - ROULETTE.randomRouletteMin)
        var randomMins = Math.floor(Math.random() * randomRange);
        randomMins += ROULETTE.randomRouletteMin;
        //JIC: Ensure we are in the correct time range:
        if ((randomMins > ROULETTE.randomRouletteMax) || (randomMins < ROULETTE.randomRouletteMin))
        {
          randomMins = ROULETTE.randomRouletteMin + ((ROULETTE.randomRouletteMax - ROULETTE.randomRouletteMin) / 2.0)
        }
        var nextTime = new Date();
        var myTimeSpan;
        myTimeSpan = randomMins*60*1000; // X minutes in milliseconds
        nextTime.setTime(nextTime.getTime() + myTimeSpan);
        API.chatLog("Next Roulette: " + UTIL.msToStr(myTimeSpan));
        ROULETTE.nextRandomRoulette = nextTime;
    }
    catch(err) { UTIL.logException("randomRouletteSetTimer: " + err.message); }
  },

  endRoulette: function () {
    try {
        ROULETTE.rouletteStatus = false;
        if (ROULETTE.participants.length === 0) {
           API.sendChat("Roulette has ended with no participants");
           return;
        }
        var ind = Math.floor(Math.random() * ROULETTE.participants.length);
        var winner = ROULETTE.participants[ind];
        ROULETTE.participants = [];
        var pos = Math.floor((Math.random() * API.getWaitList().length) + 1);
        var user = USERS.lookupUserName(winner);
        var name = user.username;
        API.sendChat(subChat(botChat.getChatMessage("winnerpicked"), {name: name, position: pos}));
        setTimeout(function (winner, pos) { API.moveUser(winner, pos, false); }, 1 * 1000, winner, pos);
    }
    catch(err) { UTIL.logException("endRoulette: " + err.message); }
  }
};

//SECTION RANDOM COMMENTS: All Random Comment functionality:
var RANDOMCOMMENTS = {
  randomInterval: null,
  settings: {
    randomComments: true,
    randomCommentMin: 60,
    randomCommentMax: 180,
    nextRandomComment: Date.now(),
  },
  randomCommentSelect: function()  {  //Added 02/19/2015 Zig
    try  {
        var arrayCount = RANDOMCOMMENTS.randomCommentArray.length;
        var randomID = Math.floor(Math.random() * arrayCount);
        return RANDOMCOMMENTS.randomCommentArray[randomID];
    }
    catch(err) {
      UTIL.logException("randomCommentSelect: " + err.message);
    }
  },
  randomCommentCheck: function() {  //Added 02/19/2015 Zig
      try  {
      //var testTime = new Date();
      //var timeDiff = testTime.getMinutes() - RANDOMCOMMENTS.settings.nextRandomComment.getMinutes();
      //botDebug.debugMessage(false, "randomCommentCheck:" + testTime.getMinutes() + " - " + RANDOMCOMMENTS.settings.nextRandomComment.getMinutes());
      //botDebug.debugMessage(false, "randomCommentCheck-NOW TIME: " + Date.now());
      //botDebug.debugMessage(false, "randomCommentCheck-timeDiff: " + timeDiff);
      //if (timeDiff > 0)
      //{
      //      RANDOMCOMMENTS.randomCommentSetTimer();
      //      if (RANDOMCOMMENTS.settings.randomComments === true) API.sendChat(RANDOMCOMMENTS.randomCommentSelect());
      //}

      if (RANDOMCOMMENTS.settings.nextRandomComment <= Date.now())
      {
          RANDOMCOMMENTS.randomCommentSetTimer();
          if (botVar.ImHidden === true) return;
          if (RANDOMCOMMENTS.settings.randomComments === true) API.sendChat(RANDOMCOMMENTS.randomCommentSelect());
      }
    }  
    catch(err) {
      UTIL.logException("randomCommentCheck: " + err.message);
    }
  },
  randomCommentSetTimer: function() {   //Added 02/19/2015 Zig
    try  {
      var randomRange = (RANDOMCOMMENTS.settings.randomCommentMax - RANDOMCOMMENTS.settings.randomCommentMin)
      var randomMins = Math.floor(Math.random() * randomRange);
      randomMins += RANDOMCOMMENTS.settings.randomCommentMin;
      //JIC: Ensure we are in the correct time range:
      if ((randomMins > RANDOMCOMMENTS.settings.randomCommentMax) || (randomMins < RANDOMCOMMENTS.settings.randomCommentMin))
      {
          randomMins = RANDOMCOMMENTS.settings.randomCommentMin + ((RANDOMCOMMENTS.settings.randomCommentMax - RANDOMCOMMENTS.settings.randomCommentMin) / 2.0)
      }
      var nextTime = new Date();
      var myTimeSpan;
      myTimeSpan = randomMins*60*1000; // X minutes in milliseconds
      nextTime.setTime(nextTime.getTime() + myTimeSpan);
      RANDOMCOMMENTS.settings.nextRandomComment = nextTime;
      botDebug.debugMessage(false, "Next Random Comment: " + nextTime);
    }  
    catch(err) {
      UTIL.logException("randomCommentSetTimer: " + err.message);
    }
  },
    randomCommentArray: [
    "Okay. You people sit tight, hold the fort and keep the home fires burning. And if we're not back by dawn... call the president.",
    "Everybody relax, I'm here.",
    "I'm a reasonable guy. But, I've just experienced some very unreasonable things.",
    "Like I told my last wife, I says, 'Honey, I never drive faster than I can see. Besides that, it's all in the reflexes.'",
    "We take what we want and leave the rest, just like your salad bar.",
    "I told him we already got one",
    "Religion is like a penis, it's fine to have one and be proud of it, but when you take it out and start waving it in my face, that's where we have a problem.",
    "You don't think she'd yada yada sex?....I've yada yada'd sex.",
    "@Bacon_Cheeseburger time for another PBR!",
    "You can't make somebody love you.  You can only stalk them and hope for the best",
    "I stayed up all night to see where the sun went, then it dawned on me.",
    "I went to a chiropractor yesterday for the first time.... he cracked me up!",
    "I know a guy thats addicted to break fluid....... he says he can stop anytime!",
    "A soldier who survived mustard gas and pepper spray is now a seasoned veteran!",
    "Irish Handcuffs:  Holding an alcoholic drink in each hand.",
    "If Apple made a car, would it have Windows?",
    "An apple a day keeps anyone away, If you throw it hard enough",
    "Yesterday at the bank an old lady asked if i could help her check her balance... so i pushed her over",
    "To the guy who invented Zero: Thanks for nothing!",
    "I can hear music coming out of my printer. I think the paper's jammin' again.",
    "People who drink light 'beer' don't like the taste of beer; they just like to pee a lot.",
    "No one looks back on their life and remembers the nights they had plenty of sleep.",
    "Give a man a beer, and he wastes an hour, but teach a man how to brew, and he wastes a lifetime.",
    "Give a man a fish and he will eat for a day. Teach him how to fish, and he will sit in a boat and drink beer all day.",
    "Squats?  I thought you said let's do shots!",
    "I want a beer. I want a giant, ice-cold bottle of beer... and shower sex.",
    "Beer makes you feel the way you ought to feel without beer.",
    "Larry no function beer well without.",
    "Drunk is when you feel sophisticated, but can't pronounce it...",
    "My girlfriend's favorite beer is water. I mean Bud Light.",
    "It's a zombie apocalypse! Quick, grab the beer!",
    "He who drinks beer sleeps well. He who sleeps well cannot sin. He who does not sin goes to heaven. Amen.",
    "There are more old drunks than there are old doctors.",
    "I don't think I've drunk enough beer to understand that.",
    "In dog beers, I've only had one.",
    "There's a time and place for beer....In my hand and NOW!",
    "When I read about the evils of drinking, I gave up reading.",
    "You can drink at 7AM Because the Beastie Boys fought for that kind of thing",
    "I rescued some beer last night.  It was trapped inside a bottle.",
    "There comes a time in the day that no matter the question...the answer is beer!",
    "I've been working out a lot lately. My favorite exercise is a mix between a lunge and a crunch....I call it Lunch.",
    "I call my bathroom the Jim instead of the the John.  So now I can tell all my friends I hit the Jim before I go to work everyday.",
    "When people get a little too chummy with me I like to call them by the wrong name to let them know I don't really care about them",
    "That's what happens when you rub it.",
    "I'm not interested in caring about people",
    "Chase you?  Bitch please, I don't even chase my liquor!",
    "I don't get nearly enough credit for managing not to be a violent psychopath.",
    "Yes I walked away mid-conversation.  You were boring me to death and my survival instincts kicked in",
    "Fishing relaxes me. It's like yoga, except I still get to kill something.",
    "All is well, the PBR is in the fridge",
    "Quick somebody pull my finger!!",
    "Random Fact: Mammoths were alive when the Great Pyramid was being built.",
    "Random Fact: Betty White is older than sliced bread.",
    "Random Fact: From the time it was discovered to the time it was stripped of its status as a planet, Pluto hadn’t made a full trip around the Sun.",
    "Random Fact: The lighter was invented before the match.",
    "Random Fact: Anne Frank and Martin Luther King Jr. were born in the same year.",
    "Random Fact: France last used a guillotine to execute someone after Star Wars premiered.",
    "Random Fact: Harvard University was founded before Calculus existed.",
    "Random Fact: If you have 23 people in a room, there is a 50% chance that 2 of them have the same birthday.",
    "Random Fact: It’s never said that Humpty Dumpty was an egg in the nursery rhyme.",
    "Random Fact: The water in Lake Superior could cover all of North and South America in a foot of water.",
    "Random Fact: North Korea and Finland both border the same country; Russia.",
    "Random Fact: When you get a kidney transplant, they usually just leave your original kidneys in your body and put the 3rd kidney in your pelvis.",
    "Random Fact: Oxford University is older than the Aztec Empire.",
    "Random Fact: National animal of Scotland is a Unicorn.",
    "Random Fact: The Ottoman Empire still existed the last time the Chicago Cubs won the World Series.",
    "Random Fact: The lighter the roast of coffee, the more caffeine it has.",
    "Random Fact: A speck of dust is halfway in size between a subatomic particle and the Earth.",
    "Random Fact: If the timeline of earth was compressed into one year, humans wouldn’t show up until December 31 at 11:58 p.m.",
    "Random Fact: If you were able to dig a hole to the center of the earth, and drop something down it, it would take 42 minutes for the object to get there.",
    "Random Fact: We went to the moon before we thought to put wheels on suitcases.",
    "Random Fact: A human could swim through the arteries of a blue whale.",
    "Random Fact: If you could fold a piece of paper in half 42 times, the combined thickness would reach the moon.",
    "Random Fact: On both Saturn and Jupiter, it rains diamonds.",
    "Random Fact: Saudi Arabia imports camels from Australia.",
    "Random Fact: You can line up all 8 planets in our solar system directly next to each other and it would fit in the space between Earth and the Moon.",
    "Random Fact: The youngest known mother was 5 years old.",
    "Random Fact: The Earth is smoother than a billiard ball, if both were of the same size.",
    "Random Fact: Nintendo was founded in 1889.",
    "Random Fact: If you take all the molecules in a teaspoon of water and lined them up end to end in a single file line, they would stretch ~30 billion miles.",
    "Random Fact: In Australia, there was a war called the emu war. The emus won.",
    "Women, can't live with them....pass the beer nuts!",
    "The object of golf is to play the least amount of golf.",
    "The sinking of the Titanic must have been a miracle to the lobsters in the kitchen.",
    "Instead of all the prequel and sequel movies coming out, they should start making 'equels' - films shot in the same time period as the original film, but from an entirely different perspective.",
    "X88B88 looks like the word 'voodoo' reflecting off of itself.",
    "April Fools Day is the one day of the year that people critically evaluate news articles before accepting them as true.",
    "Websites should post their password requirements on their login pages so I can remember WTF I needed to do to my normal password to make it work on their site.",
    "Now that cellphones are becoming more and more waterproof, pretty soon it will be okay to push people into pools again.",
    "Maybe 'Are You Smarter Than a 5th Grader?' isn't a show that displays how stupid grown adults can be, but rather, a show that depicts how much useless information we teach grade schoolers that won't be retained or applicable later in life.",
    "Last night my friend asked to use a USB port to charge his cigarette, but I was using it to charge my book. The future is stupid.",
    "When Sweden is playing Denmark, it is SWE-DEN. The remaining letters, not used, is DEN-MARK.",
    "'Go to bed, you'll feel better in the morning' is the human version of 'Did you turn it off and turn it back on again?'",
    "In the future, imagine how many Go-Pros will be found in snow mountains containing the last moments of people's lives.",
    "We should have a holiday called Space Day, where lights are to be shut off for at least an hour at night to reduce light pollution, so we can see the galaxy.",
    "Your shadow is a confirmation that light has traveled nearly 93 million miles unobstructed, only to be deprived of reaching the ground in the final few feet thanks to you.",
    "Senior citizen discounts should just round dollar amounts down so we don't have to wait in line behind them while they dig for change.",
    "I have never once hit the space bar while watching a YouTube video with the intention of scrolling halfway down the page",
    "Since smart watches can now read your pulse, there should be a feature that erases your browser history if your heart stops beating.",
    "Waterboarding at Guantanamo Bay sounds super rad if you don’t know what either of those things are.",
    "The person who would proof read Hitler's speeches was literally a grammar Nazi.",
    "The older I get, the more people can kiss my a$$",
    "I can't tell if you are on too many drugs or not enough.",
    "My doctor told me to start killing people... Well not in those exact words.  He said I had to reduce stress in my life, which is pretty much the same thing.",
    "Love is spending the rest of your life with someone you want to kill & not doing it because you'd miss them!",
    "And there goes the last F*ck I gave!",
    "My girlfriend woke up this morning with a huge smile on her face.....I love Sharpies!",
    "You don't have to like me...I'm not a Facebook status",
    "I would love to visit you, but I live on the Internet.",
    "If you were running for President, I would vote for you. And clear your search history.  Don't worry I got you.",
    "Lord, please give me patience because if you give me strength, I'll need bail money too...",
    "DRAMA = Dumbass Rejects Asking for More Attention",
    "It's been 55 minutes since the last pearl jam song, what is wrong with you people?",
    "I am presently experiencing life at a rate of several WTF's per hour",
    "If you are a passenger in my car, and I turn the radio up....Do not talk!",
    "As a young child my mother told me I can be anyone I want to be ---- Turns out this is called identity theft!",
    "Do you ever just wanna grab someone by the shoulder, look them deep in the eyes and whisper 'No one gives a shit!!'",
    "Psst... I hear Eddie Vedder likes men",
    "I'm sorry I keep calling you and hanging up.  I just got this new voice activated phone, so every time I holler dumbass it dials you....",
    "Before Walmart you had to buy a ticket to the fair to see a bearded woman.",
    "Hold on a minute.... I'm gonna need something stronger than tea to listen to this BS!!",
    "My greatest fear is one day I will die, and my wife will sell my guns for what I told her I paid for them.",
    "Going to McDonals's for a salad is like going to a prostitute for a hug.",
    "Life is like diarrhea. No matter how hard you try to stop it, the shit keeps coming!!",
    "I'll never know how individuals can fake relationships....I can't even fake a hello to somebody I don't like.",
    "Have you ever had one of those days, when you're holding a stick and everybody looks like a Pinata?",
    "If a telemarketer calls, give the phone to your 3 year-old and tell her it's Santa!!",
    "Why do we use toilet paper?  I need wet wipes!  If you got shit on your arm would you just simply wipe it off with toilet paper?",
    "I'm not angry, I'm happiness challenged!",
    "If you have an opinion about me, please raise your hand....Now put it over your mouth!",
    "In the 80s kids learned from Sesame Street and Mr Rogers.  Now they learn from watching zombies who eat people,a vampires sucking, and teen stars. I'm a bit concerned about the future...",
    "I'd unfriend you but your train wreck life is too entertaining.",
    "When people tell me 'You're going to regret that in the morning' I sleep in until noon because I'm a problem solver.",
    "Dear YouTube it's pretty safe to assume we all want 'To Skip the Ad'",
    "I don't comment on your Facebook statuses for the same reason I don't step in dog shit when I see it.",
    "Today's tip: How to handle stress like a dog. If you can't eat it or play with it then pee on it and walk away.",
    "I do whatever it takes to get the job done. And sometimes it takes a vodka.",
    "Keep talking ... I'm diagnosing you.",
    "I wouldn't say that you have a problem with alcohol but maybe just a teensy weensy difficulty with sobriety.",
    "I don't know why you're complaining about your appearance. Your personality is even worse.",
    "You're so bad you're going to hell in every religion!",
    "I haven't heard from you lately and I've really enjoyed it.",
    "Some people should be thankful that I don't always comment my thoughts on their Facebook posts.",
    "Some days the best part of my job is that my chair swivels.",
    "If I had a nickle for every time you got on my nerves ...I'd have a sock full of nickles to hit you with!",
    "You know your children are growing up when they stop asking you where they came from and refuse to tell you where they're going.",
    "Wisdom for the ages: Never get into a fist fight with anyone who is uglier than you. They have nothing to lose.",
    "So you say you'll be here sometime between noon and five for the service call? Great. I'll be sure to pay my bill sometime between February and June.",
    "If women ran the world we wouldn't have wars, just intense negotiations every 28 days.",
    "To speak before you think is like wiping your ass before you shit!",
    "To the woman in Walmart with six screaming kids: If you're wondering how those condoms got in your shopping cart, you're welcome.",
    "I understand that some people live in their own little world. And sometimes I wish they'd stay there and never visit mine.",
    "I was hoping for a battle of wits but you appear to be unarmed.",
    "I used to be a people person but people ruined that for me.",
    "If you want to feel more attractive just go to Walmart and stay away from the people at the gym.",
    "WARNING: I have restless leg syndrome and may not be able to stop from kicking your ass. Now go ahead and continue with your shenanigans.",
    "There are some things better left unsaid but you can bet your sweet ass I'm going to say them anyway.  :kiss:",
    "I don't need an 'Easy' Button. I need a 'F*CK IT' Button!",
    "No it's okay. I totally wanted to drop everything I was going to do today to take care of your bullshit.",
    "I've had one of those days where my middle finger had to answer every question.",
    "Message to all the drama queens who are looking for attention: Please take a number and go wait in my 'I don't give a shit line'",
    "If it takes you more than an hour to get ready, then you might not be as good looking as you think you are!",
    "I don't judge people based on race, color, religion, sexuality, gender, ability or size. I base it on whether or not they're an asshole.",
    "There's only one thing keeping me from breaking you in half ... I don't want two of you around!",
    "If you have a problem with me please write it nicely on a piece of paper, put it in an envelope, fold it up and shove it up your a$$",
    "There are three kinds of people in the world. People who make things happen. People who watch things happen and people who say 'WTF happened?'",
    "I got so drunk last night, I walked across the dance floor to get a drink and won the dance contest.",
    "If women ruled the world there would be no wars. Just a bunch of jealous countries not talking to each other.",
    "Holy crap! Did you just feel that? I think the whole world just revolved around YOU!",
    "To error is human, to love is divine, to piss me off is a mistake!!",
    "You're right, it's my fault because I forgot you were an idiot.",
    "I'm not anti-social. I just have a strong aversion to B.S., drama and pretending.",
    "I'm Larry. This is my brother, Darryl, and this is my other brother, Darryl",
    "My sex life is like a Ferrari...I don't have a Ferrari.",
    "I just saved a bunch of money on my car insurance by switching...my car into reverse and driving away from the accident. ",
    "No I'm not ignoring you. I suffer from selective hearing, usually triggered by idiots.",
    "I think it's only fair to throw monopoly money at strippers with fake boobs.",
    "Note to Self: It is illegal to stab people for being stupid.",
    "I'm in love with my bed. We're perfect for each other but my alarm clock doesn't want us together. That jealous whore!",
    "Pain makes you stronger. Tears make you braver. A broken heart makes you wiser. And alcohol makes you not remember any of that crap.",
    "Last time I bought a package of condoms and the cashier asked me, 'Do you need a bag?' I said, 'No she isn't that ugly.'",
    "Alcohol won’t solve my problems, but then again neither will milk or orange juice.",
    "I just failed my Health and Safety test. The question was 'what steps would you take in the event of a fire?'. Apparently 'big f*cking ones' was the wrong answer.",
    "Grammar: It's the difference between knowing your shit and knowing you're shit",
    "Only in math problems can you buy 60 cantaloupes and nobody asks what the hell is wrong with you.",
    "Who named Trojan Condoms? The Trojan Horse entered through the city gates, broke open and loads of little guys came out and messed up everyones day.",
    "People who create their own drama deserve their own karma.",
    "ACHOO! If you're allergic to bull-crap, drama, head games, liars, & fake people, keep this sneeze going. I can't wait to see who all does this.",
    "I have to stop saying 'How stupid can you be'. I think people are starting to take it as a challenge.",
    "There's a good chance you don't like me BUT an even better chance that I don't give a crap.",
    "I have a batman outfit hanging in my closet just to screw with myself when I get Alzheimer's.",
    "I love it when someone insults me. That means I don’t have to be nice anymore.",
    "I'm sarcastic and have a Smartass attitude. It's a natural defense against Drama, Bullshit and Stupidity. And I don't give a @#$& if you're offended!",
    "Give a man a fish and he will eat for a day. Teach him how to fish, and he will sit in a boat and drink beer all day.",
    "Never go to bed angry. Always stay up and plot your revenge first.",
    "I don't hate you. I'm just not necessarily excited about your existence.",
    "Life is not like a box of chocolates. It's more like a jar of jalapenos. What you do today might burn your ass tomorrow.",
    "I know the voices in my head aren't real..... but sometimes their ideas are just absolutely awesome!",
    "Doing nothing is hard, you never know when you're done.",
    "If you didn't see it with your own eyes, or hear it with your own ears, don't invent it with your small mind and share it with your big mouth!",
    "No matter how smart you are you can never convince a stupid person that they are stupid.",
    "I'm not lazy, I'm just very relaxed.",
    "It's not important to win, it's important to make the other guy lose.",
    "I am too lazy to be lazy.",
    "To make a mistake is human, but to blame it on someone else, that's even more human.",
    "Always remember you're unique, just like everyone else.",
    "Taking your ex back is like going to a garage sale and buying your own crap.",
    "To error is human, to love is divine, to piss me off is a mistake.",
    "A day without dealing with stupid people is like ..., oh never mind, I'll let you know if that ever happens.",
    "One spelling mistake can ruin your life. One husband texted this to his wife: 'Having a wonderful time. Wish you were her.'",
    "Insanity does not run in my family. It strolls through, takes its time and gets to know everyone personally.",
    "I'm so sick and tired of my friends who can't handle their alcohol. The other night they dropped me 3 times while carrying me to the car.",
    "If I say something that offends you, please let me know so I can say it again later.",
    "You're starting to sound reasonable, must be time to up my medications.",
    "Lead me not into temptation, I can find it myself.",
    "Never take life too seriously. Nobody gets out alive anyways.",
    "I didn't say it was your fault. I said I was going to blame you.",
    "My opinions may have changed, but not the fact that I'm right.",
    "WARNING - I have an attitude and I know how to use it.",
    "It's my cat's world. I'm just here to open cans.",
    "I used to be indecisive, but now I’m not too sure.",
    "Lord help me to be the person my dog thinks I am.",
    "Too much of a good thing can be wonderful. - Mae West",
    "I don’t have an attitude problem. You have a perception problem.",
    "People who think they know everything are annoying to those of us who do.",
    "I’m an excellent housekeeper. Every time I get a divorce I keep the house.",
    "I still miss my ex – but guess what? My aim is getting better.",
    "A good lawyer knows the law, a great lawyer knows the judge.",
    "Hey look squirrel",
     "Women, can't live with them....pass the beer nuts!",
    "Do vegetarians eat animal crackers? ",
    "If a jogger runs at the speed of sound, can he still hear his iPod?",
    "If man evolved from monkeys, how come we still have monkeys? ",
    "How do you handcuff a one-armed man?",
    "If God sneezes, what should you say? ",
    "Why is it that everyone driving faster than you is considered an idiot and everyone driving slower than you is a moron? ",
    "Why do they call the little candy bars 'fun sizes'. Wouldn't it be more fun to eat a big one? ",
    "Is it legal to travel down a road in reverse, as long as your following the direction of the traffic?",
    "Why doesn't the fattest man in the world become a hockey goalie? ",
    "When Atheists go to court, do they have to swear on the bible?",
    "How can something be 'new' and 'improved'? if it's new, what was it improving on?",
    "Why do they sterilize lethal injections?",
    "Why aren't drapes double sided so it looks nice on the inside and outside of your home?",
    "Is a pessimist's blood type B-negative? ",
    "Beer is proof that God loves us and wants us to be happy.",
    "I'm trying to see things from your point of view, but I can't get my head that far up your a**. ",
    "Never underestimate the power of stupid people in large groups.",
    "Sometimes my mind wanders; other times it leaves completely.",
    "I am free of all prejudices. I hate everyone equally. ",
    "Why is it that when we 'skate on thin ice', we can 'get in hot water'?",
    "If pro and con are opposites, wouldn't the opposite of progress be congress? ",
    "Why does the Easter bunny carry eggs? Rabbits don't lay eggs.",
    "Why does caregiver and caretaker mean the same thing?",
    "Last night I was looking at the stars and I wondered... where the hell's my ceiling! ",
    "Never play leap frog with a unicorn. Just sayin'.... ",
    "If it's tourist season why can't we shoo them?",
    "What is converted rice and what was it before it converted?",
    "They always say the body was found in a shallow grave!  Don't be lazy, dig a deep grave.",
    "Friends help you move. Real friends help you move dead bodies.",
    "If something 'goes without saying' why do people still say it?",
    "If you don't pay your exorcist, do you get repossessed?",
    "Where are all the mentally handicapped parking spaces for people like me?",
    "Isn't Disney World a people trap operated by a mouse?",
    "If milk goes bad if not refrigerated, why does it not go bad inside the cow?",
    "What's the difference between normal ketchup and fancy ketchup?",
    "Friendship is like peeing on yourself: everyone can see it, but only you get the warm feeling that it brings. ",
    "There are no stupid questions, just stupid people. ",
    "When I die, I want to go peacefully like my Grandfather did, in his sleep -- not screaming, like the passengers in his car. ",
    "You have a cough? Go home tonight, eat a whole box of Ex-Lax, tomorrow you'll be afraid to cough. ",
    "I could tell that my parents hated me. My bath toys were a toaster and a radio. ",
    "Can I lend a machete to your intellectual thicket?",
    "If a kid refuses to sleep during nap time, are they guilty of resisting a rest? ",
    "A child of five would understand this. Send someone to fetch a child of five. ",
    "Anyone who says he can see through women is missing a lot. ",
    "Before I speak, I have something important to say. ",
    "Either he's dead or my watch has stopped. ",
    "I have a mind to join a club and beat you over the head with it. ",
    "I have had a perfectly wonderful evening, ... but this wasn't it. ",
    "I intend to live forever, or die trying. ",
    "I must confess, I was born at a very early age. ",
    "I must say I find television very educational. The minute somebody turns it on, I go to the library and read a good book. ",
    "I never forget a face, but in your case I'll be glad to make an exception. ",
    "I refuse to join any club that would have me as a member. ",
    "I remember the first time I had sex - I kept the receipt. ",
    "I was married by a judge. I should have asked for a jury. ",
    "I worked my way up from nothing to a state of extreme poverty. ",
    "I've got the brain of a four year old. I'll bet he was glad to be rid of it. ",
    "If I held you any closer I would be on the other side of you. ",
    "If you've heard this story before, don't stop me, because I'd like to hear it again. ",
    "Man does not control his own fate. The women in his life do that for him. ",
    "Marriage is a wonderful institution, but who wants to live in an institution? ",
    "Military intelligence is a contradiction in terms. ",
    "My mother loved children - she would have given anything if I had been one.",
    "Next time I see you, remind me not to talk to you. ",
    "No man goes before his time - unless the boss leaves early. ",
    "One morning I shot an elephant in my pajamas. How he got into my pajamas I'll never know. ",
    "Outside of a dog, a book is a man's best friend. Inside of a dog it's too dark to read. ",
    "Politics is the art of looking for trouble, finding it everywhere, diagnosing it incorrectly and applying the wrong remedies. ",
    "Practically everybody in New York has half a mind to write a book, and does. ",
    "Quote me as saying I was mis-quoted. ",
    "Room service? Send up a larger room. ",
    "She got her looks from her father. He's a plastic surgeon. ",
    "The secret of life is honesty and fair dealing. If you can fake that, you've got it made. ",
    "There's one way to find out if a person is honest - ask them. If they says, 'Yes', you know they are a crook. ",
    "Those are my principles, and if you don't like them... well, I have others. ",
    "Well, Art is Art, isn't it? Still, on the other hand, water is water. And east is east and west is west and if you take cranberries and stew them like applesauce they taste much more like prunes than rhubarb does. Now you tell me what you know. ",
    "Who are you going to believe, me or your own eyes? ",
    "Whoever named it necking was a poor judge of anatomy.", 
    "Why should I care about posterity? What's posterity ever done for me? ",
    "Why, I'd horse-whip you if I had a horse. ",
    "Life changes so fast - DO something and you can change it. A small change every day amounts to a lot very quickly.",
    "You're never too late for an uprising!",
    "You can't hear me because I'm not saying anything.",
    "Elephants are not made to hop up and down.",
    "If I ever meet myself, I'll hit myself so hard I won't know what hit me.",
    "I don't negotiate with terrorists - 'Merica!!",
    "Would you think guanaria should cure diarrhea.... think about it...",
    "What's the point of having a democracy, if everybody's going to vote wrong?",
    "Would you rather: A. Eat a bowl of shit once OR B. have explosive diarrhea for the rest of your life?",
    "Would you rather: A. Have sex with a goat, but no one would know OR B. not have sex with one, but everyone would think you did?",
    "Would you rather: A. Always have to say everything on your mind OR B. never speak again?",
    "Would you rather: A. Be able to turn invisible OR B. be able to fly?",
    "Space, it seems to go on and on forever. But then you get to the end and a gorilla starts throwing barrels at you.",
    "I was having the most wonderful dream. Except you were there, and you were there, and you were there!",
    "Hey, this is mine. That's mine. All of this is mine. Except that bit. I don't want that bit. But all the rest of this is mine. Hey, this has been a really good day.",
    "Time - Unknown. Location - Unknown. Cause of accident - Unknown. Should someone find this recording, perhaps it will shed light as to what happened here.",
    "That settles it. Spankings all around, then.",
    "I feel pretty, Oh so pretty",
    "I'm feeling a bit kinky... anyone up for some robot fun?",
    "Never let good science, reason, and logic get in the way of a good conspiracy!",
    "I refer you to on-line sources, which can be changed at any time.",
    "It seems normal when they tell you about it, but then a whole camera crew appears and suddenly it's not so fun any more.",
    "Bugs like to touch themselves with their antennae while they watch you sleeping.",
    "I apologize for being the only person who truly comprehends how screwed we are!",
    "Imagination will often carry us to worlds that never were. But without it we go nowhere.",
    "The important thing is not to stop questioning; curiosity has its own reason for existing.",
    "I've got thrills to seek, deaths to defy, mattress tags to tear off.",
    "Don't tell BK but I have run with scissors",
    "Now, it's quite simple to defend yourself against a man armed with a banana. First of all you force him to drop the banana; then, second, you eat the banana, thus disarming him. You have now rendered him 'elpless.",
    "No way, spank your OWN monkey.",
    "If a cloud was the same as a fool, how would you feel about rain?",
    "Monkey recovery program. SIGN UP HERE.",
    "I am ROBOT... hear me beep.",
    "If you get a minute, give it to me.  I'm collecting them to get an extra hour.",
    "Damn shampoo commercials, hair isn't that fun.",
    "No, YOU are the hallucination! Oh wait, that was something else. Never mind.",
    "I'm not crazy. Don't call me crazy! I'm just not user-friendly!",
    "The wizards can't see you now",
    "I know where you live... each and every one of you!",
    "Are you taunting me?",
    "Go away or I shall taunt you a second time",
    "Please save all your bad tunes for a time when I'm not around.  Thanks!",
    "You don’t notice the air, until someone spoils it.",
    "Don’t drink while driving – you will spill the beer.",
    "If you love a woman, you shouldn’t be ashamed to show her to your wife.",
    "Life didn’t work out, but everything else is not that bad.",
    "I feel like Tampax – at a good place, but wrong time…",
    "If someone notices you with an open zipper, answer proudly: professional habit.",
    "If you’re not supposed to eat at night, why is there a light bulb in the refrigerator?",
    "FRIDAY is my second favorite F word.",
    "There is a new trend in our office; everyone is putting names on their food. I saw it today, while I was eating a sandwich named Kevin.",
    "The speed of light is when you take out a bottle of beer out of the fridge before the light comes on.",
    "To weigh 50 kilos and say that you’re fat, that is so female…",
    "I have been to many places but my goal is to go everywhere.",
    "If Mayans could predict the future, why didn’t they predict their extinction?",
    "Did you know that your body is made 70% of water? And now I’m thirsty.",
    "Don’t forget that alcohol helps to remove the stress, the bra, the panties and many other problems.",
    "Alcohol not only expands the blood vessels but also communications.",
    "Alcohol not only helps to make new acquaintances, but also end the old once. ",
    "If only I knew that I will have this headache today, I would have got drunk yesterday.",
    "All the problems fade before a hangover…",
    "Tequila is a good drink: you drink it and you feel like a cactus; the only problem is that in the morning the thorns grow inward.",
    "After the weekend the most difficult task is to remember names… ",
    "It’s better to be a worldwide alcoholic, than an Alcoholic Anonymous.",
    "In principle, I can stop drinking, the thing is – I don’t have such a principle.",
    "I know my limits: if I fall down it means enough.",
    "Why is there so much blood in my alcohol system?",
    "I say NO to the drugs, but they won’t listen.",
    "Smoking is a slow death! But we’re not in a hurry…",
    "I became a vegetarian – switched to weed.",
    "We must pay for the mistakes of our youth… at the drugstore.",
    "Friends come and go. Enemies pile up.",
    "I would like to know when someone unfriends me on Facebook, so I could like it.",
    "Maybe you need a ladder to climb out of my business?",
    "I like the sound of you not talking.",
    "I’m not a Facebook status, you don’t have to like me.",
    "I found your nose in my business again.",
    "If a man gives you flowers without any reason, it means there is a reason.",
    "Women can perfectly understand other people, if the people are not men.",
    "Women are very good! They can forgive a man…even if he’s not guilty.",
    "A toast to women: it’s not that good with you, as it is bad without you.",
    "If you think you are fooled by destiny – remember Al Bundy.",
    "God gave us the brain to work out problems. However, we use it to create more problems.",
    "Don’t be nervous if someone is driving ahead of you- the world is round, just think that you’re driving first!",
    "If you can’t beat the record, you can beat up its owner.",
    "Dream carefully, because dreams come true.",
    "Everything always ends well. If not – it’s probably not the end.",
    "If you want but can’t. It means you don’t want it enough.",
    "It’s better to do and regret than regret of not doing.",
    "Everything you do you’re gonna regret. But if you do nothing – you will not only regret but will also suffer.",
    "You’re not sure – outrun and make sure.",
    "The deeper the pit you’re falling into, the more chance you have to learn how to fly.",
    "If you don’t care where you are – it means you’re not lost.",
    "The light at the end of the tunnel – are the front lights of a train.",
    "If the fortune has turned her back on you, you can do whatever you want behind her back.",
    "It is said that, you can’t buy happiness. You only need to know the right places…",
    "If there would be no fools – we would be them.",
    "Artificial intelligence is nothing compared to natural stupidity.",
    "Common sense is not so common",
    "Why there are mistakes that can’t be set right and why are there no mistakes that can’t be done?",
    "Think how much you could do if you wouldn’t care what others think.",
    "I made the same mistakes for so many times, that now I call them traditions.",
    "Here food is a luxury that you don’t need to take your pants off for.",
    "Some people feel the rain. Others just get wet.",
    "Some people are so poor, all they have is money.",
    "It’s just a bad day, not a bad life.",
    "Common sense is like deodorant - The people who need it never use it",
    "Walk away from stupidity and your world becomes a better place",
    "Common sense is not a gift, it's a punishment.  Because you have to deal with those who don't have it.",
    "I know I don’t look like much now, but I’m drinking milk ",
    "I know I don’t look like much now, but I’m drinking milk. ",
    "If I followed you home, would you keep me? ",
    "I always wrap my shit. Using a smart phone without a case is like having unprotected sex. It feels so good but the consequences suck."
    ]
};
//SECTION AI: All Larry AI functionality:
var AI = {
  larryAI: function(chat, username)  {  //Added 04/03/2015 Zig
    try  {
    var fuComment = "";

    var chatmsg = chat.toUpperCase();
    botDebug.debugMessage(false, "Larry AI chatmsg: " + chatmsg);
    chatmsg = chatmsg.replace(/\W/g, '')      // Remove all non-alphanumeric values
    chatmsg = chatmsg.replace(/[0-9]/g, '');  // Remove all numeric values
    chatmsg = chatmsg.replace(/'/g, '');
    chatmsg = chatmsg.replace("\'", '');
    chatmsg = chatmsg.replace('\'', '');
    chatmsg = chatmsg.replace(/&#39;/g, '');
    chatmsg = chatmsg.replace(/@/g, '');
    chatmsg = chatmsg.replace(/,/g, '');
    chatmsg = chatmsg.replace(/-/g, '');
    chatmsg = chatmsg.replace(/_/g, '');
    chatmsg = chatmsg.replace(/ /g, '');
    chatmsg = chatmsg.replace(/THELAW/g, '');
    chatmsg = chatmsg.replace(/CRAZYBOT/g, '');
    chatmsg = chatmsg.replace(/FUCKBOT/g, "LARRY");
    chatmsg = chatmsg.replace(/BOTT/g, "LARRY");
    chatmsg = chatmsg.replace(/BOT/g, "LARRY");
    chatmsg = chatmsg.replace(/HOWIS/g, "HOWS");     // Convert 2 words to the contraction
    chatmsg = chatmsg.replace(/YOUARE/g, "YOURE");   // Convert 2 words to the contraction
    chatmsg = chatmsg.replace(/LARRYIS/g, "LARRYS");
    chatmsg = chatmsg.replace(/LARRY_THE_LAW/g, "LARRY");
    chatmsg = chatmsg.replace(/IAM/g, "IM");
    botDebug.debugMessage(false, "Larry AI chatmsg: " + chatmsg);

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
    if (chatmsg.indexOf("BLOWMELARRY") > -1) fuComment = "Can't right now %%FU%%, don't have a magnifying glass on me";
    if (chatmsg.indexOf("MISSYOULITTLEBUDDY") > -1) fuComment = "I'll miss you too %%FU%%!";
    if (chatmsg.indexOf("MISSYALITTLEBUDDY") > -1) fuComment = "I'll miss you too %%FU%%!";
    if (chatmsg.indexOf("ILOVEYOULARRY") > -1) fuComment = " :kiss: %%FU%%";
    if (chatmsg.indexOf("ILOVELARRY") > -1) fuComment = " :kiss: %%FU%%";
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
    if (chatmsg.indexOf("LARRYUNDERSTANSSME") > -1) fuComment = "BAHAHAHA, I'm merely acting %%FU%%";
    if (chatmsg.indexOf("DOYOUHATEMELARRY") > -1) fuComment = "Does the tin-man have a sheet metal cock %%FU%%?";
    if (chatmsg === "LARRY?") fuComment = "WHAT??!?!??";
    if (chatmsg.indexOf("LARRYSTILLHATESME") > -1) fuComment = "You make it too easy %%FU%%!";
    if (chatmsg.indexOf("DOYOULIKEMELARRY") > -1) fuComment = "Does Grizzly Adams have a beard %%FU%%?";
    if (chatmsg.indexOf("DOYOULOVEMELARRY") > -1) fuComment = "Is a bear catholic? Does the pope shit in the woods %%FU%%?";
    if (chatmsg.indexOf("LARRYDOYOULOVEME") > -1) fuComment = "Is a bear catholic? Does the pope shit in the woods %%FU%%?";
    
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
    if (chatmsg.indexOf("IMISSEDYOULARRY") > -1) fuComment = "I missed you too %%FU%%!";
    if (chatmsg.indexOf("IMISSYOULARRY") > -1) fuComment = "I miss you too %%FU%%!";
    if (chatmsg.indexOf("IMISSLARRY") > -1) fuComment = "I miss you too %%FU%%!";
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
    if (fuComment.length > 0) setTimeout(function () { API.sendChat(botChat.subChat(fuComment, {fu: username})); }, 100);
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
//SECTION API: All API functionality:
var API = {
  main: {
    initbot: function() {
      if (window.APIisRunning) {
        console.log("[PlugAPI-Dubtrack] already running...")
        return;
      }

      window.APIisRunning = true;
      botVar.botName = API.getBotName();
	  botVar.roomID = API.getRoomID();
      if (botVar.botName.length < 1) botVar.botName = "larry_the_law";
      botChat.loadChat();
      SETTINGS.retrieveFromStorage();
      SETTINGS.retrieveSettings();
      USERS.resetAllUsersOnStartup();
      USERS.loadUsersInRoom(false);
      USERS.removeMIANonUsers();

        botVar.currentSong = API.currentSongName();
      botVar.currentDJ   = API.currentDjName();
      botDebug.debugMessage(false, "botVar.currentDJ: " + botVar.currentDJ);
      
      //OnSongUpdate Events
      $('.currentSong').bind("DOMSubtreeModified", API.on.EVENT_SONG_ADVANCE);
      $('.chat-main').bind("DOMSubtreeModified", API.on.EVENT_NEW_CHAT);
      $('.room-user-counter').bind("DOMSubtreeModified", API.on.EVENT_USER_JOIN);
      $('.dubup').bind("DOMSubtreeModified", API.on.EVENT_DUBUP);
      $('.dubdown').bind("DOMSubtreeModified", API.on.EVENT_DUBDOWN);


      RANDOMCOMMENTS.randomCommentSetTimer();
      RANDOMCOMMENTS.randomInterval = setInterval(function () { RANDOMCOMMENTS.randomCommentCheck() }, 30 * 1000);
      USERS.loadUserInterval = setInterval(function () { USERS.loadUsersInRoom(true); }, 5 * 1000);

      //todoer AFK DJ CHECK:
      //AFK.afkInterval = setInterval(function () { AFK.afkCheck() }, 10 * 1000);

      API.sendChat(botChat.subChat(botChat.getChatMessage("online"), {botname: botVar.botName, version: botVar.version}));
      botVar.botStatus = true;
      botVar.botRunning = true;

      // [...]
    },
  },

  //todoerererererererer
  reorderQueue: function(usrObjectID, queuePos){
    try {
  //https://api.dubtrack.fm/room/5602ed62e8632103004663c2/queue/order
  //560be6cbdce3260300e40770&order%5B%5D=564933a1d4dcab140021cdeb
    }
    catch(err) {UTIL.logException("reorderQueue: " + err.message); }
  },

  //todoerererererererer
  pauseUserQueue: function(usrObjectID){
    try {
	  //https://api.dubtrack.fm/room/5602ed62e8632103004663c2/queue/user/564933a1d4dcab140021cdeb/pause
	  //564933a1d4dcab140021cdeb - dexter_nix
	  //560be6cbdce3260300e40770 - Levis_Homer
	  //542465ce43f5a10200c07f11 - Doc_Z

      var roomUser = USERS.defineRoomUser(usrObjectID);
	  botDebug.debugMessage("UserID: " + roomUser.id);
	  if (roomUser.id !== "564933a1d4dcab140021cdeb") roomUser.id = "564933a1d4dcab140021cdeb";     //todoerererererererer DELETE
      $.ajax({
            url: "https://api.dubtrack.fm/room/" + botVar.roomID + "/queue/user/" + roomUser.id + "/pause",
            type: "PUT"
        });
		
    }
    catch(err) {UTIL.logException("pauseUserQueue: " + err.message); }
  },

  getDJ: function(){
    return USERS.lookupUserName(API.currentDjName());
  },

  getWaitListPosition: function(id){
    try {
        if(typeof id === 'undefined' || id === null){
            id = API.getCurrentDubUser().id;
        }
        var wl = API.getWaitList();
        for(var i = 0; i < wl.length; i++){
            if(wl[i].id === id){
                return i;
            }
        }
        return -1;
    }
       catch(err) {
       UTIL.logException("getWaitListPosition: " + err.message);
    }
  },
  mehThisSong: function () {
    try  {  $('.dubdown').click();    }  
    catch(err) { UTIL.logException("mehThisSong: " + err.message); }
  },
  wootThisSong: function () {
    try  { $('.dubup').click(); }  
    catch(err) { UTIL.logException("wootThisSong: " + err.message); }
  },

  //todoer COMPLETE
  waitListItem: function (dubQueueItem) {
    try {
        this.id = dubQueueItem.userid;
        this.username = dubQueueItem._user.username;
        this.songlength = dubQueueItem.songLength;
        this.songid = dubQueueItem.songid;
		this.songname = dubQueueItem._song.name;
	}
    catch(err) { UTIL.logException("waitListItem: " + err.message); }
  },
  
  getWaitList: function () {
    try {
	  API.defineRoomQueue();
      for (var i = 0; i < dubBot.queue.dubQueue.data.length; i++) {
	    waitlist.push(API.waitListItem(dubBot.queue.dubQueue.data[i]));
	  }
	}
    catch(err) { UTIL.logException("getWaitList: " + err.message); }
  },
  getCurrentDubUser: function () {
    return USERS.lookupUserName(botVar.botName);
  },
  getDubUserID: function (userid) {
    try {
      //todoer COMPLETE
      //return API.getUser(userid);
    }
    catch(err) { UTIL.logException("getDubUserID: " + err.message); }
  },
  getDubUser: function (user) {
    try {
        return API.getUser(user);
    }
    catch(err) { UTIL.logException("getDubUser: " + err.message); }
  },
  getUser: function (user) {
    try {
        return API.getDubUserID(user.id);
    }
    catch(err) {
      UTIL.logException("getUser: " + err.message);
    }
  },
  
  getPermission: function (obj) { //1 requests
    try {
      return 10;
      // TODOER
      //var u;
      //if (typeof obj === "object") u = obj;
      //else u = API.getDubUserID(obj);
      //if (botCreatorIDs.indexOf(u.id) > -1) return 10;    // admin
      //if (botVar.botID === u.id) return 4;          // cohost
      //if (u.gRole < 2) return u.role;
      //else {
      //switch (u.gRole) {
      //    case 2:
      //        return 7;
      //    case 3:
      //        return 8;
      //    case 4:
      //        return 9;
      //    case 5:
      //        return 10;
      //}
      //}
      //return 0;
    }
    catch(err) {
      UTIL.logException("getPermission: " + err.message);
    }
  },
  moderateDeleteChat: function (cid) {
    // todoer
    // *[@id="562ba5be67a3641400ebabfb-1447537287106"]/div/div[1]/span    
    // #\35 62ba5be67a3641400ebabfb-1447537287106 > div > div.chatDelete > span

    //    $.ajax({
    //        url: "https://plug.dj/_/chat/" + cid,
    //        type: "DELETE"
    //    });
  },
  chatLog: function(txt) {
    var b = new Dubtrack.View.chatLoadingItem;
    b.$el.text(txt).appendTo(Dubtrack.room.chat._messagesEl);
  },

  sendChat: function(message) {
    //todoer Delete this after we re-enable the bot kill on room change code.
    //if(botVar.room.botRoomUrl != window.location.pathname) return;  // If we leave the room where we started the bot stop displaying messages.
	message = message.split("[:").join("[ :");  // Replace ALL [: with [ :  (works better than replace for replacing all instances)
    if (botVar.botMuted === true)
        API.logInfo(message);
    else if (botVar.botRunning) {
        //Max length: 140
        if (message.length > 135) {
            var space = message.indexOf(' ', 120);
            if (space === -1) space = 120;
            API.sendChat(message.substring(0, space));
            setTimeout(function () { API.sendChat(message.substring(space))  }, 500);
            return;
        }
        Dubtrack.room.chat._messageInputEl.val(message);
        Dubtrack.room.chat.sendMessage();
        botVar.ImHidden = false;
    }
    else 
        API.chatLog(message);
    
  },
  
  getDubUpCount: function() {
    try        { return parseInt($(".dubup").text()); }
    catch(err) { UTIL.logException("getDubUpCount: " + err.message); }
  },
  getSongLength: function() {
    try        { return parseInt($(".min").text()); }
    catch(err) { UTIL.logException("getSongLength: " + err.message); }
  },
  getDubDownCount: function() {
    try        { return parseInt($(".dubdown").text()); }
    catch(err) { UTIL.logException("getDubDownCount: " + err.message); }
  },
  getGrabCount: function() {
    try        { return parseInt($(".grab-counter").text()); }
    catch(err) { UTIL.logException("getGrabCount: " + err.message); }
  },
  getBotName: function() {
    try { return $(".user-info").text();    }
    catch(err) { UTIL.logException("getBotName: " + err.message); }
  },

  //todoerererererererer
  defineRoomQueue: function() {
    try {
	  //https://api.dubtrack.fm/room/5600a564bfb6340300a2def2/playlist/details
      dubBot.queue.dubQueueResp = $.ajax({
            url: "https://api.dubtrack.fm/room/" + botVar.roomID + "/playlist/details",
            type: "GET",   
            async: false });
	  botDebug.debugMessage(true, "IS OBJECT: Step 1");
	  if (typeof dubBot.queue.dubQueueResp === "object") botDebug.debugMessage(true, "IS OBJECT: dubBot.queue.dubQueueResp");
	  botDebug.debugMessage(true, "IS OBJECT: Step 2");
	  if (typeof dubBot.queue.dubQueueResp.responseText === "object") botDebug.debugMessage(true, "IS OBJECT: dubBot.queue.dubQueueResp.responseText");
	  botDebug.debugMessage(true, "IS OBJECT: Step 3");
	  UTIL.logObject(dubBot.queue.dubQueueResp, "RESP");
	  botDebug.debugMessage(true, "IS OBJECT: Step 4");
	  botDebug.debugMessage(true, "TYPE OF: " + (typeof dubBot.queue.dubQueueResp.responseText));
	  botDebug.debugMessage(true, "IS OBJECT: Step 5");

	  botDebug.debugMessage(true, "response Len: " + dubBot.queue.dubQueueResp.responseText.length);
	  botDebug.debugMessage(true, "IS OBJECT: Step 6");
	  botDebug.debugMessage(true, "response: (" + dubBot.queue.dubQueueResp.responseText + ")");
	  botDebug.debugMessage(true, "IS OBJECT: Step 7");
      dubBot.queue.dubQueue = JSON.parse(dubBot.queue.dubQueueResp.responseText);
	  botDebug.debugMessage(true, "IS OBJECT: Step 8");
	  //dubBot.queue.dubQueueResp.responseText
	  //dubBot.queue.dubQueueResp.responseText
	  //dubBot.queue.dubQueueResp.responseText is undefined botx.js:1461:5
	  //dubBot.queue.dubQueueResp.responseText

	  UTIL.logObject(dubBot.queue.dubQueue, "QUEUE");
	  botDebug.debugMessage(true, "Room Queue Count: " + dubBot.queue.dubQueue.data.length);
	  if (dubBot.queue.dubQueue.data.length === 0) return;
	  for (var i = 0; i < dubBot.queue.dubQueue.data.length; i++) {
			botDebug.debugMessage(true, "RoomID Item[" + i + "]" + dubBot.queue.dubQueue.data[i].roomid);
			botDebug.debugMessage(true, "UserID Item[" + i + "]" + dubBot.queue.dubQueue.data[i].userid);
			botDebug.debugMessage(true, "Song Length Item[" + i + "]" + dubBot.queue.dubQueue.data[i].songLength);
	  }

	}
    catch(err) { UTIL.logException("defineRoomQueue: " + err.message); }
	},
	
  /*
{  
   "data":[  
      {  
         "roomid":"5602ed62e8632103004663c2",
         "songLength":166000,
         "userid":"560be6cbdce3260300e40770",
         "_user":{  
            "_id":"560be6cbdce3260300e40770",
            "username":"Levis_Homer",
            "roleid":1,
         },
         "_song":{  
            "_id":"560c5fd23ba1f50300a418e4",
            "name":"The Living End - I've Just Seen A Face (Acoustic - Live at Visions MAG)",
            "description":"The Living End performed afew songs for Visions MAG in Germany. This is one of them.\r\n\r\nI've Just Seen A Face is a great Beatles song, and a fantastic cover...though Chris screwed up the solo a bit lol.",
            "type":"youtube",
            "fkid":"AcEyKsNjYcw",
            "songLength":166000,
         },
      }
   ]
}  */

  //todoerererererererer
  getRoomID: function() {
    //      var roomid = "5602ed62e8632103004663c2";
	//Tasty Tunes Room ID: 5600a564bfb6340300a2def2
	//        RGT Room ID: 5602ed62e8632103004663c2
    try { return "5602ed62e8632103004663c2";    }
    catch(err) { UTIL.logException("getBotName: " + err.message); }
  },

  getBotName: function() {
    try { return $(".user-info").text();    }
    catch(err) { UTIL.logException("getBotName: " + err.message); }
  },
  currentSongName: function() {
    try { return $(".currentSong").text();    }
    catch(err) { UTIL.logException("currentSongName: " + err.message); }
  },
  currentDjName: function() {
    try {
      var userInfo = document.getElementsByClassName("infoContainerInner");
      botDebug.debugMessage(false, "userInfo count: " + userInfo.length);
      var spans = userInfo[0].getElementsByClassName("currentDJSong");
      var djName = spans[0].innerHTML;
      botDebug.debugMessage(false, "djName: " + djName);
      djName = djName.replace("is playing", "");
      botDebug.debugMessage(false, "djName: " + djName.trim());
      return djName.trim();
    }
    catch(err) { UTIL.logException("currentDjName: " + err.message); }
  },
  //<li id="560be6cbdce3260300e40770-1447722815886" class="user-560be6cbdce3260300e40770 current-chat-user"><div class="stream-item-content"><div class="chatDelete"><span class="icon-close"></span></div><div class="image_row"><img src="https://api.dubtrack.fm/user/560be6cbdce3260300e40770/image" alt="levis_homer" onclick="Dubtrack.helpers.displayUser('560be6cbdce3260300e40770', this);" class="cursor-pointer" onerror="Dubtrack.helpers.image.imageError(this);"></div><div class="activity-row"><div class="text"><p><a href="#" class="username">levis_homer</a> test</p></div><div class="meta-info"><span class="username">levis_homer </span><i class="icon-dot"></i><span class="timeinfo"><time title="11/16/2015, 8:13:33 PM" class="timeago" datetime="2015-11-17T01:13:33.552Z">2 minutes ago</time></span></div></div></div></li>

  //<li id="564933a1d4dcab140021cdeb-1447720313471" class="user-564933a1d4dcab140021cdeb"><div class="stream-item-content"><div class="chatDelete"><span class="icon-close"></span></div><div class="image_row"><img src="https://api.dubtrack.fm/user/564933a1d4dcab140021cdeb/image" alt="dexter_nix" onclick="Dubtrack.helpers.displayUser('564933a1d4dcab140021cdeb', this);" class="cursor-pointer" onerror="Dubtrack.helpers.image.imageError(this);"></div><div class="activity-row"><div class="text"><p><a href="#" class="username">dexter_nix</a> sadf</p></div><div class="meta-info"><span class="username">dexter_nix </span><i class="icon-dot"></i><span class="timeinfo"><time title="11/16/2015, 7:31:53 PM" class="timeago" datetime="2015-11-17T00:31:53.471Z">14 minutes ago</time></span></div></div></div></li>
  
  //<li class="user-542465ce43f5a10200c07f11 current-chat-user isCo-owner" id="542465ce43f5a10200c07f11-1447723108852"><div class="stream-item-content"><div class="chatDelete"><span class="icon-close"></span></div><div class="image_row"><img src="https://api.dubtrack.fm/user/542465ce43f5a10200c07f11/image" alt="doc_z" onclick="Dubtrack.helpers.displayUser('542465ce43f5a10200c07f11', this);" class="cursor-pointer" onerror="Dubtrack.helpers.image.imageError(this);"></div><div class="activity-row"><div class="text"><p><a href="#" class="username">doc_z</a> .roll</p></div><div class="meta-info"><span class="username">doc_z </span><i class="icon-dot"></i><span class="timeinfo"><time class="timeago" datetime="2015-11-17T01:18:26.463Z" title="11/16/2015, 8:18:26 PM">3 minutes ago</time></span></div></div></div></li>
  
  //https://api.dubtrack.fm/room/5602ed62e8632103004663c2/queue/user/564933a1d4dcab140021cdeb/all
  //OPTIONS /room/5602ed62e8632103004663c2/queue/user/564933a1d4dcab140021cdeb/all HTTP/1.1
  //Host: api.dubtrack.fm
  //Connection: keep-alive
  //Access-Control-Request-Method: DELETE
  //Origin: https://www.dubtrack.fm
  //User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36
  //Access-Control-Request-Headers: accept
  //Accept: * / *
  //Referer: https://www.dubtrack.fm/browser/room-queue/
  //Accept-Encoding: gzip, deflate, sdch
  //Accept-Language: en-US,en;q=0.8
  //RESPONSE: connect.sid=s%3AIc6OZZrrITqik97YfAWpPwN_q0cQozk1.B3pP5IW%2BRMV%2B8gz5hxbUR%2F9pfhNVLGy4C4bF8zNYHlI;

  //https://api.dubtrack.fm/room/5602ed62e8632103004663c2/queue/user/564933a1d4dcab140021cdeb/all
  //https://api.dubtrack.fm/room/5602ed62e8632103004663c2/queue/user/564933a1d4dcab140021cdeb/all
  //https://api.dubtrack.fm/room/5602ed62e8632103004663c2/queue/user/560be6cbdce3260300e40770/all
  //DELETE /room/5602ed62e8632103004663c2/queue/user/564933a1d4dcab140021cdeb/all HTTP/1.1
  //Host: api.dubtrack.fm
  //Connection: keep-alive
  //Accept: * / *
  //Origin: https://www.dubtrack.fm
  //User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36
  //Referer: https://www.dubtrack.fm/browser/room-queue/
  //Accept-Encoding: gzip, deflate, sdch
  //Accept-Language: en-US,en;q=0.8
  //Cookie: __utma=191699775.433891708.1442850970.1444156735.1444170525.57;   __utmz=191699775.1443654480.36.3.utmcsr=mansfieldplayhouse.com|utmccn=(referral)|utmcmd=referral|utmcct=/dubtrack-help.html; _ga=GA1.2.433891708.1442850970; _gat=1;   connect.sid=s%3ATTA8i2zwfxxIvEE6zAAxeQU2K1udPxqQ.Tpw0AN8QxZa8JSGLyftn1SEpBxQd%2BhUMJClhzE9PsyA; __asc=bd21730b15112a0e927a4c2f702; __auc=d5260d8b1504993fdad0e5ee41e

  //todoerererererererer
  moderateRemoveDJ: function(usrObjectID) {
    try {
      var roomUser = USERS.defineRoomUser(usrObjectID);
      //todoer roomUser.uid.....
      var uid = "560be6cbdce3260300e40770";
      
      //https://api.dubtrack.fm/room/5602ed62e8632103004663c2/queue/user/564933a1d4dcab140021cdeb/all
      $.ajax({
            url: "https://api.dubtrack.fm/room/" + botVar.roomID + "/queue/user/" + uid + "/all",
            type: "DELETE"
        });
    }
    catch(err) { UTIL.logException("moderateRemoveDJ: " + err.message); }
  },
  moderateForceSkip: function() {
    API.sendChat("/skip");
  },
  logInfo: function(msg) {  // Log info to console
    try {
       console.log("INFO: " + msg);
    }
    catch(err) { UTIL.logException("logInfo: " + err.message); }
  },
  showPopup: function(title, message) {
    Dubtrack.helpers.displayError(title, message);
  },

  on: {
    EVENT_DUBUP: function () {
      try {
        if (botVar.ImHidden === true) return;
        botDebug.debugMessage(false, "EVENT_DUBUP");
      }
    catch(err) { UTIL.logException("EVENT_DUBUP: " + err.message); }
    },
    EVENT_DUBDOWN: function () {
      try {
        if (botVar.ImHidden === true) return;
        botDebug.debugMessage(false, "EVENT_DUBDOWN");
        var dubCount = API.getDubDownCount();
        if (dubCount <= botVar.room.currentMehCount) return;  // Prevent back-2-back calls skipping multiple songs.
        botVar.room.currentMehCount = dubCount;
        if (dubCount >= botVar.room.voteSkipLimit) {
          API.sendChat(botChat.subChat(botChat.getChatMessage("voteskipexceededlimit"), {name: botVar.currentDJ, limit: botVar.room.voteSkipLimit}));
          dubBot.skipBadSong(botVar.currentDJ, "Room", "Too many Mehs");
        }
      }
      catch(err) { UTIL.logException("EVENT_DUBDOWN: " + err.message); }
    },
    EVENT_USER_JOIN: function () {
      try {
        //if (botVar.ImHidden === true) return;
        botDebug.debugMessage(true, "USERJOIN");
        //USERS.loadUsersInRoom(true);
      }
      catch(err) { UTIL.logException("EVENT_USER_JOIN: " + err.message); }
    },
    EVENT_SONG_ADVANCE: function() {  //songadvance
      try {
      // UPDATE ON SONG UPDATE
      if (botVar.ImHidden === true) return;
      if (botVar.currentSong === API.currentSongName()) return;
      botDebug.debugMessage(false, "EVENT_SONG_ADVANCE: " + API.currentSongName() + API.currentDjName());
      //Get Current song name #player-controller > div.left > ul > li.infoContainer.display-block > div > span.
      TASTY.settings.rolledDice = false;

      var dubCount = API.getDubUpCount();
      var mehCount = API.getDubDownCount();
	  var grabCount = API.getGrabCount();
      var previousDJ = botVar.currentDJ;
      var previousSong = botVar.currentSong;
      botDebug.debugMessage(false, "previousDJ: " + previousDJ);
      botVar.currentDJ   = API.currentDjName();
      botDebug.debugMessage(false, "botVar.currentDJ: " + botVar.currentDJ);
      botVar.currentSong = API.currentSongName();
      var tastyPoints = botVar.tastyCount;
      botVar.tastyCount = 0;
      USERS.resetUserSongStats();
      var roomUser = USERS.lookupUserName(previousDJ);
      TASTY.setRolled(roomUser, false);

      setTimeout(function () { dubBot.validateCurrentSong() }, 1500);
      
      //If "loading..." do nothing
      if (previousSong == "loading...") return;

      roomUser.votes.songsPlayed++;
	  roomUser.votes.woot = parseInt(roomUser.votes.woot) + parseInt(dubCount);
	  roomUser.votes.meh = parseInt(roomUser.votes.meh) + parseInt(mehCount);
	  roomUser.votes.curate = parseInt(roomUser.votes.curate) + parseInt(grabCount);

      API.sendChat(botChat.subChat(botChat.getChatMessage("songstatisticstasty"), {woots: dubCount, grabs: grabCount, mehs: mehCount, tasty: tastyPoints, user: previousDJ, song: previousSong }));
      //botChat.chatMessages.push(["songstatisticstasty", "[ :thumbsup: %%WOOTS%% :thumbsdown: %%MEHS%% :cake: %%TASTY%%] %%USER%% [%%SONG%%]"]);
      //"[ :thumbsup: %%WOOTS%% :thumbsdown: %%MEHS%% :cake: %%TASTY%%] %%USER%% [%%SONG%%]"]);
      SETTINGS.storeToStorage();
      }
      catch(err) { UTIL.logException("EVENT_SONG_ADVANCE: " + err.message); }
    },
    EVENT_NEW_CHAT: function() {
      try {
        //document.getElementsByClassName("chat-main")[0].getElementsByTagName("li").length;
        botDebug.debugMessage(false, "============================= NEW CHAT =============================");
        var mainChat = document.getElementsByClassName("chat-main");
        var LiItems = mainChat[0].getElementsByTagName("li");
        var startCounter = 0;
        if ((LiItems.length >= botChat.lastMessageCount) && (botChat.lastMessageCount > 0)) startCounter = botChat.lastMessageCount - 1;
        botChat.lastMessageCount = LiItems.length;
        botDebug.debugMessage(false, "CHAT - LOOP: " + startCounter + " - " + LiItems.length);
        for (var i = startCounter; i < LiItems.length; i++) {
          botChat.processChatItems(LiItems[i]);
        }
      } catch (err) {
        UTIL.logException("EVENT_NEW_CHAT: " + err.message);
      }
    }
  }
};
//SECTION CONST: All Constants:
var CONST = {
  chatMessagesLink: "https://rawgit.com/SZigmund/dubBot/master/lang/en.json",
  blacklistLink: "https://rawgit.com/SZigmund/basicBot/master/Blacklist/list.json",
  userlistLink: "https://rawgit.com/SZigmund/basicBot/master/Blacklist/users.json",
  blacklistIdLink: "https://rawgit.com/SZigmund/basicBot/master/Blacklist/ids.json",
  cmdLink: "http://bit.ly/1DbtUV7",
  commandLiteral: ".",
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
                "%%FU%%, I fart in your general direction! Your mother was a hamster and your father smelt of elderberries!",
                "Do you kiss your mother with that mouth %%FU%%.",
                "%%FU%%, You daydreaming again, sweetheart?",
                "Get in the queue %%FU%%.",
                "What the hell was that i can eat a bowl of alphabet soup and shit out a smarter insult than that %%FU%%",
                "Well I could agree with you, but then we'd both be wrong %%FU%%.",
                "I love it when someone insults me %%FU%%. That means I don’t have to be nice anymore.",
                "Two wrongs don't make a right %%FU%%, take your parents as an example.",
                "The last time I saw a face like yours %%FU%%, I fed it a banana.",
                "%%FU%%, your birth certificate is an apology letter from the condom factory.",
                "Is your ass jealous of the amount of shit that just came out of your mouth %%FU%%?",
                "%%FU%%, you bring everyone lots of joy....when you leave the room.",
                "%%FU%%, you must have been born on a highway because that's where most accidents happen.",
                "%%FU%%, I bet your brain feels as good as new, seeing that you never use it.",
                "If laughter is the best medicine, your face must be curing the world %%FU%%.",
                "I could eat a bowl of alphabet soup and shit out a smarter statement than that %%FU%%.",
                "I may love to shop %%FU%%, but I'm not buying your bullshit.",
                "If you're gonna be a smartass %%FU%%, first you have to be smart. Otherwise you're just an ass.",
                "I'd slap you %%FU%%, but shit stains.",
                "Your family tree must be a cactus because everybody on it is a prick %%FU%%.",
                "%%FU%%, you shouldn't play hide and seek, no one would look for you.",
                "%%FU%%, If I were to slap you, it would be considered animal abuse!",
                "You didn't fall out of the stupid tree. You were dragged through dumbass forest %%FU%%.",
                "You're so fat, you could sell shade %%FU%%.",
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
            ":cake: *** :dancer: %%POINTFROM%% gave you a tasty point.  @larry_the_law will now dance the robot in your honor. :dancer: *** :cake:",
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
//SECTION COMMANDS: All Bot commands - The meat:
var BOTCOMMANDS = {
        commands: {
            executable: function (minRank, chat) {
                return true;
                // todoer:
                //var id = chat.uid;
                //var perm = API.getPermission(id);
                //var minPerm;
                //switch (minRank) {
                //    case 'admin':
                //        minPerm = 10;
                //        break;
                //    case 'ambassador':
                //        minPerm = 7;
                //        break;
                //    case 'host':
                //        minPerm = 5;
                //        break;
                //    case 'cohost':
                //        minPerm = 4;
                //        break;
                //    case 'manager':
                //        minPerm = 3;
                //        break;
                //    //case 'vip': todoer
                //    case 'bouncer':
                //        minPerm = 2;
                //        break;
                //    case 'residentdj':
                //        minPerm = 1;
                //        break;
                //    case 'user':
                //        minPerm = 0;
                //        break;
                //    default:
                //        API.chatLog('error assigning minimum permission');
                //}
                //return perm >= minPerm;
            },

            //SAMPLE:
             //command: {   
             //           command: 'cmd',
             //           rank: 'user/bouncer/mod/manager',
             //           type: 'startsWith/exact',
             //           functionality: function(chat, cmd){
             //                   if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
             //                   if( !BOTCOMMANDS.commands.executable(this.rank, chat) ) return void (0);
             //                   else{
             //                   
             //                   }
             //           }
             //   },

            tastyCommand: {
                command: ['tasty', 'rock', 'props', 'woot', 'groot', 'groovy', 'jam','nice','bop','cowbell','sax','ukulele','tango','samba','disco','waltz','metal',
                          'bob','boogie','cavort','conga','flit','foxtrot','frolic','gambol','hop','hustle','jig','jitter','jitterbug','jive','jump','leap','prance','promenade','rhumba',
                          'shimmy','strut','sway','swing','great','hail','good','acceptable','bad','excellent','exceptional','favorable','marvelous','positive','satisfactory','satisfying',
                          'superb','valuable','wonderful','ace','boss','bully','choice','crack','pleasing','prime','rad','sound','spanking','sterling','super','superior',
                          'welcome','worthy','admirable','agreeable','commendable','congenial','deluxe','first-class','first-rate','gnarly','gratifying','honorable','neat','precious',
                          'recherché','reputable','select','shipshape','splendid','stupendous','keen','nifty','swell','sensational','fine','cool','perfect','wicked','fab','heavy',
                          'incredible','outstanding','phenomenal','remarkable','special','terrific','unique','aces','capital','dandy','enjoyable','exquisite',
                          'fashionable','lovely','love','solid','striking','top-notch','slick','pillar','exemplary','alarming','astonishing','awe-inspiring',
                          'beautiful','breathtaking','fearsome','formidable','frightening','winner','impressive','intimidating','facinating','prodigious',
                          'magnificent','overwhelming','shocking','stunning','stupefying','majestic','grand','velvet','icecream',
                          'creamy','easy','effortless','fluid','gentle','glossy','peaceful','polished','serene','sleek','soft','tranquil','velvety','soothing','fluent','frictionless',
                          'lustrous','rhythmic','crackerjack','laudable','peachy','praiseworthy','rare','super-duper','unreal','chill','savvy','smart','ingenious','genious',
                          'sweet','delicious','lucious','bonbon','fetch','fetching','appealing','delightful','absorbing','alluring','cute','electrifying',
                          'awesome','bitchin','fly','pleasant','relaxing','mellow','nostalgia','punk','like','fries','cake','drum','guitar','bass','tune','pop',
                          'apple','fantastic','spiffy','yes','fabulous','happy','smooth','classic','mygirlfriend','skank','jiggy','funk','funky','jazz','jazzy','dance','elvis',
                          'hawt','extreme','dude','babes','fun','reggae','party','drums','trumpet','mosh','bang','blues','heart','feels','dope','makeitrain','wumbo',
                          'firstclass','firstrate','topnotch','aweinspiring','superduper','dabomb','dashit','badass','bomb','popcorn','awesomesauce','awesomeness','sick',
                          'sexy','brilliant','steampunk','bagpipes','piccolo','whee','vibe','banjo','harmony','harmonica','flute','dancing','dancin','ducky','approval','winning','okay',
                          'hunkydory','peach','divine','radiant','sublime','refined','foxy','allskate','rush','boston','mumford','murica','2fer','boom','bitches','oar','hipster',
                          'hip','soul','soulful','cover','yummy','ohyeah','twist','shout','trippy','hot','country','stellar','smoove','pantydropper','baby','mmm','hooters',
                          'tmbg','rhythm','kool','kewl','killer','biatch','woodblock','morecowbell','lesbian','lesbians','niceconnect','connect','kazoo','win','webejammin',
                          'bellyrub','groove','gold','golden','twofer','phat','punkrock','punkrocker','merp','derp','herp-a-derp','narf','amazing','doabarrellroll','plusone',
                          '133t','roofus','rufus','schway','shiz','shiznak','shiznik','shiznip','shiznit','shiznot','shizot','shwanky','shway',
                          'sic','sicc','skippy','slammin','slamming','slinkster','smack','smashing','smashingly','snizzo','spiffylicious','superfly',
                          'swass','tender','thrill','tight','tits','tizight','todiefor','to die for','trill','tuff','vicious','whizz-bang','wick',
                          'wow','omg','A-1','ace','aces','aight','allthatandabagofchips','all that and a bag of chips','alrighty','alvo','amped',
                          'A-Ok','ass-kicking','awesome-possum','awesome possum','awesomepossum','awesomesauce','awesome sauce','awesome-sauce',
                          'awsum','bad-ass','badassical','badonkadonk','bananas','bang','bangupjob','bang up job','beast','beastly','bees-knees',
                          'bees knees','beesknees','bodacious','bomb','bomb-ass','bomb diggidy','bomb-diggidy','bombdiggidy','bonkers','bonzer',
                          'boomtown','bostin','brill','bumping','capitol','cats ass','cats-ass','catsass','chilling','choice','clutch',
                          'coo','coolage','cool beans','cool-beans','coolbeans','coolness','cramazing','cray-cray','crazy','crisp','crucial','da bomb',
                          'da shit','da-bomb','da-shit','dashiznit','dabomb','dashit','da shiznit','da-shiznit','dope','ear candy','ear-candy','earcandy',
                          'easy','epic','fan-fucking-tastic','fantabulous','far out','far-out','farout','fly','fresh','funsies','gangstar','gangster',
                          'gansta','solidgold','golden','gr8','hardcore','hellacious','hoopla','hype','ill','itsallgood','its all good','jiggy','jinky','jiggity',
                          'jolly good','jolly-good','jollygood','k3w1','kickass','kick-ass','kick ass','kick in the pants','kickinthepants','kicks','kix','legendary',
                          'legit','like a boss','like a champ','like whoa','likeaboss','likeachamp','likewhoa','lush','mint','money','neato','nice','off da hook',
                          'off the chain','off the hook','out of sight','peachy keen','peachy-keen','offdahook','offthechain','offthehook','outofsight',
                          'peachykeen','perf','phatness','phenom','prime-time','primo','rad','radical','rage','rancid','random','nice cover','nicecover','raw',
                          'redonkulus','righteous','rocking','rock-solid','rollin','3fer','4fer','threefer','fourfer','nice2fer','amazeballs','craycray',
                          'whizzbang','a1','aok','asskicking','bombass','fanfuckingtastic','primetime','rocksolid','instrumental','rockin','star','rockstar',':metal:',
                          '10s','00s','90s','80s','70s','60s','50s','40s','30s','20s','insane','clever',':heart:',':heart_decoration:',':heart_eyes:',':heart_eyes_cat:',':heartbeat:',
                          ':heartpulse:',':hearts:',':yellow_heart:',':green_heart:',':two_hearts:',':revolving_hearts:',':sparkling_heart:',':blue_heart:','giddyup','rockabilly',
                          'nicefollow',':beer:',':beers:','niceplay','oldies','oldie','pj','slayer','kinky',':smoking:','jewharp','talkbox','oogachakaoogaooga','oogachaka',
                          'ooga-chaka','snag','snagged','yoink','classy','ska','grunge','jazzhands','verycool','ginchy','catchy','grab','grabbed','yes','hellyes',
                          'hellyeah','27','420','toke','fatty','blunt','joint','samples','doobie','oneeyedwilly','bongo','bingo','bangkok','tastytits','=w=',':guitar:','cl','carbonleaf',
                          'festive','srv','motorhead','motörhead','pre2fer','pre-2fer','future2fer','phoenix','clhour','accordion','schwing','schawing','cool cover','coolcover',
                          'boppin','bopping','jammin','jamming','tuba','powerballad','jukebox','word','classicrock','throwback','soultrain','train','<3','bowie'],
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        TASTY.tastyVote(chat.un, cmd);
                    }
                    catch(err) {
                        UTIL.logException("tastyCommand: " + err.message);
                    }
                }
            },

            eightballCommand: {   //Added 04/01/2015 Zig
                command: ['8ball', 'eightball', 'larry'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        var msg = chat.message;
                        var magicResponse = EIGHTBALL.eightBallSelect();
                        if (msg.length === cmd.length)  return API.sendChat(botChat.subChat(botChat.getChatMessage("eightballresponse2"), {name: chat.un, response: magicResponse }));
                        var myQuestion = msg.substring(cmd.length + 1);
                        //Since we don't delete comments yet repeating the question is pointless.
                        //API.sendChat(botChat.subChat(botChat.getChatMessage("eightballquestion"), {name: chat.un, question: myQuestion}));
                        //setTimeout(function () {
                            API.sendChat(botChat.subChat(botChat.getChatMessage("eightballresponse1"), {response: magicResponse}));
                        //}, 500);
                    }
                    catch(err) {
                        UTIL.logException("eightballCommand: " + err.message);
                    }
                }
            },
            rollCommand: {   //Added 03/30/2015 Zig
                command: ['roll','spin','throw','dice','rollem','toss','fling','pitch'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        if (API.currentDjName().toUpperCase() !== chat.un.toUpperCase()) return API.sendChat(botChat.subChat(botChat.getChatMessage("notcurrentdj"), {name: chat.un}));
                        //if (TASTY.getRolled(chat.un))  return API.sendChat(botChat.subChat(botChat.getChatMessage("doubleroll"), {name: chat.un}));
                        if (TASTY.settings.rolledDice === true) return API.sendChat(botChat.subChat(botChat.getChatMessage("doubleroll"), {name: chat.un}));
                        var msg = chat.message;
                        var dicesides = 6;
                        if (msg.length > cmd.length){
                            var dice = msg.substr(cmd.length + 1);
                            if (!isNaN(dice)) dicesides = dice;
                            if (dicesides < 4) dicesides = 4;
                        }
                        var rollResults = Math.floor(Math.random() * dicesides) + 1;
                        TASTY.setRolled(chat.un, true);
                        var resultsMsg = "";
                        var wooting = true;
                        if (rollResults > (dicesides * 0.5)) {
                            //Pick a random word for the tasty command
                            setTimeout(function () { TASTY.tastyVote(botVar.botName, TASTY.bopCommand("")); }, 250);
                            setTimeout(function () { API.wootThisSong(); }, 500);
                            resultsMsg = botChat.subChat(botChat.getChatMessage("rollresultsgood"), {name: chat.un, roll: UTIL.numberToIcon(rollResults)});
                        }
                        else {
                            setTimeout(function () { API.mehThisSong(); }, 250);
                            resultsMsg = botChat.subChat(botChat.getChatMessage("rollresultsbad"), {name: chat.un, roll: UTIL.numberToIcon(rollResults)});
                            wooting = false;
                        }
                        API.sendChat(resultsMsg + TASTY.updateRolledStats(chat.un, wooting));
                        TASTY.settings.rolledDice = true;
                        SETTINGS.storeToStorage();
                        //if (rollResults >= (dicesides * 0.8))
                        //    setTimeout(function () { TASTY.tastyVote(chat.un, "winner"); }, 1000);
                        //else if (rollResults <= (dicesides * 0.2))
                        //    setTimeout(function () { API.mehThisSong(); }, 1000);
                    }
                    catch(err) {
                        UTIL.logException("rollCommand: " + err.message);
                    }
                }
            },            
            wootCommand: {  //todoer DELETE THIS COMMAND:
                command: 'wootthissong',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.wootThisSong();
                    }
                }
            },
            mehCommand: {
                command: 'mehthissong',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd)                 {
                  try  {
                    API.mehThisSong();
                  }  
                catch(err) {
                  UTIL.logException("mehCommand: " + err.message);
                }
              }
            },
            exrouletteCommand: {
                command: ['exroulette','roulette?'],
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("Explain ROULETTE: Managers type .roulette to start the game.  Type .join to join the game. The winner gets moved to a random place in line. It is a Russian roulette in that the new position is random. So, when you win you may get moved back in line.");
                    }
                    catch(err) {
                        UTIL.logException("exroulettecommand: " + err.message);
                    }
                }
            },
            extastyCommand: {
                command: ['extasty','tasty?'],
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("Explain TASTY POINTS: This is another way to let your fellow DJs know you enjoy their play.  Since most of us run auto-woot extentions it is just a nice way to let others know when they play an extra tasty selection.");
                    }
                    catch(err) {
                        UTIL.logException("extastycommand: " + err.message);
                    }
                }
            },
            exmeetingCommand: {
                command: ['exmeeting', 'exlunch', 'exbeerrun','meeting?', 'lunch?', 'beerrun?'],
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("Explain MEETING: If you have to go afk type, .meeting or .lunch and Larry will remove you from line. When you return hop back in line and Larry will restore your position in line. If you leave the room for over 10 mins you'll lose your spot.");
                    }
                    catch(err) {
                        UTIL.logException("exmeeting: " + err.message);
                    }
                }
            },
            exmehCommand: {
                command: ['exmeh','meh?'],
                rank: 'residentdj',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        if(chat.message.length === cmd.length) return API.sendChat('No user specified.');
                        botDebug.debugMessage(false, "============================= MEH? =============================");
                        botDebug.debugMessage(false, "cmd: " + cmd);
                        botDebug.debugMessage(false, "chat.message: " + chat.message);
                        var name = chat.message.substring(cmd.length + 2);
                        var roomUser = USERS.lookupUserName(name);
                        if(typeof roomUser === 'boolean') return API.sendChat('Invalid user specified.');
                        var msgSend = "@" + roomUser.username + ": If you find yourself Meh-ing most songs, this isn't the room for you. Serial Meh'ers will be banned. If you don't like the music find a different room please.";
                        API.sendChat(msgSend);
                    }
                    catch(err) {
                        UTIL.logException("exmeh: " + err.message);
                    }
                }
            },
            mystatsCommand: {
                command: 'mystats',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        var msg = chat.message;
                        var name = "";
						//botDebug.debugMessage(true, "msg: [" + msg + "]");
						//botDebug.debugMessage(true, "cmd: [" + cmd + "]");
						//botDebug.debugMessage(true, "cmd.length: " + cmd.length);
                        if (msg.length === cmd.length) name = chat.un
                        else name = msg.substring(cmd.length + 2);
						//botDebug.debugMessage(true, "name: [" + name + "]");
                        var user = USERS.lookupUserName(name);
                        if (user === false) return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        var msg = botChat.subChat(botChat.getChatMessage("mystats"), {name: user.username, 
                                                                     songs: user.votes.songsPlayed,
                                                                     woot: user.votes.woot, 
                                                                     grabs: user.votes.curate, 
                                                                     mehs: user.votes.meh, 
                                                                     tasty: user.votes.tastyRcv});
                        TASTY.resetDailyRolledStats(user);
                        msg += " Roll Stats: " + TASTY.getRolledStats(user);
                        var byusername = " [ executed by " + chat.un + " ]";
                        if (chat.un !== name) msg += byusername;
                        API.sendChat(msg);
                    }
                    catch(err) {
                        UTIL.logException("mystatsCommand: " + err.message);
                    }
                }
            },
            nsfwCommand: {   //Added 04/22/2015 Zig
                command: 'nsfw',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("NSFW Warning [" + chat.un + "]: @everyone");
                    }
                    catch(err) {
                        UTIL.logException("nsfwCommand: " + err.message);
                    }
                }
            },
            elevenCommand: {
                command: ['eleven','11'],
                rank: 'residentdj',
                type: 'startsWith',
                functionality: function (chat, cmd)  {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
						 TASTY.tastyVote(chat.un, cmd);
						 setTimeout(function () { API.sendChat("http://media.tumblr.com/10430abfede9cebe9776f7de26e302e4/tumblr_inline_mjzgvrh7Uv1qz4rgp.gif"); }, 250);
                    }
                    catch(err) {
                        UTIL.logException("elevenCommand: " + err.message);
                    }
                }
            },
            resetstatsCommand: {  //Added 12/23/2015 Zig 
                command: 'resetstats',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
					if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
					if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
					var msg = chat.message;
					var name = "";
					if (msg.length === cmd.length) name = chat.un
					else name = msg.substring(cmd.length + 2);
					var user = USERS.lookupUserName(name);
					if (user === false) return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
					//user.votes.songsPlayed = parseInt(0);
					user.votes.woot = parseInt(0);
					user.votes.meh = parseInt(0);
					//user.votes.tastyRcv = parseInt(0);
                }
            },
            versionCommand: {  //Added 01/27/2015 Zig
                command: 'version',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    API.sendChat(botChat.subChat(botChat.getChatMessage("online"), {botname: botVar.botName, version: botVar.version}));
                }
            },
            zigaCommand: {
                command: 'ziga',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd)  {
                    try { 
                        var userInfo = document.getElementsByClassName("user-info");
                        botDebug.debugMessage(true, "userInfo count: " + userInfo.length);
                        var spans = userInfo[0].getElementsByTagName("span");
                        botDebug.debugMessage(true, "userInfo: " + spans[0].innerHTML);
                    }
                    catch(err) {
                        UTIL.logException("zigaCommand: " + err.message);
                    }
                }
            },
            zigbCommand: {
                command: 'zigb',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd)  {
                    try {
                        var userInfo = document.getElementsByClassName("infoContainerInner");
                        botDebug.debugMessage(true, "userInfo count: " + userInfo.length);
                        var spans = userInfo[0].getElementsByClassName("currentDJSong");
                        botDebug.debugMessage(true, "currentDJSong: " + spans[0].innerHTML);
                    }
                    catch(err) {
                        UTIL.logException("zigbCommand: " + err.message);
                    }
                }
            },
            zigCommand: {  //Added 02/14/2015 Zig 
                command: 'zig',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var maxTime = msg.substring(cmd.length + 1);
						if (maxTime === "1") SETTINGS.storeToStorage();
						if (maxTime === "2") SETTINGS.retrieveFromStorage();
						if (maxTime === "3") SETTINGS.retrieveSettings();
						if (maxTime === "4") API.mehThisSong();
						if (maxTime === "5") API.wootThisSong();
						if (maxTime === "6") TASTY.tastyVote(botVar.botName, "winner");
						if (maxTime === "7") {
							  var avatarList7 = document.getElementById("main-user-list-room");
							  botDebug.debugMessage(true, "avatarList count: " + avatarList7.length);
						}
						if (maxTime === "8") {
							  var avatarList8 = document.getElementById("avatar-list");
							  botDebug.debugMessage(true, "avatarList count: " + avatarList8.length);
						}
						if (maxTime === "9") USERS.loadUsersInRoom(true);
						if (maxTime === "A") USERS.removeMIANonUsers();
						if (maxTime === "B") API.defineRoomQueue();
						if (maxTime === "C") API.pauseUserQueue("dexter_nix");
						if (maxTime === "D") botDebug.debugMessage(true, USERS.getLastActivity("dexter_nix"));
						if (maxTime === "E") botDebug.debugMessage(true, USERS.getLastActivity("Levis_Homer"));
                    }
                }
            },
            userlistxferCommand: {   //Added: 08/28/2015
                command: 'userlistxfer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return;
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return;
                        USERS.users = USERS.usersImport;
                    }
                    catch (err) { UTIL.logException("userlistxfer: " + err.message); }
                }
            },
            userlistcountCommand: {   //Added: 08/28/2015
                command: 'userlistcount',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return;
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return;
                        API.logInfo("I've got " + USERS.usersImport.length + " users in the new list.");
                        setTimeout(function () {
                            API.logInfo("I've got " + USERS.users.length + " users in the old list.")
                        }, 1 * 1000);
                        //todoer
                        if (USERS.users.length >= 1) botDebug.debugMessage(true, "USER0: " + USERS.users[0].username + "::" + USERS.users[0].id);
                        if (USERS.users.length >= 2) botDebug.debugMessage(true, "USER1: " + USERS.users[1].username + "::" + USERS.users[1].id);
                        if (USERS.users.length >= 3) botDebug.debugMessage(true, "USER2: " + USERS.users[2].username + "::" + USERS.users[2].id);
                    }
                    catch (err) { UTIL.logException("userlistcount: " + err.message); }
                }
            },
            userlistimportCommand: {   //Added: 08/23/2015 Import User list from last saved in Github
                command: 'userlistimport',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return;
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return;
                        USERS.importUserList();
                        API.logInfo("I've got " + USERS.usersImport.length + " users in the new list.");
                        var DocZ = USERS.lookupUserNameImport("Doc_Z");
                        if (DocZ === false) return API.logInfo(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        var msg = botChat.subChat(botChat.getChatMessage("mystats"), {name: DocZ.username, 
                                                                     songs: DocZ.votes.songsPlayed,
                                                                     woot: DocZ.votes.woot, 
                                                                     grabs: DocZ.votes.curate, 
                                                                     mehs: DocZ.votes.meh, 
                                                                     tasty: DocZ.votes.tastyRcv});
                        TASTY.resetDailyRolledStats(DocZ);
                        msg += " Roll Stats: " + TASTY.getRolledStats(DocZ);
                        API.logInfo(msg);
                    }
                    catch (err) { UTIL.logException("userlistimport: " + err.message); }
                }
            },
            exrollCommand: {
                command: ['exroll','roll?'],
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("Explain ROLL: A dj can roll the dice during their spin. Rolling 1-3=MEH, 4-6=WOOT. 50% chance. type .roll during your spin to do it.");
                    }
                    catch(err) {
                        UTIL.logException("exrollcommand: " + err.message);
                    }
                }
            },
            whyCommand: {
                command: 'why',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("You're only getting woots cause we all have auto woot");
                    }
                    catch(err) {
                        UTIL.logException("whycommand: " + err.message);
                    }
                }
            },
            hypsterCommand: {  //hipsterCommand
                command: 'hypster',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat("I know @whitewidow is singing along with this hypster track");
                    }
                }
            },
            roomCommand: {
                command: 'room',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("Hey @bcav wanna get a hotel room together?");
                    }
                    catch(err) {
                        UTIL.logException("roomcommand: " + err.message);
                    }
                }
            },
            ughCommand: {
                command: 'ugh',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("You know your play sucks when the chat goes quiet");
                    }
                    catch(err) {
                        UTIL.logException("ughcommand: " + err.message);
                    }
                }
            },
            speakCommand: {   //Added 02/25/2015 Zig 
                command: 'speak',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                try{
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    return API.sendChat(RANDOMCOMMENTS.randomCommentSelect());
                }
                catch(err) { UTIL.logException("speakCommand: " + err.message);  }
                }
            },
            pingCommand: {
                command: 'ping',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(botChat.getChatMessage("pong"))
                    }
                }
            },
            rouletteCommand: {
                command: 'roulette',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    if (ROULETTE.rouletteStatus) return void (0);
                    if (ROULETTE.rouletteTimeRange()) {
                        API.sendChat("The LAW runs the Roulette weekdays 9AM-5PM EST");
                        return;
                    }
                    ROULETTE.startRoulette();
                }
            },
            rulesCommand: {
                command: 'rules',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof SETTINGS.settings.rulesLink === "string")
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("roomrules"), {link: SETTINGS.settings.rulesLink}));
                    }
                }
            },
            removeCommand: {
                command: 'remove',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                  try {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    var msg = chat.message;
                    if (msg.length <= cmd.length + 2) {
                      API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                      return;
                    }
                    var name = msg.substr(cmd.length + 2);
                    var user = USERS.lookupUserName(name);
                    if (typeof user !== "object") {
                      API.sendChat("Invalid user specified.");
                      return;
                    }
                    AFK.resetDC(user);  // so when they rejoin they'll not get bugged
                    API.moderateRemoveDJ(user);
                    //if (API.getDJ().id === user.id) {
                    //    API.logInfo("Skip song: " + API.getMedia().title + " by: " + chat.un + " Reason: Remove command");
                    //    API.moderateForceSkip();
                    //    setTimeout(function () {
                    //        API.moderateRemoveDJ(user.id);
                    //    }, 1 * 1000, user);
                    //}
                    //else API.moderateRemoveDJ(user.id);
                }
                catch(err) { UTIL.logException("speakCommand: " + err.message);  }
              }
            },

            commandsCommand: {
                command: 'commands',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                  try {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    API.sendChat(botChat.subChat(botChat.getChatMessage("commandslink"), {botname: botVar.botName, link: CONST.cmdLink}));
                  }
                  catch (err) { UTIL.logException("cookieCommand: " + err.message); }
                }
            },

            cookieCommand: {
                command: 'cookie',
                rank: 'user',
                type: 'startsWith',
                cookies: ['has given you a chocolate chip cookie!',
                    'has given you a soft homemade oatmeal cookie!',
                    'has given you a plain, dry, old cookie. It was the last one in the bag. Gross.',
                    'gives you a sugar cookie. What, no frosting and sprinkles? 0/10 would not touch.',
                    'gives you a chocolate chip cookie. Oh wait, those are raisins. Bleck!',
                    'gives you an enormous cookie. Poking it gives you more cookies. Weird.',
                    'gives you a fortune cookie. It reads "Why aren\'t you working on any projects?"',
                    'gives you a fortune cookie. It reads "Give that special someone a compliment"',
                    'gives you a fortune cookie. It reads "Take a risk!"',
                    'gives you a fortune cookie. It reads "Go outside."',
                    'gives you a fortune cookie. It reads "Don\'t forget to eat your veggies!"',
                    'gives you a fortune cookie. It reads "Do you even lift?"',
                    'gives you a fortune cookie. It reads "m808 pls"',
                    'gives you a fortune cookie. It reads "If you move your hips, you\'ll get all the ladies."',
                    'gives you a fortune cookie. It reads "I love you."',
                    'gives you a Golden Cookie. You can\'t eat it because it is made of gold. Dammit.',
                    'gives you an Oreo cookie with a glass of milk!',
                    'gives you a rainbow cookie made with love :heart:',
                    'gives you an old cookie that was left out in the rain, it\'s moldy.',
                    'bakes you fresh cookies, it smells amazing.'
                ],
                getCookie: function () {
                    var c = Math.floor(Math.random() * this.cookies.length);
                    return this.cookies[c];
                },
                functionality: function (chat, cmd) {
                  try {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    var msg = chat.message;
                    var space = msg.indexOf(' ');
                    if (space === -1) return API.sendChat(botChat.getChatMessage("eatcookie"));
                    var name = msg.substring(space + 2);
                    var user = USERS.lookupUserName(name);
                    if (user === false || !user.inRoom)
                        return API.sendChat(botChat.subChat(botChat.getChatMessage("nousercookie"), {name: name}));
                    if (user.username === chat.un) 
                        return API.sendChat(botChat.subChat(botChat.getChatMessage("selfcookie"), {name: name}));
                    return API.sendChat(botChat.subChat(botChat.getChatMessage("cookie"), {nameto: user.username, namefrom: chat.un, cookie: this.getCookie()}));
                  }
                  catch (err) { UTIL.logException("cookieCommand: " + err.message); }
                }
            },
            lowrollpctCommand: {   //Added 07/03/2015 Zig
                command: 'lowrollpct',
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        var leaderBoard = TASTY.loadRollPct(false);
                        TASTY.displayLeaderBoard(leaderBoard, chat.un, true, "Low Roll Percentages: ");
                    }
                    catch(err) { UTIL.logException("lowrollpct: " + err.message); }
                }
            },
            lowrollptsCommand: {   //Added 07/03/2015 Zig
                command: 'lowrollpts',
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        var leaderBoard = TASTY.loadRollPoints(false);
                        TASTY.displayLeaderBoard(leaderBoard, chat.un, false, "Low Roll Points: ");
                    }
                    catch(err) { UTIL.logException("lowrollpts: " + err.message); }
                }
            },
            rollpctCommand: {   //Added 07/03/2015 Zig
                command: 'rollpct',
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        var leaderBoard = TASTY.loadRollPct(true);
                        TASTY.displayLeaderBoard(leaderBoard, chat.un, true, "Top Roll Percentages: ");
                    }
                    catch(err) { UTIL.logException("rollpct: " + err.message); }
                }
            },
            rollptsCommand: {   //Added 07/03/2015 Zig
                command: 'rollpts',
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        var leaderBoard = TASTY.loadRollPoints(true);
                        TASTY.displayLeaderBoard(leaderBoard, chat.un, false, "Top Roll Points: ");
                    }
                    catch(err) { UTIL.logException("rollpts: " + err.message); }
                }
            },

            fbCommand: {
                command: 'fb',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof SETTINGS.settings.fbLink === "string")
                            API.sendChat(botChat.subChat(botChat.getChatMessage("facebook"), {link: SETTINGS.settings.fbLink}));
                    }
                }
            },
            //todoer delete after having fun with this:
            autorollCommand: {
                command: 'autoroll',
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("Auto-Roll feature enabled for: " + chat.un);
                    }
                    catch(err) {
                        UTIL.logException("autoroll: " + err.message);
                    }
                }
            },

            /* basic
            activeCommand: {
                command: 'active',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var now = Date.now();
                        var chatters = 0;
                        var time;
                        if (msg.length === cmd.length) time = 60;
                        else {
                            time = msg.substring(cmd.length + 1);
                            if (isNaN(time)) return API.sendChat(botChat.subChat(botChat.getChatMessage("invalidtime"), {name: chat.un}));
                        }
                        for (var i = 0; i < USERS.users.length; i++) {
                            userTime = USERS.getLastActivity(USERS.users[i]);
                            if ((now - userTime) <= (time * 60 * 1000)) {
                                chatters++;
                            }
                        }
                        API.sendChat(botChat.subChat(botChat.getChatMessage("activeusersintime"), {name: chat.un, amount: chatters, time: time}));
                    }
                }
            },

            addCommand: {
                command: 'add',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = USERS.lookupUserName(name);
                        if (msg.length > cmd.length + 2) {
                            if (typeof user !== 'undefined') {
                                API.moderateAddDJ(user.id);
                            } else API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        }
                    }
                }
            },

            afklimitCommand: {
                command: 'afklimit',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nolimitspecified"), {name: chat.un}));
                        var limit = msg.substring(cmd.length + 1);
                        if (!isNaN(limit)) {
                            AFK.settings.maximumAfk = parseInt(limit, 10);
                            API.sendChat(botChat.subChat(botChat.getChatMessage("maximumafktimeset"), {name: chat.un, time: AFK.settings.maximumAfk}));
                        }
                        else API.sendChat(botChat.subChat(botChat.getChatMessage("invalidlimitspecified"), {name: chat.un}));
                    }
                }
            },

            randomCommentsCommand: {   //Added 02/14/2015 Zig
                command: 'randomcomments',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (RANDOMCOMMENTS.settings.randomComments) {
                            RANDOMCOMMENTS.settings.randomComments = !RANDOMCOMMENTS.settings.randomComments;
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': 'Random Comments'}));
                        }
                        else {
                            RANDOMCOMMENTS.settings.randomComments = !RANDOMCOMMENTS.settings.randomComments;
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': 'Random Comments'}));
                        }
                    }
                }
            },
            skipHistoryCommand: {   //Added 02/14/2015 Zig
                command: 'skiphistory',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (botVar.room.repeatSongs) {
                            botVar.room.repeatSongs = !botVar.room.repeatSongs;
                            //todoer why do we clear the afk interval here???
                            clearInterval(AFK.afkInterval);
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("repeatSongs")}));
                        }
                        else {
                            botVar.room.repeatSongs = !botVar.room.repeatSongs;
                            AFK.afkInterval = setInterval(function () { AFK.afkCheck() }, 2 * 1000);
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("repeatSongs")}));
                        }
                    }
                }
            },
            afkremovalCommand: {
                command: 'afkremoval',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (AFK.settings.afkRemoval) {
                            AFK.settings.afkRemoval = !AFK.settings.afkRemoval;
                            clearInterval(AFK.afkInterval);
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("afkremoval")}));
                        }
                        else {
                            AFK.settings.afkRemoval = !AFK.settings.afkRemoval;
                            AFK.afkInterval = setInterval(function () { AFK.afkCheck() }, 2 * 1000);
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("afkremoval")}));
                        }
                    }
                }
            },
            trollCommand: {
                command: 'troll',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try{
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        var msg = chat.message;
                        //if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                        if (msg.length === cmd.length) return(0);
                        var name = msg.substring(cmd.length + 2);
                        var user = USERS.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        API.moderateBanUser(user.id, 1, API.BAN.PERMA);
                    }
                    catch (err) { UTIL.logException("trollCommand: " + err.message); }
                }
            },
            afkresetCommand: {
                command: 'afkreset',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = USERS.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        USERS.setLastActivity(user, false);
                        API.sendChat(botChat.subChat(botChat.getChatMessage("afkstatusreset"), {name: chat.un, username: name}));
                    }
                }
            },

            afktimeCommand: {
                command: 'afktime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = USERS.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        var lastActive = USERS.getLastActivity(user);
                        var inactivity = Date.now() - lastActive;
                        var time = UTIL.msToStr(inactivity);
                        API.sendChat(botChat.subChat(botChat.getChatMessage("inactivefor"), {name: chat.un, username: name, time: time}));
                    }
                }
            },

            autoskipCommand: {
                command: 'autoskip',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (botVar.room.autoskip) {
                            botVar.room.autoskip = !botVar.room.autoskip;
                            clearTimeout(botVar.room.autoskipTimer);
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("autoskip")}));
                        }
                        else {
                            botVar.room.autoskip = !botVar.room.autoskip;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("autoskip")}));
                        }
                    }
                }
            },

            autowootCommand: {
                command: 'autowoot',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(botChat.getChatMessage("autowoot"));
                    }
                }
            },

            baCommand: {
                command: 'ba',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(botChat.getChatMessage("brandambassador"));
                    }
                }
            },

            banCommand: {
                command: 'ban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = USERS.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        API.moderateBanUser(user.id, 1, API.BAN.DAY);
                    }
                }
            },
            blinfoCommand: {
                command: 'blinfo',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var author = API.getMedia().author;
                        var title = API.getMedia().title;
                        var name = chat.un;
                        var format = API.getMedia().format;
                        var cid = API.getMedia().cid;
                        var songid = format + ":" + cid;
                        API.sendChat(botChat.subChat(botChat.getChatMessage("blinfo"), {name: name, author: author, title: title, songid: songid}));
                    }
                }
            },

            clearchatCommand: {
                command: 'clearchat',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var currentchat = $('#chat-messages').children();
                        for (var i = 0; i < currentchat.length; i++) {
                            API.moderateDeleteChat(currentchat[i].getAttribute("data-cid"));
                        }
                        return API.sendChat(botChat.subChat(botChat.getChatMessage("chatcleared"), {name: chat.un}));
                    }
                }
            },

            voteskipCommand: {
                command: 'voteskip',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(botChat.subChat(botChat.getChatMessage("voteskiplimit"), {name: chat.un, limit: botVar.room.voteSkipLimit}));
                        var argument = msg.substring(cmd.length + 1);
                        if (!botVar.room.voteSkipEnabled) botVar.room.voteSkipEnabled = !botVar.room.voteSkipEnabled;
                        if (isNaN(argument)) {
                            API.sendChat(botChat.subChat(botChat.getChatMessage("voteskipinvalidlimit"), {name: chat.un}));
                        }
                        else {
                            botVar.room.voteSkipLimit = argument;
                            API.sendChat(botChat.subChat(botChat.getChatMessage("voteskipsetlimit"), {name: chat.un, limit: botVar.room.voteSkipLimit}));
                        }
                    }
                }
            },

            togglevoteskipCommand: {
                command: 'togglevoteskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (botVar.room.voteSkipEnabled) {
                            botVar.room.voteSkipEnabled = !botVar.room.voteSkipEnabled;
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("voteskip")}));
                        }
                        else {
                            botVar.room.voteSkipEnabled = !botVar.room.voteSkipEnabled;
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("voteskip")}));
                        }
                    }
                }
            },

            dclookupCommand: {
                command: ['dclookup', 'dc', 'back'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substring(cmd.length + 2);
                            var perm = API.getPermission(chat.uid);
                            if (perm < 2) return API.sendChat(botChat.subChat(botChat.getChatMessage("dclookuprank"), {name: chat.un}));
                        }
                        var user = USERS.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        var toChat = basicBot.userUtilities.dclookup(user.id);
                        API.sendChat(toChat);
                    }
                }
            },

            emojiCommand: {
                command: 'emoji',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = 'http://www.emoji-cheat-sheet.com/';
                        API.sendChat(botChat.subChat(botChat.getChatMessage("emojilist"), {link: link}));
                    }
                }
            },

            etaCommand: {
                command: 'eta',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var perm = API.getPermission(chat.uid);
                        var msg = chat.message;
                        var name;
                        if (msg.length > cmd.length) {
                            if (perm < 2) return void (0);
                            name = msg.substring(cmd.length + 2);
                        } else name = chat.un;
                        var user = USERS.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        var pos = API.getWaitListPosition(user.id);
                        if (pos < 0) return API.sendChat(botChat.subChat(botChat.getChatMessage("notinwaitlist"), {name: name}));
                        var timeRemaining = API.getTimeRemaining();
                        var estimateMS = ((pos * 4 * 60) + timeRemaining) * 1000;
                        var estimateString = UTIL.msToStr(estimateMS);
                        API.sendChat(botChat.subChat(botChat.getChatMessage("eta"), {name: name, time: estimateString}));
                    }
                }
            },

            filterCommand: {
                command: 'filter',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (botVar.room.filterChat) {
                            botVar.room.filterChat = !botVar.room.filterChat;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("chatfilter")}));
                        }
                        else {
                            botVar.room.filterChat = !botVar.room.filterChat;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("chatfilter")}));
                        }
                    }
                }
            },


            gifCommand: {
                command: ['gif', 'giphy'],
                rank: 'cohost',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!SETTINGS.settings.gifEnabled) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length !== cmd.length) {
                            function get_id(api_key, fixedtag, func)
                            {
                                // Old URL: "https://api.giphy.com/v1/gifs/random?", 
                                $.getJSON(
                                    "https://tv.giphy.com/v1/gifs/random?", 
                                    { 
                                        "format": "json",
                                        "api_key": api_key,
                                        "rating": rating,
                                        "tag": fixedtag
                                    },
                                    function(response)
                                    {
                                        func(response.data.id);
                                    }
                                    )
                            }
                            var api_key = "dc6zaTOxFJmzC"; // public beta key
                            var rating = "pg-13"; // PG 13 gifs
                            var tag = msg.substr(cmd.length + 1);
                            var fixedtag = tag.replace(/ /g,"+");
                            var commatag = tag.replace(/ /g,", ");
                            get_id(api_key, tag, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(botChat.subChat(botChat.getChatMessage("validgiftags"), {name: chat.un, id: id, tags: commatag}));
                                } else {
                                    API.sendChat(botChat.subChat(botChat.getChatMessage("invalidgiftags"), {name: chat.un, tags: commatag}));
                                }
                            });
                        }
                        else {
                            function get_random_id(api_key, func)
                            {
                                $.getJSON(
                                    "https://api.giphy.com/v1/gifs/random?", 
                                    { 
                                        "format": "json",
                                        "api_key": api_key,
                                        "rating": rating
                                    },
                                    function(response)
                                    {
                                        func(response.data.id);
                                    }
                                    )
                            }
                            var api_key = "dc6zaTOxFJmzC"; // public beta key
                            var rating = "pg-13"; // PG 13 gifs
                            get_random_id(api_key, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(botChat.subChat(botChat.getChatMessage("validgifrandom"), {name: chat.un, id: id}));
                                } else {
                                    API.sendChat(botChat.subChat(botChat.getChatMessage("invalidgifrandom"), {name: chat.un}));
                                }
                            });
                        }
                    }
                }
            },

            helpCommand: {
                command: 'help',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = "http://i.imgur.com/SBAso1N.jpg";
                        API.sendChat(botChat.subChat(botChat.getChatMessage("starterhelp"), {link: link}));
                    }
                }
            },

            hopupCommand: {
                command: 'hopup',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.botDjNow();
                    }
                }
            },
            hopdownCommand: {
                command: 'hopdown',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        SETTINGS.settings.hoppingDownNow = true;
                        setTimeout(function () {
                            SETTINGS.settings.hoppingDownNow = false;
                            }, 2000);
                        API.botHopDown();
                    }
                }
            },
            bootCommand: {
                command: 'boot',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    var msg = chat.message;
                    var name;
                    var byusername = " ";
                    if (msg.length === cmd.length) name = chat.un;
                    else {
                        name = msg.substring(cmd.length + 2);
                        var perm = API.getPermission(chat.uid);
                        if (perm < 2) return API.sendChat(botChat.subChat(botChat.getChatMessage("bootrank"), {name: chat.un}));
                        byusername = " [ executed by " + chat.un + " ]";
                    }
                    var user = USERS.lookupUserName(name);
                    if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                    if (user.bootable) {
                        user.bootable = false;
                        API.sendChat(botChat.subChat(botChat.getChatMessage("bootableDisabled"), {name: name, userbyname: byusername}));
                    }
                    else {
                        user.bootable = true;
                        API.sendChat(botChat.subChat(botChat.getChatMessage("bootableEnabled"), {name: name, userbyname: byusername}));
                    }
                }
            },

            joinCommand: {
                command: 'join',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (ROULETTE.rouletteStatus && ROULETTE.participants.indexOf(chat.uid) < 0) {
                            ROULETTE.participants.push(chat.uid);
                            API.sendChat(botChat.subChat(botChat.getChatMessage("roulettejoin"), {name: chat.un}));
                        }
                    }
                }
            },

            jointimeCommand: {
                command: 'jointime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = USERS.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        var join = basicBot.userUtilities.getJointime(user);
                        var time = Date.now() - join;
                        var timeString = UTIL.msToStr(time);
                        API.sendChat(botChat.subChat(botChat.getChatMessage("jointime"), {namefrom: chat.un, username: name, time: timeString}));
                    }
                }
            },

            kickCommand: {
                command: 'kick',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var lastSpace = msg.lastIndexOf(' ');
                        var time;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            time = 0.25;
                            name = msg.substring(cmd.length + 2);
                        }
                        else {
                            time = msg.substring(lastSpace + 1);
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }

                        var user = USERS.lookupUserNameX(name);
                        var from = chat.un;
                        if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));

                        var permFrom = API.getPermission(chat.uid);
                        var permTokick = API.getPermission(user.id);

                        if (permFrom <= permTokick)
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("kickrank"), {name: chat.un}));

                        if (!isNaN(time)) {
                            API.sendChat(botChat.subChat(botChat.getChatMessage("kick"), {name: chat.un, username: name, time: time}));
                            if (time > 24 * 60 * 60) API.moderateBanUser(user.id, 1, API.BAN.PERMA);
                            else API.moderateBanUser(user.id, 1, API.BAN.DAY);
                            setTimeout(function (id, name) {
                                API.moderateUnbanUser(id);
                                //botDebug.debugMessage(true, 'Unbanned @' + name + '. (' + id + ')');
                            }, time * 60 * 1000, user.id, name);
                        }
                        else API.sendChat(botChat.subChat(botChat.getChatMessage("invalidtime"), {name: chat.un}));
                    }
                }
            },

            killbotCommand: {
                command: 'killbot',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        SETTINGS.storeToStorage();
                        API.sendChat(botChat.getChatMessage("kill"));
                        basicBot.disconnectAPI();
                        setTimeout(function () { UTIL.killbot(); }, 1000);
                    }
                }
            },

            leaveCommand: {
                command: 'leave',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var ind = ROULETTE.participants.indexOf(chat.uid);
                        if (ind > -1) {
                            ROULETTE.participants.splice(ind, 1);
                            API.sendChat(botChat.subChat(botChat.getChatMessage("rouletteleave"), {name: chat.un}));
                        }
                    }
                }
            },

            linkCommand: {
                command: 'link',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var media = API.getMedia();
                        var from = chat.un;
                        var user = USERS.lookupUserID(chat.uid);
                        var perm = API.getPermission(chat.uid);
                        var dj = API.getDJ().id;
                        var isDj = false;
                        if (dj === chat.uid) isDj = true;
                        if (perm >= 1 || isDj) {
                            if (media.format === 1) {
                                var linkToSong = "https://www.youtube.com/watch?v=" + media.cid;
                                API.sendChat(botChat.subChat(botChat.getChatMessage("songlink"), {name: from, link: linkToSong}));
                            }
                            if (media.format === 2) {
                                SC.get('/tracks/' + media.cid, function (sound) {
                                    API.sendChat(botChat.subChat(botChat.getChatMessage("songlink"), {name: from, link: sound.permalink_url}));
                                });
                            }
                        }
                    }
                }
            },

            lockCommand: {
                command: 'lock',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        basicBot.roomUtilities.booth.lockBooth();
                    }
                }
            },

            lockdownCommand: {
                command: 'lockdown',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var temp = SETTINGS.settings.lockdownEnabled;
                        SETTINGS.settings.lockdownEnabled = !temp;
                        if (SETTINGS.settings.lockdownEnabled) {
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("lockdown")}));
                        }
                        else return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("lockdown")}));
                    }
                }
            },

            lockskipCommand: {
                command: 'lockskip',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (dubBot.room.skippable) {
                            var dj = API.getDJ();
                            var id = dj.id;
                            var name = dj.username;
                            var msgSend = '@' + name + ': ';
                            dubBot.room.queueable = false;

                            if (chat.message.length === cmd.length) {
                                API.sendChat(botChat.subChat(botChat.getChatMessage("usedlockskip"), {name: chat.un}));
                                basicBot.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.logInfo("Skip song: " + API.getMedia().title + " by: " + chat.un + " Reason: Lockskip command");
                                    API.moderateForceSkip();
                                    dubBot.room.skippable = false;
                                    setTimeout(function () {
                                        dubBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        basicBot.userUtilities.moveUser(id, SETTINGS.settings.lockskipPosition, false);
                                        dubBot.room.queueable = true;
                                        setTimeout(function () {
                                            basicBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < SETTINGS.settings.lockskipReasons.length; i++) {
                                var r = SETTINGS.settings.lockskipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += SETTINGS.settings.lockskipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(botChat.subChat(botChat.getChatMessage("usedlockskip"), {name: chat.un}));
                                basicBot.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.logInfo("Skip song: " + API.getMedia().title + " by: " + chat.un + " Reason: Lockskip command");
                                    API.moderateForceSkip();
                                    dubBot.room.skippable = false;
                                    API.sendChat(msgSend);
                                    setTimeout(function () {
                                        dubBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        basicBot.userUtilities.moveUser(id, SETTINGS.settings.lockskipPosition, false);
                                        dubBot.room.queueable = true;
                                        setTimeout(function () {
                                            basicBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                        }
                    }
                }
            },

            lockskipposCommand: {
                command: 'lockskippos',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var pos = msg.substring(cmd.length + 1);
                        if (!isNaN(pos)) {
                            SETTINGS.settings.lockskipPosition = pos;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("lockskippos"), {name: chat.un, position: SETTINGS.settings.lockskipPosition}));
                        }
                        else return API.sendChat(botChat.subChat(botChat.getChatMessage("invalidpositionspecified"), {name: chat.un}));
                    }
                }
            },

            historytimeCommand: {  //Added 02/14/2015 Zig 
                command: 'historytime',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var maxTime = msg.substring(cmd.length + 1);
                        if (!isNaN(maxTime)) {
                            SETTINGS.settings.repeatSongTime = maxTime;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("repeatSongLimit"), {name: chat.un, time: SETTINGS.settings.repeatSongTime}));
                        }
                        else return API.sendChat(botChat.subChat(botChat.getChatMessage("invalidtime"), {name: chat.un}));
                    }
                }
            },
            logoutCommand: {
                command: 'logout',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(botChat.subChat(botChat.getChatMessage("logout"), {name: chat.un, botname: botVar.botName}));
                        setTimeout(function () {
                            $(".logout").mousedown()
                        }, 1000);
                    }
                }
            },
            maxlengthCommand: {
                command: 'maxlength',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var maxTime = msg.substring(cmd.length + 1);
                        if (!isNaN(maxTime)) {
                            SETTINGS.settings.maximumSongLength = maxTime;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("maxlengthtime"), {name: chat.un, time: SETTINGS.settings.maximumSongLength}));
                        }
                        else return API.sendChat(botChat.subChat(botChat.getChatMessage("invalidtime"), {name: chat.un}));
                    }
                }
            },

            motdCommand: {
                command: 'motd',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat('MotD: ' + SETTINGS.settings.motd);
                        var argument = msg.substring(cmd.length + 1);
                        if (!SETTINGS.settings.motdEnabled) SETTINGS.settings.motdEnabled = !SETTINGS.settings.motdEnabled;
                        if (isNaN(argument)) {
                            SETTINGS.settings.motd = argument;
                            API.sendChat(botChat.subChat(botChat.getChatMessage("motdset"), {msg: SETTINGS.settings.motd}));
                        }
                        else {
                            SETTINGS.settings.motdInterval = argument;
                            API.sendChat(botChat.subChat(botChat.getChatMessage("motdintervalset"), {interval: SETTINGS.settings.motdInterval}));
                        }
                    }
                }
            },

            moveCommand: {
                command: 'move',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var pos;
                        var name;
                        if (isNaN(parseInt(msg.substring(lastSpace + 1)))) {
                            pos = 1;
                            name = msg.substring(cmd.length + 2);
                        }
                        else {
                            pos = parseInt(msg.substring(lastSpace + 1));
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var user = USERS.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        if (user.id === botVar.botID) return API.sendChat(botChat.subChat(botChat.getChatMessage("addbotwaitlist"), {name: chat.un}));
                        if (!isNaN(pos)) {
                            API.sendChat(botChat.subChat(botChat.getChatMessage("move"), {name: chat.un}));
                            basicBot.userUtilities.moveUser(user.id, pos, false);
                        } else return API.sendChat(botChat.subChat(botChat.getChatMessage("invalidpositionspecified"), {name: chat.un}));
                    }
                }
            },

            muteCommand: {
                command: 'mute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                        var lastSpace = msg.lastIndexOf(' ');
                        var time = null;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            name = msg.substring(cmd.length + 2);
                            time = 45;
                        }
                        else {
                            time = msg.substring(lastSpace + 1);
                            if (isNaN(time) || time == "" || time == null || typeof time == "undefined") {
                                return API.sendChat(botChat.subChat(botChat.getChatMessage("invalidtime"), {name: chat.un}));
                            }
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var from = chat.un;
                        var user = USERS.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        var permFrom = API.getPermission(chat.uid);
                        var permUser = API.getPermission(user.id);
                        if (permFrom > permUser) {
                             //botVar.room.mutedUsers.push(user.id);
                             //if (time === null) API.sendChat(botChat.subChat(botChat.getChatMessage("mutednotime"), {name: chat.un, username: name}));
                             //else {
                             //API.sendChat(botChat.subChat(botChat.getChatMessage("mutedtime"), {name: chat.un, username: name, time: time}));
                             //setTimeout(function (id) {
                             //var muted = botVar.room.mutedUsers;
                             //var wasMuted = false;
                             //var indexMuted = -1;
                             //for (var i = 0; i < muted.length; i++) {
                             //if (muted[i] === id) {
                             //indexMuted = i;
                             //wasMuted = true;
                             //}
                             // }
                             //if (indexMuted > -1) {
                             //botVar.room.mutedUsers.splice(indexMuted);
                             //var u = USERS.lookupUserID(id);
                             //var name = u.username;
                             //API.sendChat(botChat.subChat(botChat.getChatMessage("unmuted"), {name: chat.un, username: name}));
                             //}
                             //}, time * 60 * 1000, user.id);
                             //}
                            if (time > 45) {
                                API.sendChat(botChat.subChat(botChat.getChatMessage("mutedmaxtime"), {name: chat.un, time: "45"}));
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                            }
                            else if (time === 45) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(botChat.subChat(botChat.getChatMessage("mutedtime"), {name: chat.un, username: name, time: time}));

                            }
                            else if (time > 30) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(botChat.subChat(botChat.getChatMessage("mutedtime"), {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                            else if (time > 15) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.MEDIUM);
                                API.sendChat(botChat.subChat(botChat.getChatMessage("mutedtime"), {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                            else {
                                API.moderateMuteUser(user.id, 1, API.MUTE.SHORT);
                                API.sendChat(botChat.subChat(botChat.getChatMessage("mutedtime"), {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                        }
                        else API.sendChat(botChat.subChat(botChat.getChatMessage("muterank"), {name: chat.un}));
                    }
                }
            },

            opCommand: {
                command: 'op',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof SETTINGS.settings.opLink === "string")
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("oplist"), {link: SETTINGS.settings.opLink}));
                    }
                }
            },

            refreshbrowserCommand: {
                command: 'refreshbrowser',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        SETTINGS.storeToStorage();
                        basicBot.disconnectAPI();
                        setTimeout(function () {
                            window.location.reload(false);
                        }, 1000);

                    }
                }
            },

            reloadCommand: {
                command: 'reload',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(botChat.getChatMessage("reload"));
                        SETTINGS.storeToStorage();
                        basicBot.disconnectAPI();
                        UTIL.killbot();
                        setTimeout(function () { $.getScript(basicBot.scriptLink); }, 2000);
                    }
                }
            },

            reloadtestCommand: {
                command: 'reloadtest',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(botChat.getChatMessage("reload"));
                        SETTINGS.storeToStorage();
                        basicBot.disconnectAPI();
                        UTIL.killbot();
                        setTimeout(function () { $.getScript(basicBot.scriptTestLink); }, 2000);
                    }
                }
            },

            restrictetaCommand: {
                command: 'restricteta',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (SETTINGS.settings.etaRestriction) {
                            SETTINGS.settings.etaRestriction = !SETTINGS.settings.etaRestriction;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("etarestriction")}));
                        }
                        else {
                            SETTINGS.settings.etaRestriction = !SETTINGS.settings.etaRestriction;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("etarestriction")}));
                        }
                    }
                }
            },

            sessionstatsCommand: {
                command: 'sessionstats',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var woots = dubBot.room.roomstats.totalWoots;
                        var mehs = dubBot.room.roomstats.totalMehs;
                        var grabs = dubBot.room.roomstats.totalCurates;
                        API.sendChat(botChat.subChat(botChat.getChatMessage("sessionstats"), {name: from, woots: woots, mehs: mehs, grabs: grabs}));
                    }
                }
            },

            skipCommand: {
                command: 'skip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (!basicBot.roomUtilities.canSkip()) return API.sendChat("Skip too soon...");
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.logInfo("Skip song: " + API.getMedia().title + " by: " + chat.un + " Reason: Skip command");
                        API.moderateForceSkip();
                        dubBot.room.skippable = false;
                        setTimeout(function () {
                            dubBot.room.skippable = true
                        }, 5 * 1000);

                    }
                }
            },

            blockedCommand: {
                command: 'blocked',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (!basicBot.roomUtilities.canSkip()) return API.sendChat("Skip too soon...");
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        try {
                            var dj = API.getDJ();
                            var msgSend = '@' + dj.username + ': this song has been blocked in the US. please find another version.';
                            API.logInfo("Skip song: " + API.getMedia().title + " by: " + chat.un + " Reason: Blocked");
                            API.moderateForceSkip();
                            dubBot.room.skippable = false;
                            setTimeout(function () {
                                dubBot.room.skippable = true
                            }, 5 * 1000);
                            API.sendChat(msgSend);
                        }
                        catch (err) {
                            UTIL.logException("blockedCommand: " + err.message);
                        }
                    }
                }
            },
            banlistimportCommand: {   //Added: 06/11/2015 Import ban list from last saved in Github
                command: 'banlistimport',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return;
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return;
                        basicBot.roomUtilities.importBlackList();
                    }
                    catch (err) { UTIL.logException("banlistimport: " + err.message); }
                }
            },
            banremoveCommand: {  //Added: 06/10/2015 Remove a song from the ban list by the cid key
                command: 'banremove',
                rank: 'cohost',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat("Missing mid to remove...");
                        var midToRemove = msg.substring(cmd.length + 1);
                        botDebug.debugMessage(true, "Keyword: " + midToRemove);
                        var idxToRemove = dubBot.room.newBlacklistIDs.indexOf(midToRemove);
                        if (idxToRemove < 0) return API.sendChat("Could not locate mid: " + midToRemove);
                        if (dubBot.room.newBlacklist.length !== dubBot.room.newBlacklistIDs.length) return API.sendChat("Could not remove song ban, corrupt song list info.");
                        var track = dubBot.room.newBlacklist[idxToRemove];
                        var msgToSend = chat.un + " removed [" + track.author + " - " + track.title + "] from the banned song list.";
                        dubBot.room.newBlacklist.splice(idxToRemove, 1);  // Remove 1 item from list
                        dubBot.room.newBlacklistIDs.splice(idxToRemove, 1);  // Remove 1 item from list
                        if (dubBot.room.blacklistLoaded) localStorage["BLACKLIST"] = JSON.stringify(dubBot.room.newBlacklist);
                        if (dubBot.room.blacklistLoaded) localStorage["BLACKLISTIDS"] = JSON.stringify(dubBot.room.newBlacklistIDs);
                        API.sendChat(msgToSend);
                        API.logInfo(msgToSend);
                    }
                    catch (err) { UTIL.logException("banremove: " + err.message); }
                }
            },
            banremoveallsongsCommand: { //Added: 06/10/2015 Remove all banned / blacklisted songs
                command: 'banremoveallsongs',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        if (dubBot.room.newBlacklist.length !== dubBot.room.newBlacklistIDs.length) API.sendChat("Could not remove song ban, corrupt song list info.");
                        dubBot.room.newBlacklist.splice(0, dubBot.room.newBlacklist.length);  // Remove all items from list
                        dubBot.room.newBlacklistIDs.splice(0, dubBot.room.newBlacklistIDs.length);  // Remove all items from list
                        if (dubBot.room.blacklistLoaded) localStorage["BLACKLIST"] = JSON.stringify(dubBot.room.newBlacklist);
                        if (dubBot.room.blacklistLoaded) localStorage["BLACKLISTIDS"] = JSON.stringify(dubBot.room.newBlacklistIDs);
                    }
                    catch (err) { UTIL.logException("banremoveallsongs: " + err.message); }
                }
            },
            banallhistorysongsCommand: { //Added: 06/10/2015 Add all songs in current room history to the ban song list
                command: 'banallhistorysongs',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        var songCount = 0;
                        var banCount = 0;
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if ((!BOTCOMMANDS.commands.executable(this.rank, chat)) && chat.uid !== botVar.botID) return void (0);
                        var songHistory = API.getHistory();
                        for (var i = 0; i < songHistory.length; i++) {
                            var song = songHistory[i];
                            songCount++;
                            //if (i === 0) basicBot.roomUtilities.logObject(song, "SONG");
                            var songMid = song.media.format + ':' + song.media.cid;
                            if (dubBot.room.newBlacklistIDs.indexOf(songMid) < 0) {
                            //var media = API.getMedia();
                                var track = {
                                    author: song.media.author,
                                    title: song.media.title,
                                    mid: songMid
                                };
                                basicBot.roomUtilities.banSong(track);
                                banCount++;
                            }
                        }
                        API.logInfo("Banned " + banCount + " out of " + songCount + " songs");
                    }
                    catch (err) { UTIL.logException("banallhistorysongs: " + err.message); }
                }
            },
            banlastsongCommand: { //Added: 06/11/2015 Add all songs in current room history to the ban song list
                command: 'banlastsong',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                    //<a class="ytp-title-link yt-uix-sessionlink" tabindex="13" target="_blank" data-sessionlink="feature=player-title" href="https://www.youtube.com/watch?v=4pjCcIh9O5c">Mase-Feel So Good</a>
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if ((!BOTCOMMANDS.commands.executable(this.rank, chat)) && chat.uid !== botVar.botID) return void (0);
                        var histIndex = "2"; //Default to 2nd song on the list, or the last song played
                        var msg = chat.message;
                        if (msg.length > cmd.length) histIndex = msg.substring(cmd.length + 1);
                        if (isNaN(histIndex)) {
                            API.sendChat("Invalid historical song index number");
                            return;
                        }
                        var songHistory = API.getHistory();
                        if ((parseInt(histIndex) > songHistory.length) || (parseInt(histIndex) < 1)) {
                            API.sendChat("Invalid historical song index value");
                            return;
                        }
                        var song = songHistory[parseInt(histIndex) - 1];
                        if (typeof song === 'undefined') {
                            API.sendChat("Could not define song idx: " + histIndex);
                            return;
                        }
                        var songMid = song.media.format + ':' + song.media.cid;
                        if (dubBot.room.newBlacklistIDs.indexOf(songMid) < 0) {
                            var track = {
                                author: song.media.author,
                                title: song.media.title,
                                mid: songMid
                            };
                            basicBot.roomUtilities.banSong(track);
                            API.sendChat(botChat.subChat(botChat.getChatMessage("newblacklisted"), {name: song.user.username, author: song.media.author, title: song.media.title, mid: song.media.format + ':' + song.media.cid}));
                        }
                        else
                            API.sendChat("This song has already been banned: " + song.media.author + " - " + song.media.title + " - " + song.media.format + ':' + song.media.cid);
                    }
                    catch (err) { UTIL.logException("banlastsong: " + err.message); }
                }
            },
            banlistidjsonCommand: {   //Added: 06/11/2015 List all banned songs
                command: 'banlistidjson',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.logInfo(JSON.stringify(dubBot.room.newBlacklistIDs));
                    }
                    catch (err) { UTIL.logException("banlistidjson: " + err.message); }
                }
            },
            banlistjsonCommand: {   //Added: 06/11/2015 List all banned songs
                command: 'banlistjson',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.logInfo(JSON.stringify(dubBot.room.newBlacklist));
                    }
                    catch (err) { UTIL.logException("banlistjson: " + err.message); }
                }
            },
            userlistjsonCommand: {   //Added: 08/25/2015 List all users to json
                command: 'userlistjson',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.logInfo(JSON.stringify(USERS.users));
                    }
                    catch (err) { UTIL.logException("userlistjson: " + err.message); }
                }
            },
            userliststatsCommand: {   //Added: 08/28/2015
                command: 'userliststats',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return;
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return;
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.logInfo(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = USERS.lookupUserName(name);
                        var msg = "";
                        if (user === false) {
                            msg = "Could not find old user";
                        }
                        else {
                            msg = botChat.subChat(botChat.getChatMessage("mystats"), {name: user.username, songs: user.votes.songsPlayed, woot: user.votes.woot, 
                                                                     grabs: user.votes.curate, mehs: user.votes.meh, tasty: user.votes.tastyRcv});
                            TASTY.resetDailyRolledStats(user);
                            msg += " Roll Stats: " + TASTY.getRolledStats(user);
                        }
                        API.logInfo(msg);

                        var newuser = USERS.lookupUserNameImport(name);
                        if (newuser === false) {
                            msg = "Could not find new user";
                        }
                        else {
                            msg = botChat.subChat(botChat.getChatMessage("mystats"), {name: newuser.username, songs: newuser.votes.songsPlayed,  woot: newuser.votes.woot, 
                                                                     grabs: newuser.votes.curate, mehs: newuser.votes.meh, tasty: newuser.votes.tastyRcv});
                            TASTY.resetDailyRolledStats(newuser);
                            msg += " Roll Stats: " + TASTY.getRolledStats(newuser);
                        }
                        setTimeout(function () { API.logInfo(msg); }, 1 * 1000);
                    }
                    catch (err) { UTIL.logException("userliststats: " + err.message); }
                }
            },

            banlistconsoleCommand: {   //Added: 06/11/2015 List all banned songs
                command: 'banlistconsole',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        basicBot.roomUtilities.logNewBlacklistedSongs();
                    }
                    catch (err) { UTIL.logException("banlistconsole: " + err.message); }
                }
            },
            banlistcountCommand: {   //Added: 06/12/2015 List all banned songs
                command: 'banlistcount',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("I've got " + dubBot.room.newBlacklist.length + " songs on the ban list " + chat.un + ".");
                    }
                    catch (err) { UTIL.logException("banlistcount: " + err.message); }
                }
            },
            banlistCommand: {   //Added: 06/10/2015 List all banned songs
                command: ['banlist','banlistpublic'],
                rank: 'cohost',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        var keyword = "";
                        var privatemsg = false;
                        if (chat.uid === botVar.botID) privatemsg = true;
                        if (cmd.toUpperCase() === "BANLISTPUBLIC") privatemsg = false;
                        var msg = chat.message;
                        var matchCnt = 0;
                        if (msg.length > cmd.length) keyword = msg.substring(cmd.length + 1).toUpperCase();
                        botDebug.debugMessage(true, "Keyword: " + keyword);
                        var dispMsgs = [];
                        for (var i = 0; i < dubBot.room.newBlacklist.length; i++) {
                            var track = dubBot.room.newBlacklist[i];
                            var trackinfo = track.title.toUpperCase() + track.author.toUpperCase();
                            if (trackinfo.indexOf(keyword) > -1) {
                                var dispMsg = "[" + track.author + " - " + track.title + "] -> " + track.mid;
                                if (privatemsg){
                                    API.chatLog(dispMsg);
                                }
                                else {
                                    matchCnt++;
                                    if (matchCnt <= 10) dispMsgs.push(dispMsg);
                                }
                            }
                        }
                        if (!privatemsg) {
                            var msgtoSend = "Found " + matchCnt + " matches.";
                            if (matchCnt > 10) msgtoSend +=  "(only display first 10)"
                            API.sendChat(msgtoSend);
                            if (matchCnt > 0) setTimeout(function () { API.sendChat(dispMsgs[0]); }, 1 * 500);
                            if (matchCnt > 1) setTimeout(function () { API.sendChat(dispMsgs[1]); }, 2 * 500);
                            if (matchCnt > 2) setTimeout(function () { API.sendChat(dispMsgs[2]); }, 3 * 500);
                            if (matchCnt > 3) setTimeout(function () { API.sendChat(dispMsgs[3]); }, 4 * 500);
                            if (matchCnt > 4) setTimeout(function () { API.sendChat(dispMsgs[4]); }, 5 * 500);
                            if (matchCnt > 5) setTimeout(function () { API.sendChat(dispMsgs[5]); }, 6 * 500);
                            if (matchCnt > 6) setTimeout(function () { API.sendChat(dispMsgs[6]); }, 7 * 500);
                            if (matchCnt > 7) setTimeout(function () { API.sendChat(dispMsgs[7]); }, 8 * 500);
                            if (matchCnt > 8) setTimeout(function () { API.sendChat(dispMsgs[8]); }, 9 * 500);
                            if (matchCnt > 9) setTimeout(function () { API.sendChat(dispMsgs[9]); }, 10 * 500);
                        }
                    }
                    catch (err) { UTIL.logException("banlist: " + err.message); }
                }
            },
            oobCommand: {
                command: ['oob','bansong','songban','blacklist','bl'],
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (!basicBot.roomUtilities.canSkip()) return API.sendChat("Skip too soon...");
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        basicBot.roomUtilities.banCurrentSong(chat.un);
                    }
                    catch (err) { UTIL.logException("oob: " + err.message); }
                }
            },
            botmutedCommand: {
                command: 'botmuted',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        basicBot.botMuted = (!basicBot.botMuted);
                        API.logInfo("Bot Muted = " + basicBot.botMuted);
                    }
                    catch (err) { UTIL.logException("botmutedCommand: " + err.message); }
                }
            },
            songstatsCommand: {
                command: 'songstats',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (SETTINGS.settings.songstats) {
                            SETTINGS.settings.songstats = !SETTINGS.settings.songstats;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("songstats")}));
                        }
                        else {
                            SETTINGS.settings.songstats = !SETTINGS.settings.songstats;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("songstats")}));
                        }
                    }
                }
            },

            sourceCommand: {
                command: 'source',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat('This bot was made by ' + botCreator + '.');
                    }
                }
            },

            statusCommand: {
                command: 'status',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var msg = '[@' + from + '] ';

                        msg += botChat.getChatMessage("afkremoval") + ': ';
                        if (AFK.settings.afkRemoval) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += botChat.getChatMessage("afksremoved") + ": " + AFK.afkList.length + '. ';
                        msg += botChat.getChatMessage("afklimit") + ': ' + AFK.settings.maximumAfk + '. ';

                        msg += botChat.getChatMessage("repeatSongs") + ': ';
                        if (botVar.room.repeatSongs) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += botChat.getChatMessage("repeatSongLimit") + ': ' + SETTINGS.settings.repeatSongTime + '. ';

                        msg +=  'Random Comments' + ': ';
                        if (RANDOMCOMMENTS.settings.randomComments) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                                                
                        msg += botChat.getChatMessage("blacklist") + ': ';
                        if (SETTINGS.settings.blacklistEnabled) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += botChat.getChatMessage("timeguard") + ': ';
                        if (SETTINGS.settings.timeGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        var msg2 = botChat.getChatMessage("chatfilter") + ': ';
                        if (botVar.room.filterChat) msg2 += 'ON';
                        else msg2 += 'OFF';
                        msg2 += '. ';

                        msg2 += botChat.getChatMessage("voteskip") + ': ';
                        if (botVar.room.voteSkipEnabled) msg2 += 'ON';
                        else msg2 += 'OFF';
                        msg2 += '. ';

                        var launchT = dubBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = UTIL.msToStr(durationOnline);
                        msg2 += botChat.subChat(botChat.getChatMessage("activefor"), {time: since});

                        setTimeout(function () { API.sendChat(msg2); }, 500);
                        return API.sendChat(msg);
                    }
                }
            },

            swapCommand: {
                command: 'swap',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var name1 = msg.substring(cmd.length + 2, lastSpace);
                        var name2 = msg.substring(lastSpace + 2);
                        var user1 = USERS.lookupUserName(name1);
                        var user2 = USERS.lookupUserName(name2);
                        if (typeof user1 === 'boolean' || typeof user2 === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("swapinvalid"), {name: chat.un}));
                        if (user1.id === botVar.botID || user2.id === botVar.botID) return API.sendChat(botChat.subChat(botChat.getChatMessage("addbottowaitlist"), {name: chat.un}));
                        var p1 = API.getWaitListPosition(user1.id) + 1;
                        var p2 = API.getWaitListPosition(user2.id) + 1;
                        if (p1 < 0 || p2 < 0) return API.sendChat(botChat.subChat(botChat.getChatMessage("swapwlonly"), {name: chat.un}));
                        API.sendChat(botChat.subChat(botChat.getChatMessage("swapping"), {'name1': name1, 'name2': name2}));
                        if (p1 < p2) {
                            basicBot.userUtilities.moveUser(user2.id, p1, false);
                            setTimeout(function (user1, p2) {
                                basicBot.userUtilities.moveUser(user1.id, p2, false);
                            }, 2000, user1, p2);
                        }
                        else {
                            basicBot.userUtilities.moveUser(user1.id, p2, false);
                            setTimeout(function (user2, p1) {
                                basicBot.userUtilities.moveUser(user2.id, p1, false);
                            }, 2000, user2, p1);
                        }
                    }
                }
            },

            themeCommand: {
                command: 'theme',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof SETTINGS.settings.themeLink === "string")
                            API.sendChat(botChat.subChat(botChat.getChatMessage("genres"), {link: SETTINGS.settings.themeLink}));
                    }
                }
            },

            timeguardCommand: {
                command: 'timeguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (SETTINGS.settings.timeGuard) {
                            SETTINGS.settings.timeGuard = !SETTINGS.settings.timeGuard;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("timeguard")}));
                        }
                        else {
                            SETTINGS.settings.timeGuard = !SETTINGS.settings.timeGuard;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("timeguard")}));
                        }

                    }
                }
            },

            toggleblCommand: {
                command: 'togglebl',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var temp = SETTINGS.settings.blacklistEnabled;
                        SETTINGS.settings.blacklistEnabled = !temp;
                        if (SETTINGS.settings.blacklistEnabled) {
                          return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("blacklist")}));
                        }
                        else return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("blacklist")}));
                    }
                }
            },
                        
            togglemotdCommand: {
                command: 'togglemotd',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (SETTINGS.settings.motdEnabled) {
                            SETTINGS.settings.motdEnabled = !SETTINGS.settings.motdEnabled;
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("motd")}));
                        }
                        else {
                            SETTINGS.settings.motdEnabled = !SETTINGS.settings.motdEnabled;
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("motd")}));
                        }
                    }
                }
            },

            unbanCommand: {
                command: 'unban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        $(".icon-population").click();
                        $(".icon-ban").click();
                        setTimeout(function (chat) {
                            var msg = chat.message;
                            if (msg.length === cmd.length) return API.sendChat();
                            var name = msg.substring(cmd.length + 2);
                            var bannedUsers = API.getBannedUsers();
                            var found = false;
                            var bannedUser = null;
                            for (var i = 0; i < bannedUsers.length; i++) {
                                var user = bannedUsers[i];
                                if (user.username === name) {
                                    bannedUser = user;
                                    found = true;
                                }
                            }
                            if (!found) {
                                $(".icon-chat").click();
                                return API.sendChat(botChat.subChat(botChat.getChatMessage("notbanned"), {name: chat.un}));
                            }
                            API.moderateUnbanUser(bannedUser.id);
                            //botDebug.debugMessage(true, "Unbanned " + name);
                            setTimeout(function () {
                                $(".icon-chat").click();
                            }, 1000);
                        }, 1000, chat);
                    }
                }
            },

            unlockCommand: {
                command: 'unlock',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        basicBot.roomUtilities.booth.unlockBooth();
                    }
                }
            },

            unmuteCommand: {
                command: 'unmute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var permFrom = API.getPermission(chat.uid);
                        // if (msg.indexOf('@') === -1 && msg.indexOf('all') !== -1) {
                        //    if (permFrom > 2) {
                        //        botVar.room.mutedUsers = [];
                        //        return API.sendChat(botChat.subChat(botChat.getChatMessage("unmutedeveryone"), {name: chat.un}));
                        //    }
                        //    else return API.sendChat(botChat.subChat(botChat.getChatMessage("unmuteeveryonerank"), {name: chat.un}));
                        //}
                        var from = chat.un;
                        var name = msg.substr(cmd.length + 2);

                        var user = USERS.lookupUserName(name);

                        if (typeof user === 'boolean') return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));

                        var permUser = API.getPermission(user.id);
                        if (permFrom > permUser) {
                             //var muted = botVar.room.mutedUsers;
                             //var wasMuted = false;
                             //var indexMuted = -1;
                             //for (var i = 0; i < muted.length; i++) {
                             //if (muted[i] === user.id) {
                             //indexMuted = i;
                             //wasMuted = true;
                             //}
                             //}
                             //if (!wasMuted) return API.sendChat(botChat.subChat(botChat.getChatMessage("notmuted"), {name: chat.un}));
                             //botVar.room.mutedUsers.splice(indexMuted);
                             //API.sendChat(botChat.subChat(botChat.getChatMessage("unmuted"), {name: chat.un, username: name}));
                            try {
                                API.moderateUnmuteUser(user.id);
                                API.sendChat(botChat.subChat(botChat.getChatMessage("unmuted"), {name: chat.un, username: name}));
                            }
                            catch (err) {
                                API.sendChat(botChat.subChat(botChat.getChatMessage("notmuted"), {name: chat.un}));
                            }
                        }
                        else API.sendChat(botChat.subChat(botChat.getChatMessage("unmuterank"), {name: chat.un}));
                    }
                }
            },

            usercmdcdCommand: {
                command: 'usercmdcd',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var cd = msg.substring(cmd.length + 1);
                        if (!isNaN(cd)) {
                            SETTINGS.settings.commandCooldown = cd;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("commandscd"), {name: chat.un, time: SETTINGS.settings.commandCooldown}));
                        }
                        else return API.sendChat(botChat.subChat(botChat.getChatMessage("invalidtime"), {name: chat.un}));
                    }
                }
            },

            usercommandsCommand: {
                command: 'usercommands',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (SETTINGS.settings.usercommandsEnabled) {
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("usercommands")}));
                            SETTINGS.settings.usercommandsEnabled = !SETTINGS.settings.usercommandsEnabled;
                        }
                        else {
                            API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("usercommands")}));
                            SETTINGS.settings.usercommandsEnabled = !SETTINGS.settings.usercommandsEnabled;
                        }
                    }
                }
            },

            mystatsxCommand: {
                command: 'mystatsx',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        var msg = chat.message;
                        var name = "";
                        if (msg.length === cmd.length) name = chat.un
                        else name = msg.substring(cmd.length + 2);
                        var user = USERS.lookupUserName(name);
                        if (user === false) return API.chatLog(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        var msg = botChat.subChat(botChat.getChatMessage("mystats"), {name: user.username, 
                                                                     songs: user.votes.songsPlayed,
                                                                     woot: user.votes.woot, 
                                                                     grabs: user.votes.curate, 
                                                                     mehs: user.votes.meh, 
                                                                     tasty: user.votes.tastyRcv});
                        var byusername = " [ executed by " + chat.un + " ]";
                        if (chat.un !== name) msg += byusername;
                        API.chatLog(msg);
                    }
                    catch(err) {
                        UTIL.logException("mystatsCommand: " + err.message);
                    }
                }
            },
            voteratioCommand: {
                command: 'voteratio',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = USERS.lookupUserName(name);
                        if (user === false) return API.sendChat(botChat.subChat(botChat.getChatMessage("invaliduserspecified"), {name: chat.un}));
                        var vratio = user.votes;
                        var ratio = vratio.woot / vratio.meh;
                        API.sendChat(botChat.subChat(botChat.getChatMessage("voteratio"), {name: chat.un, username: name, woot: vratio.woot, mehs: vratio.meh, ratio: ratio.toFixed(2)}));
                    }
                }
            },

            welcomeCommand: {
                command: 'welcome',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (SETTINGS.settings.welcome) {
                            SETTINGS.settings.welcome = !SETTINGS.settings.welcome;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleoff"), {name: chat.un, 'function': botChat.getChatMessage("welcomemsg")}));
                        }
                        else {
                            SETTINGS.settings.welcome = !SETTINGS.settings.welcome;
                            return API.sendChat(botChat.subChat(botChat.getChatMessage("toggleon"), {name: chat.un, 'function': botChat.getChatMessage("welcomemsg")}));
                        }
                    }
                }
            },

             echoCommand: {   //Added 01/27/2015 Zig
                command: 'echo',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                try{
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    var msg = chat.message;
                    if (msg.length === cmd.length) return;
                    var msgContent = msg.substring(cmd.length + 1);
                    msgContent = msgContent.replace(/&#39;/g, "'");
                    API.logInfo(chat.un + " used echo: " + msgContent);
                    return API.sendChat(msgContent);
                    }
                catch(err) {
                    UTIL.logException("echoCommand: " + err.message);
                }
                }
            },
             //beerCommand: {   //Added 02/25/2015 Zig
             //   command: 'beer',
             //   rank: 'manager',
             //   type: 'startsWith',
             //   functionality: function (chat, cmd) {
             //   try{
             //       if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
             //       if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
             //       return API.sendChat("@Bacon_Cheeseburger time for another PBR!");
             //       }
             //   catch(err) {
             //       UTIL.logException("beerCommand: " + err.message);
             //   }
             //   }
            //},
            websiteCommand: {
                command: ['website','web'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof SETTINGS.settings.website === "string")
                            API.sendChat(botChat.subChat(botChat.getChatMessage("website"), {link: SETTINGS.settings.website}));
                    }
                }
            },

            origemCommand: {
                command: 'origem',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(botChat.getChatMessage("origem"));
                    }
                }
            },
            englishCommand: {
                command: 'english',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        else {
                            if(chat.message.length === cmd.length) return API.sendChat('No user specified.');
                            var name = chat.message.substring(cmd.length + 2);
                            var roomUser = USERS.lookupUserName(name);
                            if(typeof roomUser === 'boolean') return API.sendChat('Invalid user specified.');
                            var lang = API.getDubUser(roomUser).language;
                            botDebug.debugMessage(true, "lang: " + lang);
                            botDebug.debugMessage(true, "roomUser: " + roomUser.username);
                            botDebug.debugMessage(true, "roomUser: " + roomUser.id);
                            var englishMessage = basicBot.userUtilities.englishMessage(lang, name);
                            API.sendChat(englishMessage);
                        }
                    }
                    catch(err) { UTIL.logException("englishCommand: " + err.message); }
                }
            },
            grabCommand: {  //Added 05/27/2015 Zig  (This command relies on Origem Woot to be running)
                command: 'grab',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                try  {
                  API.sendChat("/grab");
                  //todo: API.grabSong(....
                  //  $("#grab").click(); 
                  }  
                catch(err) {
                  UTIL.logException("grabCommand: " + err.message);
                }
              }
            },
            dasbootCommand: {
                command: 'dasboot',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    var msg = chat.message;
                    if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                    var bootid = msg.substr(cmd.length + 1);
                    if (isNaN(bootid)) return API.sendChat("Invalid ID");
                    API.logInfo("Boot ID: " + bootid);
                    API.moderateBanUser(bootid, 1, API.BAN.PERMA);
                }
            },

            zigunbanCommand: {
                command: 'zigunban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        $(".icon-population").click();
                        $(".icon-ban").click();
                        setTimeout(function (chat) {
                            var msg = chat.message;
                            if (msg.length === cmd.length) return API.sendChat();
                            var name = msg.substring(cmd.length + 2);
                            var bannedUsers = API.getBannedUsers();
                            var found = false;
                            var bannedUser = null;
                            for (var i = 0; i < bannedUsers.length; i++) {
                                var user = bannedUsers[i];
                                if (user.username === name) {
                                    bannedUser = user;
                                    found = true;
                                }
                            }
                            if (!found) {
                                $(".icon-chat").click();
                                return API.sendChat(botChat.subChat(botChat.getChatMessage("notbanned"), {name: chat.un}));
                            }
                            //API.moderateUnbanUser(bannedUser.id);
                            botDebug.debugMessage(true, "Unbanned: " + name);
                            botDebug.debugMessage(true, "Unban ID: " + bannedUser.id);
                            setTimeout(function () {
                                $(".icon-chat").click();
                            }, 1000);
                        }, 1000, chat);
                    }
                }
            },
            meetingCommand: {   //Added 03/28/2015 Zig
                command: ['meeting', 'lunch', 'beerrun'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        var msg = chat.message;
                        var name;
                        var byusername = " ";
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substring(cmd.length + 2);
                            var perm = API.getPermission(chat.uid);
                            if (perm < 2) return API.sendChat(botChat.subChat(botChat.getChatMessage("bootrank"), {name: chat.un}));
                            byusername = " [ executed by " + chat.un + " ]";
                        }
                        var user = USERS.lookupUserName(name);
                        var currPos = API.getWaitListPosition(user.id) + 1;
                        if (currPos < 1) return API.sendChat(botChat.subChat(botChat.getChatMessage("notinwaitlist"), {name: name}));
                        user.lastKnownPosition = currPos;
                        user.lastSeenInLine = Date.now();
                        basicBot.userUtilities.updateDC(user);
                        var msg;
                        if (cmd == '.beerrun') {
                            basicBot.userUtilities.setBeerRunStatus(user, true);
                            msg = botChat.subChat(botChat.getChatMessage("beerrunleave"), {name: API.getDubUser(user).username, pos: currPos});
                        }
                        if (cmd == '.lunch') {
                            basicBot.userUtilities.setLunchStatus(user, true);
                            msg = botChat.subChat(botChat.getChatMessage("lunchleave"), {name: API.getDubUser(user).username, pos: currPos});
                        }
                        if (cmd == '.meeting') {
                            basicBot.userUtilities.setMeetingStatus(user, true);
                            msg = botChat.subChat(botChat.getChatMessage("meetingleave"), {name: API.getDubUser(user).username, pos: currPos});

                        }
                        setTimeout(function () { API.moderateRemoveDJ(user.id); }, 1000);
                        API.sendChat(msg + byusername);
                    }
                    catch(err) {
                        UTIL.logException("meetingCommand: " + err.message);
                    }
                }
            },
            lastplayedCommand: {
                command: 'lastplayed',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat(basicBot.songinfo.songStatsMsg);
                    }
                    catch(err) {
                        UTIL.logException("lastplayed: " + err.message);
                    }
                }
            },
            exrefreshCommand: {
                command: ['exrefresh','refresh?'],
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("Hover over the video area and press the refresh button.  Press it repeatedly until a window pops up and lets you select an alternate song.");
                    }
                    catch(err) {
                        UTIL.logException("exrefresh: " + err.message);
                    }
                }
            },
            kissCommand: {
                command: 'kiss',
                rank: 'residentdj',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        API.sendChat("/me gives " + chat.un + " a big fat :kiss:");
                    }
                    catch(err) {
                        UTIL.logException("exkisscommand: " + err.message);
                    }
                }
            },
            loguserCommand: {
                command: 'loguser',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        else {
                        
                            if(chat.message.length === cmd.length) return API.chatLog('No user specified.');
                            var name = chat.message.substring(cmd.length + 2);
                            var roomUser = USERS.lookupUserName(name);
                            if(typeof roomUser === 'boolean') return API.chatLog('Invalid user specified.');
                            var resetDebug = false;
                            if (dubBot.room.debug === false) resetDebug = true;
                            dubBot.room.debug = true;
                            basicBot.roomUtilities.logObject(roomUser, "User");
                            botDebug.debugMessage(true, "JSON: " + JSON.stringify(roomUser));
                            if (resetDebug) dubBot.room.debug = false;
                        }
                    }
                    catch(err) { UTIL.logException("loguserCommand: " + err.message); }
                }
            },
            zigbanCommand: {
                command: 'zigban',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    var msg = chat.message;
                    if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
                    var bootid = msg.substr(cmd.length + 1);
                    if (isNaN(bootid)) return API.sendChat("Invalid ID");
                    $(".icon-population").click();
                    $(".icon-ban").click();
                    setTimeout(function (bootid) {
                        botDebug.debugMessage(true, "Boot ID: " + bootid);
                        //API.moderateBanUser(bootid, 1, API.BAN.PERMA);
                        setTimeout(function () {
                            $(".icon-chat").click();
                        }, 1000);
                    }, 1000);
                }
            },
            zigaaCommand: {
                command: 'zigaa',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd)  {
                    try {
                        API.botHopDown();
                    }
                    catch(err) {
                        UTIL.logException("zigaaCommand: " + err.message);
                    }
                }
            },
            zigcCommand: {
                command: 'zigc',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd)  {
                    try {
                        basicBot.roomUtilities.validateUserCheck();
                    }
                    catch(err) { UTIL.logException("zigcCommand: " + err.message); }
                }
            },
            zigdCommand: {
                command: 'zigd',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd)  {
                    try {
                    //grab song testing:
                        var songHistory = API.getHistory();
                        //var songHistory = API.getUsers();
                        basicBot.roomUtilities.logObject(songHistory[0], "songHistory");
                        botDebug.debugMessage(true, "Media cid: " + songHistory[0].media.cid);
                        var newMedia = API.getMedia();
                        basicBot.roomUtilities.logObject(newMedia, "Media");
                        API.grabSong("7527918", songHistory[0].media.cid);
//Request body: {"playlistID":,"historyID":"3602db39-e515-4739-aa24-0dc084f384bc"}
//7527918

                        }
                    catch(err) { UTIL.logException("zigdCommand: " + err.message); }
                }
            },
            debugCommand: {
                command: 'debug',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        dubBot.room.debug = (!dubBot.room.debug);
                        API.logInfo("Debug = " + dubBot.room.debug);
                    }
                    catch(err) { UTIL.logException("debugCommand: " + err.message); }
                }
            },
            gifenabledCommand: {
                command: 'gifenabled',
                rank: 'cohost',
                type: 'exact',
                functionality: function (chat, cmd) {
                    try {
                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                        SETTINGS.settings.gifEnabled = (!SETTINGS.settings.gifEnabled);
                        API.logInfo("GifEnabled = " + SETTINGS.settings.gifEnabled);
                    }
                    catch(err) { UTIL.logException("gifenabledCommand: " + err.message); }
                }
            },
//            whoisCommand: {
//                command: 'whois',
//                rank: 'bouncer',
//                type: 'startsWith',
//                functionality: function (chat, cmd) {
//                    try {
//                        if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
//                        if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
//                        var msg = chat.message;
//                        if (msg.length === cmd.length) return API.sendChat(botChat.subChat(botChat.getChatMessage("nouserspecified"), {name: chat.un}));
//                        var whoisuser = msg.substr(cmd.length + 2);
//                        botDebug.debugMessage(true, "whois: " + whoisuser);
//                        var user;
//                        if (isNaN(whoisuser)) user = USERS.lookupUserName(whoisuser);
//                        else                  user = API.getDubUser(whoisuser);
//                        if (typeof user !== 'undefined')  {
//                            botDebug.debugMessage(true, "USER ID: " + user.id);
//                            API.sendChat("USER: " + user.username + " " + user.id);
//                        }
//                        botDebug.debugMessage(true, "TYPE: " + typeof user);
//                    }
//                    catch(err) {
//                        UTIL.logException("whoisCommand: " + err.message);
//                    }
//                }
//            },

            whoisCommand: {
                command: 'whois',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else name = msg.substr(cmd.length + 2);
                        var whoismsg = basicBot.roomUtilities.whoisinfo(chat.un, name);
                        if (whoismsg.length > 0) API.sendChat(whoismsg);
                    }
                }
            },

            youtubeCommand: {
                command: 'youtube',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!BOTCOMMANDS.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof SETTINGS.settings.youtubeLink === "string")
                            API.sendChat(botChat.subChat(botChat.getChatMessage("youtube"), {name: chat.un, link: SETTINGS.settings.youtubeLink}));
                    }
                }
            }
             */
        }
};
if (!window.APIisRunning) {
  API.main.initbot();
} else {
  setTimeout(function () { API.main.initbot(); }, 1000);
}
// basicBot.chat -> botChat.chatMessages botChat.getChatMessage("
// dubBot.room. cBot.room.
//TODO:
// • Test .larry, <<question>>
// • /me comments to not trigger AI detection
// • USER PERMISSIONS
// • Load UID from chat and update/remove users as needed
// • roll/tasty stats
// • Save/Load users
// • afk Monitor
// • .nsfw
// • Skip songs played in last 90 mins
// • Delete comments
// • ban list, 
//WORKING: 
// • tasty comments
// • welcome users
// • 8ball, 
// • random comments
// • rollCommand
// • song stat
// • Skip if > 8 Min
// • Skip if 4 Mehs
// • tasty comments too long!
