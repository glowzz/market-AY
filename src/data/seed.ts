import { supabase } from '../lib/supabase'

const PAIN_POINTS = [
  {
    title: '每天手动录入100张发票信息到系统',
    description:
      '作为财务人员，每月末需要把100+张发票的金额、日期、供应商信息逐一录入ERP系统。每张发票需要手动填写5-6个字段，一张大概要1分钟，100张就要将近2小时。而且容易出错，录错了还要回头核对修改。希望能有一种AI方案，拍照/扫描后自动识别发票内容并录入系统。',
    tags: ['财务', '发票', '自动化'],
    bounty: 30,
  },
  {
    title: '每周花半天写周报总结',
    description:
      '格式固定但每次都要重新整理数据写一遍，从各个系统导数据、做表格、写总结，费时费力还不讨好。领导就扫一眼，我却要花3小时。',
    tags: ['周报', '写作'],
    bounty: 20,
  },
  {
    title: '客服每天回复200条重复问题',
    description:
      '同样的问题每天被问几十遍，客户等得烦，我复制粘贴也烦。像查物流、退换货政策、价格咨询这些问题完全可以用AI自动回复。',
    tags: ['客服', '自动化'],
    bounty: 15,
  },
  {
    title: '手动对比50个供应商报价',
    description:
      '每次采购都要从各个供应商的邮件/Excel里手动提取报价数据，做对比表，分析性价比。50个供应商的报价整理下来要一整天。',
    tags: ['采购', '比价'],
    bounty: 25,
  },
  {
    title: '每月给100个客户发对账单',
    description:
      '每月初要从系统导出每个客户的交易记录，生成对账单PDF，然后一封封发邮件。100个客户就要重复操作100次，纯纯的体力活。',
    tags: ['财务', '邮件'],
    bounty: 10,
  },
]

const SOLUTIONS = [
  {
    title: '用 ChatGPT + OCR 自动识别录入发票',
    description: '拍照发票→AI识别关键字段→自动填入系统，3秒搞定一张发票',
    content:
      '## 实现步骤\n\n1. 使用手机拍照或扫描发票\n2. 调用 OCR API（如百度OCR/腾讯OCR）识别文字\n3. 用 GPT-4V 直接理解发票图片结构\n4. 提取关键字段：金额、日期、供应商、发票号\n5. 通过 RPA 或 API 自动填入 ERP 系统\n\n## 推荐工具\n- 百度OCR API（准确率高，有免费额度）\n- OpenAI GPT-4V（直接理解图片）\n- 影刀RPA（自动操作ERP）\n\n## 成本估算\n- OCR: 约0.01元/张\n- GPT-4V: 约0.1元/张\n- 总成本约0.11元/张，vs 人工1分钟/张',
    tags: ['财务', 'OCR'],
    price: 10,
    pain_point_index: 0,
  },
  {
    title: 'AI 自动生成周报 Chrome 插件',
    description: '一键从 Git/Jira 抓数据，AI 写总结，直接复制到周报模板',
    content:
      '## 使用方法\n\n1. 安装 Chrome 插件\n2. 配置你的 Git/Jira 账号\n3. 点击"生成本周周报"\n4. AI 自动抓取本周 commit、PR、完成的任务\n5. 生成结构化周报（本周完成 + 下周计划 + 风险项）\n6. 一键复制到剪贴板\n\n## 技术实现\n- Chrome Extension API 抓取页面数据\n- GPT-4 整合数据生成文字\n- 支持自定义周报模板',
    tags: ['周报', '插件'],
    price: 0,
    pain_point_index: 1,
  },
  {
    title: 'AI 客服机器人自动回复',
    description: '训练知识库，自动匹配回复，人工只处理复杂问题',
    content:
      '## 方案介绍\n\n基于企业知识库训练一个客服AI，能自动回答80%的常见问题。\n\n## 实现方式\n1. 整理常见问题文档（FAQ）\n2. 使用 RAG（检索增强生成）技术\n3. 用户提问 → 向量检索相关文档 → GPT生成回复\n4. 复杂问题自动转人工\n\n## 效果\n- 80%问题自动回复\n- 平均响应时间从5分钟降到5秒\n- 客户满意度提升30%',
    tags: ['客服', '机器人'],
    price: 5,
    pain_point_index: 2,
  },
  {
    title: '智能比价工具',
    description: '自动抓取供应商报价，生成对比分析表，一目了然',
    content:
      '## 功能\n- 自动解析供应商邮件/Excel中的报价\n- 生成多维对比表（价格、交期、质量评分）\n- AI推荐最优供应商\n- 支持历史价格趋势分析\n\n## 使用\n1. 导入供应商报价文件（支持Excel/PDF/邮件）\n2. AI自动提取关键字段\n3. 生成对比报告\n4. 一键生成采购建议',
    tags: ['采购', '爬虫'],
    price: 15,
    pain_point_index: 3,
  },
]

export async function seedData() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('请先登录')

  // Insert pain points directly (bypass RPC to avoid point deduction)
  const painPointIds: string[] = []
  for (const pp of PAIN_POINTS) {
    const { data, error } = await supabase
      .from('pain_points')
      .insert({
        author_id: user.id,
        title: pp.title,
        description: pp.description,
        tags: pp.tags,
        bounty: pp.bounty,
      })
      .select('id')
      .single()

    if (error) console.error('Error inserting pain point:', error)
    if (data?.id) painPointIds.push(data.id)
  }

  // Insert solutions
  for (const sol of SOLUTIONS) {
    const painPointId =
      sol.pain_point_index < painPointIds.length
        ? painPointIds[sol.pain_point_index]
        : null

    const { error } = await supabase.from('solutions').insert({
      author_id: user.id,
      pain_point_id: painPointId,
      title: sol.title,
      description: sol.description,
      content: sol.content,
      tags: sol.tags,
      price: sol.price,
    })
    if (error) console.error('Error inserting solution:', error)
  }

  return { painPoints: painPointIds.length, solutions: SOLUTIONS.length }
}
