/**
 * Sample news data for the broadcast video.
 * In production, this will be replaced with Horizon-collected news data
 * processed through the broadcast-engine.
 */
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: "top" | "tech" | "world" | "business" | "science";
  source?: string;
}

export interface BroadcastData {
  date: string;
  title: string;
  subtitle: string;
  newsItems: NewsItem[];
  closingText: string;
}

export const sampleBroadcast: BroadcastData = {
  date: "2026年6月11日",
  title: "每日新闻速递",
  subtitle: "Horizon News · 为您呈现全球视野",
  newsItems: [
    {
      id: "news-1",
      title: "全球AI峰会在新加坡开幕",
      summary:
        "来自50多个国家的代表齐聚新加坡，共同探讨人工智能治理框架与跨境协作机制。峰会首日发布了《AI安全合作宣言》。",
      category: "top",
      source: "Horizon 采集",
    },
    {
      id: "news-2",
      title: "量子计算突破：1000量子比特处理器问世",
      summary:
        "研究团队成功开发出新一代量子处理器，首次突破1000量子比特大关，有望在药物研发和气候建模领域带来革命性变化。",
      category: "science",
      source: "Horizon 采集",
    },
    {
      id: "news-3",
      title: "国际空间站完成第20次商业补给任务",
      summary:
        "SpaceX 货运龙飞船成功对接国际空间站，运送了超过3吨的科研设备和补给物资，包括新一代植物生长实验装置。",
      category: "world",
      source: "Horizon 采集",
    },
    {
      id: "news-4",
      title: "央行数字货币跨境支付试点扩大至12国",
      summary:
        "多国央行联合宣布数字货币跨境结算试点范围扩大，覆盖东南亚、中东和非洲地区，交易确认时间缩短至3秒以内。",
      category: "business",
      source: "Horizon 采集",
    },
    {
      id: "news-5",
      title: "新型固态电池续航突破1000公里",
      summary:
        "多家车企联合发布下一代固态电池技术，能量密度达到传统锂电池的2.5倍，充电10分钟可续航1000公里，预计2027年量产。",
      category: "tech",
      source: "Horizon 采集",
    },
  ],
  closingText: "感谢收看 · 我们明天再见",
};