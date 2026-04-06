export const APP_NAME = "羽毛球赛事资格核验工具";
export const DEMO_ACCOUNT_EMAIL = "admin@example.com";
export const DEMO_ACCOUNT_PASSWORD = "password123";
export const SESSION_COOKIE_NAME = "badminton_mvp_session";

export const RISK_LEVELS = [
  "二级运动员",
  "二级",
  "一级运动员",
  "一级",
  "运动健将",
  "国际级运动健将",
  "国际健将"
] as const;

export const SAFE_LEVELS = ["无等级"] as const;

export const NAME_COLUMN_CANDIDATES = [
  "姓名",
  "名字",
  "运动员姓名",
  "参赛人姓名",
  "选手姓名",
  "运动员",
  "name",
  "player",
  "athlete"
] as const;
