# 产品判官 (Product Judge)

一个帮助创业者和产品经理验证产品想法的 AI 工具，通过苏格拉底式提问和多角色挑战，帮助用户深度思考产品的真实价值。

## 功能特点

### 1. 交互式对话
- AI 以"产品判官"身份与用户对话
- 苏格拉底式提问，追问关键问题
- 三阶段引导：问题定义 → 解决方案 → 商业模式

### 2. 知识库支持
- **303 期 Lenny's Podcast** 完整 transcript
- **34 篇产品沉思录** 精华文章
- 支持导入 PDF、Markdown、TXT 文件
- RAG 检索相关案例和原则
- 内置产品管理理论（The Mom Test、Zero to One 等）

### 3. 多视角挑战（6 角色评审系统）
- **Product Manager** - 验证真实需求
- **Strategy Consultant** - 分析护城河和竞争
- **Growth Hacker** - 评估增长渠道
- **Tech Architect** - 技术可行性分析
- **User Simulator** - 用户体验模拟
- **Angel Investor** - ROI 和市场分析

### 4. 灵感卡片
- 10 张产品思维卡片
- 来源：Shreyas Doshi, Brian Chesky, Elena Verna, Marty Cagan

## 项目结构

```
产品思考工具/
├── README.md                   # 本文件
│
├── 产品知识库/                 # 📚 知识库 (303期播客 + 34篇文章)
│   ├── README.md               # 知识库索引
│   ├── 核心知识精华.md          # 最重要的知识点汇总
│   │
│   ├── Lenny播客精华/          # 303期播客按主题整理
│   │   ├── 产品管理/           # 产品管理 (175期)
│   │   ├── 增长策略/           # 增长黑客、PLG
│   │   ├── 领导力/             # 团队管理
│   │   ├── 创业/               # 创业、PMF
│   │   ├── AI与技术/           # AI 产品
│   │   ├── 职业发展/           # 职业规划
│   │   └── 决策与战略/         # 战略思维
│   │
│   ├── 产品沉思录/             # 少楠的产品思考 (34篇)
│   │
│   ├── 01-产品与设计/          # 产品设计方法论
│   ├── 02-商业与战略/          # 商业模式、战略
│   ├── 03-思维与认知/          # 思维模型
│   ├── 04-成长与效能/          # 个人成长
│   ├── 05-技术与AI/            # AI、技术趋势
│   │
│   ├── 资源文件/               # PDF、图片等
│   └── 原始数据/               # 原始 transcript 存档
│       ├── lenny-transcripts/  # 303期完整 transcript
│       └── notion_articles/    # Notion 原始下载
│
├── backend/                    # 🔧 后端 (FastAPI + LangGraph)
│   ├── main.py                 # API 服务器
│   ├── agent.py                # 6 角色评审系统
│   ├── db.py                   # ChromaDB 向量数据库
│   ├── ingest.py               # 知识库导入脚本
│   ├── knowledge/              # 内置知识库
│   └── requirements.txt
│
└── frontend/                   # 🎨 前端 (Next.js)
    ├── src/
    │   ├── app/
    │   │   ├── chat/           # 对话页面
    │   │   ├── explore/        # 灵感卡片页面
    │   │   └── api/chat/       # API 路由
    │   ├── data/
    │   │   ��── prompts.ts      # 系统提示词
    │   │   └── cards.json      # 灵感卡片数据
    │   └── components/
    └── package.json
```

## 快速开始

### 1. 后端设置

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 OPENAI_API_KEY

# 导入知识库
python ingest.py

# 启动服务器
uvicorn main:app --reload
```

### 2. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 文件，填入 OPENROUTER_API_KEY

# 启动开发服务器
npm run dev
```

### 3. 访问应用

- 前端: http://localhost:3000
- 后端 API: http://localhost:8000

## 知识库管理

### 导入知识库

```bash
cd backend
python ingest.py
```

这会自动导入：
- `backend/knowledge/` 目录下的 .md 和 .txt 文件
- `产品知识库/` 目录下的所有文本文件
- 根目录下的 PDF 文件

### 清空知识库

```bash
python ingest.py --clear
```

### 添加新知识

1. 将 PDF 文件放到项目根目录
2. 将 .md 或 .txt 文件放到 `产品知识库/` 或 `backend/knowledge/` 目录
3. 运行 `python ingest.py` 重新导入

## 技术栈

### 后端
- FastAPI - Web 框架
- LangGraph - AI Agent 工作流
- LangChain - LLM 应用框架
- ChromaDB - 向量数据库
- OpenAI API - GPT-4o 模型

### 前端
- Next.js 16 - React 框架
- Tailwind CSS - 样式框架
- OpenRouter API - Claude 3.5 Sonnet

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 健康检查 |
| `/api/knowledge` | POST | 知识库检索 |
| `/api/judge` | POST | 6 角色评审 |

## 环境变量

### 推荐配置（只需要一个 API Key）

在前端和后端都使用同一个 OpenRouter API Key：

**后端 (.env)**
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**前端 (.env.local)**
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
BACKEND_URL=http://localhost:8000
```

### 模型说明

| 任务 | 模型 | 说明 |
|------|------|------|
| 前端对话 | `anthropic/claude-3.5-sonnet` | 苏格拉底式提问 |
| 知识库 Embedding | `openai/text-embedding-3-small` | 向量化文档 |
| 6 角色评审 | `openai/gpt-4o` | 结构化输出 |

### 备选配置

如果你有 OpenAI API Key，也可以在后端使用：
```
OPENAI_API_KEY=your_openai_api_key_here
```
