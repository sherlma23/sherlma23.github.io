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
let websites = [];
try {
    const savedWebsites = JSON.parse(localStorage.getItem('websites') || '[]');
    websites = Array.isArray(savedWebsites) ? savedWebsites : [];
} catch (error) {
    console.warn('已保存的网址数据无法读取:', error);
}
let currentIndex = null; // 当前编辑或删除的网站索引
let isEditMode = false; // 编辑模式状态
const MAX_WEBSITES = 12; // 最大网站数量
const FALLBACK_ICON = new URL('./favicon.ico', document.baseURI).href;

function getHttpUrl(value, base) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const url = base ? new URL(value.trim(), base) : new URL(value.trim());
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch (error) {
        return null;
    }
}

// 直接使用目标网站的图标；加载失败时由图片错误回调切换到本地图标。
function getAutomaticIconUrl(url) {
    const iconUrl = new URL('/favicon.ico', url);
    if (document.location.protocol === 'https:' && iconUrl.protocol === 'http:') {
        iconUrl.protocol = 'https:';
    }
    return iconUrl.href;
}

function getSavedIconUrl(website, url) {
    const savedIcon = typeof website.icon === 'string' ? website.icon.trim() : '';
    const legacyService = /^https:\/\/(?:www\.google\.com\/s2\/favicons|favicon\.twenty\.com\/|icons\.duckduckgo\.com\/ip3\/)/i;
    if (savedIcon && savedIcon !== './ico/default.png' && !legacyService.test(savedIcon)) {
        const validIcon = getHttpUrl(savedIcon, document.baseURI);
        if (validIcon) return validIcon;
    }
    return url ? getAutomaticIconUrl(url) : FALLBACK_ICON;
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
            const website = websites[i] || {};
            const name = String(website.name || '');
            const url = getHttpUrl(website.url);
            const iconUrl = getSavedIconUrl(website, url);

            websiteItem.innerHTML = `
                <a target="_blank" rel="external nofollow noopener">
                    <div class="d-flex mb-2">
                        <div class="sites-icon mx-auto ub-blur-bg">
                            <img class="lazy" alt="">
                        </div>
                    </div>
                    <div class="sites-title ub-blur-bg px-2 text-xs overflowClip_1">
                        <span></span>
                    </div>
                </a>
                ${isEditMode ? `
                    <div class="edit-overlay">
                        <button class="edit-btn" type="button">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="delete-btn" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                ` : ''}
            `;
            const link = websiteItem.querySelector('a');
            if (url) link.href = url;
            link.title = name;
            websiteItem.querySelector('.sites-title span').textContent = name;

            const image = websiteItem.querySelector('img');
            image.alt = name;
            image.addEventListener('error', () => {
                if (image.src !== FALLBACK_ICON) image.src = FALLBACK_ICON;
            }, { once: true });
            image.src = iconUrl;
            image.dataset.src = iconUrl;

            if (isEditMode) {
                websiteItem.querySelector('.edit-btn').addEventListener('click', (event) => {
                    event.stopPropagation();
                    openEditPopup(i);
                });
                websiteItem.querySelector('.delete-btn').addEventListener('click', (event) => {
                    event.stopPropagation();
                    openDeletePopup(i);
                });
            }
        } else {
            // 空位置 - 添加按钮
            websiteItem.innerHTML = `
                <div class="empty-site">
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
            if (isEditMode) {
                websiteItem.querySelector('.empty-site').addEventListener('click', (event) => {
                    event.stopPropagation();
                    openAddPopup(i);
                });
            }
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
websiteForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const websiteName = document.getElementById('websiteName').value.trim();
    const websiteUrlInput = document.getElementById('websiteUrl').value.trim();
    const websiteIconInput = document.getElementById('websiteIcon').value.trim();

    // 验证表单
    if (!websiteName || !websiteUrlInput) {
        websiteForm.classList.add('was-validated');
        return;
    }

    const websiteUrl = getHttpUrl(websiteUrlInput);
    if (!websiteUrl) {
        alert('请输入以 http:// 或 https:// 开头的有效网址');
        return;
    }

    const customIcon = websiteIconInput ? getHttpUrl(websiteIconInput, document.baseURI) : null;
    if (websiteIconInput && !customIcon) {
        alert('请输入有效的图标 URL');
        return;
    }

    try {
        const websiteData = {
            name: websiteName,
            url: websiteUrl,
            icon: customIcon || getAutomaticIconUrl(websiteUrl)
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
