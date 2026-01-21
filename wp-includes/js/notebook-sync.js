// e:\Codes\Navigate\wp-includes\js\notebook-sync.js
jQuery(document).ready(function ($) {
    // 记事本功能：关联本地文件(自动保存/同步)
    const notebook = document.getElementById('notebook');
    const statusSpan = document.getElementById('noteStatus');
    const linkBtn = document.getElementById('linkNoteBtn');

    // 确保元素存在
    if (!notebook || !linkBtn) return;

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
    }

    // 2.  关联本地文件 (自动保存 + 双向同步)
    linkBtn.addEventListener('click', async () => {
        if (!window.showOpenFilePicker) {
            alert('您的浏览器不支持文件系统访问API，请使用最新版Chrome或Edge浏览器。');
            return;
        }
        try {
            [fileHandle] = await window.showOpenFilePicker({
                types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }],
            });

            // 关键修复：立即请求写权限，防止后续自动保存因缺少用户手势被拦截
            const options = { mode: 'readwrite' };
            if ((await fileHandle.queryPermission(options)) !== 'granted') {
                if ((await fileHandle.requestPermission(options)) !== 'granted') {
                    alert('需要授予写权限才能启用自动保存功能。');
                    fileHandle = null;
                    return;
                }
            }

            await loadFromFile();
            statusSpan.style.color = ''; // 重置颜色
            statusSpan.textContent = '已关联本地文件';

            // 清除可能存在的旧定时器，防止重复关联导致多重轮询
            if (syncTimer) clearInterval(syncTimer);
            // 启动轮询检查外部修改
            syncTimer = setInterval(checkForUpdates, 2000);
        } catch (err) {
            console.error('关联失败:', err);
            statusSpan.textContent = '关联失败';
        }
    });

    async function loadFromFile() {
        if (!fileHandle) return;
        const file = await fileHandle.getFile();
        lastModified = file.lastModified;
        const text = await file.text();
        if (notebook.value !== text) {
            isSyncing = true; // 标记正在同步，避免触发保存
            notebook.value = text;
            notebook.dispatchEvent(new Event('input'));
            isSyncing = false;
        }
    }

    async function saveToFile() {
        if (!fileHandle || isSaving) return;
        isSaving = true;
        statusSpan.textContent = '保存中...';
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(notebook.value);
            await writable.close();
            // 更新最后修改时间，防止轮询时误判为外部修改
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
        if (!fileHandle || isSaving) return;
        try {
            const file = await fileHandle.getFile();
            // 如果文件在磁盘上的修改时间晚于我们最后一次读取/写入的时间
            if (file.lastModified > lastModified) {
                statusSpan.textContent = '检测到外部修改，同步中...';
                await loadFromFile();
                statusSpan.textContent = '已同步最新内容';
            }
        } catch (err) { handleSyncError(err); }
    }

    // 监听输入事件进行防抖自动保存
    let saveTimeout;
    notebook.addEventListener('input', () => {
        if (!fileHandle || isSyncing) return;
        statusSpan.textContent = '等待保存...';
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveToFile, 1000); // 停止输入1秒后保存
    });
});
