# AI错题本 Cookie 存储说明

## 📋 存储方式

错题本和错题数据现在使用 **Cookie 临时存储**，不再保存到数据库。

## 🔧 技术实现

### Cookie 名称
- `wrong_books`：存储错题本列表
- `wrong_questions`：存储错题列表

### 数据结构
```typescript
interface WrongBook {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface WrongQuestion {
  id: string;
  name: string;
  content: string;
  wrongBookId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

### Cookie 配置
- **有效期**：1 年（365 天）
- **HttpOnly**：true（防止 XSS 攻击）
- **SameSite**：lax（CSRF 保护）

## ⚠️ 限制说明

### Cookie 大小限制
- 单个 Cookie 最大约 **4KB**
- 如果数据超过限制，会自动限制数量：
  - 错题本：最多保留最近的 **50 个**
  - 错题：最多保留最近的 **200 个**

### 数据持久性
- ✅ **优点**：无需数据库，简单快速
- ⚠️ **缺点**：
  - 清除浏览器 cookie 后数据会丢失
  - 更换浏览器或设备后数据不会同步
  - 数据量受 Cookie 大小限制

## 🔄 迁移说明

### 从数据库迁移到 Cookie
- ✅ 已移除所有数据库相关代码（Prisma 查询）
- ✅ 所有 API 路由已改为操作 Cookie
- ✅ 前端组件无需修改（API 接口保持一致）

### 如果需要恢复数据库存储
1. 恢复 Prisma schema 中的 `WrongBook` 和 `WrongQuestion` 模型
2. 恢复 API 路由中的数据库操作代码
3. 运行 `npx prisma db push` 创建表

## 📝 使用建议

1. **适合场景**：
   - 临时测试
   - 个人学习记录（不需要跨设备同步）
   - 快速原型开发

2. **不适合场景**：
   - 需要长期保存的数据
   - 需要跨设备同步
   - 大量数据存储

3. **未来优化**：
   - 如果需要持久化，可以改回数据库存储
   - 或者使用 localStorage（前端存储，不受 HttpOnly 限制）
   - 或者使用 IndexedDB（支持更大数据量）

---

*更新时间：2026-02-02*
