# AI 痛点集市 — 设计文档

## 项目概述

一个线上 AI 痛点交易集市。用户发布工作中的痛点场景、悬赏 AI 解决方案；也可以分享自己用 AI 解决问题的好办法，有偿分享给其他用户。支持投票增加热度，每周公布榜单。

**目标用户**：Coding 比赛评委和观众，2 分钟内体验主流程。

**核心体验路径**：打开页面 → 自动获得匿名身份和 100 积分 → 浏览卡片流 → 发布痛点/分享方案 → 投票 → 查看榜单。

## 技术架构

```
用户浏览器
  └── Vite + React SPA (GitHub Pages 部署)
        └── Supabase Client SDK
              ├── Supabase Auth (匿名登录)
              ├── Supabase Database (PostgreSQL)
              └── Supabase Realtime (投票数实时更新)
```

- **前端**：Vite + React，纯静态 SPA，部署到 GitHub Pages
- **后端**：Supabase（BaaS），通过 JS SDK 直连
- **部署**：GitHub 仓库 → GitHub Actions → GitHub Pages

## 用户身份

- 首次访问自动调用 `supabase.auth.signInAnonymously()`
- 随机分配趣味昵称（如「勇敢的猫头鹰」「机智的海豚」）+ emoji 头像
- 身份信息存 localStorage，Supabase 匿名 session 持久化
- 无需任何注册操作

## 积分体系

积分仅用于悬赏场景：

| 事件 | 积分变化 |
|------|---------|
| 首次访问（匿名登录） | +100 |
| 每日打卡 | +10（每天限一次） |
| 发布痛点悬赏 | -设定积分 |
| 认领并解决痛点 | +悬赏积分 |
| 购买方案 | -方案价格 |
| 方案被购买 | +方案价格 |

## 数据模型

### profiles

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (FK → auth.users) | 用户 ID |
| nickname | text | 随机昵称 |
| avatar | text | 头像 emoji |
| points | int | 积分余额，初始 100 |
| last_check_in | date | 上次打卡日期 |

### pain_points（痛点/悬赏）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| author_id | uuid (FK → profiles) | 发布者 |
| title | text | 痛点标题 |
| description | text | 详细描述 |
| tags | text[] | 标签 |
| bounty | int | 悬赏积分（发布时从作者余额冻结） |
| status | text | open / claimed / resolved |
| claimer_id | uuid (FK → profiles) nullable | 认领者 |
| claimed_at | timestamptz nullable | 认领时间 |
| votes | int | 投票数 |
| created_at | timestamptz | 创建时间 |

### solutions（AI 方案分享）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| author_id | uuid (FK → profiles) | 分享者 |
| pain_point_id | uuid (FK → pain_points) nullable | 关联痛点（可选，独立分享可为空） |
| title | text | 方案标题 |
| description | text | 方案简介 |
| content | text | 详细步骤（付费内容） |
| tags | text[] | 标签 |
| price | int | 查看价格，0=免费 |
| votes | int | 投票数 |
| purchases | int | 购买次数 |
| created_at | timestamptz | 创建时间 |

### votes（投票记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 投票者 |
| target_id | uuid | 痛点或方案 ID |
| target_type | text | pain_point / solution |

约束：`UNIQUE(user_id, target_id, target_type)` 防止重复投票。`votes` 计数字段通过数据库触发器同步。

### comments（评论）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| author_id | uuid (FK → profiles) | 评论者 |
| target_id | uuid | 痛点或方案 ID |
| target_type | text | pain_point / solution |
| content | text | 评论内容 |
| created_at | timestamptz | 创建时间 |

### purchases（购买记录，用于方案付费解锁）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 购买者 |
| solution_id | uuid (FK → solutions) | 方案 ID |
| price | int | 购买时价格 |
| created_at | timestamptz | 购买时间 |

约束：`UNIQUE(user_id, solution_id)` 防止重复购买。免费方案（price=0）自动创建购买记录以简化权限判断。

## 页面设计

### 1. 集市广场（首页）

卡片流布局，痛点（黄色标签）和方案（绿色标签）混排：

- **顶部导航栏**：品牌名「🏪 AI 痛点集市」+ 积分余额 + 榜单入口(📊) + 打卡(🔥) + 头像(🐱)
- **瀑布流卡片**：每个卡片显示类型标签、标题、描述摘要、标签、积分信息、投票数
- **发布按钮**：浮动圆形按钮——发痛点(红) / 分享方案(绿)

### 2. 发布痛点页

红色主题表单：
- 痛点标题（必填）
- 详细描述（必填）
- 标签选择（预设 + 自定义）
- 悬赏积分滑块（显示余额）

### 3. 分享方案页

绿色主题表单：
- 方案标题（必填）
- 方案简介（必填）
- 详细步骤/内容（付费后可见）
- 标签选择
- 价格选择（免费 / 10 / 20 积分）

### 4. 榜单页

三个 Tab 榜单：
- **痛点榜**：按投票数排序的痛点 Top 10
- **方案榜**：按投票数排序的方案 Top 10
- **慧眼奖**：提出最多被解决痛点的用户排行

Top 3 金银铜特殊样式（渐变背景），4-10 简洁列表。

### 5. 详情页（痛点/方案）

点击卡片进入：
- 作者信息（头像 + 昵称 + 时间）
- 完整标题 + 描述/内容
- 标签
- 痛点：悬赏金额 + 投票/认领按钮
- 方案：付费内容区域（未购买显示锁定，购买后解锁）+ 购买按钮
- 评论区

## 响应式设计

| 断点 | 卡片布局 | 导航方式 | 发布按钮 | 卡片内容 |
|------|---------|---------|---------|---------|
| < 640px（移动端） | 单列列表 | 底部 Tab 栏 | Tab 内入口 | 精简（标题+积分+投票） |
| 640-1024px（平板） | 双列瀑布流 | 顶部导航栏 | 浮动按钮 | 完整 |
| > 1024px（PC） | 三列瀑布流 | 顶部导航栏 | 右下角浮动圆形按钮 | 完整 |

移动端额外适配：
- 底部 Tab 导航栏（集市/发痛点/分享方案/榜单）
- 发布页顶部返回箭头
- 触控友好：按钮最小 44px 高度
- 标签 flex-wrap 自动换行

## 模拟数据

为丰富演示效果，预置一批模拟数据：

**痛点示例**：
- 每天手动录入100张发票信息到系统（财务/发票，悬赏30）
- 每周花半天写周报总结（周报/写作，悬赏20）
- 客服每天回复200条重复问题（客服/自动化，悬赏15）
- 手动对比50个供应商报价（采购/比价，悬赏25）
- 每月给100个客户发对账单（财务/邮件，悬赏10）

**方案示例**：
- ChatGPT + OCR 自动录入发票（财务/OCR，付费10）
- AI 自动生成周报 Chrome 插件（周报/插件，免费）
- AI 客服机器人自动回复（客服/机器人，付费5）
- 智能比价工具（采购/爬虫，付费15）

**预设标签**：财务、日报、客服、运营、开发、采购、自动化、写作、OCR、邮件

## 部署方案

1. 代码推送到 GitHub 仓库
2. GitHub Actions 自动构建 Vite 项目
3. 部署到 GitHub Pages
4. 产出公网可访问 URL

Supabase 项目独立托管，前端通过环境变量连接。

## 安全策略

所有积分变更操作通过 Supabase RPC（PostgreSQL 函数）执行，客户端不可直接修改 `profiles.points`：

- **RLS 策略**：`profiles` 表用户只能读自己的行，不能 `UPDATE points`
- **积分扣减**：通过 RPC `deduct_points(user_id, amount)` 原子操作（`UPDATE ... SET points = points - amount WHERE points >= amount`）
- **积分增加**：通过 RPC `add_points(user_id, amount, reason)` 原子操作
- **打卡**：通过 RPC `check_in(user_id)` 执行，使用 `CURRENT_DATE` 服务端时间判断，非客户端时间
- **投票**：通过 RPC `vote(user_id, target_id, target_type)` 执行，依赖 UNIQUE 约束防重复
- **购买方案**：通过 RPC `purchase_solution(user_id, solution_id)` 原子执行（扣积分 + 创建购买记录 + 更新 purchases 计数）
- **认领痛点**：通过 RPC `claim_pain_point(user_id, pain_point_id)` 更新 claimer_id 和 status
- **解决痛点**：通过 RPC `resolve_pain_point(pain_point_id)` 将悬赏积分转给认领者，更新 status

余额不足时：前端实时校验禁用按钮，后端 RPC 返回错误提示「积分不足」。

## 认领流程

1. 用户点击「认领悬赏」→ `claim_pain_point()` → status 变为 claimed，claimer_id 记录认领者
2. 认领者提交解决方案（分享方案时关联 pain_point_id）
3. 痛点作者确认解决 → `resolve_pain_point()` → 悬赏积分发放给认领者，status 变为 resolved
4. 比赛演示简化：认领后可直接标记解决，无需等待作者确认
