var chromeSettings = chrome.contentSettings;
var currentTab = null;
var extractHostname = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
var actualState = {
    'allow': 'enabled',
    'block': 'disabled',
    'inactive': 'na'
};

// state = enabled/disabled/na
function changeIconAs(thisState) {
    chrome.browserAction.setIcon({
        path: 'icons/icon-' + thisState + '.png'
    });
}

function getCurrentTab(callback) {
    chrome.tabs.query({
        'active': true
    }, function(tabs) {
        if (tabs && tabs.length) {
            currentTab = tabs[0];
            callback();
        }
    });
}

function updateCurrentState() {
    if (currentTab) {
        var url = currentTab.url;
        var incognito = currentTab.incognito;

        if (url) {
            var fileUrl = /^file:/.test(url);
            var newResourseName = url.match(extractHostname);

            if (fileUrl || !!newResourseName && newResourseName[0])
                chromeSettings.javascript.get({
                    primaryUrl: url,
                    incognito: incognito
                }, function (data) {
                    var state = data.setting;

                    changeIconAs(actualState[state]);
                });
            else
                changeIconAs(actualState['inactive']);
        } else
            changeIconAs(actualState['inactive']);
    }
}

function initialize() { getCurrentTab(updateCurrentState); }

chrome.tabs.onActivated.addListener(initialize);

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == "loading" && tab.selected)
        initialize();
});

chrome.windows.getCurrent(initialize);

function changeJSState() {
    if (currentTab) {
        var url = currentTab.url;
        var incognito = currentTab.incognito;

        if (url)
        chromeSettings.javascript.get({
            primaryUrl: url,
            incognito: incognito
        }, function (data) {
            var state = data.setting;

            if (state) {
                var newState = state == 'allow' ? 'block' : 'allow';
                var pattern = "";

                if (/^file:/.test(url))
                    pattern = url;
                else {
                    var newResourseName = url.match(extractHostname);
                    pattern = !!newResourseName && newResourseName[0] + '/*';
                }

                if (pattern)
                chromeSettings.javascript.set(
                    {
                        primaryPattern: pattern,
                        setting: newState,
                        scope: incognito ? 'incognito_session_only' : 'regular'

                    },
                    function () {
                        changeIconAs(actualState[newState]);
                        chrome.tabs.reload(currentTab.id, { bypassCache: false });
                    }
                );
            }
        })
    }
}

function toggleJS() { getCurrentTab(changeJSState); }

chrome.browserAction.onClicked.addListener(toggleJS);
