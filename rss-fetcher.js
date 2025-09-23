import fetch from "node-fetch";
import * as cheerio from "cheerio";
import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bcahnkgczieiogyyxyml.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw";
const supabase = createClient(supabaseUrl, supabaseKey);

const parser = new Parser();

// ----------------- 配置区 -----------------
const sources = {
  NHK: {
    社会: "https://www3.nhk.or.jp/rss/news/cat0.xml", // 社会
    政治: "https://www3.nhk.or.jp/rss/news/cat1.xml", // 政治
    経済: "https://www3.nhk.or.jp/rss/news/cat5.xml", // 经济
  },
  Asahi: {
    社会: "https://www.asahi.com/national/",
    政治: "https://www.asahi.com/politics/",
    経済: "https://www.asahi.com/business/",
  },
  Yomiuri: {
    社会: "https://www.yomiuri.co.jp/national/",
    政治: "https://www.yomiuri.co.jp/politics/",
    経済: "https://www.yomiuri.co.jp/economy/",
  },
};
// ----------------- 配置区 -----------------

// 保存到 Supabase
async function saveNews(item) {
  const { data: existing } = await supabase
    .from("news")
    .select("id")
    .eq("link", item.link)
    .limit(1);

  if (existing && existing.length > 0) return; // 已存在则跳过

  await supabase.from("news").insert([item]);
  console.log(`✅ 已保存 [${item.source}][${item.category}] ${item.title}`);
}

// 抓取 NHK RSS
async function fetchNHK(url, category) {
  const feed = await parser.parseURL(url);
  return feed.items.map((item) => ({
    title: item.title,
    link: item.link,
    summary: item.contentSnippet || "",
    pub_date: item.pubDate,
    source: "NHK",
    category,
  }));
}

// 抓取 朝日新闻（支持翻页）
async function fetchAsahi(url, category, pages = 3) {
  let results = [];
  for (let i = 1; i <= pages; i++) {
    const res = await fetch(i === 1 ? url : `${url}?page=${i}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    $("section.Section .List li a").each((_, el) => {
      const title = $(el).text().trim();
      let link = $(el).attr("href");
      if (link && link.includes("/articles/")) {
        if (!link.startsWith("http")) link = `https://www.asahi.com${link}`;
        results.push({
          title,
          link,
          summary: "",
          pub_date: new Date().toISOString(),
          source: "Asahi",
          category,
        });
      }
    });
  }
  return results;
}

// 抓取 读卖新闻（支持翻页）
async function fetchYomiuri(url, category, pages = 3) {
  let results = [];
  for (let i = 1; i <= pages; i++) {
    const res = await fetch(i === 1 ? url : `${url}?page=${i}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    $("main .p-list-item a").each((_, el) => {
      const title = $(el).text().trim();
      let link = $(el).attr("href");
      if (link && link.includes("/articles/")) {
        if (!link.startsWith("http")) link = `https://www.yomiuri.co.jp${link}`;
        results.push({
          title,
          link,
          summary: "",
          pub_date: new Date().toISOString(),
          source: "Yomiuri",
          category,
        });
      }
    });
  }
  return results;
}

// 主函数
async function main() {
  for (const [source, categories] of Object.entries(sources)) {
    for (const [category, url] of Object.entries(categories)) {
      let news = [];
      try {
        if (source === "NHK") {
          news = await fetchNHK(url, category);
        } else if (source === "Asahi") {
          news = await fetchAsahi(url, category);
        } else if (source === "Yomiuri") {
          news = await fetchYomiuri(url, category);
        }

        console.log(`✅ ${source} ${category} 抓取到 ${news.length} 条`);
        for (const n of news) {
          await saveNews(n);
        }
      } catch (err) {
        console.error(`❌ ${source} ${category} 抓取失败:`, err.message);
      }
    }
  }
  console.log("🎉 新闻抓取完成");
}

main();

// 为了保持与现有代码的兼容性，我们仍然导出 fetchAndStore 函数
async function fetchAndStore() {
  return main();
}

export { fetchAndStore };