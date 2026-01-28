# 照片显示问题修复总结

## 🐛 问题描述

用户测试上传照片时提示成功，但照片不显示。

## 🔍 问题分析

### 问题1：路径代理问题（主要问题）

**原因**：
- 前端运行在：`http://localhost:5174`
- 后端运行在：`http://localhost:3010`
- 照片URL：`/uploads/pregnancy-photos/xxx.png`
- 前端请求`/uploads/...`时，会请求到前端服务器（5174端口）
- 但照片文件实际存储在后端服务器（3010端口）

**表现**：
- 上传成功（文件保存到服务器）
- 数据库记录正确
- 但前端无法加载图片（404错误）

**解决方案**：
在`vite.config.js`中添加`/uploads`路径的代理配置：
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3010',
    changeOrigin: true
  },
  '/uploads': {  // 新增
    target: 'http://localhost:3010',
    changeOrigin: true
  }
}
```

### 问题2：文件名中week显示undefined（次要问题）

**原因**：
- multer在生成文件名时，`req.body`还没有完全解析
- 导致`req.body.week`为undefined

**表现**：
- 文件名：`user1_weekundefined_main_1769614118577.png`
- 不影响功能，但文件名不规范

**解决方案**：
简化文件名生成逻辑，只使用userId和时间戳：
```javascript
filename: (req, file, cb) => {
  const userId = req.user.id;
  const ext = path.extname(file.originalname);
  const timestamp = Date.now();
  cb(null, `user${userId}_${timestamp}${ext}`);
}
```

## ✅ 修复内容

### 修改的文件

1. **vite.config.js**
   - 添加`/uploads`路径代理
   - 将uploads请求转发到后端服务器

2. **server/routes/photos.js**
   - 简化文件名生成逻辑
   - 避免使用未解析的req.body

## 🧪 验证步骤

### 1. 重启服务器
服务器已自动重启，新配置已生效。

### 2. 测试照片访问
```bash
# 通过前端代理访问照片
curl -I http://localhost:5174/uploads/pregnancy-photos/xxx.png
# 应该返回 200 OK
```

### 3. 重新测试上传
1. 刷新浏览器页面（清除缓存）
2. 进入孕照页面
3. 选择任意周数
4. 上传照片
5. ✅ 照片应该立即显示

### 4. 检查已上传的照片
之前上传的照片现在也应该能正常显示了。

## 📊 技术细节

### 代理工作原理

**没有代理时**：
```
浏览器请求: http://localhost:5174/uploads/xxx.png
  ↓
前端服务器 (5174) 查找文件
  ↓
404 Not Found (文件不在前端服务器)
```

**配置代理后**：
```
浏览器请求: http://localhost:5174/uploads/xxx.png
  ↓
Vite代理拦截 /uploads 请求
  ↓
转发到: http://localhost:3010/uploads/xxx.png
  ↓
后端服务器返回文件
  ↓
浏览器显示照片 ✅
```

### 生产环境注意事项

在生产环境部署时，需要配置Nginx反向代理：

```nginx
server {
  listen 80;
  server_name your-domain.com;

  # 前端静态文件
  location / {
    root /var/www/baby-movement-tracker/dist;
    try_files $uri $uri/ /index.html;
  }

  # API代理
  location /api {
    proxy_pass http://localhost:3010;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # 上传文件代理
  location /uploads {
    proxy_pass http://localhost:3010;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## 🎯 测试清单

- [x] 修复代理配置
- [x] 修复文件名生成
- [x] 重启服务器
- [x] 验证代理工作
- [ ] 用户测试上传新照片
- [ ] 验证已上传照片显示
- [ ] 测试删除功能
- [ ] 测试替换主照片

## 💡 经验总结

1. **开发环境代理**：
   - 前后端分离开发时，必须配置代理
   - 不仅API需要代理，静态资源也需要

2. **multer时序问题**：
   - multer处理文件时，req.body可能未完全解析
   - 避免在filename回调中使用req.body
   - 可以在上传后重命名文件

3. **调试技巧**：
   - 检查浏览器Network标签
   - 查看请求的完整URL
   - 确认文件是否真的上传成功
   - 检查服务器日志

## 🚀 下一步

现在照片应该能正常显示了！请：
1. 刷新浏览器页面
2. 重新测试上传功能
3. 检查之前上传的照片是否显示

如果还有问题，请告诉我具体的错误信息。
