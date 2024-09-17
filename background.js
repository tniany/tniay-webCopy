let selectionEnabled = false;

const menuItems = [
  {id: "copySelectedText", title: "复制选中文字", contexts: ["selection"]},
  {id: "copyAllText", title: "复制所有文字", contexts: ["all"]},
  {id: "selectAllText", title: "全选网页文字", contexts: ["all"]},
  {id: "toggleSelection", title: "启用/禁用文本选择", contexts: ["all"]}
];

function updateMenus() {
  chrome.contextMenus.removeAll(() => {
    menuItems.forEach(item => {
      if (item.id === "toggleSelection") {
        item.title = `${selectionEnabled ? "禁用" : "启用"}文本选择 (当前: ${selectionEnabled ? "开启" : "关闭"})`;
      }
      chrome.contextMenus.create(item);
    });
  });
}

chrome.runtime.onInstalled.addListener(updateMenus);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "toggleSelection") {
    selectionEnabled = !selectionEnabled;
    updateMenus();
  }
  chrome.tabs.sendMessage(tab.id, {action: info.menuItemId, selectionEnabled: selectionEnabled});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectionStatus") {
    sendResponse({selectionEnabled: selectionEnabled});
  } else if (request.action === "addToCopyHistory") {
    addToCopyHistory(request.text);
  }
});

function addToCopyHistory(text) {
  chrome.storage.local.get(['copyHistory'], function(result) {
    let history = result.copyHistory || [];
    history.unshift(text);
    history = history.slice(0, 50); // 保留最近50条记录
    chrome.storage.local.set({copyHistory: history});
  });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "copy-text") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "copySelectedText"});
    });
  } else if (command === "open-history") {
    chrome.action.openPopup();
  }
});

// 处理来自 content.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "addToCopyHistory") {
    chrome.storage.local.get(['copyHistory'], function(result) {
      let history = result.copyHistory || [];
      history.unshift(request.text); // 将新复制的文本添加到历史记录的开头
      if (history.length > 10) { // 限制历史记录最多保存10条
        history = history.slice(0, 10);
      }
      chrome.storage.local.set({copyHistory: history});
    });
  }
});