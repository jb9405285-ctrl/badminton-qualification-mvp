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

## 11. Render 重新部署方案

如果你昨天已经在 Render 上建好 Web Service，这一版不需要新开一套服务，直接把现有服务切到最新代码并更新构建命令即可。

线上仍建议：

- 使用 PostgreSQL 作为 `DATABASE_URL`
- 设置 `PERSIST_UPLOAD_FILES=false`
- 让 Render 负责跑构建和启动，避免本地打包产物混入线上

### 11.1 现有 Render 服务需要替换的命令

把现有 Render Web Service 的命令改成：

```text
Build Command:
npm ci --include=dev && npm run render:build

Pre-Deploy Command:
npm run render:predeploy

Start Command:
npm run start
```

其中：

- `render:build` 会先生成 PostgreSQL 版 Prisma Client，再执行 `next build`
- `render:predeploy` 会把 schema 推到线上数据库，并补齐演示账号和演示数据

### 11.2 现有 Render 服务需要确认的环境变量

至少保留：

```text
DATABASE_URL=你当前线上 PostgreSQL 连接串
PERSIST_UPLOAD_FILES=false
NODE_ENV=production
```

如果你昨天用的是 Supabase PostgreSQL，可以继续沿用，不需要因为这次升级强制换库。

### 11.3 重新部署前的仓库检查

推送到 GitHub 前，请确认不要提交本地真实数据文件：

```bash
cd "/Users/xxiyy/Documents/badminton"
git rm --cached badminton-qualification-mvp/prisma/dev.db
git rm --cached badminton-qualification-mvp/.DS_Store .DS_Store
```

以上命令只会从 Git 跟踪中移除文件，不会删除你电脑上的本地文件。

### 11.4 重部署后的检查顺序

Render 部署完成后先访问：

```text
https://你的-render域名/api/health
```

看到 `{"ok":true,"database":"ok"}` 后，再检查：

```text
https://你的-render域名/
https://你的-render域名/search
https://你的-render域名/login
```

演示账号仍是：

```text
admin@example.com
password123
```

### 11.5 免费方案限制

- Render Free 一段时间无人访问后会休眠，第一次打开可能需要等待。
- 如果你当前数据库也是免费实例，首次访问时可能有冷启动。
- Render 免费环境不适合依赖本地持久磁盘，所以原始上传文件不应作为长期存储。
- 如果朋友开始持续使用，建议升级实例并增加数据库备份。

## 12. 联调与验收

当前阶段的统一联调、测试步骤和验收清单已整理到：

[docs/acceptance-checklist.md](/Users/xxiyy/Documents/badminton/badminton-qualification-mvp/docs/acceptance-checklist.md)

这份文档会在 A/B/C 子代理完成后作为最终验收口径。
