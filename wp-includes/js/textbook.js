// 待办事项基础功能
(function () {
    const notebook = document.getElementById('notebook');
    const clearNotebook = document.getElementById('clearNotebook');
    const viewNotebookFull = document.getElementById('viewNotebookFull');
    const notebookFullOverlay = document.getElementById('notebookFullOverlay');
    const notebookFullContent = document.getElementById('notebookFullContent');
    const closeNotebookFull = document.getElementById('closeNotebookFull');

    if (!notebook || !clearNotebook || !viewNotebookFull || !notebookFullOverlay || !notebookFullContent || !closeNotebookFull) {
        return;
    }

    function dispatchNotebookInput() {
        notebook.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function updateFullEditorFromNotebook(force) {
        if (!force && document.activeElement === notebookFullContent) {
            return;
        }

        notebookFullContent.value = notebook.value;
    }

    // 加载保存的内容
    notebook.value = localStorage.getItem('notebook') || '';

    // 自动保存
    notebook.addEventListener('input', () => {
        localStorage.setItem('notebook', notebook.value);

        if (notebookFullOverlay.classList.contains('show')) {
            updateFullEditorFromNotebook(false);
        }
    });

    notebookFullContent.addEventListener('input', () => {
        if (notebook.value !== notebookFullContent.value) {
            notebook.value = notebookFullContent.value;
            dispatchNotebookInput();
        }
    });

    function openNotebookFull() {
        updateFullEditorFromNotebook(true);
        notebookFullOverlay.hidden = false;
        notebookFullOverlay.classList.add('show');
        notebookFullOverlay.setAttribute('aria-hidden', 'false');
        notebookFullContent.focus();

        const textLength = notebookFullContent.value.length;
        notebookFullContent.setSelectionRange(textLength, textLength);
    }

    function closeNotebookFullModal() {
        notebookFullOverlay.classList.remove('show');
        notebookFullOverlay.setAttribute('aria-hidden', 'true');
        notebookFullOverlay.hidden = true;
    }

    viewNotebookFull.addEventListener('click', openNotebookFull);
    closeNotebookFull.addEventListener('click', closeNotebookFullModal);

    notebookFullOverlay.addEventListener('click', (event) => {
        if (event.target === notebookFullOverlay) {
            closeNotebookFullModal();
        }
    });

    // 清空只清空文本内容；如果已关联本地 txt，同步脚本会把空内容写回文件。
    clearNotebook.addEventListener('click', () => {
        if (confirm('确定要清空待办事项内容吗？如果已关联本地 txt，文件内容也会被清空，但不会断开关联。')) {
            notebook.value = '';
            notebookFullContent.value = '';
            dispatchNotebookInput();
            notebook.dispatchEvent(new CustomEvent('notebook:cleared', { bubbles: true }));
        }
    });
})();
