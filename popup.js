console.log('Popup script loaded');

document.addEventListener('DOMContentLoaded', function() {
  const titleSection = document.getElementById('titleSection');
  const introSection = document.getElementById('introSection');
  const copyHistory = document.getElementById('copyHistory');
  const historyTitle = document.getElementById('historyTitle');
  const noHistoryMessage = document.getElementById('noHistoryMessage');

  // 检查是否是首次使用
  chrome.storage.local.get(['introHidden'], function(result) {
    if (result.introHidden) {
      introSection.style.display = 'none';
    } else {
      introSection.style.display = 'block';
    }
  });

  // 添加点击标题显示/隐藏介绍的功能
  titleSection.addEventListener('click', function() {
    if (introSection.style.display === 'none') {
      introSection.style.display = 'block';
      chrome.storage.local.set({introHidden: false});
    } else {
      introSection.style.display = 'none';
      chrome.storage.local.set({introHidden: true});
    }
  });

  // 在每次打开弹出窗口时隐藏介绍
  chrome.storage.local.set({introHidden: true});

  function loadHistory() {
    chrome.storage.local.get(['copyHistory'], function(result) {
      const history = result.copyHistory || [];
      copyHistory.innerHTML = '';
      
      if (history.length > 0) {
        copyHistory.style.display = 'block';
        historyTitle.style.display = 'block';
        noHistoryMessage.style.display = 'none';
        
        history.forEach((item, index) => {
          const div = document.createElement('div');
          div.className = 'history-item';
          
          const textContainer = document.createElement('div');
          textContainer.className = 'history-text-container';
          
          const textSpan = document.createElement('span');
          textSpan.className = 'history-text';
          textSpan.textContent = item;
          textSpan.title = item;
          textSpan.addEventListener('click', function() {
            copyToClipboard(item);
          });
          
          textContainer.appendChild(textSpan);
          
          const editBtn = document.createElement('button');
          editBtn.className = 'edit-btn';
          editBtn.innerHTML = '✎';
          editBtn.title = '修改';
          editBtn.addEventListener('click', function() {
            editHistoryItem(index, item);
          });
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-btn';
          deleteBtn.innerHTML = '✖';
          deleteBtn.title = '删除';
          deleteBtn.addEventListener('click', function() {
            deleteHistoryItem(index);
          });
          
          div.appendChild(textContainer);
          div.appendChild(editBtn);
          div.appendChild(deleteBtn);
          copyHistory.appendChild(div);
        });
      } else {
        copyHistory.style.display = 'none';
        historyTitle.style.display = 'none';
        noHistoryMessage.style.display = 'block';
      }
    });
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
      console.log('文本已成功复制到剪贴板');
    }, function(err) {
      console.error('无法复制文本: ', err);
    });
  }

  function editHistoryItem(index, currentText) {
    const fullscreenEdit = document.createElement('div');
    fullscreenEdit.className = 'fullscreen-edit';
    fullscreenEdit.innerHTML = `
      <textarea id="editArea">${currentText}</textarea>
      <div class="button-container">
        <button id="saveBtn">保存</button>
        <button id="cancelBtn">取消</button>
      </div>
    `;
    document.body.appendChild(fullscreenEdit);

    const editArea = document.getElementById('editArea');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    saveBtn.addEventListener('click', function() {
      const newText = editArea.value;
      if (newText !== currentText) {
        chrome.storage.local.get(['copyHistory'], function(result) {
          let history = result.copyHistory || [];
          history[index] = newText;
          chrome.storage.local.set({copyHistory: history}, function() {
            document.body.removeChild(fullscreenEdit);
            loadHistory();
          });
        });
      } else {
        document.body.removeChild(fullscreenEdit);
      }
    });

    cancelBtn.addEventListener('click', function() {
      document.body.removeChild(fullscreenEdit);
    });
  }

  function deleteHistoryItem(index) {
    if (confirm("确定要删除这条历史记录吗？")) {
      chrome.storage.local.get(['copyHistory'], function(result) {
        let history = result.copyHistory || [];
        history.splice(index, 1);
        chrome.storage.local.set({copyHistory: history}, loadHistory);
      });
    }
  }

  loadHistory();

  // GitHub 仓库跳转按钮的点击事件
  document.getElementById('github-link').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://github.com/tniany/tniay-webCopy.git' });
  });
});