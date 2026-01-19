// 简化版记事本功能
const notebook = document.getElementById('notebook');
const clearNotebook = document.getElementById('clearNotebook');

// 加载保存的内容
notebook.value = localStorage.getItem('notebook') || '';

// 自动保存
notebook.addEventListener('input', () => {
    localStorage.setItem('notebook', notebook.value);
});

// 清空功能
clearNotebook.addEventListener('click', () => {
    if (confirm('确定要清空记事本吗？')) {
        notebook.value = '';
        localStorage.setItem('notebook', '');
    }
});

