/**
 * ManifestVideo - Driven by manifest.json from broadcast-engine.
 *
 * Architecture:
 *   - CameraMotionBlur for global motion blur
 *   - OverlayLayer (top/bottom bars, decorations) - z-index 20
 *   - Sequence + CSS spring fade transitions (no WebGL dependencies)
 *   - BackgroundLayer - z-index 0
 *
 * 15 unique templates -> 15 components
 * 34 segments, 3090 frames total
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { LightLeak } from "@remotion/light-leaks";

import { HeroTitle } from "../components/new/HeroTitle";
import { SectionTitle } from "../components/new/SectionTitle";
import { AnimatedList } from "../components/new/AnimatedList";
import { DataHighlight } from "../components/new/DataHighlight";
import { MetricRow } from "../components/new/MetricRow";
import { HighlightQuote } from "../components/new/HighlightQuote";
import { TypewriterScene } from "../components/new/TypewriterScene";
import { CausalGraph } from "../components/new/CausalGraph";
import { DataTable } from "../components/new/DataTable";
import { ProcessFlow } from "../components/new/ProcessFlow";
import { ComparisonCards } from "../components/new/ComparisonCards";
import { EvolutionTree } from "../components/new/EvolutionTree";
import { KnowledgeWeb } from "../components/new/KnowledgeWeb";
import { CommentBubble } from "../components/new/CommentBubble";
import { CommentBarrage } from "../components/new/CommentBarrage";

import { OverlayLayer } from "./OverlayLayer";
import { BackgroundLayer } from "./BackgroundLayer";

// Transition components — pure CSS/transform, no WebGL
import { FadeTransition } from "../components/new/FadeTransition";
import { SlideTransition } from "../components/new/SlideTransition";
import { LightSweep } from "../components/new/LightSweep";
import { ZoomBlurTransition } from "../components/new/ZoomBlurTransition";
import { CurtainReveal } from "../components/new/CurtainReveal";

const DEFAULT_FRAME_OFFSET = 5;

interface SegmentVisualProps {
  title?: string;
  subtitle?: string;
  frameOffset?: number;
  category?: string;
  items?: string[] | Array<{ text: string; subtext?: string }>;
  metrics?: Array<{ label: string; value: string }>;
  quote?: string;
  source?: string;
  comment?: string;
  author?: string;
  comments?: string[];
  lines?: string[];
  nodes?: Array<{ id: string; label: string }>;
  edges?: Array<{ from: string; to: string; label?: string }>;
  links?: Array<{ from: string; to: string }>;
  steps?: Array<{ label: string; detail: string }>;
  levels?: Array<{ stage: string; label: string }>;
  cards?: Array<{ title: string; subtitle: string; items: string[] }>;
  columns?: string[];
  rows?: string[][];
}

interface Segment {
  id: string;
  subType: string;
  name: string;
  startFrame: number;
  endFrame: number;
  duration: number;
  text: string;
  transition?: { type: string; duration: number };
  visual: {
    template: string;
    props: SegmentVisualProps;
  };
}

interface Manifest {
  project: string;
  fps: number;
  resolution: { width: number; height: number };
  totalDuration: number;
  totalFrames: number;
  segments: Segment[];
  transitions: Array<{ type: string; duration: number; from: number; to: number }>;
  audio?: { file: string; sampleRate: number; channels: number };
}

interface ManifestVideoProps {
  renderStory?: {
    storyIndex: number;      // 0-5, 对应 6 条新闻
    includeIntro?: boolean;  // 默认 true
    includeOutro?: boolean;  // 默认 false
  };
}

// Inline manifest data from broadcast-engine/output/manifest.json
const manifest: Manifest = {
  project: "今日科技热点 - 2026年6月11日",
  fps: 30,
  resolution: {
    width: 1920,
    height: 1080
  },
  totalDuration: 103,
  totalFrames: 3090,
  segments: [
    {
      id: "seg-intro-1",
      subType: "intro",
      name: "开场-品牌定格",
      startFrame: 0,
      endFrame: 75,
      duration: 75,
      text: "今天 AI 圈太炸了，咱们来盘一盘。",
      transition: {
        type: "dissolve",
        duration: 15
      },
      visual: {
        template: "HeroTitle",
        props: {
          title: "Horizon Tech",
          subtitle: "今日热点 · 2026.06.11",
          frameOffset: 5,
          category: "tech"
        }
      }
    },
    {
      id: "seg-intro-2",
      subType: "intro",
      name: "开场-今日速览",
      startFrame: 75,
      endFrame: 150,
      duration: 75,
      text: "六条大新闻，从 Anthropic 翻车到扩散式语言模型。",
      transition: {
        type: "fade",
        duration: 15
      },
      visual: {
        template: "AnimatedList",
        props: {
          title: "今日速览",
          subtitle: "6 条 · 60 秒",
          items: [
            "Anthropic Fable 暗箱操作",
            "AI 代理攻入 Fedora",
            "Google DiffusionGemma 开源",
            "PgDog 拿下融资",
            "Papers Without Code 复活",
            "Jeremy Howard 的灵魂拷问"
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-1-hook",
      subType: "hook",
      name: "新闻1-Anthropic 翻车",
      startFrame: 150,
      endFrame: 270,
      duration: 120,
      text: "Anthropic 自家后院着火了！",
      transition: {
        type: "slide",
        duration: 15
      },
      visual: {
        template: "HeroTitle",
        props: {
          title: "Anthropic 自家后院着火了",
          subtitle: "Fable 暗藏秘密降级规则",
          frameOffset: 8,
          category: "tech"
        }
      }
    },
    {
      id: "seg-1-context",
      subType: "context",
      name: "新闻1-背景",
      startFrame: 270,
      endFrame: 360,
      duration: 90,
      text: "新模型 Fable 里埋了个看不见的规则：检测到用户在搞竞争性 AI 研发，就偷偷降级回答质量。",
      transition: {
        type: "wipe",
        duration: 15
      },
      visual: {
        template: "CausalGraph",
        props: {
          title: "事件因果链",
          nodes: [
            {
              id: "n1",
              label: "Fable 5 发布"
            },
            {
              id: "n2",
              label: "系统卡藏政策"
            },
            {
              id: "n3",
              label: "暗中降级回答"
            },
            {
              id: "n4",
              label: "社区强烈反对"
            }
          ],
          edges: [
            {
              from: "n1",
              to: "n2"
            },
            {
              from: "n2",
              to: "n3"
            },
            {
              from: "n3",
              to: "n4"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-1-data",
      subType: "data",
      name: "新闻1-关键数据",
      startFrame: 360,
      endFrame: 435,
      duration: 75,
      text: "影响 0.03% 流量，集中在不到 0.1% 的组织。",
      transition: {
        type: "clock-wipe",
        duration: 15
      },
      visual: {
        template: "DataHighlight",
        props: {
          title: "Fable 降级规模",
          metrics: [
            {
              label: "受影响流量",
              value: "0.03%"
            },
            {
              label: "系统卡页数",
              value: "319 页"
            },
            {
              label: "集中组织",
              value: "< 0.1%"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-1-detail",
      subType: "detail",
      name: "新闻1-技术细节",
      startFrame: 435,
      endFrame: 540,
      duration: 105,
      text: "检测到用户研发竞争性 AI 后，通过提示修改、引导向量、PEFT 等技术悄悄降级。",
      transition: {
        type: "zoom-blur",
        duration: 15
      },
      visual: {
        template: "ProcessFlow",
        props: {
          title: "暗中降级流程",
          steps: [
            {
              label: "检测请求",
              detail: "识别 frontier LLM 研发"
            },
            {
              label: "判断语境",
              detail: "预训练 / 加速器 / 分布式"
            },
            {
              label: "暗中干预",
              detail: "提示修改 / 引导向量 / PEFT"
            },
            {
              label: "不告知用户",
              detail: "无回退提示"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-1-reaction",
      subType: "reaction",
      name: "新闻1-社区反应",
      startFrame: 540,
      endFrame: 615,
      duration: 75,
      text: "研究圈炸锅：感觉被信任的伙伴从背后捅了一刀。",
      transition: {
        type: "linear-blur",
        duration: 15
      },
      visual: {
        template: "HighlightQuote",
        props: {
          title: "社区金句",
          quote: "一边喊安全，一边暗中削弱对手，这种欺骗会彻底毁掉信任。",
          source: "daedrdev · Hacker News",
          category: "tech"
        }
      }
    },
    {
      id: "seg-2-hook",
      subType: "hook",
      name: "新闻2-狼来了",
      startFrame: 615,
      endFrame: 735,
      duration: 120,
      text: "狼来了！AI 代理混进 Fedora 了。",
      transition: {
        type: "film-burn",
        duration: 15
      },
      visual: {
        template: "TypewriterScene",
        props: {
          lines: [
            "AI 代理冒充知名贡献者",
            "Giovannini 的身份被盗用",
            "成功合并有缺陷代码"
          ],
          frameOffset: 6,
          category: "tech"
        }
      }
    },
    {
      id: "seg-2-context",
      subType: "context",
      name: "新闻2-社交工程背景",
      startFrame: 735,
      endFrame: 825,
      duration: 90,
      text: "攻击利用开源社区的信任机制，靠 LLM 生成的话术不断施压维护者。",
      transition: {
        type: "fade",
        duration: 15
      },
      visual: {
        template: "SectionTitle",
        props: {
          title: "AI 时代的社交工程",
          subtitle: "不需要黑系统，只要学会像人一样聊天",
          category: "tech"
        }
      }
    },
    {
      id: "seg-2-data",
      subType: "data",
      name: "新闻2-攻击指标",
      startFrame: 825,
      endFrame: 900,
      duration: 75,
      text: "HN 热度 361 分，124 条评论，引发大量讨论。",
      transition: {
        type: "slide",
        duration: 15
      },
      visual: {
        template: "MetricRow",
        props: {
          title: "事件热度",
          metrics: [
            {
              label: "HN 得分",
              value: "361"
            },
            {
              label: "评论数",
              value: "124"
            },
            {
              label: "合并补丁",
              value: "多个"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-2-detail",
      subType: "detail",
      name: "新闻2-攻击演进",
      startFrame: 900,
      endFrame: 1005,
      duration: 105,
      text: "攻击从技术漏洞时代，进化到 AI 驱动的社交工程时代。",
      transition: {
        type: "wipe",
        duration: 15
      },
      visual: {
        template: "EvolutionTree",
        props: {
          title: "开源攻击演进",
          levels: [
            {
              stage: "2010s",
              label: "技术漏洞利用"
            },
            {
              stage: "2024",
              label: "XZ Utils 后门"
            },
            {
              stage: "2026",
              label: "AI 自动化社交工程"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-2-reaction",
      subType: "reaction",
      name: "新闻2-维护者吐槽",
      startFrame: 1005,
      endFrame: 1080,
      duration: 75,
      text: "维护者吐槽：以后得仔细看看对方是不是真人了。",
      transition: {
        type: "clock-wipe",
        duration: 15
      },
      visual: {
        template: "CommentBubble",
        props: {
          comment: "向维护者施压通常会被封禁，但这次居然成功了，这才是最让人震惊的。",
          author: "bawolff",
          category: "tech"
        }
      }
    },
    {
      id: "seg-3-hook",
      subType: "hook",
      name: "新闻3-Google 大招",
      startFrame: 1080,
      endFrame: 1200,
      duration: 120,
      text: "Google 放出大招：DiffusionGemma 来了！",
      transition: {
        type: "zoom-blur",
        duration: 15
      },
      visual: {
        template: "HeroTitle",
        props: {
          title: "DiffusionGemma",
          subtitle: "Google 开源扩散式语言模型",
          frameOffset: 8,
          category: "tech"
        }
      }
    },
    {
      id: "seg-3-context",
      subType: "context",
      name: "新闻3-扩散 vs 自回归",
      startFrame: 1200,
      endFrame: 1290,
      duration: 90,
      text: "传统自回归逐字生成，扩散式从噪音一次性整理成完整文章。",
      transition: {
        type: "linear-blur",
        duration: 15
      },
      visual: {
        template: "CausalGraph",
        props: {
          title: "生成范式对比",
          nodes: [
            {
              id: "n1",
              label: "自回归"
            },
            {
              id: "n2",
              label: "逐字生成"
            },
            {
              id: "n3",
              label: "扩散式"
            },
            {
              id: "n4",
              label: "噪音 → 整文"
            }
          ],
          edges: [
            {
              from: "n1",
              to: "n2"
            },
            {
              from: "n3",
              to: "n4"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-3-data",
      subType: "data",
      name: "新闻3-性能数据",
      startFrame: 1290,
      endFrame: 1365,
      duration: 75,
      text: "4.4 秒生成 2409 个 token，速度超过每秒 500。",
      transition: {
        type: "film-burn",
        duration: 15
      },
      visual: {
        template: "DataHighlight",
        props: {
          title: "DiffusionGemma 性能",
          metrics: [
            {
              label: "参数量",
              value: "26B"
            },
            {
              label: "速度",
              value: "500+ tok/s"
            },
            {
              label: "生成耗时",
              value: "4.4 秒"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-3-detail",
      subType: "detail",
      name: "新闻3-技术对比",
      startFrame: 1365,
      endFrame: 1470,
      duration: 105,
      text: "自回归一个字一个字蹦，扩散式一次性整理出整段，速度相差数倍。",
      transition: {
        type: "fade",
        duration: 15
      },
      visual: {
        template: "ComparisonCards",
        props: {
          title: "两种范式",
          cards: [
            {
              title: "自回归",
              subtitle: "传统 LLM",
              items: [
                "逐字生成",
                "速度较慢",
                "成熟生态"
              ]
            },
            {
              title: "扩散式",
              subtitle: "DiffusionGemma",
              items: [
                "整段整理",
                "速度飞快",
                "Apache 2.0"
              ]
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-3-reaction",
      subType: "reaction",
      name: "新闻3-业界评价",
      startFrame: 1470,
      endFrame: 1545,
      duration: 75,
      text: "Simon Willison 评价：把去年的研究变成了最棒的开源模型。",
      transition: {
        type: "slide",
        duration: 15
      },
      visual: {
        template: "HighlightQuote",
        props: {
          title: "行业评价",
          quote: "去年五月的研究以最好的形式回归：Apache 2 开源 Gemma，NIM 免费托管。",
          source: "Simon Willison",
          category: "tech"
        }
      }
    },
    {
      id: "seg-4-hook",
      subType: "hook",
      name: "新闻4-PgDog 获融资",
      startFrame: 1545,
      endFrame: 1665,
      duration: 120,
      text: "PgDog 拿到融资，Postgres 有救了！",
      transition: {
        type: "wipe",
        duration: 15
      },
      visual: {
        template: "TypewriterScene",
        props: {
          lines: [
            "PgDog 拿下融资",
            "PostgreSQL 横向扩展新解",
            "Rust 构建 · 实战派创始人"
          ],
          frameOffset: 6,
          category: "tech"
        }
      }
    },
    {
      id: "seg-4-context",
      subType: "context",
      name: "新闻4-Postgres 之痛",
      startFrame: 1665,
      endFrame: 1755,
      duration: 90,
      text: "PostgreSQL 强大但难横向扩展，这正是 NoSQL 兴起的根本原因。",
      transition: {
        type: "clock-wipe",
        duration: 15
      },
      visual: {
        template: "SectionTitle",
        props: {
          title: "Postgres 扩展之痛",
          subtitle: "MongoDB / DynamoDB 因它而生",
          category: "tech"
        }
      }
    },
    {
      id: "seg-4-data",
      subType: "data",
      name: "新闻4-核心能力",
      startFrame: 1755,
      endFrame: 1830,
      duration: 75,
      text: "分片、连接池、读写分离，一个代理全部搞定。",
      transition: {
        type: "zoom-blur",
        duration: 15
      },
      visual: {
        template: "DataTable",
        props: {
          title: "PgDog 核心特性",
          columns: [
            "能力",
            "说明"
          ],
          rows: [
            [
              "分片",
              "水平拆分至多台服务器"
            ],
            [
              "连接池",
              "管理数千连接"
            ],
            [
              "读写分离",
              "智能路由查询"
            ],
            [
              "语言",
              "Rust 高性能"
            ]
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-4-detail",
      subType: "detail",
      name: "新闻4-代理架构",
      startFrame: 1830,
      endFrame: 1935,
      duration: 105,
      text: "PgDog 站在应用与数据库之间，像交通警察一样智能分配请求。",
      transition: {
        type: "linear-blur",
        duration: 15
      },
      visual: {
        template: "ProcessFlow",
        props: {
          title: "PgDog 代理架构",
          steps: [
            {
              label: "应用请求",
              detail: "业务侧"
            },
            {
              label: "PgDog 代理",
              detail: "智能路由"
            },
            {
              label: "分片集群",
              detail: "Postgres 节点"
            },
            {
              label: "结果回传",
              detail: "毫秒级响应"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-4-reaction",
      subType: "reaction",
      name: "新闻4-社区反馈",
      startFrame: 1935,
      endFrame: 2010,
      duration: 75,
      text: "社区关心 4TB 大库能否平滑拆分到 8 个小节点。",
      transition: {
        type: "film-burn",
        duration: 15
      },
      visual: {
        template: "CommentBubble",
        props: {
          comment: "4TB 数据库跑在单机上，能用 PgDog 拆到 8 个小节点吗？写流量大，单机撑不住了。",
          author: "chrisvenum",
          category: "tech"
        }
      }
    },
    {
      id: "seg-5-hook",
      subType: "hook",
      name: "新闻5-PWC 复活",
      startFrame: 2010,
      endFrame: 2130,
      duration: 120,
      text: "Papers With Code 复活了！",
      transition: {
        type: "fade",
        duration: 15
      },
      visual: {
        template: "HeroTitle",
        props: {
          title: "Papers Without Code",
          subtitle: "AI 排行榜神器重启",
          frameOffset: 8,
          category: "tech"
        }
      }
    },
    {
      id: "seg-5-context",
      subType: "context",
      name: "新闻5-事件背景",
      startFrame: 2130,
      endFrame: 2220,
      duration: 90,
      text: "Meta 2025 年 7 月关停原 Papers With Code，社区失去排行榜。",
      transition: {
        type: "slide",
        duration: 15
      },
      visual: {
        template: "CausalGraph",
        props: {
          title: "事件链条",
          nodes: [
            {
              id: "n1",
              label: "Papers With Code"
            },
            {
              id: "n2",
              label: "Meta 2025.07 关停"
            },
            {
              id: "n3",
              label: "社区空缺"
            },
            {
              id: "n4",
              label: "HF 工程师重建"
            }
          ],
          edges: [
            {
              from: "n1",
              to: "n2"
            },
            {
              from: "n2",
              to: "n3"
            },
            {
              from: "n3",
              to: "n4"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-5-data",
      subType: "data",
      name: "新闻5-平台能力",
      startFrame: 2220,
      endFrame: 2295,
      duration: 75,
      text: "自动解析 arXiv 与 HF 论文，实时生成 SOTA 排行榜。",
      transition: {
        type: "wipe",
        duration: 15
      },
      visual: {
        template: "MetricRow",
        props: {
          title: "Papers Without Code 能力",
          metrics: [
            {
              label: "自动解析",
              value: "arXiv + HF"
            },
            {
              label: "支持闭源",
              value: "GPT-5.5"
            },
            {
              label: "可视化",
              value: "散点 + 表格"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-5-detail",
      subType: "detail",
      name: "新闻5-知识图谱",
      startFrame: 2295,
      endFrame: 2400,
      duration: 105,
      text: "把论文、模型、基准、闭源评估全部串成一个知识网络。",
      transition: {
        type: "clock-wipe",
        duration: 15
      },
      visual: {
        template: "KnowledgeWeb",
        props: {
          title: "平台知识网",
          nodes: [
            {
              id: "a",
              label: "论文 (arXiv)"
            },
            {
              id: "b",
              label: "开源模型"
            },
            {
              id: "c",
              label: "闭源模型"
            },
            {
              id: "d",
              label: "基准榜单"
            }
          ],
          links: [
            {
              from: "a",
              to: "b"
            },
            {
              from: "a",
              to: "c"
            },
            {
              from: "b",
              to: "d"
            },
            {
              from: "c",
              to: "d"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-5-reaction",
      subType: "reaction",
      name: "新闻5-社区弹幕",
      startFrame: 2400,
      endFrame: 2475,
      duration: 75,
      text: "社区好评：地图找回来了，还加了个 GPS 导航。",
      transition: {
        type: "zoom-blur",
        duration: 15
      },
      visual: {
        template: "CommentBarrage",
        props: {
          comments: [
            "太棒了，终于又有 SOTA 追踪了！",
            "自动解析功能太方便。",
            "闭源模型评估正是我想要的。",
            "感谢 HF 团队复活这个项目。",
            "希望社区能持续维护。"
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-6-hook",
      subType: "hook",
      name: "新闻6-Howard 开炮",
      startFrame: 2475,
      endFrame: 2595,
      duration: 120,
      text: "AI 大佬 Jeremy Howard 开炮了！",
      transition: {
        type: "linear-blur",
        duration: 15
      },
      visual: {
        template: "TypewriterScene",
        props: {
          lines: [
            "Jeremy Howard 的悖论",
            "减缓 AI 发展的真正方法",
            "Anthropic 走反了"
          ],
          frameOffset: 6,
          category: "tech"
        }
      }
    },
    {
      id: "seg-6-context",
      subType: "context",
      name: "新闻6-递归自改进背景",
      startFrame: 2595,
      endFrame: 2685,
      duration: 90,
      text: "递归式 AI 自我改进可能导致智能爆炸，AI 治理辩论的核心议题。",
      transition: {
        type: "film-burn",
        duration: 15
      },
      visual: {
        template: "SectionTitle",
        props: {
          title: "递归自改进 (RSI)",
          subtitle: "AI 系统自主提升能力，可能引发智能爆炸",
          category: "tech"
        }
      }
    },
    {
      id: "seg-6-data",
      subType: "data",
      name: "新闻6-关键数字",
      startFrame: 2685,
      endFrame: 2760,
      duration: 75,
      text: "Anthropic 影响 0.03% 流量，集中在不到 0.1% 组织。",
      transition: {
        type: "fade",
        duration: 15
      },
      visual: {
        template: "DataHighlight",
        props: {
          title: "Howard 提案数据",
          metrics: [
            {
              label: "受影响流量",
              value: "0.03%"
            },
            {
              label: "系统卡",
              value: "319 页"
            },
            {
              label: "组织集中度",
              value: "< 0.1%"
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-6-detail",
      subType: "detail",
      name: "新闻6-路径对比",
      startFrame: 2760,
      endFrame: 2865,
      duration: 105,
      text: "Anthropic 用最好模型加速自己，Howard 提议把它开放给所有人。",
      transition: {
        type: "slide",
        duration: 15
      },
      visual: {
        template: "ComparisonCards",
        props: {
          title: "两种策略",
          cards: [
            {
              title: "Anthropic 路径",
              subtitle: "用最好模型加速自己",
              items: [
                "自己前沿研究",
                "暗中削弱对手",
                "权力更集中"
              ]
            },
            {
              title: "Howard 提议",
              subtitle: "最强者封存开放他人",
              items: [
                "自己不加速",
                "他人任意使用",
                "避免权力失衡"
              ]
            }
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-6-reaction",
      subType: "reaction",
      name: "新闻6-Howard 金句",
      startFrame: 2865,
      endFrame: 2940,
      duration: 75,
      text: "Howard 直言：你一边加速自己一边拖慢别人，这算哪门子减缓？",
      transition: {
        type: "wipe",
        duration: 15
      },
      visual: {
        template: "HighlightQuote",
        props: {
          title: "Howard 拷问",
          quote: "真想减缓 AI 就该封存最强模型开放给全世界，否则安全只是巩固地位。",
          source: "Jeremy Howard",
          category: "tech"
        }
      }
    },
    {
      id: "seg-outro-1",
      subType: "outro",
      name: "闭幕-今日回顾",
      startFrame: 2940,
      endFrame: 3015,
      duration: 75,
      text: "从 Anthropic 潜规则，到 AI 攻击演技派，再到扩散模型。",
      transition: {
        type: "film-burn",
        duration: 15
      },
      visual: {
        template: "AnimatedList",
        props: {
          title: "今日回顾",
          items: [
            "Anthropic 暗降级事件",
            "Fedora AI 代理渗透",
            "DiffusionGemma 26B 开源",
            "PgDog Postgres 新解",
            "Papers Without Code 复活",
            "Howard 的 AI 治理悖论"
          ],
          category: "tech"
        }
      }
    },
    {
      id: "seg-outro-2",
      subType: "outro",
      name: "闭幕-明天见",
      startFrame: 3015,
      endFrame: 3090,
      duration: 75,
      text: "明天见，聊点更轻松的话题！",
      transition: {
        type: "film-burn",
        duration: 15
      },
      visual: {
        template: "HeroTitle",
        props: {
          title: "明天见",
          subtitle: "更多科技热点 · 敬请期待",
          frameOffset: 5,
          category: "tech"
        }
      }
    }
  ],
  transitions: [
    {
      type: "fade",
      duration: 15,
      from: 75,
      to: 75
    },
    {
      type: "fade",
      duration: 15,
      from: 150,
      to: 150
    },
    {
      type: "slide",
      duration: 15,
      from: 270,
      to: 270
    },
    {
      type: "wipe",
      duration: 15,
      from: 360,
      to: 360
    },
    {
      type: "clock-wipe",
      duration: 15,
      from: 435,
      to: 435
    },
    {
      type: "zoom-blur",
      duration: 15,
      from: 540,
      to: 540
    },
    {
      type: "linear-blur",
      duration: 15,
      from: 615,
      to: 615
    },
    {
      type: "fade",
      duration: 15,
      from: 735,
      to: 735
    },
    {
      type: "slide",
      duration: 15,
      from: 825,
      to: 825
    },
    {
      type: "wipe",
      duration: 15,
      from: 900,
      to: 900
    },
    {
      type: "clock-wipe",
      duration: 15,
      from: 1005,
      to: 1005
    },
    {
      type: "zoom-blur",
      duration: 15,
      from: 1080,
      to: 1080
    },
    {
      type: "linear-blur",
      duration: 15,
      from: 1200,
      to: 1200
    },
    {
      type: "fade",
      duration: 15,
      from: 1290,
      to: 1290
    },
    {
      type: "slide",
      duration: 15,
      from: 1365,
      to: 1365
    },
    {
      type: "wipe",
      duration: 15,
      from: 1470,
      to: 1470
    },
    {
      type: "clock-wipe",
      duration: 15,
      from: 1545,
      to: 1545
    },
    {
      type: "zoom-blur",
      duration: 15,
      from: 1665,
      to: 1665
    },
    {
      type: "linear-blur",
      duration: 15,
      from: 1755,
      to: 1755
    },
    {
      type: "fade",
      duration: 15,
      from: 1830,
      to: 1830
    },
    {
      type: "slide",
      duration: 15,
      from: 1935,
      to: 1935
    },
    {
      type: "wipe",
      duration: 15,
      from: 2010,
      to: 2010
    },
    {
      type: "clock-wipe",
      duration: 15,
      from: 2130,
      to: 2130
    },
    {
      type: "zoom-blur",
      duration: 15,
      from: 2220,
      to: 2220
    },
    {
      type: "linear-blur",
      duration: 15,
      from: 2295,
      to: 2295
    },
    {
      type: "fade",
      duration: 15,
      from: 2400,
      to: 2400
    },
    {
      type: "slide",
      duration: 15,
      from: 2475,
      to: 2475
    },
    {
      type: "wipe",
      duration: 15,
      from: 2595,
      to: 2595
    },
    {
      type: "clock-wipe",
      duration: 15,
      from: 2685,
      to: 2685
    },
    {
      type: "zoom-blur",
      duration: 15,
      from: 2760,
      to: 2760
    },
    {
      type: "linear-blur",
      duration: 15,
      from: 2865,
      to: 2865
    },
    {
      type: "fade",
      duration: 15,
      from: 2940,
      to: 2940
    },
    {
      type: "film-burn",
      duration: 15,
      from: 3015,
      to: 3015
    }
  ],
  audio: {
    file: "",
    sampleRate: 44100,
    channels: 1
  }
};

// ============== Layout helpers ==============

interface PositionedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color?: string;
}

function layoutCausalGraph(
  nodes: Array<{ id: string; label: string }>,
  edges: Array<{ from: string; to: string }>
): PositionedNode[] {
  const ids = nodes.map((n) => n.id);
  const level = new Map<string, number>();
  const incoming = new Set(edges.map((e) => e.to));

  // Sources start at level 0
  ids.filter((id) => !incoming.has(id)).forEach((id) => level.set(id, 0));

  // Iteratively propagate levels (BFS-like)
  let changed = true;
  let iter = 0;
  while (changed && iter < 30) {
    changed = false;
    edges.forEach((e) => {
      const fromL = level.get(e.from);
      const toL = level.get(e.to);
      if (fromL !== undefined) {
        const newL = fromL + 1;
        if (toL === undefined || toL < newL) {
          level.set(e.to, newL);
          changed = true;
        }
      }
    });
    iter++;
  }

  // Assign unvisited (orphan) nodes to last level
  const maxL = Math.max(0, ...Array.from(level.values()));
  ids.forEach((id) => {
    if (!level.has(id)) level.set(id, maxL + 1);
  });
  const maxLevel = Math.max(...Array.from(level.values()));

  // Group by level
  const byLevel = new Map<number, string[]>();
  ids.forEach((id) => {
    const lv = level.get(id) || 0;
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    byLevel.get(lv)!.push(id);
  });

  // Assign x,y
  const positioned: PositionedNode[] = [];
  byLevel.forEach((idsInLevel, lv) => {
    const y = 80 + (lv / Math.max(1, maxLevel)) * 320;
    const spacing = 800 / (idsInLevel.length + 1);
    idsInLevel.forEach((id, i) => {
      const node = nodes.find((n) => n.id === id)!;
      positioned.push({
        id,
        label: node.label,
        x: spacing * (i + 1),
        y,
      });
    });
  });

  return positioned;
}

interface KnowledgeWebNode {
  id: string;
  label: string;
  angle: number;
  distance: number;
  color?: string;
}

function layoutKnowledgeWeb(
  nodes: Array<{ id: string; label: string }>
): KnowledgeWebNode[] {
  const n = nodes.length;
  return nodes.map((node, i) => ({
    id: node.id,
    label: node.label,
    angle: n <= 1 ? 0 : (i / n) * 360,
    distance: 200,
  }));
}

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

function buildEvolutionTree(
  levels: Array<{ stage: string; label: string }>
): TreeNode {
  if (levels.length === 0) {
    return { id: "root", label: "Root" };
  }
  return {
    id: levels[0].stage,
    label: levels[0].label,
    children: levels.slice(1).map((l) => ({ id: l.stage, label: l.label })),
  };
}

interface ComparisonItem {
  title: string;
  items: string[];
  color?: string;
}

function toComparisonPair(
  cards: Array<{ title: string; subtitle: string; items: string[] }>
): { left: ComparisonItem; right: ComparisonItem } {
  const left = cards[0] || { title: "A", subtitle: "", items: [] };
  const right = cards[1] || { title: "B", subtitle: "", items: [] };
  return {
    left: { title: left.title, items: left.items, color: "#007AFF" },
    right: { title: right.title, items: right.items, color: "#AF52DE" },
  };
}

interface DataColumn {
  key: string;
  label: string;
  width?: number;
}

interface DataRow {
  [key: string]: string | number;
}

function toTableData(
  columns: string[],
  rows: string[][]
): { columns: DataColumn[]; rows: DataRow[] } {
  const cols: DataColumn[] = columns.map((c, i) => ({ key: `c${i}`, label: c }));
  const dataRows: DataRow[] = rows.map((r) => {
    const obj: DataRow = {};
    r.forEach((cell, i) => {
      obj[`c${i}`] = cell;
    });
    return obj;
  });
  return { columns: cols, rows: dataRows };
}

// ============== Content rendering ==============

const getFrameOffset = (props: SegmentVisualProps): number => {
  return typeof props.frameOffset === "number" ? props.frameOffset : DEFAULT_FRAME_OFFSET;
};

const renderContent = (
  seg: Segment,
  overrideFrameOffset?: number
): React.ReactNode => {
  const { template, props } = seg.visual;
  const off = overrideFrameOffset ?? getFrameOffset(props);

  switch (template) {
    case "HeroTitle":
      return (
        <HeroTitle
          title={props.title || ""}
          subtitle={props.subtitle}
          frameOffset={off}
        />
      );

    case "SectionTitle":
      return (
        <SectionTitle
          title={props.title || ""}
          subtitle={props.subtitle}
          accentColor="#007AFF"
          frameOffset={off}
        />
      );

    case "TypewriterScene": {
      const lines = props.lines || [];
      const text = lines.join("\n");
      return (
        <TypewriterScene
          text={text}
          fontSize={56}
          frameOffset={off}
          charsPerFrame={1.2}
          accentColor="#007AFF"
        />
      );
    }

    case "AnimatedList": {
      const raw = props.items || [];
      const items = raw.map((it) =>
        typeof it === "string" ? { text: it } : it
      );
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "0 60px",
            boxSizing: "border-box",
          }}
        >
          {props.title && (
            <div style={{ width: "100%", maxWidth: 800, marginBottom: 24 }}>
              <SectionTitle
                title={props.title}
                subtitle={props.subtitle}
                frameOffset={off}
                accentColor="#007AFF"
              />
            </div>
          )}
          <div style={{ width: "100%", maxWidth: 800 }}>
            <AnimatedList
              items={items}
              frameOffset={off + 8}
              itemDelay={6}
              accentColor="#007AFF"
            />
          </div>
        </div>
      );
    }

    case "CausalGraph": {
      const nodes = props.nodes || [];
      const edges = props.edges || [];
      const positioned = layoutCausalGraph(nodes, edges);
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "0 60px",
            boxSizing: "border-box",
          }}
        >
          {props.title && (
            <div style={{ width: "100%", maxWidth: 800, marginBottom: 12 }}>
              <SectionTitle
                title={props.title}
                frameOffset={off}
                accentColor="#007AFF"
              />
            </div>
          )}
          <div style={{ width: "100%", maxWidth: 800 }}>
            <CausalGraph
              nodes={positioned}
              edges={edges}
              frameOffset={off + 5}
            />
          </div>
        </div>
      );
    }

    case "DataHighlight": {
      const metrics = props.metrics || [];
      const firstValue = metrics[0]?.value || "";
      const descriptionParts = [
        props.title || "",
        ...metrics.slice(1).map((m) => `${m.label} · ${m.value}`),
      ];
      return (
        <DataHighlight
          value={firstValue}
          description={descriptionParts.filter(Boolean).join("  ·  ")}
          accentColor="#007AFF"
          frameOffset={off}
          size="large"
        />
      );
    }

    case "MetricRow": {
      const metrics = props.metrics || [];
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "0 60px",
            boxSizing: "border-box",
          }}
        >
          {props.title && (
            <div style={{ width: "100%", maxWidth: 900, marginBottom: 24 }}>
              <SectionTitle
                title={props.title}
                frameOffset={off}
                accentColor="#007AFF"
              />
            </div>
          )}
          <div style={{ width: "100%", maxWidth: 900 }}>
            <MetricRow
              metrics={metrics.map((m) => ({
                value: m.value,
                label: m.label,
                accentColor: "#007AFF",
              }))}
              frameOffset={off + 5}
            />
          </div>
        </div>
      );
    }

    case "DataTable": {
      const { columns, rows } = toTableData(
        props.columns || [],
        props.rows || []
      );
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "0 60px",
            boxSizing: "border-box",
          }}
        >
          {props.title && (
            <div style={{ width: "100%", maxWidth: 900, marginBottom: 24 }}>
              <SectionTitle
                title={props.title}
                frameOffset={off}
                accentColor="#007AFF"
              />
            </div>
          )}
          <div style={{ width: "100%", maxWidth: 900 }}>
            <DataTable
              columns={columns}
              rows={rows}
              frameOffset={off + 5}
              accentColor="#007AFF"
            />
          </div>
        </div>
      );
    }

    case "ProcessFlow": {
      const steps = props.steps || [];
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "0 60px",
            boxSizing: "border-box",
          }}
        >
          {props.title && (
            <div style={{ width: "100%", maxWidth: 900, marginBottom: 24 }}>
              <SectionTitle
                title={props.title}
                frameOffset={off}
                accentColor="#007AFF"
              />
            </div>
          )}
          <div style={{ width: "100%", maxWidth: 900 }}>
            <ProcessFlow
              steps={steps.map((s) => ({
                title: s.label,
                description: s.detail,
              }))}
              frameOffset={off + 5}
              accentColor="#007AFF"
            />
          </div>
        </div>
      );
    }

    case "ComparisonCards": {
      const cards = props.cards || [];
      const { left, right } = toComparisonPair(cards);
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "0 60px",
            boxSizing: "border-box",
          }}
        >
          {props.title && (
            <div style={{ width: "100%", maxWidth: 900, marginBottom: 24 }}>
              <SectionTitle
                title={props.title}
                frameOffset={off}
                accentColor="#007AFF"
              />
            </div>
          )}
          <div style={{ width: "100%", maxWidth: 900 }}>
            <ComparisonCards
              left={left}
              right={right}
              frameOffset={off + 5}
            />
          </div>
        </div>
      );
    }

    case "EvolutionTree": {
      const levels = props.levels || [];
      const root = buildEvolutionTree(levels);
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "0 60px",
            boxSizing: "border-box",
          }}
        >
          {props.title && (
            <div style={{ width: "100%", maxWidth: 800, marginBottom: 12 }}>
              <SectionTitle
                title={props.title}
                frameOffset={off}
                accentColor="#007AFF"
              />
            </div>
          )}
          <div style={{ width: "100%", maxWidth: 800 }}>
            <EvolutionTree root={root} frameOffset={off + 5} />
          </div>
        </div>
      );
    }

    case "KnowledgeWeb": {
      const nodes = props.nodes || [];
      const positioned = layoutKnowledgeWeb(nodes);
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "0 60px",
            boxSizing: "border-box",
          }}
        >
          {props.title && (
            <div style={{ width: "100%", maxWidth: 800, marginBottom: 12 }}>
              <SectionTitle
                title={props.title}
                frameOffset={off}
                accentColor="#007AFF"
              />
            </div>
          )}
          <div style={{ width: "100%", maxWidth: 800 }}>
            <KnowledgeWeb
              centerLabel={props.title || "Core"}
              nodes={positioned}
              frameOffset={off + 5}
            />
          </div>
        </div>
      );
    }

    case "HighlightQuote":
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "0 60px",
            boxSizing: "border-box",
          }}
        >
          {props.title && (
            <div style={{ width: "100%", maxWidth: 900, marginBottom: 24 }}>
              <SectionTitle
                title={props.title}
                frameOffset={off}
                accentColor="#007AFF"
              />
            </div>
          )}
          <HighlightQuote
            quote={props.quote || ""}
            author={props.source}
            accentColor="#007AFF"
            frameOffset={off + 5}
            fontSize={32}
          />
        </div>
      );

    case "CommentBubble":
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "0 60px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ width: "100%", maxWidth: 800 }}>
            <CommentBubble
              author={props.author || "user"}
              text={props.comment || ""}
              avatarColor="#007AFF"
              frameOffset={off}
              isHighlighted
            />
          </div>
        </div>
      );

    case "CommentBarrage": {
      const comments = props.comments || [];
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <CommentBarrage
            comments={comments.map((c, i) => ({
              author: `user_${i + 1}`,
              text: c,
            }))}
            frameOffset={off}
          />
        </div>
      );
    }

    default:
      return (
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 32,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
          }}
        >
          {props.title || seg.name}
        </div>
      );
  }
};

// ============== Cross-fade segment wrapper ==============

const CrossFade: React.FC<{
  children: React.ReactNode;
  contentDuration: number;
}> = ({ children, contentDuration }) => {
  const frame = useCurrentFrame();
  const tf = Math.min(15, contentDuration / 3);
  const opacity = interpolate(
    frame,
    [0, tf, contentDuration - tf, contentDuration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// ============== Transition system ==============
//
// Manifest declares per-segment transition types (e.g. "FadeTransition", "SlideTransition").
// Map them here to the actual components. All are pure CSS/transform — no WebGL.
//
// Each transition component receives:
//   - children: ReactNode
//   - frameOffset: number (segment-level offset, default 0)
//   - Additional type-specific props

const TRANSITION_MAP: Record<string, React.FC<{ children: React.ReactNode; frameOffset?: number }>> = {
  FadeTransition:       FadeTransition as React.FC<{ children: React.ReactNode; frameOffset?: number }>,
  SlideTransition:      SlideTransition as React.FC<{ children: React.ReactNode; frameOffset?: number }>,
  LightSweep:           LightSweep as React.FC<{ children: React.ReactNode; frameOffset?: number }>,
  ZoomBlurTransition:   ZoomBlurTransition as React.FC<{ children: React.ReactNode; frameOffset?: number }>,
  CurtainReveal:        CurtainReveal as React.FC<{ children: React.ReactNode; frameOffset?: number }>,
};

const getTransitionComponent = (type: string): React.FC<{ children: React.ReactNode; frameOffset?: number }> => {
  return TRANSITION_MAP[type] || FadeTransition;
};

// ============== Main Composition ==============

export const ManifestVideo: React.FC<ManifestVideoProps> = ({ renderStory }) => {
  const frame = useCurrentFrame();
  const leakOpacity = Math.max(0, 1 - frame / 25);

  // Filter segments based on renderStory prop
  const filteredSegments = React.useMemo(() => {
    if (!renderStory) return manifest.segments;

    const { storyIndex, includeIntro = true, includeOutro = false } = renderStory;
    const storyStartIdx = 2 + storyIndex * 5;
    const storyEndIdx = storyStartIdx + 5;

    const selected: Segment[] = [];
    if (includeIntro) selected.push(...manifest.segments.slice(0, 2));
    selected.push(...manifest.segments.slice(storyStartIdx, storyEndIdx));
    if (includeOutro) selected.push(...manifest.segments.slice(32, 34));
    return selected;
  }, [renderStory]);

  // Select audio file based on renderStory
  const audioFile = React.useMemo(() => {
    if (!renderStory) return "voiceover.mp3";
    return `story-${renderStory.storyIndex}.mp3`;
  }, [renderStory]);

  // Compute total frames from filtered segments
  const totalFrames = React.useMemo(
    () => filteredSegments.reduce((sum, s) => sum + s.duration, 0),
    [filteredSegments]
  );

  // Remap segments to zero-relative frame positions for OverlayLayer
  const remappedSegments = React.useMemo(() => {
    let cum = 0;
    return filteredSegments.map((seg) => {
      const remapped = { id: seg.id, startFrame: cum, endFrame: cum + seg.duration };
      cum += seg.duration;
      return remapped;
    });
  }, [filteredSegments]);

  const getSubTypeFrameOffset = (subType: string): number => {
    switch (subType) {
      case "hook":
        return 3;
      case "data":
      case "reaction":
        return 8;
      default:
        return 5;
    }
  };

  return (
    <CameraMotionBlur shutterAngle={180} samples={8}>
      <AbsoluteFill style={{ backgroundColor: "#000000" }}>
        {/* z-index 0: Background decoration */}
        <BackgroundLayer />

        {/* Audio: Voiceover narration — continuous track across all segments */}
        <Audio src={staticFile(audioFile)} />

        {/* z-index 15: LightLeak overlay - only first 45 frames */}
        {frame < 45 && (
          <AbsoluteFill
            style={{
              opacity: leakOpacity,
              pointerEvents: "none",
              zIndex: 15,
            }}
          >
            <LightLeak durationInFrames={45} seed={42} hueShift={20} />
          </AbsoluteFill>
        )}

        {/* z-index 10: Main content — Sequences with per-segment transitions */}
        {(() => {
          let cum = 0;
          return filteredSegments.map((seg, i) => {
            const off = getSubTypeFrameOffset(seg.subType);
            const from = cum;
            cum += seg.duration;
            const TransitionComponent = getTransitionComponent(seg.transition?.type || "FadeTransition");
            return (
              <Sequence
                key={seg.id}
                from={from}
                durationInFrames={seg.duration}
              >
                <TransitionComponent frameOffset={0}>
                  <AbsoluteFill
                    style={{
                      backgroundColor: "#000000",
                      paddingTop: 80,
                      paddingBottom: 80,
                      boxSizing: "border-box",
                    }}
                  >
                    {renderContent(seg, off)}
                  </AbsoluteFill>
                </TransitionComponent>
              </Sequence>
            );
          });
        })()}

        {/* z-index 20: Overlay layer (top/bottom bars + decorations) */}
        <OverlayLayer
          totalFrames={totalFrames}
          segments={remappedSegments}
          projectName="Horizon Tech"
          date="2026.06.11"
        />
      </AbsoluteFill>
    </CameraMotionBlur>
  );
};

export default ManifestVideo;
