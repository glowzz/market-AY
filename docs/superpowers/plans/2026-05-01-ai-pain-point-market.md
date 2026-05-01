# AI 痛点集市 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 AI 痛点交易集市 SPA，支持匿名用户发布痛点悬赏、分享 AI 方案、投票、积分交易，部署到 GitHub Pages。

**Architecture:** Vite + React 纯静态 SPA，Supabase 作为 BaaS（Auth + Database + RPC），通过 GitHub Actions 部署到 GitHub Pages。客户端使用 @supabase/supabase-js SDK 直连 Supabase。

**Tech Stack:** Vite, React 18, TypeScript, TailwindCSS, @supabase/supabase-js, react-router-dom

---

## File Structure

```
market-AY/
├── .github/
│   └── workflows/
│       └── deploy.yml                 # GitHub Pages 部署
├── supabase/
│   ├── config.toml                    # Supabase 本地配置（可选）
│   └── migrations/
│       └── 00001_init.sql             # 建表 + RLS + RPC + 触发器
├── src/
│   ├── main.tsx                       # 入口
│   ├── App.tsx                        # 路由定义
│   ├── index.css                      # TailwindCSS 入口
│   ├── lib/
│   │   └── supabase.ts               # Supabase client 初始化
│   ├── hooks/
│   │   ├── useAuth.ts                # 匿名登录 + profile 管理
│   │   ├── usePoints.ts              # 积分余额 + 打卡
│   │   ├── usePainPoints.ts          # 痛点 CRUD
│   │   ├── useSolutions.ts           # 方案 CRUD
│   │   ├── useVotes.ts               # 投票
│   │   └── useComments.ts            # 评论
│   ├── components/
│   │   ├── Navbar.tsx                 # 顶部导航栏（PC）
│   │   ├── BottomNav.tsx              # 底部 Tab 导航（移动端）
│   │   ├── FloatingActionButton.tsx   # 右下角浮动按钮（PC）
│   │   ├── PainPointCard.tsx          # 痛点卡片
│   │   ├── SolutionCard.tsx           # 方案卡片
│   │   ├── CardFeed.tsx               # 瀑布流卡片列表
│   │   ├── TagSelector.tsx            # 标签选择器
│   │   ├── PointsSlider.tsx           # 积分滑块
│   │   ├── VoteButton.tsx             # 投票按钮
│   │   └── CommentSection.tsx         # 评论区
│   ├── pages/
│   │   ├── HomePage.tsx               # 集市广场
│   │   ├── PainPointDetailPage.tsx    # 痛点详情
│   │   ├── SolutionDetailPage.tsx     # 方案详情
│   │   ├── PublishPainPointPage.tsx   # 发布痛点
│   │   ├── ShareSolutionPage.tsx      # 分享方案
│   │   └── LeaderboardPage.tsx        # 榜单
│   └── data/
│       └── seed.ts                    # 模拟数据
├── public/
│   └── favicon.ico
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .env.example                       # Supabase URL/Key 模板
└── .gitignore
```

---

### Task 1: 项目脚手架搭建

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.gitignore`, `.env.example`

- [ ] **Step 1: 初始化 Vite + React + TypeScript 项目**

```bash
cd /home/glw/project/market-AY
pnpm create vite . --template react-ts
```

- [ ] **Step 2: 安装依赖**

```bash
pnpm add @supabase/supabase-js react-router-dom
pnpm add -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: 配置 TailwindCSS**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
})
```

`src/index.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 4: 创建 .env.example**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 5: 创建 .gitignore**

```
node_modules
dist
.env
.superpowers
```

- [ ] **Step 6: 验证项目启动**

```bash
pnpm dev
```

Expected: 浏览器打开 http://localhost:5173 看到 Vite + React 默认页面

- [ ] **Step 7: 提交**

```bash
git add .
git commit -m "chore: scaffold Vite + React + TypeScript + TailwindCSS project"
```

---

### Task 2: Supabase 数据库建表 + RLS + RPC

**Files:**
- Create: `supabase/migrations/00001_init.sql`
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: 创建 Supabase 项目**

在 https://supabase.com/dashboard 创建新项目，获取 Project URL 和 anon key。创建 `.env` 文件：

```
VITE_SUPABASE_URL=<your-url>
VITE_SUPABASE_ANON_KEY=<your-key>
```

- [ ] **Step 2: 在 Supabase SQL Editor 中执行建表 SQL**

`supabase/migrations/00001_init.sql` — 包含以下内容（在 Supabase Dashboard 的 SQL Editor 中执行）：

```sql
-- profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  avatar text NOT NULL,
  points int NOT NULL DEFAULT 100,
  last_check_in date
);

-- pain_points
CREATE TABLE pain_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  bounty int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'resolved')),
  claimer_id uuid REFERENCES profiles(id),
  claimed_at timestamptz,
  votes int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- solutions
CREATE TABLE solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id),
  pain_point_id uuid REFERENCES pain_points(id),
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  price int NOT NULL DEFAULT 0,
  votes int NOT NULL DEFAULT 0,
  purchases int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- votes
CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  target_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('pain_point', 'solution')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_id, target_type)
);

-- comments
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id),
  target_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('pain_point', 'solution')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- purchases
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  solution_id uuid NOT NULL REFERENCES solutions(id),
  price int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, solution_id)
);

-- RLS: profiles - 用户只能读自己的行，不能修改 points
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile non-points" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger: 阻止客户端直接修改 points 列
CREATE OR REPLACE FUNCTION prevent_points_update() RETURNS trigger AS $$
BEGIN
  NEW.points = OLD.points;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_points_protection
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_points_update();

-- RLS: pain_points - 公开读，登录后写
ALTER TABLE pain_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pain_points" ON pain_points FOR SELECT USING (true);
CREATE POLICY "Auth users can insert" ON pain_points FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author can update" ON pain_points FOR UPDATE USING (auth.uid() = author_id OR auth.uid() = claimer_id);

-- RLS: solutions - 公开读，登录后写
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read solutions" ON solutions FOR SELECT USING (true);
CREATE POLICY "Auth users can insert" ON solutions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author can update" ON solutions FOR UPDATE USING (auth.uid() = author_id);

-- RLS: votes - 登录后读写
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own vote" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS: comments - 公开读，登录后写
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Auth users can insert" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- RLS: purchases - 用户读自己的，登录后写
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth users can insert" ON purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger: 自动维护 votes 计数
CREATE OR REPLACE FUNCTION update_votes_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'pain_point' THEN
      UPDATE pain_points SET votes = votes + 1 WHERE id = NEW.target_id;
    ELSE
      UPDATE solutions SET votes = votes + 1 WHERE id = NEW.target_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_votes_count
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION update_votes_count();

-- RPC: 打卡
CREATE OR REPLACE FUNCTION check_in(p_user_id uuid) RETURNS json AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF v_profile.last_check_in = CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'message', '今天已打卡');
  END IF;
  UPDATE profiles SET points = points + 10, last_check_in = CURRENT_DATE WHERE id = p_user_id;
  RETURN json_build_object('success', true, 'points_added', 10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: 积分扣减（原子操作，防竞态）
CREATE OR REPLACE FUNCTION deduct_points(p_user_id uuid, p_amount int) RETURNS json AS $$
DECLARE
  v_current int;
BEGIN
  UPDATE profiles SET points = points - p_amount
    WHERE id = p_user_id AND points >= p_amount
    RETURNING points INTO v_current;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', '积分不足');
  END IF;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: 投票
CREATE OR REPLACE FUNCTION vote(p_user_id uuid, p_target_id uuid, p_target_type text) RETURNS json AS $$
BEGIN
  INSERT INTO votes (user_id, target_id, target_type) VALUES (p_user_id, p_target_id, p_target_type);
  RETURN json_build_object('success', true);
EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('success', false, 'message', '已经投过票了');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: 购买方案
CREATE OR REPLACE FUNCTION purchase_solution(p_user_id uuid, p_solution_id uuid) RETURNS json AS $$
DECLARE
  v_price int;
  v_author_id uuid;
  v_result json;
BEGIN
  SELECT price, author_id INTO v_price, v_author_id FROM solutions WHERE id = p_solution_id;
  IF v_price = 0 THEN
    INSERT INTO purchases (user_id, solution_id, price) VALUES (p_user_id, p_solution_id, 0)
      ON CONFLICT (user_id, solution_id) DO NOTHING;
    RETURN json_build_object('success', true, 'message', '免费方案');
  END IF;
  v_result := deduct_points(p_user_id, v_price);
  IF (v_result->>'success')::boolean = false THEN
    RETURN v_result;
  END IF;
  INSERT INTO purchases (user_id, solution_id, price) VALUES (p_user_id, p_solution_id, v_price);
  UPDATE profiles SET points = points + v_price WHERE id = v_author_id;
  UPDATE solutions SET purchases = purchases + 1 WHERE id = p_solution_id;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: 认领痛点
CREATE OR REPLACE FUNCTION claim_pain_point(p_user_id uuid, p_pain_point_id uuid) RETURNS json AS $$
DECLARE
  v_status text;
  v_author_id uuid;
BEGIN
  SELECT status, author_id INTO v_status, v_author_id FROM pain_points WHERE id = p_pain_point_id;
  IF v_status != 'open' THEN
    RETURN json_build_object('success', false, 'message', '该痛点已被认领');
  END IF;
  IF v_author_id = p_user_id THEN
    RETURN json_build_object('success', false, 'message', '不能认领自己发布的痛点');
  END IF;
  UPDATE pain_points SET claimer_id = p_user_id, claimed_at = now(), status = 'claimed' WHERE id = p_pain_point_id;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: 解决痛点（发放悬赏）
CREATE OR REPLACE FUNCTION resolve_pain_point(p_pain_point_id uuid) RETURNS json AS $$
DECLARE
  v_claimer_id uuid;
  v_bounty int;
BEGIN
  SELECT claimer_id, bounty INTO v_claimer_id, v_bounty FROM pain_points WHERE id = p_pain_point_id;
  IF v_claimer_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', '尚未被认领');
  END IF;
  UPDATE profiles SET points = points + v_bounty WHERE id = v_claimer_id;
  UPDATE pain_points SET status = 'resolved' WHERE id = p_pain_point_id;
  RETURN json_build_object('success', true, 'bounty_awarded', v_bounty);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: 发布痛点（冻结积分）
CREATE OR REPLACE FUNCTION create_pain_point(
  p_author_id uuid, p_title text, p_description text, p_tags text[], p_bounty int
) RETURNS json AS $$
DECLARE
  v_id uuid;
  v_result json;
BEGIN
  IF p_bounty > 0 THEN
    v_result := deduct_points(p_author_id, p_bounty);
    IF (v_result->>'success')::boolean = false THEN
      RETURN v_result;
    END IF;
  END IF;
  INSERT INTO pain_points (author_id, title, description, tags, bounty)
    VALUES (p_author_id, p_title, p_description, p_tags, p_bounty) RETURNING id INTO v_id;
  RETURN json_build_object('success', true, 'id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 启用匿名登录（需在 Supabase Dashboard → Authentication → Providers 中启用 Anonymous）

-- Realtime: 发布 pain_points 和 solutions 表变更
ALTER PUBLICATION supabase_realtime ADD TABLE pain_points;
ALTER PUBLICATION supabase_realtime ADD TABLE solutions;
```

- [ ] **Step 3: 在 Supabase Dashboard 启用匿名登录**

Authentication → Providers → Anonymous → Enable

- [ ] **Step 4: 创建 Supabase client 文件**

`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "feat: add Supabase schema, RLS policies, and RPC functions"
```

---

### Task 3: 匿名登录 + Profile 管理

**Files:**
- Create: `src/hooks/useAuth.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: 实现 useAuth hook**

`src/hooks/useAuth.ts`:
```ts
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

const ADJECTIVES = ['勇敢的', '机智的', '快乐的', '聪明的', '可爱的', '优雅的', '敏捷的', '温柔的']
const ANIMALS = ['猫头鹰', '海豚', '狐狸', '熊', '兔子', '鹿', '企鹅', '猫', '狮子', '鹰']
const AVATARS = ['🦉', '🐬', '🦊', '🐻', '🐰', '🦌', '🐧', '🐱', '🦁', '🦅']

function generateIdentity() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  const avatarIdx = Math.floor(Math.random() * AVATARS.length)
  return { nickname: `${adj}${animal}`, avatar: AVATARS[avatarIdx] }
}

export interface Profile {
  id: string
  nickname: string
  avatar: string
  points: number
  last_check_in: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        await signInAnonymously()
      }
      initialized.current = true
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!initialized.current) return
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInAnonymously() {
    setLoading(true)
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) { console.error(error); setLoading(false); return }
    if (data.user) {
      setUser(data.user)
      const identity = generateIdentity()
      await supabase.from('profiles').insert({
        id: data.user.id,
        nickname: identity.nickname,
        avatar: identity.avatar,
        points: 100,
      })
      await fetchProfile(data.user.id)
    }
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
    setLoading(false)
  }

  return { user, profile, loading, refreshProfile: () => user && fetchProfile(user.id) }
}
```

- [ ] **Step 2: 更新 App.tsx 基础框架**

`src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { profile, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: 验证匿名登录**

```bash
pnpm dev
```

Expected: 打开浏览器，Supabase Dashboard → Authentication → Users 中看到新匿名用户，profiles 表中有对应记录

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: add anonymous auth with random identity and profile management"
```

---

### Task 4: 集市广场首页 — 卡片流

**Files:**
- Create: `src/components/Navbar.tsx`
- Create: `src/components/BottomNav.tsx`
- Create: `src/components/FloatingActionButton.tsx`
- Create: `src/components/PainPointCard.tsx`
- Create: `src/components/SolutionCard.tsx`
- Create: `src/components/CardFeed.tsx`
- Create: `src/pages/HomePage.tsx`
- Create: `src/hooks/usePainPoints.ts`
- Create: `src/hooks/useSolutions.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: 实现 Navbar（PC 顶部导航栏）**

`src/components/Navbar.tsx` — 渐变紫色背景，左侧品牌名，右侧积分/榜单/打卡/头像按钮

- [ ] **Step 2: 实现 BottomNav（移动端底部 Tab）**

`src/components/BottomNav.tsx` — 4 个 Tab：集市/发痛点/分享方案/榜单，`< 640px` 显示，`>= 640px` 隐藏

- [ ] **Step 3: 实现 FloatingActionButton（PC 右下角）**

`src/components/FloatingActionButton.tsx` — 两个圆形按钮（发痛点红/分享方案绿），`>= 640px` 显示

- [ ] **Step 4: 实现 PainPointCard 和 SolutionCard**

`src/components/PainPointCard.tsx` — 黄色标签「痛点悬赏」、标题、描述摘要、标签、悬赏积分、投票数
`src/components/SolutionCard.tsx` — 绿色标签「AI 方案」、标题、描述摘要、标签、价格、投票数、购买数

- [ ] **Step 5: 实现 CardFeed 瀑布流**

`src/components/CardFeed.tsx` — 合并痛点和方案数据，按时间排序，使用 CSS columns 实现响应式瀑布流（<640px 单列，640-1024px 双列，>1024px 三列）

- [ ] **Step 6: 实现 usePainPoints 和 useSolutions hooks**

`src/hooks/usePainPoints.ts`:
```ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface PainPoint {
  id: string
  author_id: string
  title: string
  description: string
  tags: string[]
  bounty: number
  status: string
  votes: number
  created_at: string
  profiles?: { nickname: string; avatar: string }
}

export function usePainPoints() {
  const [items, setItems] = useState<PainPoint[]>([])

  async function fetchAll() {
    const { data } = await supabase
      .from('pain_points')
      .select('*, profiles(nickname, avatar)')
      .order('created_at', { ascending: false })
    if (data) setItems(data as PainPoint[])
  }

  useEffect(() => { fetchAll() }, [])
  return { items, refresh: fetchAll }
}
```

`src/hooks/useSolutions.ts` — 类似结构，额外加载 purchases 计数

- [ ] **Step 7: 组装 HomePage**

`src/pages/HomePage.tsx` — Navbar + CardFeed + FloatingActionButton + BottomNav

- [ ] **Step 8: 更新 App.tsx 路由**

添加 HomePage 路由，通过 Context 向下传递 profile

- [ ] **Step 9: 验证**

```bash
pnpm dev
```

Expected: 首页显示卡片流（需要先插入模拟数据，见 Task 7）

- [ ] **Step 10: 提交**

```bash
git add .
git commit -m "feat: add homepage with card feed, navbar, bottom nav, and floating action buttons"
```

---

### Task 5: 发布痛点 + 分享方案页面

**Files:**
- Create: `src/components/TagSelector.tsx`
- Create: `src/components/PointsSlider.tsx`
- Create: `src/pages/PublishPainPointPage.tsx`
- Create: `src/pages/ShareSolutionPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 实现 TagSelector 组件**

`src/components/TagSelector.tsx` — 预设标签列表 + 自定义输入，选中高亮，flex-wrap

- [ ] **Step 2: 实现 PointsSlider 组件**

`src/components/PointsSlider.tsx` — 滑块选择积分，显示当前余额，余额不足时禁用

- [ ] **Step 3: 实现 PublishPainPointPage**

`src/pages/PublishPainPointPage.tsx` — 红色主题，标题/描述/标签/积分滑块，调用 RPC `create_pain_point`

- [ ] **Step 4: 实现 ShareSolutionPage**

`src/pages/ShareSolutionPage.tsx` — 绿色主题，标题/简介/详细步骤/标签/价格选择，直接 insert solutions

- [ ] **Step 5: 更新 App.tsx 路由**

添加 `/publish` 和 `/share` 路由

- [ ] **Step 6: 验证**

```bash
pnpm dev
```

Expected: 点击发布按钮 → 填写表单 → 提交成功 → 跳转首页看到新卡片

- [ ] **Step 7: 提交**

```bash
git add .
git commit -m "feat: add publish pain point and share solution pages"
```

---

### Task 6: 详情页 + 投票 + 评论

**Files:**
- Create: `src/components/VoteButton.tsx`
- Create: `src/components/CommentSection.tsx`
- Create: `src/pages/PainPointDetailPage.tsx`
- Create: `src/pages/SolutionDetailPage.tsx`
- Create: `src/hooks/useVotes.ts`
- Create: `src/hooks/useComments.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: 实现 VoteButton 组件**

`src/components/VoteButton.tsx` — 点击调用 RPC `vote()`，乐观更新 UI，防重复

- [ ] **Step 2: 实现 CommentSection 组件**

`src/components/CommentSection.tsx` — 评论列表 + 输入框 + 发送按钮，加载评论数据

- [ ] **Step 3: 实现 useVotes 和 useComments hooks**

- [ ] **Step 4: 实现 PainPointDetailPage**

`src/pages/PainPointDetailPage.tsx` — 完整痛点详情，投票按钮，认领按钮（调用 RPC `claim_pain_point`），评论区

- [ ] **Step 5: 实现 SolutionDetailPage**

`src/pages/SolutionDetailPage.tsx` — 方案详情，付费内容锁定逻辑（查 purchases 表），购买按钮（调用 RPC `purchase_solution`），评论区

- [ ] **Step 6: 更新路由**

添加 `/pain-point/:id` 和 `/solution/:id` 路由

- [ ] **Step 7: 验证**

Expected: 点击卡片 → 进入详情页 → 投票/认领/购买/评论都能正常工作

- [ ] **Step 8: 提交**

```bash
git add .
git commit -m "feat: add detail pages with voting, claiming, purchasing, and comments"
```

---

### Task 7: 榜单页 + 打卡

**Files:**
- Create: `src/pages/LeaderboardPage.tsx`
- Create: `src/hooks/usePoints.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: 实现 usePoints hook**

`src/hooks/usePoints.ts` — 积分余额查询，打卡调用 RPC `check_in()`

- [ ] **Step 2: 实现 LeaderboardPage**

`src/pages/LeaderboardPage.tsx` — 三个 Tab（痛点榜/方案榜/慧眼奖），Top 3 金银铜样式，查询数据按 votes 排序

- [ ] **Step 3: 在 Navbar/BottomNav 中接入打卡功能**

打卡按钮调用 `checkIn()`，成功后刷新积分显示，显示 Toast 提示

- [ ] **Step 4: 更新路由**

添加 `/leaderboard` 路由

- [ ] **Step 5: 验证**

Expected: 点击榜单 → 看到 Top 排行，点击打卡 → 积分 +10

- [ ] **Step 6: 提交**

```bash
git add .
git commit -m "feat: add leaderboard page and daily check-in"
```

---

### Task 8: 模拟数据填充

**Files:**
- Create: `src/data/seed.ts`

- [ ] **Step 1: 创建模拟数据种子脚本**

`src/data/seed.ts` — 包含 5 条预设痛点 + 4 条预设方案。先创建 5 个匿名用户作为模拟作者，再插入关联数据。每个模拟用户先 `signInAnonymously()` + insert profile，再用其 ID 插入痛点/方案。

- [ ] **Step 2: 添加种子数据页面/按钮**

在开发模式下提供一个 `/seed` 路由或首页隐藏按钮，点击执行种子数据插入

- [ ] **Step 3: 执行种子数据插入并验证**

Expected: 首页显示预填充的痛点/方案卡片

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: add seed data for demo"
```

---

### Task 9: GitHub 部署

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `vite.config.ts` (base path 配置)

- [ ] **Step 1: 初始化 Git 仓库并推送到 GitHub**

```bash
git init
git add .
git commit -m "feat: AI pain point market MVP"
gh repo create market-AY --public --source=. --push
```

- [ ] **Step 2: 创建 GitHub Actions 部署配置**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 3: 配置 GitHub Pages**

在 GitHub repo Settings → Pages → Source 选择 "GitHub Actions"

- [ ] **Step 4: 配置 GitHub Secrets**

添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 到 repo Settings → Secrets

- [ ] **Step 5: 推送并验证部署**

```bash
git push origin main
```

Expected: GitHub Actions 构建成功，`https://<username>.github.io/market-AY/` 可访问

- [ ] **Step 6: 提交**

```bash
git add .
git commit -m "ci: add GitHub Pages deployment workflow"
```

---

### Task 10: UI 打磨 + 最终验证

**Files:**
- Modify: 各组件文件进行样式调整

- [ ] **Step 1: 验证完整体验流程**

1. 打开公网 URL → 自动获得匿名身份和 100 积分 ✓
2. 浏览卡片流，看到预填充的痛点和方案 ✓
3. 点击打卡 → 积分 +10 ✓
4. 发布痛点 → 填写表单 → 提交 → 首页看到新卡片 ✓
5. 分享方案 → 填写表单 → 提交 → 首页看到新卡片 ✓
6. 点击卡片 → 详情页 → 投票 → 评论 ✓
7. 购买方案 → 积分扣除 → 内容解锁 ✓
8. 认领痛点 → 标记解决 ✓
9. 查看榜单 → 看到 Top 排行 ✓

- [ ] **Step 2: 移动端验证**

用手机或浏览器 DevTools 模拟移动端，验证：
- 底部 Tab 导航显示正确
- 卡片单列显示
- 表单布局适配

- [ ] **Step 3: 修复 UI 细节**

根据验证结果调整间距、字体、颜色等

- [ ] **Step 4: 最终提交**

```bash
git add .
git commit -m "polish: UI refinements and responsive fixes"
```
