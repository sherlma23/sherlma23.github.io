<span style="color: #d35400;">[主版本号.次版本号.修订号] - xxxx-xx-xx</span>

Added
Changed
Fixed



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