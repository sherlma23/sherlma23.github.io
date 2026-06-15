// 日程清单：用 JSON 保存事项、完成状态、截止日期和排序。
(function () {
    const form = document.getElementById('scheduleForm');
    const input = document.getElementById('scheduleInput');
    const deadlineInput = document.getElementById('scheduleDeadline');
    const list = document.getElementById('scheduleList');
    const emptyState = document.getElementById('scheduleEmpty');
    const summary = document.getElementById('scheduleSummary');
    const statusSpan = document.getElementById('scheduleStatus');
    const openAddBtn = document.getElementById('openScheduleAdd');
    const openFullAddBtn = document.getElementById('openScheduleFullAdd');
    const addOverlay = document.getElementById('scheduleAddOverlay');
    const closeAddBtn = document.getElementById('closeScheduleAdd');
    const cancelAddBtn = document.getElementById('cancelScheduleAdd');
    const addTitle = document.getElementById('scheduleAddTitle');
    const submitBtn = document.getElementById('submitScheduleItem');
    const viewFullBtn = document.getElementById('viewScheduleFull');
    const fullOverlay = document.getElementById('scheduleFullOverlay');
    const fullList = document.getElementById('scheduleFullList');
    const fullEmptyState = document.getElementById('scheduleFullEmpty');
    const fullSummary = document.getElementById('scheduleFullSummary');
    const closeFullBtn = document.getElementById('closeScheduleFull');
    const linkBtn = document.getElementById('linkScheduleBtn');
    const filterTabs = Array.from(document.querySelectorAll('[data-schedule-filter]'));

    if (!form || !input || !deadlineInput || !list || !emptyState || !summary || !statusSpan ||
        !openAddBtn || !openFullAddBtn || !addOverlay || !closeAddBtn || !cancelAddBtn || !addTitle || !submitBtn || !viewFullBtn ||
        !fullOverlay || !fullList || !fullEmptyState || !fullSummary || !closeFullBtn ||
        !linkBtn || !filterTabs.length) {
        return;
    }

    const storageKey = 'schedule-list';
    const dbName = 'schedule-list-db';
    const storeName = 'file-handles-store';
    const fileHandleKey = 'linked-schedule-file-handle';
    const jsonFileOptions = {
        types: [{
            description: 'Schedule JSON',
            accept: { 'application/json': ['.json'] }
        }]
    };

    let items = [];
    let activeFilter = 'pending';
    let fileHandle = null;
    let lastModified = 0;
    let isSaving = false;
    let isSyncing = false;
    let needsSaveAfterCurrent = false;
    let saveTimeout = null;
    let syncTimer = null;
    let draggingId = null;
    let dropTargetId = null;
    let dropAfter = false;
    let editingId = null;

    function withStore(type, callback) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction(storeName, type);
                const store = tx.objectStore(storeName);

                tx.oncomplete = () => {
                    db.close();
                    resolve();
                };
                tx.onerror = () => {
                    db.close();
                    reject(tx.error);
                };

                callback(store);
            };

            request.onerror = () => reject(request.error);
        });
    }

    function idbSet(key, value) {
        return withStore('readwrite', (store) => {
            store.put(value, key);
        });
    }

    function idbGet(key) {
        return new Promise((resolve) => {
            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const getRequest = store.get(key);

                getRequest.onsuccess = () => resolve(getRequest.result);
                getRequest.onerror = () => resolve(undefined);
                tx.oncomplete = () => db.close();
                tx.onerror = () => {
                    db.close();
                    resolve(undefined);
                };
            };

            request.onerror = () => resolve(undefined);
        });
    }

    function idbDel(key) {
        return withStore('readwrite', (store) => {
            store.delete(key);
        });
    }

    function setStatus(text, type) {
        statusSpan.textContent = text;
        if (type === 'error') {
            statusSpan.style.color = '#dc3545';
        } else if (type === 'success') {
            statusSpan.style.color = '#198754';
        } else {
            statusSpan.style.color = '';
        }
    }

    function updateConnectionControls() {
        if (fileHandle) {
            linkBtn.textContent = '断开连接';
            linkBtn.classList.remove('btn-outline-success');
            linkBtn.classList.add('btn-outline-secondary');
        } else {
            linkBtn.textContent = '关联文件';
            linkBtn.classList.remove('btn-outline-secondary');
            linkBtn.classList.add('btn-outline-success');
        }
    }

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function now() {
        return new Date().toISOString();
    }

    function todayDateString() {
        const date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 10);
    }

    function normalizeDate(value, fallback) {
        if (!value) {
            return fallback;
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return fallback;
        }

        return date.toISOString();
    }

    function normalizeDeadline(value) {
        if (!value) {
            return null;
        }

        const text = String(value).trim();
        if (!text) {
            return null;
        }

        const dateOnly = text.slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
            return dateOnly;
        }

        const date = new Date(text);
        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return date.toISOString().slice(0, 10);
    }

    function normalizeItems(data) {
        const source = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);

        return source.map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }

            const rawText = item.text !== undefined ? item.text : item.title;
            const text = String(rawText || '').trim();

            if (!text) {
                return null;
            }

            const done = Boolean(item.done !== undefined ? item.done : item.completed);
            const createdAt = normalizeDate(item.createdAt, now());
            const completedAt = done ? normalizeDate(item.completedAt, now()) : null;

            return {
                id: item.id ? String(item.id) : createId(),
                text,
                done,
                deadline: normalizeDeadline(item.deadline),
                createdAt,
                completedAt
            };
        }).filter(Boolean);
    }

    function serializeSchedule() {
        return JSON.stringify({
            version: 1,
            updatedAt: now(),
            items
        }, null, 2);
    }

    function loadLocalItems() {
        const saved = localStorage.getItem(storageKey);
        if (!saved) {
            return [];
        }

        try {
            return normalizeItems(JSON.parse(saved));
        } catch (err) {
            console.error('日程清单本地缓存读取失败:', err);
            return [];
        }
    }

    function saveLocalItems() {
        localStorage.setItem(storageKey, serializeSchedule());
    }

    function getFilteredItems() {
        return items.filter((item) => activeFilter === 'done' ? item.done : !item.done);
    }

    function getEmptyText() {
        return activeFilter === 'done' ? '暂无已完成事项' : '暂无未完成事项';
    }

    function updateSummary() {
        const pendingCount = items.filter((item) => !item.done).length;
        const doneCount = items.length - pendingCount;
        const text = `未完成 ${pendingCount} / 已完成 ${doneCount}`;

        summary.textContent = text;
        fullSummary.textContent = text;

        filterTabs.forEach((tab) => {
            const filter = tab.dataset.scheduleFilter;
            tab.classList.toggle('active', filter === activeFilter);
            tab.setAttribute('aria-selected', filter === activeFilter ? 'true' : 'false');
            tab.textContent = filter === 'done' ? `已完成 (${doneCount})` : `未完成 (${pendingCount})`;
        });
    }

    function createItemElement(item, prefix, index) {
        const li = document.createElement('li');
        const dragBtn = document.createElement('button');
        const checkbox = document.createElement('input');
        const content = document.createElement('div');
        const title = document.createElement('div');
        const deleteBtn = document.createElement('button');
        const checkboxId = `${prefix}-schedule-${index}-${item.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

        li.className = item.done ? 'schedule-item is-done' : 'schedule-item';
        if (item.deadline && item.deadline < todayDateString()) {
            li.classList.add('is-overdue');
        }
        li.dataset.id = item.id;

        dragBtn.className = 'schedule-drag';
        dragBtn.type = 'button';
        dragBtn.draggable = true;
        dragBtn.dataset.action = 'drag';
        dragBtn.setAttribute('aria-label', '调整顺序');
        dragBtn.title = '调整顺序';
        dragBtn.innerHTML = '<i class="fas fa-grip-vertical" aria-hidden="true"></i>';

        checkbox.className = 'schedule-checkbox';
        checkbox.type = 'checkbox';
        checkbox.checked = item.done;
        checkbox.id = checkboxId;
        checkbox.setAttribute('aria-label', item.done ? '标记为未完成' : '标记为已完成');

        content.className = 'schedule-content';
        content.dataset.action = 'edit';
        content.title = '双击编辑';

        title.className = 'schedule-title';
        title.textContent = item.text;

        content.appendChild(title);

        if (item.deadline) {
            const meta = document.createElement('div');
            meta.className = 'schedule-meta';
            meta.innerHTML = `<i class="fas fa-calendar-day" aria-hidden="true"></i><span>截止 ${item.deadline}</span>`;
            content.appendChild(meta);
        }

        deleteBtn.className = 'schedule-delete';
        deleteBtn.type = 'button';
        deleteBtn.dataset.action = 'delete';
        deleteBtn.setAttribute('aria-label', '删除事项');
        deleteBtn.title = '删除';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt" aria-hidden="true"></i>';

        li.appendChild(dragBtn);
        li.appendChild(checkbox);
        li.appendChild(content);
        li.appendChild(deleteBtn);

        return li;
    }

    function renderInto(container, prefix, visibleItems) {
        container.innerHTML = '';

        visibleItems.forEach((item, index) => {
            container.appendChild(createItemElement(item, prefix, index));
        });
    }

    function render() {
        const visibleItems = getFilteredItems();

        renderInto(list, 'main', visibleItems);
        renderInto(fullList, 'full', visibleItems);
        emptyState.textContent = getEmptyText();
        fullEmptyState.textContent = getEmptyText();
        updateSummary();
    }

    function queueFileSave(immediate) {
        if (!fileHandle || isSyncing) {
            return;
        }

        clearTimeout(saveTimeout);
        saveTimeout = null;

        if (immediate) {
            saveToFile();
            return;
        }

        setStatus('等待保存...');
        saveTimeout = setTimeout(saveToFile, 10000);
    }

    function persist(options) {
        const opts = options || {};
        saveLocalItems();
        render();

        if (fileHandle && opts.syncFile !== false) {
            queueFileSave(Boolean(opts.immediate));
        } else {
            setStatus('已保存到浏览器');
        }
    }

    function stopSync() {
        if (syncTimer) {
            clearInterval(syncTimer);
        }
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        saveTimeout = null;
        syncTimer = null;
        fileHandle = null;
        needsSaveAfterCurrent = false;
        updateConnectionControls();
    }

    function handleSyncError(err) {
        console.error('日程清单同步异常:', err);
        stopSync();
        idbDel(fileHandleKey).catch((deleteErr) => console.error('日程清单文件句柄清理失败:', deleteErr));
        setStatus('同步中断，请重新关联文件', 'error');
    }

    async function saveToFile() {
        if (!fileHandle || isSyncing) {
            return false;
        }

        if (isSaving) {
            needsSaveAfterCurrent = true;
            return false;
        }

        clearTimeout(saveTimeout);
        saveTimeout = null;
        isSaving = true;
        setStatus('保存中...');

        try {
            const writable = await fileHandle.createWritable();
            await writable.write(serializeSchedule());
            await writable.close();

            const file = await fileHandle.getFile();
            lastModified = file.lastModified;
            setStatus('已保存到本地', 'success');
            return true;
        } catch (err) {
            handleSyncError(err);
            return false;
        } finally {
            isSaving = false;

            if (needsSaveAfterCurrent && fileHandle && !isSyncing) {
                needsSaveAfterCurrent = false;
                queueFileSave(true);
            }
        }
    }

    function parseFileText(text) {
        if (!text.trim()) {
            return null;
        }

        return normalizeItems(JSON.parse(text));
    }

    function mergeMissingBrowserItems(fileItems, browserItems) {
        const fileIds = new Set(fileItems.map((item) => item.id));
        const additions = browserItems.filter((item) => !fileIds.has(item.id));

        return {
            items: fileItems.concat(additions.map((item) => ({ ...item }))),
            addedCount: additions.length
        };
    }

    async function loadFromFile(options) {
        if (!fileHandle) {
            return { addedCount: 0 };
        }

        const opts = {
            writeCurrentIfEmpty: false,
            mergeBrowserItems: false,
            ...(options || {})
        };
        const browserItems = items.map((item) => ({ ...item }));
        const file = await fileHandle.getFile();
        const text = await file.text();
        const fileItems = parseFileText(text);

        lastModified = file.lastModified;

        if (fileItems === null) {
            const addedCount = opts.writeCurrentIfEmpty ? browserItems.length : 0;
            if (opts.writeCurrentIfEmpty) {
                await saveToFile();
            }
            return { addedCount };
        }

        let nextItems = fileItems;
        let addedCount = 0;

        if (opts.mergeBrowserItems) {
            const merged = mergeMissingBrowserItems(fileItems, browserItems);
            nextItems = merged.items;
            addedCount = merged.addedCount;
        }

        isSyncing = true;
        items = nextItems;
        saveLocalItems();
        render();
        isSyncing = false;

        if (addedCount > 0) {
            await saveToFile();
        }

        return { addedCount };
    }

    async function ensurePermission(handle) {
        const options = { mode: 'readwrite' };

        if ((await handle.queryPermission(options)) === 'granted') {
            return true;
        }

        return (await handle.requestPermission(options)) === 'granted';
    }

    function startSyncTimer() {
        if (syncTimer) {
            clearInterval(syncTimer);
        }

        syncTimer = setInterval(checkForUpdates, 10000);
    }

    async function initializeSync(handle) {
        fileHandle = handle;
        updateConnectionControls();

        try {
            if (!(await ensurePermission(handle))) {
                fileHandle = null;
                await idbDel(fileHandleKey);
                updateConnectionControls();
                setStatus('文件权限已失效，请重新关联', 'error');
                return false;
            }

            const syncResult = await loadFromFile({
                writeCurrentIfEmpty: true,
                mergeBrowserItems: true
            });
            startSyncTimer();
            updateConnectionControls();
            if (syncResult.addedCount > 0) {
                setStatus(`已关联本地 JSON 文件，已补充 ${syncResult.addedCount} 项浏览器事项`, 'success');
            } else {
                setStatus('已关联本地 JSON 文件', 'success');
            }
            return true;
        } catch (err) {
            stopSync();
            throw err;
        }
    }

    async function checkForUpdates() {
        if (!fileHandle || isSaving || isSyncing) {
            return;
        }

        try {
            const file = await fileHandle.getFile();
            if (file.lastModified > lastModified) {
                setStatus('检测到外部修改，同步中...');
                await loadFromFile();
                setStatus('已同步最新内容', 'success');
            }
        } catch (err) {
            handleSyncError(err);
        }
    }

    function setActiveFilter(filter) {
        activeFilter = filter === 'done' ? 'done' : 'pending';
        render();
    }

    function getItemById(id) {
        return items.find((item) => item.id === id);
    }

    function truncateText(text) {
        return text.length > 24 ? `${text.slice(0, 24)}...` : text;
    }

    function clearDropIndicators() {
        [list, fullList].forEach((container) => {
            container.querySelectorAll('.drop-before, .drop-after, .is-dragging').forEach((itemEl) => {
                itemEl.classList.remove('drop-before', 'drop-after', 'is-dragging');
            });
        });
    }

    function resetDragState() {
        draggingId = null;
        dropTargetId = null;
        dropAfter = false;
        clearDropIndicators();
    }

    function reorderItem(movingId, targetId, insertAfter) {
        if (!movingId || !targetId || movingId === targetId) {
            return false;
        }

        const movingItem = getItemById(movingId);
        const targetItem = getItemById(targetId);
        if (!movingItem || !targetItem || movingItem.done !== targetItem.done) {
            return false;
        }

        const nextItems = items.filter((item) => item.id !== movingId);
        const targetIndex = nextItems.findIndex((item) => item.id === targetId);
        if (targetIndex === -1) {
            return false;
        }

        nextItems.splice(targetIndex + (insertAfter ? 1 : 0), 0, movingItem);
        items = nextItems;
        return true;
    }

    function bindListEvents(container) {
        container.addEventListener('change', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement) || !target.classList.contains('schedule-checkbox')) {
                return;
            }

            const itemEl = target.closest('.schedule-item');
            const item = itemEl ? getItemById(itemEl.dataset.id) : null;

            if (!item) {
                return;
            }

            item.done = target.checked;
            item.completedAt = item.done ? now() : null;
            persist();
        });

        container.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            const deleteBtn = target.closest('[data-action="delete"]');
            if (!deleteBtn) {
                return;
            }

            const itemEl = deleteBtn.closest('.schedule-item');
            const item = itemEl ? getItemById(itemEl.dataset.id) : null;
            if (!item) {
                return;
            }

            if (confirm(`确定要删除「${truncateText(item.text)}」吗？`)) {
                items = items.filter((entry) => entry.id !== item.id);
                persist();
            }
        });

        container.addEventListener('dblclick', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            if (target.closest('.schedule-checkbox') || target.closest('[data-action="delete"]') || target.closest('[data-action="drag"]')) {
                return;
            }

            const itemEl = target.closest('.schedule-item');
            const item = itemEl ? getItemById(itemEl.dataset.id) : null;
            if (!item) {
                return;
            }

            openEditModal(item);
        });

        container.addEventListener('dragstart', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            const dragBtn = target.closest('[data-action="drag"]');
            const itemEl = dragBtn ? dragBtn.closest('.schedule-item') : null;
            if (!itemEl) {
                event.preventDefault();
                return;
            }

            draggingId = itemEl.dataset.id;
            itemEl.classList.add('is-dragging');
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', draggingId);
            }
        });

        container.addEventListener('dragover', (event) => {
            if (!draggingId) {
                return;
            }

            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            const itemEl = target.closest('.schedule-item');
            if (!itemEl || itemEl.dataset.id === draggingId) {
                return;
            }

            const targetItem = getItemById(itemEl.dataset.id);
            const movingItem = getItemById(draggingId);
            if (!targetItem || !movingItem || targetItem.done !== movingItem.done) {
                return;
            }

            event.preventDefault();

            const rect = itemEl.getBoundingClientRect();
            dropTargetId = itemEl.dataset.id;
            dropAfter = event.clientY > rect.top + rect.height / 2;

            clearDropIndicators();
            const currentDragging = Array.from(container.querySelectorAll('.schedule-item')).find((entry) => entry.dataset.id === draggingId);
            if (currentDragging) {
                currentDragging.classList.add('is-dragging');
            }
            itemEl.classList.add(dropAfter ? 'drop-after' : 'drop-before');
        });

        container.addEventListener('drop', (event) => {
            if (!draggingId || !dropTargetId) {
                resetDragState();
                return;
            }

            event.preventDefault();
            if (reorderItem(draggingId, dropTargetId, dropAfter)) {
                persist();
            }
            resetDragState();
        });

        container.addEventListener('dragend', resetDragState);
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const text = input.value.trim();
        if (!text) {
            input.focus();
            return;
        }

        if (editingId) {
            const item = getItemById(editingId);
            if (item) {
                item.text = text;
                item.deadline = normalizeDeadline(deadlineInput.value);
            }
        } else {
            items.unshift({
                id: createId(),
                text,
                done: false,
                deadline: normalizeDeadline(deadlineInput.value),
                createdAt: now(),
                completedAt: null
            });
            activeFilter = 'pending';
        }

        input.value = '';
        deadlineInput.value = '';
        persist();
        closeAddModal();
    });

    filterTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            setActiveFilter(tab.dataset.scheduleFilter);
        });
    });

    bindListEvents(list);
    bindListEvents(fullList);

    function openAddModal() {
        editingId = null;
        addTitle.innerHTML = '<i class="fas fa-plus"></i> 添加事项';
        submitBtn.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i> 添加';
        input.value = '';
        deadlineInput.value = '';
        addOverlay.hidden = false;
        addOverlay.classList.add('show');
        addOverlay.setAttribute('aria-hidden', 'false');
        input.focus();
    }

    function openEditModal(item) {
        editingId = item.id;
        addTitle.innerHTML = '<i class="fas fa-pen"></i> 编辑事项';
        submitBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> 保存';
        input.value = item.text;
        deadlineInput.value = item.deadline || '';
        addOverlay.hidden = false;
        addOverlay.classList.add('show');
        addOverlay.setAttribute('aria-hidden', 'false');
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }

    function closeAddModal() {
        addOverlay.classList.remove('show');
        addOverlay.setAttribute('aria-hidden', 'true');
        addOverlay.hidden = true;
        editingId = null;
    }

    openAddBtn.addEventListener('click', openAddModal);
    openFullAddBtn.addEventListener('click', openAddModal);
    closeAddBtn.addEventListener('click', closeAddModal);
    cancelAddBtn.addEventListener('click', closeAddModal);

    addOverlay.addEventListener('click', (event) => {
        if (event.target === addOverlay) {
            closeAddModal();
        }
    });

    viewFullBtn.addEventListener('click', () => {
        fullOverlay.hidden = false;
        fullOverlay.classList.add('show');
        fullOverlay.setAttribute('aria-hidden', 'false');
        closeFullBtn.focus();
    });

    closeFullBtn.addEventListener('click', () => {
        fullOverlay.classList.remove('show');
        fullOverlay.setAttribute('aria-hidden', 'true');
        fullOverlay.hidden = true;
    });

    fullOverlay.addEventListener('click', (event) => {
        if (event.target === fullOverlay) {
            closeFullBtn.click();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !addOverlay.hidden) {
            closeAddModal();
        } else if (event.key === 'Escape' && !fullOverlay.hidden) {
            closeFullBtn.click();
        }
    });

    async function disconnectLinkedFile() {
        const confirmed = window.confirm('确定要断开当前关联文件吗？断开后，新修改会暂存到浏览器，不会继续写入本地 JSON 文件。');
        if (!confirmed) {
            return;
        }

        stopSync();
        await idbDel(fileHandleKey).catch((err) => console.error('日程清单文件句柄清理失败:', err));
        saveLocalItems();
        setStatus('已断开文件连接，当前内容暂存浏览器');
    }

    linkBtn.addEventListener('click', async () => {
        if (fileHandle) {
            await disconnectLinkedFile();
            return;
        }

        if (!window.showOpenFilePicker) {
            alert('您的浏览器不支持文件系统访问API，请使用最新版Chrome或Edge浏览器。');
            return;
        }

        try {
            const handles = await window.showOpenFilePicker(jsonFileOptions);
            const handle = handles[0];

            if (await initializeSync(handle)) {
                await idbSet(fileHandleKey, handle);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                return;
            }

            console.error('日程清单文件关联失败:', err);
            setStatus('关联失败，请确认 JSON 格式正确', 'error');
        }
    });

    async function tryAutoReconnect() {
        const storedHandle = await idbGet(fileHandleKey);
        if (!storedHandle) {
            return;
        }

        setStatus('正在尝试自动关联...');

        try {
            await initializeSync(storedHandle);
        } catch (err) {
            handleSyncError(err);
        }
    }

    items = loadLocalItems();
    render();
    updateConnectionControls();
    tryAutoReconnect();
})();
