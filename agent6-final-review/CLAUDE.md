# Agent 6 — Final Review

## 职责
最终质量审查 + 汇总所有 Agent 产物到 final-output/。

## 4 阶段审查

1. **Assembly 验证** — 读 Agent 5 的 assembly-report.json
2. **多模态分析** — 调 aesthetic-reviewer 的 analyze_video.py 审最终视频
3. **产物完整性** — 检查所有 Agent 的输出产物齐全
4. **最终裁定** — PASS/FAIL + 拷贝到 final-output/

## 命令

```bash
# 完整审查
python agent6-final-review/scripts/final_review.py

# 跳过多模态（节省时间/API 费用）
python agent6-final-review/scripts/final_review.py --skip-vision

# 仅检查
python agent6-final-review/scripts/final_review.py --dry-run
```

## 通过阈值
- Assembly PASS
- 视觉总分 >= 7.0/10（如果跑了多模态）
- Pre-flight >= 8/11 通过
- 产物完整性 >= 90%

## 产物
- `agent6-final-review/output/final-review-report.md` — 最终审查报告
- `agent6-final-review/output/final-review.json` — 结构化审查数据
- `agent6-final-review/output/final-vision.json` — 多模态分析结果（如果有）
- `final-output/{timestamp}/` — 所有最终产物的归档