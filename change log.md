<span style="color: #d35400;">[主版本号.次版本号.修订号] - xxxx-xx-xx</span>

Added
Changed
Fixed


<span style="color: #d35400;">[0.3.5] - 2026-06-15</span>

Added

* 日程清单全文模式下，在未完成 / 已完成分类按钮旁添加“添加事项”按钮，复用现有添加事项弹窗。

Changed

* 将首页页脚联系邮箱更新为 `zhiqiang.ma97@gmail.com`。

Fixed

* 修复从日程清单全文模式打开添加事项弹窗时，弹窗层级可能被全文弹窗遮挡的问题。


<span style="color: #d35400;">[0.3.4] - 2026-06-04</span>

Added

* 添加“日程清单”模块，支持未完成 / 已完成分类显示。
* 添加事项弹窗，支持填写事项内容和可选 deadline 日期。
* 添加日程清单全文弹窗，用于查看更多事项。
* 添加本地 JSON 文件关联、读取和写入同步功能，网页修改会自动写回已关联文件。
* 添加“关联文件”按钮的断开连接状态，可取消已关联的本地 JSON 文件并回到浏览器暂存状态。
* 添加关联文件时的数据差异合并：浏览器暂存中存在、JSON 文件中不存在的事项会自动补充写入文件。

Changed

* 暂时从页面隐藏原 notebook 待办事项模块，并停止加载 notebook 同步脚本。
* 日程清单底部按钮布局复用 notebook 的 `card-footer`、`notebook-footer` 和 `notebook-actions` 结构。
* “添加事项”按钮移动到未完成 / 已完成分类标签同一行右侧。
* 删除“新建文件”、“清除已完成”和“清空清单”按钮，仅保留“全文”和“关联文件”入口。
* “关联文件”按钮在已关联后切换为“断开连接”，断开前需要二次确认。
* 双击日程事项内容可进入编辑弹窗，编辑后更新原事项。
* 仅点击复选框时切换事项完成状态，点击事项文字不再触发完成状态变化。

Fixed

* 修复日程清单事项过多时底部按钮被挤出或隐藏的问题。
* 修复事项文字与复选框关联导致点击文字误切换完成状态的问题。


<span style="color: #d35400;">[0.3.3] - 2026-06-02</span>

Changed

* 将首页“记事本”调整为“待办事项”，非全文模式改为只读预览。
* 全文模式改为可编辑文本框，编辑内容会同步更新预览、自动保存和本地 txt 同步逻辑。
* 将“清空”按钮文案改为“清空内容”，明确其作用是清空文本内容；已关联本地 txt 时会同步清空文件内容，但不会断开关联。

Fixed

* 修复“全文 / 关联 / 清空内容”按钮底部显示不完整的问题，改用 flex 布局撑开待办事项底部区域。


<span style="color: #d35400;">[0.3.2] - 2026-06-02</span>

Fixed

* 修复 `bookmark.html` 搜索栏 tab 与下方搜索分类可能不匹配的问题。
* 保留默认使用上一次搜索方式的设计，并在初始化、切换 tab、切换搜索项时同步 tab、radio、搜索地址和占位提示。


<span style="color: #d35400;">[0.3.1] - 2026-05-16</span>

Added

* 添加 Sherlma / 学术星航 SVG 品牌 logo：包含星轨、博士帽、打开的书、星芒等视觉元素。
* 添加 SVG 标签页图标 `img/sherlma-mark.svg`，与主 logo 风格保持一致。
* 添加 阿里云域名邮箱 链接，登录@sherlma.top邮箱。

Changed

* 修改首页标题区，将文字标题替换为新版 logo 图片。
* 调整 `custom.css` 中 logo 的响应式显示宽度。
* 修改 favicon 引用为新版 SVG 图标，并增加版本参数以减少浏览器缓存影响。


<span style="color: #d35400;">[0.3.0] - 2026-04-27</span>

Changed

* Chatgpt优化了代码结构，优化书签卡片结构，减少冗余代码。
* 修改 index.html，替换 安全顶会 为 Gmail, 替换 文心一言 为 ChatGPT。


<span style="color: #d35400;">[0.2.3] - 2026-04-15</span>

Changed

* 修改记事本自动同步和自动保存时间，设置为10秒。

<span style="color: #d35400;">[0.2.2] - 2026-02-13</span>

Added

* 添加 CloudConvert 链接：免费转换各种文件类型。


<span style="color: #d35400;">[0.2.1] - 2026-02-10</span>

Added

* 添加 KMS在线激活链接：免费激活 Windows 系统和 office 办公软件。

<span style="color: #d35400;">[0.2.0] - 2026-2-9</span>

Added

* 添加 Draw.io 链接: 一个在线画图软件，类似 visio

Changed

* 重新写了 **效率工具** 的代码，简化了代码结构。

* 定义了 efficiencyTools 数组：这个数组包含了“效率工具”部分所有卡片的信息。每个 {...} 就是一个对象，代表一个卡片。
* createCard(cardData) 函数:
这个函数是我们的“模板引擎”。它接收一个 cardData 对象作为参数。
内部使用了 模板字符串 (Template Literals)，也就是用反引号 ` 包裹的字符串。这让我们可以方便地在字符串中通过 ${...} 语法嵌入变量。
它根据传入的数据，动态生成一个完整的卡片HTML结构，并将其作为字符串返回。

* renderCards(containerId, cardArray) 函数:
这个函数负责将卡片渲染到页面上。
它通过 document.getElementById(containerId) 找到我们在HTML中准备好的容器。
cardArray.map(createCard) 会遍历数据数组，并对数组中的每个元素（每个 cardData 对象）调用 createCard 函数，最终返回一个包含所有卡片HTML字符串的新数组。
.join('') 将这个数组中的所有HTML字符串连接成一个单一的、巨大的字符串。
最后，container.innerHTML = ... 将这个巨大的字符串设置为容器的内部HTML，浏览器就会解析并显示出所有的卡片。

* document.addEventListener('DOMContentLoaded', ...): 这是一个事件监听器，它能确保我们的脚本在整个HTML文档被完全加载和解析完毕之后再执行，避免了因脚本在DOM元素创建前执行而找不到容器的错误。


<span style="color: #d35400;">[0.1.7] - 2026-2-4</span>

Added

* 添加 Conference Ranks 链接
* 添加 Zenodo 链接

<span style="color: #d35400;">[0.1.6] - 2026-1-21</span>

Fixed

* 添加记事本同步功能的错误处理机制，防止同步功能在后台失效。
* 打开新网页，记事本仍然关联之前的 txt 文件。

<span style="color: #d35400;">[0.1.5] - 2026-1-19</span>

Added

* 增加记事本功能：可以关联本地txt文件。在网页记事本修改的内容自动同步到本地 txt 文件中，在本地 txt 文件修改的内容自动同步到网页显示。
* 增加 notebook-sync.js，提供自动同步功能。
* 增加 custom.css，主要用来实现 基础的网站列表和弹窗界面的样式。

Changed

* 

<span style="color: #d35400;">[0.1.4] - 2025-12-28</span>

Changed

* 修改 Sci-Hub 链接、Library Genesis 链接


<span style="color: #d35400;">[0.1.3] - 2025-12-23</span>

Added

* 添加 Google AI Studio 链接

<span style="color: #d35400;">[0.1.2] - 2025-12-15</span>

Added

* 添加 即时工具 链接

<span style="color: #d35400;">[0.1.1] - 2025-12-03</span>

Added

* 添加 WhatsApp 链接
* 添加 ./ico/whatsapp.png
* 修改侧边栏条目名称，增加跳转链接

<span style="color: #d35400;">[0.1.0] - 2025-11-25</span>

Added

* 添加网站修改日志文件 change log.md
