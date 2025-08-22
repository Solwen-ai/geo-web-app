import { getJson } from "serpapi";

getJson({
  // q: "台北有哪些 SEO 公司口碑佳，成功把客戶關鍵字從第 3 頁拉到首頁？",
  q: "drop shipping",
  api_key: process.env.SERPAPI_KEY
}, (json) => {
  console.log(json["ai_overview"]);
});
