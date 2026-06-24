# 本地预览个人主页

## 环境要求

建议使用 RubyInstaller 3.3.x x64 with DevKit。

下载网址
https://rubyinstaller.org/downloads/

确认当前终端使用的是 Ruby 3.3：

```powershell
ruby -v
gem -v
```

## 安装依赖

进入个人主页目录：

```powershell
cd .\profile
```

安装依赖：

```powershell
bundle install
```

## 构建检查

```powershell
bundle exec jekyll build
```

构建成功后，静态文件会生成到：

```text
.\profile\_site
```

如果看到下面的 warning，可以忽略：

```text
GitHub Metadata: No GitHub API authentication could be found
To use retry middleware with Faraday v2.0+, install `faraday-retry` gem
```

## 启动本地预览

```powershell
bundle exec jekyll serve --force_polling --livereload
```

浏览器打开：

```text
http://127.0.0.1:4000/profile/
```

注意：因为 `_config.yml` 里配置了 `baseurl: /profile`，所以预览地址需要带 `/profile/`。

## 端口被占用

如果 4000 端口被占用，可以换一个端口：

```powershell
bundle exec jekyll serve --force_polling --livereload --port 4001
```

然后打开：

```text
http://127.0.0.1:4001/profile/
```

## 停止预览

在运行 Jekyll 的 PowerShell 窗口按：

```text
Ctrl + C
```
