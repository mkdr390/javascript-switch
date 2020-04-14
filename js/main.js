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
        currentTab = tabs[0];
        callback();
    });
}

function updateCurrentState() {
    if (currentTab) {
        var url = currentTab.url;
        var incognito = currentTab.incognito;

        chromeSettings.javascript.get({
            primaryUrl: url,
            incognito: incognito
        }, function (data) {
            var state = data.setting;

            changeIconAs(actualState[state]);
        })
    }
}

function initialize() { getCurrentTab(updateCurrentState); }

chrome.tabs.onActivated.addListener(initialize);
chrome.windows.getCurrent(initialize);

function changeJSState() {
    if (currentTab) {
        var url = currentTab.url;
        var incognito = currentTab.incognito;

        chromeSettings.javascript.get({
            primaryUrl: url,
            incognito: incognito
        }, function (data) {
            var state = data.setting;

            if (state) {
                var newState = state == 'allow' ? 'block' : 'allow';
                var pattern = /^file:/.test(url) ? url : url.match(extractHostname)[0] + '/*';

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
