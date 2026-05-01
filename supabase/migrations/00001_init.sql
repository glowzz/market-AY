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

-- Realtime: 发布 pain_points 和 solutions 表变更
ALTER PUBLICATION supabase_realtime ADD TABLE pain_points;
ALTER PUBLICATION supabase_realtime ADD TABLE solutions;
