// e:\Codes\Navigate\wp-includes\js\notebook-sync.js
jQuery(document).ready(function ($) {
    // --- IndexedDB 助手函数，用于存储 FileHandle ---
    const dbName = 'notebook-db';
    const storeName = 'file-handles-store';
    const fileHandleKey = 'linked-file-handle';

    function withStore(type, callback) {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(storeName);
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(storeName, type);
            const store = tx.objectStore(storeName);
            callback(store);
        };
        request.onerror = (err) => console.error("数据库错误:", err);
    }

    function idbSet(key, value) {
        return new Promise((resolve, reject) => {
            withStore('readwrite', store => {
                const request = store.put(value, key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    }

    function idbGet(key) {
        return new Promise((resolve) => {
            withStore('readonly', store => {
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(undefined);
            });
        });
    }

    function idbDel(key) {
        return new Promise((resolve, reject) => {
            withStore('readwrite', store => {
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    }

    // --- 记事本逻辑 ---
    const notebook = document.getElementById('notebook');
    const statusSpan = document.getElementById('noteStatus');
    const linkBtn = document.getElementById('linkNoteBtn');
    const clearBtn = document.getElementById('clearNotebook');

    // 确保元素存在
    if (!notebook || !linkBtn || !clearBtn) return;

    let fileHandle;
    let lastModified = 0;
    let isSaving = false;
    let isSyncing = false;
    let syncTimer = null;

    // 统一处理同步中断错误
    function handleSyncError(err) {
        console.error('同步异常:', err);
        statusSpan.textContent = '同步中断，请重新关联';
        statusSpan.style.color = '#dc3545'; // 红色警示
        if (syncTimer) clearInterval(syncTimer);
        syncTimer = null;
        fileHandle = null;
        idbDel(fileHandleKey); // 从数据库中删除失效的句柄
    }

    // 核心函数：初始化同步流程
    async function initializeSync(handle) {
        fileHandle = handle;
        const options = { mode: 'readwrite' };

        // 验证并请求权限（对于自动重连至关重要）
        if ((await fileHandle.queryPermission(options)) !== 'granted') {
            if ((await fileHandle.requestPermission(options)) !== 'granted') {
                statusSpan.textContent = '文件权限已失效，请重新关联';
                statusSpan.style.color = '#dc3545';
                fileHandle = null;
                await idbDel(fileHandleKey); // 清理无效的句柄
                return;
            }
        }

        await loadFromFile();
        statusSpan.style.color = ''; // 重置颜色
        statusSpan.textContent = '已关联本地文件';

        if (syncTimer) clearInterval(syncTimer);
        syncTimer = setInterval(checkForUpdates, 2000);
    }

    // "关联"按钮事件
    linkBtn.addEventListener('click', async () => {
        if (!window.showOpenFilePicker) {
            alert('您的浏览器不支持文件系统访问API，请使用最新版Chrome或Edge浏览器。');
            return;
        }
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }],
            });

            await idbSet(fileHandleKey, handle); // 将句柄存入IndexedDB
            await initializeSync(handle); // 使用新句柄开始同步

        } catch (err) {
            if (err.name !== 'AbortError') { // 用户取消选择文件时不报错
                console.error('关联失败:', err);
                statusSpan.textContent = '关联失败';
            }
        }
    });

    async function loadFromFile() {
        if (!fileHandle) return;
        const file = await fileHandle.getFile();
        lastModified = file.lastModified;
        const text = await file.text();
        if (notebook.value !== text) {
            isSyncing = true;
            notebook.value = text;
            notebook.dispatchEvent(new Event('input'));
            isSyncing = false;
        }
    }

    async function saveToFile() {
        if (!fileHandle || isSaving || isSyncing) return;
        isSaving = true;
        statusSpan.textContent = '保存中...';
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(notebook.value);
            await writable.close();
            const file = await fileHandle.getFile();
            lastModified = file.lastModified;
            statusSpan.textContent = '已保存到本地';
        } catch (err) {
            handleSyncError(err);
        } finally {
            isSaving = false;
        }
    }

    async function checkForUpdates() {
        if (!fileHandle || isSaving || isSyncing) return;
        try {
            const file = await fileHandle.getFile();
            if (file.lastModified > lastModified) {
                statusSpan.textContent = '检测到外部修改，同步中...';
                await loadFromFile();
                statusSpan.textContent = '已同步最新内容';
            }
        } catch (err) { handleSyncError(err); }
    }

    let saveTimeout;
    notebook.addEventListener('input', () => {
        if (!fileHandle || isSyncing) return;
        statusSpan.textContent = '等待保存...';
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveToFile, 1000);
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('确定要清空记事本内容吗？\n如果已关联文件，文件内容也将被清空。')) {
            notebook.value = '';
            if (fileHandle) {
                saveToFile();
            }
        }
    });

    // --- 页面加载时尝试自动重连 ---
    async function tryAutoReconnect() {
        const storedHandle = await idbGet(fileHandleKey);
        if (storedHandle) {
            statusSpan.textContent = '正在尝试自动关联...';
            try {
                await initializeSync(storedHandle);
            } catch (err) {
                console.error("自动关联失败:", err);
                handleSyncError(err);
            }
        }
    }

    tryAutoReconnect();
});
