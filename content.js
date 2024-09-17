console.log('Content script loaded');

let selectionEnabled = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === "copySelectedText") {
    copySelectedText();
  } else if (request.action === "copyAllText") {
    copyAllText();
  } else if (request.action === "selectAllText") {
    selectAllText();
  } else if (request.action === "toggleSelection") {
    selectionEnabled = request.selectionEnabled;
    toggleSelection();
  }
  sendResponse({status: "success"});
  return true;
});

function copySelectedText() {
  const selectedText = window.getSelection().toString();
  copyTextToClipboard(selectedText);
}

function copyAllText() {
  const allText = getAllText();
  copyTextToClipboard(allText);
}

function selectAllText() {
  const range = document.createRange();
  range.selectNodeContents(document.body);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function toggleSelection() {
  if (selectionEnabled) {
    enableSelection();
  } else {
    disableSelection();
  }
}

function enableSelection() {
  const style = document.createElement('style');
  style.id = 'tniay-enable-selection';
  style.textContent = `
    * {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
      -webkit-touch-callout: default !important;
    }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('*').forEach(element => {
    element.style.setProperty('user-select', 'text', 'important');
    element.oncontextmenu = null;
    element.onselectstart = null;
    element.ondragstart = null;
    element.onmousedown = null;
    element.oncopy = null;
    element.oncut = null;
  });

  console.log('已启用文本选择和复制');
}

function disableSelection() {
  const style = document.getElementById('tniay-enable-selection');
  if (style) {
    style.remove();
  }
  console.log('已禁用文本选择和复制');
}

function getAllText() {
  return document.body.innerText;
}

function copyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    console.log('文本已成功复制到剪贴板');
    // 添加以下行
    chrome.runtime.sendMessage({action: "addToCopyHistory", text: text});
  } catch (err) {
    console.error('无法复制文本: ', err);
  }
  document.body.removeChild(textArea);
}

// 初始化状态
chrome.runtime.sendMessage({action: "getSelectionStatus"}, response => {
  if (response && response.selectionEnabled) {
    selectionEnabled = true;
    enableSelection();
  }
});