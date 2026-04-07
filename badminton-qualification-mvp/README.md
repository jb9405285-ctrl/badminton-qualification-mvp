# 羽毛球赛事资格核验工具 MVP

基于 `Next.js 14 + TypeScript + Tailwind CSS + Prisma + SQLite + shadcn/ui 风格组件` 实现的网页端 MVP，包含：

- 公众免费查询页：按姓名查询羽毛球运动员等级信息
- 主办方后台：创建赛事、上传 Excel/CSV 名单、批量核验、人工备注、核验历史、CSV/PDF 导出

当前版本的固定风险规则：

- `二级运动员`
- `一级运动员`
- `运动健将`
- `国际级运动健将`

以上等级统一视为风险，不应参加业余赛事。

## 1. 项目路径

项目已创建在：

`/Users/xxiyy/Documents/badminton/badminton-qualification-mvp`

## 2. 启动要求

建议使用：

- Node.js `18.18+` 或 `20+`
- npm `9+`

## 3. 启动步骤

先进入项目目录：

```bash
cd "/Users/xxiyy/Documents/badminton/badminton-qualification-mvp"
```

复制环境变量：

```bash
cp .env.example .env
```

安装依赖：

```bash
npm install
```

生成 Prisma Client 并应用迁移：

```bash
npx prisma migrate dev
```

启动开发环境：

```bash
npm run dev
```

如果要固定使用本地演示端口 `3001`：

```bash
npm run dev:local
```

打开浏览器访问：

- 首页：[http://localhost:3000](http://localhost:3000)
- 公众查询页：[http://localhost:3000/search](http://localhost:3000/search)
- 登录页：[http://localhost:3000/login](http://localhost:3000/login)

## 4. 演示账号

- 邮箱：`admin@example.com`
- 密码：`password123`

## 5. 已实现功能

### 公众查询

- 首页强调“赛事资格核验工具”定位
- `/search` 单人查询页
- 查询字段包含：
  - 姓名
  - 性别
  - 所属地区/单位
  - 羽毛球运动等级
  - 数据来源说明
  - 查询时间
- 无结果提示
- Loading 状态
- 页面免责声明

### 主办方后台

- `/login` 固定测试账号登录
- `/dashboard` 后台概览
- `/dashboard/events` 创建和管理赛事
- `/dashboard/events/[id]` 查看单场赛事的批次和核验结果
- `/dashboard/batch-check` 上传名单并批量核验
- `/dashboard/history` 查看核验历史
- `/dashboard/settings` 查看当前规则和数据源说明

### 批量核验能力

- 支持 `.xlsx / .xls / .csv`
- 自动识别“姓名”列
- 若无法识别，则提示用户手动选择姓名列
- 批量核验结果状态：
  - `通过`
  - `疑似高等级选手`
  - `未查到记录`
  - `需人工复核`
- 风险记录高亮
- 每条记录支持人工备注
- 结果表支持分页

### 导出

- 导出 CSV
- 导出 PDF 核验报告
- PDF 报告包含：
  - 赛事名称
  - 主办方
  - 导出时间
  - 核验结果汇总
  - 风险名单
  - 完整名单结果表
  - 页脚免责声明

## 6. 数据设计

Prisma 模型包含：

- `User`
- `Session`
- `Event`
- `Athlete`
- `UploadBatch`
- `VerificationRecord`

其中：

- `Athlete` 用于演示运动员等级库
- `UploadBatch` 用于记录每次名单上传与处理状态
- `VerificationRecord` 用于保存逐条核验结果和人工备注

## 7. mock 数据与适配层

项目内置 28 条 mock 羽毛球运动员数据，带有：

- 姓名
- 性别
- 地区
- 单位
- 等级
- 来源说明
- 示例证书编号

统一查询入口：

- `searchAthleteByName(name)`

后续真实接入建议：

- 新增 `FutureOfficialProvider`
- 在 `lib/services/athlete-provider.ts` 中切换 provider
- 保持前端页面和批量核验逻辑不变

## 8. 演示建议

### 直接演示现成数据

首次启动后，系统会自动写入：

- 演示管理员账号
- 28 条 mock 运动员数据
- 1 场演示赛事
- 1 个演示上传批次
- 一组演示核验结果

所以你启动后不需要先手动造数据，也能直接演示后台。

### 演示文件

项目自带示例名单文件：

`/Users/xxiyy/Documents/badminton/badminton-qualification-mvp/public/templates/demo-roster.csv`

你也可以在浏览器中访问：

[http://localhost:3000/templates/demo-roster.csv](http://localhost:3000/templates/demo-roster.csv)

## 9. 目录结构

```text
app/
  api/
  dashboard/
  login/
  search/
components/
  dashboard/
  layout/
  search/
  ui/
lib/
  auth/
  data/
  export/
  services/
  uploads/
prisma/
public/
storage/
```

## 10. 当前说明

- 当前数据仅用于演示
- 暂未接入正式商业授权数据源
- 实际使用前需核验数据合法性与准确性
- 这版优先保证 MVP 可运行与可演示，后续适合继续接真实数据源、权限、支付和部署能力

## 11. 免费线上部署方案

当前推荐的免费试运行方案：

- Render Free：运行 Next.js 网站
- Supabase Free：保存 PostgreSQL 数据库
- Render Free 没有持久磁盘，所以线上建议设置 `PERSIST_UPLOAD_FILES=false`
- 名单解析后的行数据、核验结果、风险名单和导出报告所需数据会保存到数据库
- 原始上传文件本身不作为线上免费环境的可靠持久存储

### 11.1 创建 Supabase 免费数据库

1. 打开 Supabase 并创建免费 PostgreSQL 项目。
2. 如果直连 `db.<project-ref>.supabase.co:5432` 不通，优先使用 Supabase Connection Pooler。
3. 当前项目已验证可用的 pooler host 是：

```text
aws-1-us-east-2.pooler.supabase.com
```

4. Render 环境变量中的连接串格式类似：

```text
postgresql://postgres.<project-ref>:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

### 11.2 创建 Render Free Web Service

1. 把本项目推送到 GitHub。
2. 在 Render 新建 `Web Service`，选择该 GitHub 仓库。
3. 如果 GitHub 仓库根目录是 `/Users/xxiyy/Documents/badminton`，Root Directory 填：

```text
badminton-qualification-mvp
```

4. Runtime 选择 Node。
5. Build Command 填：

```bash
npm install --include=dev && npm run deploy:build
```

6. Start Command 填：

```bash
npm run start
```

7. Environment Variables 填：

```text
DATABASE_URL=Supabase Pooler PostgreSQL 连接串
PERSIST_UPLOAD_FILES=false
NODE_ENV=production
```

推送到 GitHub 前，请确认不要提交本地真实数据文件：

```bash
cd "/Users/xxiyy/Documents/badminton"
git rm --cached badminton-qualification-mvp/prisma/dev.db
git rm --cached badminton-qualification-mvp/.DS_Store .DS_Store
```

以上命令只会从 Git 跟踪中移除文件，不会删除你电脑上的本地文件。

### 11.3 上线后检查

Render 部署完成后先访问：

```text
https://你的-render域名/api/health
```

看到 `{"ok":true,"database":"ok"}` 后，再访问：

```text
https://你的-render域名/login
```

演示账号仍是：

```text
admin@example.com
password123
```

### 11.4 免费方案限制

- Render Free 一段时间无人访问后会休眠，客户第一次打开可能需要等待。
- Supabase Free 数据库也可能有冷启动，但数据会比 Render 本地文件更可靠。
- 不要把本地 `prisma/dev.db` 当作线上数据库上传到公开仓库。
- 如果客户开始真实长期使用，建议升级到付费实例并增加备份策略。
