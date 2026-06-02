// 获取 DOM 元素
const toggleEditBtn = document.getElementById('toggleEditBtn');
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
let isEditMode = false; // 编辑模式状态
const MAX_WEBSITES = 12; // 最大网站数量

// 自动获取网站图标
async function fetchWebsiteIcon(url) {
    try {
        // 从 URL 提取域名
        const domain = new URL(url).hostname;

        // 尝试多种图标获取方式
        const iconUrls = [
            `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            `https://favicon.twenty.com/${domain}`,
            `https://icons.duckduckgo.com/ip3/${domain}.ico`,
            `https://${domain}/favicon.ico`
        ];

        // 测试每个图标URL是否可用
        for (const iconUrl of iconUrls) {
            try {
                const response = await fetch(iconUrl, { mode: 'no-cors' });
                return iconUrl;
            } catch (e) {
                continue;
            }
        }

        return './ico/default.png';
    } catch (error) {
        console.error('获取网站图标失败:', error);
        return './ico/default.png';
    }
}

// 渲染网站列表
function renderWebsites() {
    websiteList.innerHTML = ''; // 清空当前列表

    // 创建12个固定位置
    for (let i = 0; i < MAX_WEBSITES; i++) {
        const websiteItem = document.createElement('div');
        websiteItem.className = 'sites-btn col-2 col-md-2 text-center mb-4';

        if (i < websites.length) {
            // 已有网站的位置
            const website = websites[i];
            const iconUrl = website.icon || './ico/default.png';

            websiteItem.innerHTML = `
                <a href="${website.url}" target="_blank" title="${website.name}" rel="external nofollow noopener">
                    <div class="d-flex mb-2">
                        <div class="sites-icon mx-auto ub-blur-bg">
                            <img class="lazy" src="${iconUrl}" 
                                 data-src="${iconUrl}" 
                                 onerror="javascript:this.src='./ico/default.png'" 
                                 alt="${website.name}">
                        </div>
                    </div>
                    <div class="sites-title ub-blur-bg px-2 text-xs overflowClip_1">
                        <span>${website.name}</span>
                    </div>
                </a>
                ${isEditMode ? `
                    <div class="edit-overlay">
                        <button class="edit-btn" onclick="event.stopPropagation(); openEditPopup(${i})">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="delete-btn" onclick="event.stopPropagation(); openDeletePopup(${i})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                ` : ''}
            `;
        } else {
            // 空位置 - 添加按钮
            websiteItem.innerHTML = `
                <div class="empty-site" onclick="event.stopPropagation(); ${isEditMode ? `openAddPopup(${i})` : ''}">
                    <div class="d-flex mb-2">
                        <div class="sites-icon mx-auto ub-blur-bg empty-icon">
                            ${isEditMode ? `
                                <i class="fas fa-plus add-icon"></i>
                            ` : `
                                <i class="fas fa-plus add-icon disabled"></i>
                            `}
                        </div>
                    </div>
                    <div class="sites-title ub-blur-bg px-2 text-xs overflowClip_1">
                        <span>${isEditMode ? '添加网址' : '空位'}</span>
                    </div>
                </div>
            `;
        }

        websiteList.appendChild(websiteItem);
    }
}

// 打开添加弹窗（点击空位时）
function openAddPopup(index) {
    currentIndex = index;
    popupTitle.textContent = '添加网址';
    submitBtn.textContent = '添加';
    websiteForm.reset();
    document.getElementById('websiteIcon').style.display = 'none';
    document.querySelector('label[for="websiteIcon"]').style.display = 'none';
    websiteForm.classList.remove('was-validated');
    popupOverlay.classList.add('show');
    websitePopup.classList.add('show');
}

// 切换编辑模式
toggleEditBtn.addEventListener('click', () => {
    isEditMode = !isEditMode;

    // 更新图标和标题
    const iconElement = toggleEditBtn.querySelector('i');
    if (isEditMode) {
        // 编辑模式：改变颜色或添加效果
        iconElement.style.color = '#07daffff'; // 黄色表示激活状态
        toggleEditBtn.title = '完成管理';
    } else {
        // 正常模式：恢复原色
        iconElement.style.color = ''; // 恢复默认颜色
        toggleEditBtn.title = '管理网址';
    }

    renderWebsites();
});

// 显示编辑弹窗
function openEditPopup(index) {
    if (!isEditMode) return;

    currentIndex = index;
    const website = websites[index];
    document.getElementById('websiteName').value = website.name;
    document.getElementById('websiteUrl').value = website.url;
    document.getElementById('websiteIcon').value = website.icon || '';
    document.getElementById('websiteIcon').style.display = 'block';
    document.querySelector('label[for="websiteIcon"]').style.display = 'block';
    popupTitle.textContent = '编辑网址';
    submitBtn.textContent = '保存';
    websiteForm.classList.remove('was-validated');
    popupOverlay.classList.add('show');
    websitePopup.classList.add('show');
}

// 显示删除确认弹窗
function openDeletePopup(index) {
    if (!isEditMode) return;

    currentIndex = index;
    popupOverlay.classList.add('show');
    deletePopup.classList.add('show');
}

// 隐藏弹窗
function closePopup() {
    popupOverlay.classList.remove('show');
    websitePopup.classList.remove('show');
    deletePopup.classList.remove('show');
    websiteForm.classList.remove('was-validated');
}

// 关闭弹窗按钮
closePopupBtn.addEventListener('click', closePopup);
cancelDeleteBtn.addEventListener('click', closePopup);

// 添加或编辑网站
websiteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const websiteName = document.getElementById('websiteName').value;
    const websiteUrl = document.getElementById('websiteUrl').value;
    const websiteIcon = document.getElementById('websiteIcon').value;

    // 验证表单
    if (!websiteName || !websiteUrl) {
        websiteForm.classList.add('was-validated');
        return;
    }

    try {
        new URL(websiteUrl);
    } catch (error) {
        alert('请输入有效的URL地址（例如：https://example.com）');
        return;
    }

    // 显示加载状态
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '获取图标中...';
    submitBtn.disabled = true;

    try {
        let iconUrl = websiteIcon;

        if ((currentIndex === null || currentIndex >= websites.length) && !websiteIcon) {
            iconUrl = await fetchWebsiteIcon(websiteUrl);
        } else if (currentIndex !== null && !websiteIcon) {
            iconUrl = await fetchWebsiteIcon(websiteUrl);
        }

        const websiteData = {
            name: websiteName,
            url: websiteUrl,
            icon: iconUrl
        };

        if (currentIndex === null || currentIndex >= websites.length) {
            // 添加新网站
            if (websites.length >= MAX_WEBSITES) {
                alert('已达到最大网站数量限制（12个）');
                return;
            }
            websites.push(websiteData);
        } else {
            // 编辑现有网站
            websites[currentIndex] = websiteData;
        }

        localStorage.setItem('websites', JSON.stringify(websites));
        renderWebsites();
        closePopup();

    } catch (error) {
        console.error('保存网站失败:', error);
        alert('保存失败，请重试');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// 删除网站
confirmDeleteBtn.addEventListener('click', () => {
    websites.splice(currentIndex, 1);
    localStorage.setItem('websites', JSON.stringify(websites));
    renderWebsites();
    closePopup();
});

// URL输入时自动填充网站名称
document.getElementById('websiteUrl').addEventListener('blur', function () {
    const url = this.value;
    const websiteName = document.getElementById('websiteName').value;

    if (url && !websiteName) {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            const name = domain.split('.')[0];
            document.getElementById('websiteName').value = name.charAt(0).toUpperCase() + name.slice(1);
        } catch (e) {
            // 如果URL无效，忽略
        }
    }
});

// 点击弹窗外部关闭弹窗
popupOverlay.addEventListener('click', (e) => {
    if (e.target === popupOverlay) {
        closePopup();
    }
});

// 初始化页面时渲染网站列表
renderWebsites();