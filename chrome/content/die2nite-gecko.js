var itemIdsByImage;
var campingTopologiesByTextSnippet;

var die2NiteApps = {
    'dd': {
        'name':     "From Dusk Till Dawn",
        'code':     "dd",
        'url':      "http://d2n.duskdawn.net/zone/extended",
        'keyName':  "key=",
        'userKey':  null,
        'success':  "HTTP",
        'id':       14
    },
    'at': {
        'name':     "Atlas",
        'code':     "at",
        'url':      "http://atlas.wonderfulfailure.com/scripts/updater.php",
        'keyName':  "key=",
        'userKey':  null,
        'success':  "TEXT",
        'text':     "^1$",
        'id':       12
    },
    'em': {
        'name':     "External Map",
        'code':     "em",
        'url':      "http://d2nextmap.metaemployee.com/index.php?r=site/update",
        'keyName':  "key=",
        'userKey':  null,
        'success':  "TEXT",
        'text':     "^1$",
        'id':       15
    },
    'wc': {
        'name':     "Cartographer",
        'code':     "wc",
        'url':      "http://wastelandcartographer.com/plugin",
        'keyName':  "key=",
        'userKey':  null,
        'success':  "HTTP",
        'id':       19
    },
    'ru': {
        'name':     "Rulesy Map",
        'code':     "ru",
        'url':      "die2nite.gamerz.org.uk/plugin",
        'keyName':  "key=",
        'userKey':  null,
        'success':  "TEXT",
        'text':     "successfully",
        'id':       1
    }
};

var die2nite_gecko = {

    updateZone: function(e) {
        if (die2nite_gecko.inWorldBeyond()) {

            die2nite_gecko.prepareStatusBox();

            var campingTopology = die2nite_gecko.findCampingTopology();
            var zombies = die2nite_gecko.findZombies();
            var zoneDepletion = die2nite_gecko.findZoneDepletion();
            var itemKeys = die2nite_gecko.getItemKeys(die2nite_gecko.groupItems(die2nite_gecko.findItems()));

            var hasBuilding = die2nite_gecko.findHasBuilding();

            var blueprintAvailable;
            if (hasBuilding) {
                blueprintAvailable = die2nite_gecko.findBlueprintAvailable();
            }

            for (var appCode in die2NiteApps) {
                var app = die2NiteApps[appCode];
                if (app.userKey == undefined) {
                    die2nite_gecko.getUserKey(app);
                }
                if (app.userKey == undefined) {
                    die2nite_gecko.setStatus(appCode, "Key not found");
                    continue;
                }
                var key = app.keyName + app.userKey;

                if (appCode == 'dd') {
                    key +=
                        (zombies==undefined?"":"&zombies="+zombies)+
                        (zoneDepletion==undefined?"":"&zone_depleted="+zoneDepletion)+
                        (campingTopology==undefined?"":"&camping_topology="+campingTopology)+
                        (blueprintAvailable==undefined?"":"&blueprint_available="+blueprintAvailable)+
                        die2nite_gecko.getItemKeysAsDataString(itemKeys);
                }
                die2nite_gecko.submitUpdate(app, key);
            }

        } else {
            var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
            promptService.alert(null, "Die2Nite Gecko", "You can only use this when in Die2Nite's World Beyond");
        }
    },

    getItemKeysAsDataString: function(itemKeys) {
        var output = "";
        for(var itemPos = 0; itemPos < itemKeys.length; itemPos++) {
            output += "&items=";
            output += itemKeys[itemPos];
        }
        return output;
    },

    inWorldBeyond: function() {
        return (window.content.location.href.match('^http://www\.die2nite\.com/\#outside\\?go\=outside\/refresh') != null);
    },

    onLoad: function() {
        die2nite_gecko.getItemIdsByImage();
        die2nite_gecko.getCampingTopologiesByText();
        document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function (e) {
            die2nite_gecko.showContextMenu();
        }, false);
    },

    showContextMenu: function() {
        document.getElementById("context-die2nite-gecko").hidden = !die2nite_gecko.inWorldBeyond();
    },

    submitUpdate: function(app, data) {

//        alert(app.code+": "+data);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", app.url, true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("Content-length", data.length);
        xhr.setRequestHeader("Connection", "close");
        xhr.onreadystatechange = (function(currentApp) { return function() {
            if (xhr.readyState == 4) {

                var success = false;

                if (xhr.status == 200) {
                    // Must contain a '1' in the return string
                    if (currentApp.success == "TEXT") {
                        var successText = new RegExp(currentApp.text);
                        success = successText.test(xhr.responseText);
                    }
                    // HTTP status code 200 is success
                    if (currentApp.success == "HTTP") {
                        success = true;
                    }
                }

                if (success) {
                    die2nite_gecko.setStatus(currentApp.code, "updated");
                } else {
                    die2nite_gecko.setStatus(currentApp.code, "failed");
                }

            }
        }})(app);
        xhr.send(data);
    },

    prepareStatusBox: function() {

        if (content.document.getElementById("gecko-status") != undefined) {
            return;
        }

        var genericElement = content.document.getElementById("generic_section");
        var rightHandElements = genericElement == undefined ? null : genericElement.getElementsByClassName("right");
        var headerElements = rightHandElements == undefined || rightHandElements[0] == undefined ? null : rightHandElements[0].getElementsByTagName("h2");
        var headerElement = headerElements == undefined || headerElements[0] == undefined ? null : headerElements[0];

        var statusDiv = document.createElement('div');
        statusDiv.setAttribute("id", "gecko-status");
        for (var appCode in die2NiteApps) {
            var app = die2NiteApps[appCode];
            var appDiv = document.createElement('div');
            appDiv.setAttribute("id", "app-status-"+appCode);
            statusDiv.appendChild(appDiv);
        }
        rightHandElements[0].insertBefore(statusDiv, headerElement);
    },

    setStatus: function(appCode, message) {
        var appStatusBlock = content.document.getElementById("app-status-"+appCode);
        appStatusBlock.innerHTML = "";
        var theNewParagraph = document.createElement('p');
        var theText1 = document.createTextNode(appCode+": "+message);
        theNewParagraph.appendChild(theText1);
        appStatusBlock.appendChild(theNewParagraph);
    },

    getUserKey: function(app) {
        var regex = /<input.*?name="key".*?value="([0-9a-f]+)"/ig;
        regex.lastIndex = 0;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://www.die2nite.com/disclaimer?id=" + app.id, false);
        xhr.send(null);
        if(xhr.status == 200) {
            var matches = regex.exec(xhr.responseText);
            if (matches != undefined && matches.length >= 2) {
                app.userKey = matches[1];
            }
        }
    },

    getCampingTopologiesByText: function() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://d2n.duskdawn.net/domain/camping_topologies_by_text", true);
        xhr.setRequestHeader("Connection", "close");
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    campingTopologiesByTextSnippet = JSON.parse(xhr.responseText);
                } else {
                    alert("Unable to load camping topologies from Duskdawn");
                }
            }
        };
        xhr.send();
    },

    getItemIdsByImage: function() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://d2n.duskdawn.net/domain/items_by_image", true);
        xhr.setRequestHeader("Connection", "close");
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    itemIdsByImage  = JSON.parse(xhr.responseText);
                } else {
                    alert("Unable to load items from Duskdawn");
                }
            }
        };
        xhr.send();
    },

    findCampingTopology: function() {
        var campElements = content.document.getElementsByClassName("camp");
        var campText = campElements == undefined  || campElements[0] == undefined ? [] : campElements[0].getElementsByTagName("p");
        campText = campText == undefined ? [] : campText;
        for (var textPos = 0; textPos < campText.length; textPos++) {
            for (var snippet in campingTopologiesByTextSnippet) {
                if (campText[textPos].innerHTML.indexOf(snippet) != -1) {
                    return campingTopologiesByTextSnippet[snippet];
                }
            }
        }
        return undefined;
    },

    findZombies: function() {
        var regex = /([0-9]+)/ig;
        var zombieElement = content.document.getElementById("zombiePts");
        return zombieElement == undefined ? 0 : regex.exec(zombieElement.innerHTML)[1];
    },

    findZoneDepletion: function() {
        var depletedZoneElement = content.document.getElementsByClassName("driedZone");
        return depletedZoneElement == undefined ? false : depletedZoneElement.length > 0;
    },

    findHasBuilding: function() {
        var buildingElement = content.document.getElementsByClassName("outSpot");
        return buildingElement == undefined ? false : buildingElement.length > 0;
    },

    findBlueprintAvailable: function() {
        var campingElement = content.document.getElementById("campInfos");
        var campingText = campingElement == undefined ? [] : campingElement.getElementsByTagName("p");
        campingText = campingText == undefined ? [] : campingText;
        for (var textPos = 0; textPos < campingText.length; textPos++) {
            if (    campingText[textPos].innerHTML.indexOf("You can obtain a blueprint if you camp here, but the zone must be cleared first of all.") != -1 ||
                    campingText[textPos].innerHTML.indexOf("You will earn a <strong>construction blueprint</strong> if you camp in this building.") != -1) {
                return true;
            }
        }
        return false;
    },

    getItemKeys: function(groupedItems) {
        var itemKeys = [];
        for (var key in groupedItems) {
            itemKeys.push(key+"-"+groupedItems[key]);
        }
        return itemKeys;
    },

    groupItems: function(ungroupedItems) {
        var groupedItems = {};
        for(var itemPos = 0; itemPos < ungroupedItems.length; itemPos++) {
            var ungroupedItem = ungroupedItems[itemPos];
            if (groupedItems[ungroupedItem] == undefined) {
                groupedItems[ungroupedItems[itemPos]] = 1;
            } else {
                groupedItems[ungroupedItems[itemPos]]++;
            }
        }
        return groupedItems;
    },

    findItems: function() {

        var stuffOnTheGround = content.document.getElementsByClassName("outInv")[0];
        var items = stuffOnTheGround == undefined ? [] : stuffOnTheGround.getElementsByTagName("li");
        var itemIds = [];
        for(var itemPos = 0; itemPos < items.length; itemPos++) {
            var item = items[itemPos];
            if (die2nite_gecko.hasClass(item, 'clear') || die2nite_gecko.hasClass(item, 'label')) {
                continue;
            }
            var enclosingElements = item.getElementsByTagName("a");
            if (enclosingElements == undefined || enclosingElements[0] == undefined) {
                enclosingElements = item.getElementsByTagName("span");
                if (enclosingElements == undefined || enclosingElements[0] == undefined) {
                    continue;
                }
            }
            var broken = die2nite_gecko.hasClass(enclosingElements[0], 'limited');
            var images = enclosingElements[0].getElementsByTagName("img");
            if (images == undefined || images[0] == undefined) {
                continue;
            }
            itemIds.push(die2nite_gecko.convertImageNameToId(images[0])+(broken?"B":""));
        }
        return itemIds;
    },

    convertImageNameToId: function(image) {
        var regex = /http:\/\/data.die2nite.com\/gfx\/icons\/item_([0-9a-z_]+)\.gif/ig;
        var imageName = regex.exec(image.src)[1];
        return itemIdsByImage[imageName];
    },

    hasClass: function(element, className) {
        return element.className == undefined ? false : element.className.match(new RegExp('(\\s|^)'+className+'(\\s|$)'));
    }

};

window.addEventListener("load", function () {
    die2nite_gecko.onLoad();
}, false);
