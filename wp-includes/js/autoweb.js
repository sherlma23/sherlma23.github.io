// 获取 DOM 元素
const openPopupBtn = document.getElementById('openPopupBtn');
const popupOverlay = document.getElementById('popupOverlay');
const websitePopup = document.getElementById('websitePopup');
const deletePopup = document.getElementById('deletePopup');
const closePopupBtn = document.getElementById('closePopupBtn');
const websiteForm = document.getElementById('websiteForm');
const websiteList = document.getElementById('websiteList');
const popupTitle = document.getElementById('popupTitle');
const submitBtn = document.getElementById('submitBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// 从 LocalStorage 加载已保存的网站
let websites = JSON.parse(localStorage.getItem('websites')) || [];
let currentIndex = null; // 当前编辑或删除的网站索引

// 渲染网站列表
function renderWebsites() {
    websiteList.innerHTML = ''; // 清空当前列表
    websites.forEach((website, index) => {
        const websiteItem = document.createElement('div');
        websiteItem.className = 'website-item';
        websiteItem.innerHTML = `
            <a href="${website.url}" target="_blank">${website.name}</a>
            <button onclick="openEditPopup(${index})">编辑</button>
            <button onclick="openDeletePopup(${index})">删除</button>
        `;
        websiteList.appendChild(websiteItem);
    });
}

// 显示添加弹窗
openPopupBtn.addEventListener('click', () => {
    popupTitle.textContent = '添加网址';
    submitBtn.textContent = '添加';
    websiteForm.reset();
    popupOverlay.classList.add('show');
    websitePopup.classList.add('show');
});

// 显示编辑弹窗
function openEditPopup(index) {
    currentIndex = index;
    const website = websites[index];
    document.getElementById('websiteName').value = website.name;
    document.getElementById('websiteUrl').value = website.url;
    popupTitle.textContent = '编辑网址';
    submitBtn.textContent = '保存';
    popupOverlay.classList.add('show');
    websitePopup.classList.add('show');
}

// 显示删除确认弹窗
function openDeletePopup(index) {
    currentIndex = index;
    popupOverlay.classList.add('show');
    deletePopup.classList.add('show');
}

// 隐藏弹窗
function closePopup() {
    popupOverlay.classList.remove('show');
    websitePopup.classList.remove('show');
    deletePopup.classList.remove('show');
}

// 关闭弹窗按钮
closePopupBtn.addEventListener('click', closePopup);
cancelDeleteBtn.addEventListener('click', closePopup);

// 添加或编辑网站
websiteForm.addEventListener('submit', (e) => {
    e.preventDefault(); // 阻止表单默认提交行为

    const websiteName = document.getElementById('websiteName').value;
    const websiteUrl = document.getElementById('websiteUrl').value;

    if (websiteName && websiteUrl) {
        if (currentIndex === null) {
            // 添加模式
            websites.push({ name: websiteName, url: websiteUrl });
        } else {
            // 编辑模式
            websites[currentIndex] = { name: websiteName, url: websiteUrl };
        }
        localStorage.setItem('websites', JSON.stringify(websites)); // 保存到 LocalStorage
        renderWebsites(); // 重新渲染列表
        closePopup(); // 关闭弹窗
    }
});

// 删除网站
confirmDeleteBtn.addEventListener('click', () => {
    websites.splice(currentIndex, 1); // 从数组中删除
    localStorage.setItem('websites', JSON.stringify(websites)); // 更新 LocalStorage
    renderWebsites(); // 重新渲染列表
    closePopup(); // 关闭弹窗
});

// 初始化页面时渲染网站列表
renderWebsites();