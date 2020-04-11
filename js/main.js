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

function getCurrentTab() {

    chrome.tabs.query({
        'active': true,
        'windowId': chrome.windows.WINDOW_ID_CURRENT
    }, function(tabs) {
        currentTab = tabs[0];
    });
}

function initialize() {
    getCurrentTab();

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

chrome.tabs.onUpdated.addListener(function (tabId, props, tab) {
    if (props.status == "loading" && tab.selected) {
      initialize();
    }
  });

  chrome.tabs.onHighlighted.addListener(function () {
    initialize();
  });

  chrome.windows.onFocusChanged.addListener(function () {
    initialize();
  });

  chrome.windows.getCurrent(function () {
    initialize();
  });

function toggleJS() {
    getCurrentTab();

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

chrome.browserAction.onClicked.addListener(toggleJS);
