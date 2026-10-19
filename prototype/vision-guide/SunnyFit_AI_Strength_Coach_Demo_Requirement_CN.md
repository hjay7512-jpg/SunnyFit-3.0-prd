# SunnyFit AI Strength Coach Demo 需求文档

## 基于手机摄像头的 Dumbbell + Bench AI 指导训练体验

- **文档版本**：v1.0
- **更新日期**：2026-07-23
- **文档用途**：交由 Qoder 执行产品 Demo 的技术分析、设计与开发
- **Demo 类型**：产品体验验证 Demo，不是通用动作识别算法产品
- **默认终端**：手机
- **核心器械**：Dumbbells + Bench
- **核心 Camera Profile**：Portrait Bench / 竖屏固定机位
- **核心训练**：一次架设手机后，完成一组连续、完整的力量训练

---

# 1. 项目背景

SunnyFit 的核心目标是帮助家庭健身用户：

1. 更容易开始训练；
2. 更持续地坚持训练；
3. 更清楚地理解自己的训练效果和进步；
4. 通过 AI Coach、个性化计划、训练结果反馈与进度激励形成持续训练闭环。

很多家庭健身用户已经拥有哑铃、Bench、阻力带等非蓝牙配件，但这些器械本身无法提供训练数据和实时指导。用户即使拥有器械，仍然可能面临：

- 不知道应该练什么；
- 不知道动作如何组合成完整训练；
- 不确定自己的动作是否正确；
- 不知道训练强度是否合适；
- 缺少训练过程中的节奏提醒和鼓励；
- 训练结束后不知道自己是否有所改善。

本 Demo 希望验证：

> 是否可以通过手机摄像头、人体姿态识别和结构化 AI Coach 反馈，把普通 Dumbbells + Bench 升级为一套低成本、可执行、可持续的 AI 指导力量训练体验。

当前 SunnyFit 新用户计划问卷已经包含 Dumbbells、Bands 等配件信息，但 Bench 尚未作为独立器械选项出现。因此，本 Demo 中的 Bench 应被视为一个新增的器械上下文，后续如进入正式产品，需要补充 Equipment Profile、Onboarding 选项和内容标签。

---

# 2. 所属用户旅程与业务价值

## 2.1 用户旅程位置

本 Demo 主要覆盖：

```text
AI Coach / AI Plan 推荐训练
        ↓
训练准备与手机架设
        ↓
AI 指导完成完整力量训练
        ↓
Workout Result 训练结果解释
        ↓
Progress / 下一次训练建议
```

## 2.2 解决的核心问题

| 核心问题 | Demo 提供的价值 |
|---|---|
| 开始训练 | 直接提供一组可执行训练，而不是让用户自行组合动作 |
| 坚持训练 | AI Coach 提供次数、节奏、组间切换和轻量鼓励 |
| 训练信心 | 对明确、可识别的问题提供动作纠正 |
| 进步感 | 训练结束后展示完成情况、动作趋势和下次改进重点 |
| 复训动机 | 把训练结果连接到下一次训练，而不是停留在单次动作评分 |
| 商业吸引力 | 让 SunnyFit 的非蓝牙配件获得“智能化”体验，形成 Premium 能力候选 |

## 2.3 与 SunnyFit 核心模块的关系

| 模块 | 关系 |
|---|---|
| AI Coach | 推荐训练、训练中指导、训练后解释 |
| Personalized Plan | 将 AI Guided Strength 作为 Strength 目标的一种内容承载方式 |
| Movement Workout | 从“看动作并跟练”升级为“执行、识别、纠正、总结” |
| Workout Result | 增加次数、完成组数、动作问题和改进趋势 |
| Progress | 记录训练一致性、动作控制改善和力量训练完成情况 |

---

# 3. Demo 核心目标

## 3.1 目标

验证以下完整体验是否可行：

1. 用户使用一台手机；
2. 用户只需设置一次手机位置；
3. 用户在 Bench 附近完成一组 10–15 分钟力量训练；
4. 系统稳定识别人体关键点；
5. 系统根据当前已知动作统计次数和动作阶段；
6. 系统对少量高价值问题提供及时且不过度打扰的反馈；
7. 用户完成完整训练并获得训练结果总结；
8. 整个过程不要求用户反复搬动或旋转手机。

## 3.2 Demo 成功的核心定义

Demo 成功不等于“支持四个动作”。

Demo 成功应同时满足：

```text
可完成的完整训练
+ 一次 Camera Setup
+ 稳定次数统计
+ 有价值但克制的动作反馈
+ 有教练感的训练流程
+ 可理解的训练结果
```

---

# 4. 核心验证假设

## H1：器械智能化价值

拥有 Dumbbells + Bench 的家庭用户，会认为实时次数统计、动作提醒和训练总结比普通训练视频更有价值。

## H2：手机架设可接受

用户可以接受在训练前花费约 30–90 秒摆放手机，但不能接受训练过程中频繁搬动手机。

## H3：固定 Camera Profile 可以承载完整训练

通过围绕 Bench 选择坐姿、扶凳和上半身动作，可以在同一个竖屏机位下完成一组连续训练。

## H4：规则引擎足以验证产品价值

第一版不需要训练通用动作识别模型。通过 Pose Detection、动作状态机和规则判断，可以验证大部分产品价值。

## H5：实时反馈不应依赖 LLM

实时反馈需要稳定、低延迟、可控。LLM 更适合根据结构化训练结果生成训练后总结，而不是逐帧分析视频或实时决定每一句纠正。

---

# 5. Demo 范围

## 5.1 P0 范围

### 支持设备

- Smartphone
- Dumbbells
- Flat Bench 或可调节 Bench 的平板状态

### 支持 Camera Profile

```text
camera_profile_id: portrait_bench_45_full
orientation: portrait
view_angle: front_oblique_30_to_45
body_visibility: head_to_below_knee
bench_visibility: partial_or_full
phone_movement_during_workout: false
```

### 支持动作

1. 单手扶凳哑铃划船  
   `supported_dumbbell_row`

2. 坐姿哑铃肩推  
   `seated_dumbbell_shoulder_press`

3. 坐姿哑铃弯举  
   `seated_dumbbell_curl`

4. 坐姿哑铃侧平举  
   `seated_dumbbell_lateral_raise`

### 支持能力

- 手机摄像头权限与实时画面；
- 人体姿态关键点检测；
- Camera Setup 引导；
- 人体是否在有效区域的判断；
- 当前动作的阶段识别；
- 次数统计；
- 少量基础动作问题识别；
- 实时 UI 反馈；
- 可选 TTS 语音反馈；
- 完整 Workout Flow；
- 训练结果页；
- 用户体验验证埋点。

## 5.2 P1 范围

- RPE 1–10 主观强度反馈；
- 基于结构化训练数据的 AI Coach Summary；
- 动作问题在不同轮次之间的趋势比较；
- 实时语音反馈；
- 设备与动作配置后台化；
- Camera Setup 质量评分；
- 训练记录本地保存；
- 用户测试数据导出。

## 5.3 非目标

本 Demo 不实现：

- 重量自动识别；
- Bench 型号自动识别；
- 通用器械物体检测；
- 任意动作自动分类；
- 医疗级或运动科学级动作诊断；
- 关节损伤风险预测；
- 专业生物力学评分；
- 多人识别；
- 多摄像头；
- 云端逐帧视频分析；
- 自动生成长期训练计划；
- 大规模动作库；
- 商业级账号、支付、订阅系统；
- 正式 SunnyFit App 集成。

---

# 6. 产品原则

## 6.1 Camera Session 优先于 Exercise

训练内容的组织方式应是：

```text
Camera Profile
    ↓
兼容该机位的动作集合
    ↓
完整 Workout Template
    ↓
AI Feedback Rules
```

而不是：

```text
先选择动作
    ↓
再要求用户为每个动作重新摆手机
```

## 6.2 当前动作由 Workout Flow 指定

P0 不需要识别“用户正在做哪个动作”。

系统已经知道当前训练步骤，例如：

```json
{
  "current_exercise_id": "seated_dumbbell_curl"
}
```

Pose Engine 只需要判断：

- 当前动作处于哪个阶段；
- 是否完成一次有效重复；
- 是否出现对应动作的规则问题。

这样可以显著降低识别复杂度和误判率。

## 6.3 反馈优先于评分

不要把核心价值做成：

> 动作得分 82 分。

更合适的是：

> 你最后几次开始借力。下一组放慢下降速度，并保持手肘贴近身体。

P0 可以保留内部质量分数用于调试，但默认用户界面不展示综合动作评分。

## 6.4 先保证训练闭环，再增加动作

开发优先级：

```text
完整训练体验
> Camera Setup 稳定
> 次数统计
> 少量准确反馈
> 结果总结
> 更多动作
```

---

# 7. 用户画像与使用场景

## 7.1 目标用户

- Beginner / Intermediate 家庭健身用户；
- 已拥有哑铃和 Bench；
- 想做力量训练，但缺少系统方法；
- 不确定动作是否正确；
- 不想购买昂贵的智能力量设备；
- 愿意使用手机获取指导。

## 7.2 典型场景

用户在 SunnyFit 首页或 AI Coach 中看到推荐：

```text
AI Bench Dumbbell Upper Body
15 min · Beginner
Equipment: Dumbbells + Bench

I’ll count your reps and guide your form.
```

用户点击 Start 后：

1. 确认器械；
2. 授权摄像头；
3. 按照示意摆放 Bench 和手机；
4. 系统确认人体位置；
5. 用户完成整组训练；
6. 系统给出训练结果和下一次建议。

---

# 8. Demo 训练定义

## 8.1 对外名称

**AI Bench Dumbbell Upper Body Starter**

## 8.2 内部定位

这是一组用于验证 Camera Profile 和 AI Coach 体验的上肢入门训练，主要覆盖：

- 背部拉；
- 肩部推；
- 肱二头肌；
- 肩部外展控制。

注意：

P0 动作组合并不代表完整的长期上肢增肌计划，胸部、肱三头肌等训练将在后续 Camera Profile 中补充。本 Demo 优先验证手机固定机位与动作指导价值。

## 8.3 训练时长

目标时长：约 12–15 分钟，不含首次 Camera Setup。

## 8.4 训练结构

```text
训练准备                         30–60 秒
热身                             90 秒
主训练 Round 1                   4–5 分钟
轮间休息                         45–60 秒
主训练 Round 2                   4–5 分钟
结束放松                         60–90 秒
训练结果                         1–2 分钟
```

## 8.5 热身

### 动作 A：坐姿肩部环绕

- 时长：30 秒；
- 目的：进入训练状态，确认肩部关键点跟踪稳定；
- 不统计次数；
- 反馈：只提供开始和结束提醒。

### 动作 B：坐姿无负重肩胛后缩

- 次数：8 次；
- 目的：让用户理解肩背发力；
- 作为 Pose Tracking 校准动作；
- P0 可仅播放示范，不做动作纠正。

## 8.6 主训练

每轮包含：

| 顺序 | 动作 | 目标 |
|---|---|---|
| 1 | 单手扶凳哑铃划船 | 8–10 次 / 侧 |
| 2 | 坐姿哑铃肩推 | 8–10 次 |
| 3 | 坐姿哑铃弯举 | 10 次 |
| 4 | 坐姿哑铃侧平举 | 8–10 次 |

共 2 轮。

动作之间休息 20–30 秒；轮间休息 45–60 秒。

## 8.7 动作顺序设计原因

1. 所有动作围绕同一张 Bench 完成；
2. 手机保持竖屏、固定距离和固定角度；
3. 用户只改变自己在 Bench 上或 Bench 旁的位置；
4. 不要求调整 Bench 角度；
5. 划船、肩推、弯举、侧平举可以在同一 Camera Profile 下覆盖；
6. 动作强度适合 Beginner / Intermediate；
7. 每个动作都有较明确的次数和基础姿态反馈价值。

---

# 9. Camera Profile 与空间设置

## 9.1 推荐设置

- 手机：竖屏；
- 手机高度：约腰部至胸部高度；
- 手机距离：约 2–3 米，实际由画面检测决定；
- 机位：Bench 前侧 30–45°；
- Bench 长边与镜头方向形成约 30–45°；
- 用户和 Bench 必须位于屏幕引导区域内；
- 用户头部到膝盖以下区域尽量完整进入画面。

## 9.2 为什么不是单纯“上半身模式”

单手扶凳哑铃划船需要观察：

- 肩部；
- 手肘；
- 手腕；
- 髋部；
- 躯干旋转；
- 膝部或下肢支撑位置。

因此 P0 推荐使用“头部至膝下”的 Portrait Bench Profile，而不是只截取腰部以上。

## 9.3 Bench 锚点

Bench 在 Demo 中承担两种作用：

1. 训练设备；
2. 用户在摄像头画面中的空间锚点。

页面应通过半透明引导区域展示：

```text
[手机画面]

  用户活动区域
       ↓
 ┌───────────┐
 │           │
 │   Bench   │
 │           │
 └───────────┘
```

P0 不要求使用物体检测自动识别 Bench。可以通过：

- Bench 摆放示意；
- 画面引导框；
- 用户手动确认；
- 人体关键点是否在预期区域；

完成 Camera Setup。

“Bench detected” 不应作为 P0 必须条件，除非实际测试证明已有方案足够稳定且实现成本低。

---

# 10. Camera Setup 用户流程

## 10.1 页面 A：训练与器械确认

标题：

> AI Bench Dumbbell Upper Body

展示：

- 约 15 min；
- Beginner；
- Dumbbells；
- Bench；
- Portrait Camera Required。

CTA：

> Set Up Camera

## 10.2 页面 B：摄像头与隐私说明

说明：

- 摄像头用于实时动作识别；
- P0 默认不上传、不保存原始视频；
- 仅处理姿态关键点和训练数据；
- 用户可以随时退出。

CTA：

> Allow Camera

异常：

- 权限被拒绝；
- 浏览器不支持；
- 摄像头被其他应用占用。

## 10.3 页面 C：摆放指导

标题：

> Set Up Your Phone

文案：

> Place your phone 6–10 ft away at a 30–45° angle from your bench.

展示：

- 手机位置；
- Bench 位置；
- 用户位置；
- 竖屏方向；
- 推荐高度。

CTA：

> Check My Setup

## 10.4 页面 D：实时 Camera Validation

检测项：

### P0 必须

- 检测到一个人体；
- 关键点置信度达到最低要求；
- 肩、肘、腕、髋和至少一侧膝部可见；
- 人体位于有效区域；
- 画面在连续若干帧内保持稳定；
- 画面不过暗；
- 不存在明显多人干扰。

### 建议状态

```text
✓ Body detected
✓ Key joints visible
✓ Good distance
✓ Camera stable
```

### 失败提示

| 问题 | 提示 |
|---|---|
| 人体太近 | Step back so I can see more of your body. |
| 人体太远 | Move a little closer. |
| 关键点缺失 | Keep your shoulders, hands and hips in view. |
| 光线不足 | Move to a brighter area. |
| 多人进入 | Make sure only one person is in the training area. |
| 手机不稳定 | Keep your phone on a stable surface. |

### 成功状态

> Camera Ready  
> Your coach can see your movement.

CTA：

> Start Workout

---

# 11. Workout Runtime 界面

## 11.1 页面结构

推荐以摄像头画面作为主背景。

### 顶部

- 当前进度：Round 1 / 2；
- 已训练时间；
- 暂停；
- 退出。

### 中部

- 人体识别画面；
- P0 用户模式可隐藏完整骨架，只显示轻量关键点或轮廓；
- Developer Mode 可显示骨架、关节角度和置信度。

### 底部

- 当前动作名称；
- 当前侧：Left / Right；
- 当前次数：6 / 10；
- 当前状态：Ready / Lift / Lower；
- AI Coach 提示气泡；
- 下一动作提示。

## 11.2 训练状态

```text
PREPARE
    ↓
POSITION_CHECK
    ↓
COUNTDOWN
    ↓
ACTIVE_SET
    ↓
SET_COMPLETE
    ↓
REST_OR_SIDE_SWITCH
    ↓
NEXT_EXERCISE
```

## 11.3 动作切换

系统应明确告诉用户：

- 下一动作；
- 是否需要坐下、站到 Bench 一侧或切换左右手；
- 是否需要拿起或放下哑铃；
- 休息剩余时间。

用户只调整身体位置，不调整手机。

---

# 12. 动作详细需求

# 12.1 单手扶凳哑铃划船

## 动作 ID

`supported_dumbbell_row`

## 推荐 P0 变体

优先选择：

> 一手扶 Bench、双脚落地的单臂哑铃划船。

相比“一手一膝跪 Bench”，该变体：

- 左右换侧更容易；
- 用户不需要绕到 Bench 另一侧太多；
- 在固定竖屏机位中更容易保持关键点可见；
- 更适合 Demo 调试。

“一手一膝跪 Bench”可作为 P1 变体。

## 关键点

- shoulder；
- elbow；
- wrist；
- hip；
- knee；
- torso orientation。

## 动作阶段

```text
START:
手臂接近伸直，哑铃位于肩部下方

PULL:
肘部向后移动，腕部向躯干靠近

PEAK:
肘部达到后侧高点

LOWER:
手臂受控返回

REP_COMPLETE:
从 START → PEAK → START 完成一次
```

## 次数规则

- 需要通过连续帧确认阶段；
- 不允许单帧角度变化直接计次；
- 进入 PEAK 后必须返回 START 才计 1 次；
- 关键点置信度不足时不计次。

## P0 Form Rules

### 规则 A：明显躯干旋转

Issue Code：

`torso_rotation`

反馈：

> Keep your chest steady and avoid rotating with the weight.

说明：

只判断明显、连续的旋转，不尝试诊断轻微自然活动。

### 规则 B：肘部路径偏离

Issue Code：

`elbow_path_out`

反馈：

> Pull your elbow back toward your hip.

### 规则 C：回落过快

Issue Code：

`fast_eccentric`

反馈：

> Slow down the lowering phase.

## 不判断

- 肩胛肌肉是否真正参与；
- 背部是否“发力正确”；
- 哑铃重量是否合理；
- 脊柱细微中立位；
- 疼痛或损伤风险。

---

# 12.2 坐姿哑铃肩推

## 动作 ID

`seated_dumbbell_shoulder_press`

## 关键点

- left/right shoulder；
- left/right elbow；
- left/right wrist；
- hip；
- torso orientation。

## 动作阶段

```text
START:
哑铃位于肩部附近，手肘弯曲

PRESS:
手腕和手肘向上移动

TOP:
手臂接近伸展

LOWER:
回到肩部附近

REP_COMPLETE:
START → TOP → START
```

## P0 Form Rules

### 规则 A：明显后仰

Issue Code：

`torso_lean_back`

反馈：

> Stay tall and avoid leaning back as you press.

### 规则 B：左右不同步

Issue Code：

`asymmetric_press`

反馈：

> Try pressing both dumbbells together.

### 规则 C：动作幅度明显不足

Issue Code：

`limited_range`

反馈：

> Lower a little more before your next press.

## 不判断

- 肩峰撞击风险；
- 精确肘部安全角度；
- 是否应该锁肘；
- 负重是否过重。

---

# 12.3 坐姿哑铃弯举

## 动作 ID

`seated_dumbbell_curl`

## 关键点

- shoulder；
- elbow；
- wrist；
- hip；
- torso orientation。

## 动作阶段

```text
START:
手臂接近伸直

CURL:
手腕向肩部靠近

TOP:
肘部保持弯曲，手腕达到高点

LOWER:
受控返回

REP_COMPLETE:
START → TOP → START
```

## P0 Form Rules

### 规则 A：肘部明显前移

Issue Code：

`elbow_drift_forward`

反馈：

> Keep your elbows close to your sides.

### 规则 B：身体摆动借力

Issue Code：

`torso_swing`

反馈：

> Slow down and let your arms do the work.

### 规则 C：下降过快

Issue Code：

`fast_eccentric`

反馈：

> Control the lowering phase.

---

# 12.4 坐姿哑铃侧平举

## 动作 ID

`seated_dumbbell_lateral_raise`

## 关键点

- shoulder；
- elbow；
- wrist；
- torso orientation。

## 动作阶段

```text
START:
双臂位于身体两侧

RAISE:
手肘和手腕向两侧抬起

TOP:
手肘接近肩部高度

LOWER:
双臂受控回到身体两侧

REP_COMPLETE:
START → TOP → START
```

## P0 Form Rules

### 规则 A：抬得明显过高

Issue Code：

`raise_too_high`

反馈：

> Stop around shoulder height, then control down.

### 规则 B：明显躯干摆动

Issue Code：

`torso_swing`

反馈：

> Keep your body still and use a lighter, controlled motion.

### 规则 C：节奏过快

Issue Code：

`movement_too_fast`

反馈：

> Slow the movement down and stay in control.

## 谨慎项

“耸肩”仅依靠 2D Pose 很容易误判。P0 不应把 `shoulder_shrug` 设为必须完成的规则，除非测试后证明可通过关键点相对位置稳定判断。

---

# 13. 反馈策略

## 13.1 核心原则

AI Coach 不是持续报错器。

反馈应满足：

- 准确优先；
- 可执行；
- 简短；
- 不重复；
- 不打断动作节奏；
- 一次只说一个重点；
- 优先解决持续出现的问题。

## 13.2 反馈类型

### A. Setup Feedback

用于 Camera Setup 和动作起始位置。

例如：

- Step a little farther back.
- Keep both hands in view.
- Turn slightly toward the camera.

### B. Rep / Milestone Feedback

例如：

- 5 reps.
- Two more.
- Set complete.
- Switch sides.

### C. Correction Feedback

只有同一问题连续出现时触发。

### D. Positive Feedback

例如：

- Nice control.
- Good pace.
- Much steadier this round.

### E. Transition Feedback

例如：

- Next: seated shoulder press.
- Take 30 seconds to rest.

## 13.3 纠正触发规则

建议：

```text
第一次检测到：
仅记录

连续第二次检测到：
提高 issue confidence

连续第三次或在滑动时间窗内重复达到阈值：
触发反馈
```

触发后进入冷却：

- 同一问题 10–20 秒内不重复；
- 同一组最多对同一问题提示 1–2 次；
- 如果用户已明显调整，不再提示。

## 13.4 反馈优先级

```text
Camera / Pose Lost
> 动作安全相关的明显基础问题
> 当前动作主要纠正点
> 次数与组完成
> 正向鼓励
```

P0 不应使用“危险”“受伤”等强医疗措辞。

## 13.5 实时反馈实现

P0 推荐：

```text
Issue Code
    ↓
预定义 Coach Copy
    ↓
UI Bubble
    ↓
可选本地或系统 TTS
```

不要在实时反馈链路中调用 LLM。

原因：

- 延迟不可控；
- 输出可能过长；
- 表达不稳定；
- 成本高；
- 网络异常会破坏训练；
- 同一 Issue 应提供一致指导。

## 13.6 训练后 LLM 使用

训练完成后，可以把结构化数据发送给 LLM：

```json
{
  "workout_id": "bench_dumbbell_upper_body_beginner",
  "completed": true,
  "rounds_completed": 2,
  "exercise_results": [],
  "dominant_issues": [],
  "improvements": [],
  "rpe": 6
}
```

LLM 只负责把确定事实转化为简短 Coach Insight，不得新增未检测到的动作问题。

---

# 14. Workout Result

## 14.1 目标

训练结果页需要回答：

1. 我完成了什么？
2. 我在哪个动作上控制得更好？
3. 哪一个问题最值得下次注意？
4. 下一次应该怎么做？

## 14.2 页面结构

### Achievement

```text
Workout Complete
2 rounds · 14 min
```

### Exercise Summary

```text
Supported Row        36 reps
Shoulder Press       18 reps
Seated Curl          20 reps
Lateral Raise        18 reps
```

### Coach Insight

示例：

> Your shoulder press became steadier in the second round. Next time, keep the same weight and focus on lowering with control.

### One Improvement Focus

示例：

> Next focus: keep your torso still during curls.

### RPE

沿用 SunnyFit 当前 Workout Result 的 1–10 RPE 机制：

> Tell me how this session felt.

RPE 可作为后续推荐重量、次数和训练强度的辅助信号，但 P0 不需要自动调整重量。

### CTA

- Done
- Try Again
- View Next Workout（P1）

## 14.3 结果生成规则

结果必须来自真实结构化数据。

禁止：

- 根据动作名称编造“进步”；
- 根据次数直接推断力量增长；
- 把单次识别误差包装成专业结论；
- 使用医疗诊断语言。

---

# 15. 数据模型

## 15.1 Camera Profile

```json
{
  "camera_profile_id": "portrait_bench_45_full",
  "orientation": "portrait",
  "view_angle": {
    "min_degree": 30,
    "max_degree": 45
  },
  "body_visibility": "head_to_below_knee",
  "required_landmarks": [
    "shoulders",
    "elbows",
    "wrists",
    "hips",
    "at_least_one_knee"
  ],
  "equipment_context": [
    "dumbbells",
    "bench"
  ],
  "phone_reposition_required": false
}
```

## 15.2 Exercise Schema

```json
{
  "exercise_id": "seated_dumbbell_curl",
  "display_name": "Seated Dumbbell Curl",
  "camera_profile_id": "portrait_bench_45_full",
  "equipment": [
    "dumbbells",
    "bench"
  ],
  "body_position": "seated",
  "training_role": [
    "upper_body",
    "arms",
    "pull_accessory"
  ],
  "sides": "bilateral",
  "rep_target": 10,
  "state_machine": {
    "states": [
      "ready",
      "start",
      "concentric",
      "peak",
      "eccentric"
    ]
  },
  "form_rules": [
    {
      "issue_code": "elbow_drift_forward",
      "severity": "coaching",
      "min_consecutive_occurrences": 3,
      "cooldown_seconds": 15,
      "message_key": "coach_curl_keep_elbows_still"
    }
  ]
}
```

## 15.3 Workout Template

```json
{
  "workout_id": "bench_dumbbell_upper_body_beginner",
  "display_name": "AI Bench Dumbbell Upper Body Starter",
  "goal": "strength",
  "level": "beginner",
  "duration_minutes": 15,
  "camera_profile_id": "portrait_bench_45_full",
  "equipment": [
    "dumbbells",
    "bench"
  ],
  "rounds": 2,
  "blocks": [
    {
      "type": "warmup",
      "items": [
        {
          "exercise_id": "seated_arm_circle",
          "duration_seconds": 30
        },
        {
          "exercise_id": "seated_scapular_retraction",
          "reps": 8
        }
      ]
    },
    {
      "type": "main",
      "repeat": 2,
      "items": [
        {
          "exercise_id": "supported_dumbbell_row",
          "reps": 8,
          "per_side": true
        },
        {
          "exercise_id": "seated_dumbbell_shoulder_press",
          "reps": 8
        },
        {
          "exercise_id": "seated_dumbbell_curl",
          "reps": 10
        },
        {
          "exercise_id": "seated_dumbbell_lateral_raise",
          "reps": 8
        }
      ]
    }
  ]
}
```

## 15.4 Runtime Event

```json
{
  "session_id": "session_001",
  "timestamp_ms": 123456,
  "exercise_id": "seated_dumbbell_curl",
  "exercise_phase": "eccentric",
  "rep_count": 6,
  "pose_confidence": 0.88,
  "issue_codes": [
    "elbow_drift_forward"
  ],
  "feedback_triggered": false
}
```

## 15.5 Workout Result

```json
{
  "session_id": "session_001",
  "workout_id": "bench_dumbbell_upper_body_beginner",
  "duration_seconds": 840,
  "completed": true,
  "rounds_completed": 2,
  "exercise_results": [
    {
      "exercise_id": "seated_dumbbell_curl",
      "target_reps": 20,
      "counted_reps": 19,
      "dominant_issue": "elbow_drift_forward",
      "issue_count": 4,
      "round_trend": "improved"
    }
  ],
  "rpe": 6
}
```

---

# 16. 推荐技术架构

```text
Mobile Camera
    ↓
Pose Detection
    ↓
Landmark Smoothing / Visibility Check
    ↓
Current Exercise State Machine
    ↓
Rep Counter
    ↓
Rule-based Form Analysis
    ↓
Feedback Scheduler
    ↓
UI + Optional TTS
    ↓
Workout Session Manager
    ↓
Structured Workout Result
    ↓
Optional LLM Coach Summary
```

## 16.1 模块职责

### Camera Layer

- 请求摄像头权限；
- 选择前后摄像头；
- 竖屏画面；
- 处理设备旋转；
- 控制帧率；
- 不默认保存视频。

### Pose Engine

- 输出关键点坐标；
- 输出置信度；
- 对关键点进行平滑；
- 标识关键点缺失；
- 不承担动作业务逻辑。

### Exercise State Machine

- 知道当前动作；
- 根据关键点判断动作阶段；
- 管理迟滞阈值；
- 防止一次动作重复计数。

### Form Rule Engine

- 输入连续姿态特征；
- 输出 Issue Code 和 Confidence；
- 规则参数配置化；
- 不直接生成自然语言。

### Feedback Scheduler

- 合并重复问题；
- 决定是否提示；
- 管理优先级和冷却时间；
- 避免 TTS 重叠。

### Workout Session Manager

- 管理热身、动作、组、轮、休息、左右切换；
- 记录训练状态；
- 处理暂停、退出和恢复；
- 输出训练结果。

### Coach Summary

- 输入结构化训练结果；
- 输出短总结；
- 不允许扩展未检测事实。

---

# 17. 开源项目与技术参考

## 17.1 主参考项目

### RealTime-Voice-Video-AI-Gym-Coach

Repository：

https://github.com/nakulcharak002/RealTime-Voice-Video-AI-Gym-Coach

截至本需求整理时，该项目 README 描述的主要能力包括：

- Python + Streamlit；
- Streamlit WebRTC；
- MediaPipe；
- OpenCV；
- 实时姿态检测；
- 33 个身体关键点；
- 次数统计；
- 基础姿态纠正；
- Groq API；
- gTTS；
- 支持 Squat、Push-up、Biceps Curl、Shoulder Press、Lunge；
- 按动作拆分 detector；
- README 声明 MIT License。

### 参考价值

可以重点参考：

1. 视频输入与实时帧处理流程；
2. MediaPipe Pose 接入方式；
3. Base Exercise 抽象；
4. 按动作拆分 Detector 的结构；
5. 关节角度计算；
6. 动作状态机和次数统计；
7. 实时反馈与 TTS 管线；
8. Streamlit WebRTC Demo 快速运行方式。

### 不应直接照搬

该项目更接近单动作技术展示，SunnyFit Demo 还需要增加：

- 手机竖屏体验；
- Camera Profile；
- Bench 空间锚点；
- 完整 Workout Session；
- 左右侧切换；
- Exercise / Workout Schema；
- 反馈冷却与优先级；
- 训练结果；
- RPE；
- SunnyFit AI Coach 风格；
- 手机端性能与布局适配；
- 隐私说明；
- 埋点与验证指标。

### License 注意

虽然 README 声明 MIT License，Qoder 在复制或改造代码前仍需：

1. 检查仓库是否实际包含 LICENSE 文件；
2. 确认 LICENSE 内容与 README 一致；
3. 保留必要版权与 License 声明；
4. 检查依赖库各自 License；
5. 在交付文档中列出复用代码和来源。

## 17.2 MediaPipe

Repository：

https://github.com/google-ai-edge/mediapipe

参考页面：

https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/pose.md

MediaPipe Pose / Pose Landmarker 可输出全身关键点。官方资料描述其 Pose 方案可以从 RGB 视频中推断 33 个 3D landmarks，并针对手机、桌面和 Web 的实时使用进行设计。

### 推荐用途

- P0 首选 Pose Engine；
- 适合需要肩、肘、腕、髋、膝等较多关键点的 Bench 动作；
- 支持移动端和 Web 验证；
- 可以作为当前开源项目的延续方案。

## 17.3 MoveNet

TensorFlow examples：

https://github.com/tensorflow/examples/tree/master/lite/examples/pose_estimation

TensorFlow.js MoveNet：

https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/src/movenet/README.md

MoveNet 提供 17 个身体关键点，常见变体包括：

- Lightning：优先低延迟；
- Thunder：优先准确度。

### 推荐用途

- 作为性能或兼容性备选方案；
- 用于对比不同手机上的帧率、延迟和稳定性；
- 如果 MediaPipe 在目标设备上性能不足，可以评估 MoveNet Lightning。

## 17.4 TensorFlow.js Pose Detection

Repository：

https://github.com/tensorflow/tfjs-models/tree/master/pose-detection

该包提供 MoveNet、BlazePose、PoseNet 等模型的统一 Web 接口，适合作为移动浏览器 Demo 的参考。

## 17.5 技术选型建议

### 路线 A：最快复用验证

```text
Fork 现有 Python / Streamlit 项目
+ 增加 SunnyFit Workout Flow
+ 增加 Dumbbell + Bench Detectors
+ 手机浏览器访问 Streamlit WebRTC
```

优点：

- 开发快；
- 可复用已有结构；
- 容易验证动作状态机和反馈逻辑。

风险：

- Streamlit 手机竖屏布局可能不理想；
- 移动浏览器摄像头兼容性需要验证；
- Python 服务端处理可能增加延迟；
- 不代表正式 App 架构。

### 路线 B：更贴近真实手机体验

```text
React / Vite Mobile Web
+ getUserMedia
+ MediaPipe Tasks Vision 或 TF.js Pose Detection
+ 浏览器端状态机和规则引擎
+ 可选轻量后端生成训练总结
```

优点：

- 更接近真实手机使用；
- 竖屏 UI 更可控；
- 可将 Pose 推理留在设备端；
- 延迟和隐私表现更好；
- 后续更容易迁移到 App。

风险：

- 初始开发量更大；
- 需要重新实现部分现有项目能力。

### 推荐决策方式

Qoder 不应直接默认选择路线。

第一步先做 0.5–1 天技术 Spike：

1. 在手机上运行原项目；
2. 验证竖屏摄像头；
3. 验证 MediaPipe 帧率；
4. 验证 10 分钟连续运行；
5. 验证 TTS；
6. 评估 UI 可改造性。

如果手机端体验无法满足核心约束，则：

- 保留原项目的 detector、state machine 和反馈思路；
- 将运行时迁移到 Mobile Web。

---

# 18. Qoder 执行要求

## 18.1 第一阶段：仓库评估

先分析：

https://github.com/nakulcharak002/RealTime-Voice-Video-AI-Gym-Coach

输出：

`docs/repository_assessment.md`

内容至少包括：

- 目录结构；
- 入口文件；
- Camera / WebRTC 流程；
- Pose Engine；
- Exercise Detector 抽象；
- Rep Counter；
- Feedback / TTS；
- 状态管理；
- 数据保存；
- 可复用模块；
- 必须重构模块；
- 手机端风险；
- License 检查；
- 推荐路线 A 或 B。

## 18.2 第二阶段：技术 Spike

必须在真实手机上验证：

- iOS Safari 或 Chrome；
- Android Chrome；
- 竖屏画面；
- 摄像头权限；
- 前后摄像头；
- 关键点检测；
- 连续运行；
- 基础帧率；
- 设备发热；
- 浏览器切后台再回来；
- 网络断开时的行为。

输出：

`docs/mobile_spike_report.md`

## 18.3 第三阶段：架构与 Schema

输出：

- `docs/architecture.md`
- `configs/camera_profiles.json`
- `configs/exercises.json`
- `configs/workouts.json`
- `configs/coach_messages.json`

要求：

- 动作阈值配置化；
- 反馈文案配置化；
- 不在 UI 中硬编码状态；
- Camera Profile 可扩展；
- 训练模板可扩展。

## 18.4 第四阶段：P0 开发

实现顺序：

1. Camera permission；
2. Portrait camera runtime；
3. Pose Detection；
4. Camera Validation；
5. Workout Session Manager；
6. Seated Curl；
7. Shoulder Press；
8. Lateral Raise；
9. Supported Row；
10. Feedback Scheduler；
11. Result Screen；
12. Analytics log；
13. Mobile UX tuning。

建议先实现 Curl 和 Shoulder Press，因为动作阶段更容易稳定；Supported Row 放在后面。

## 18.5 第五阶段：测试与调参

每个动作至少使用：

- 不同身高；
- 不同体型；
- 不同衣着；
- 不同哑铃尺寸；
- 明暗两种光线；
- 至少两种手机性能档位；
- 左右侧；
- 正确和刻意错误动作。

阈值不能只基于单个开发者样本。

---

# 19. 工程交付物

建议交付结构：

```text
sunnyfit-ai-strength-coach-demo/
├── README.md
├── docs/
│   ├── repository_assessment.md
│   ├── mobile_spike_report.md
│   ├── architecture.md
│   ├── test_plan.md
│   └── known_limitations.md
├── configs/
│   ├── camera_profiles.json
│   ├── exercises.json
│   ├── workouts.json
│   └── coach_messages.json
├── src/
│   ├── camera/
│   ├── pose/
│   ├── exercises/
│   ├── rules/
│   ├── feedback/
│   ├── workout/
│   ├── result/
│   └── analytics/
├── tests/
│   ├── unit/
│   ├── fixtures/
│   └── manual/
└── third_party/
    └── NOTICE.md
```

README 必须包含：

- 安装方式；
- 启动方式；
- 手机访问方式；
- 环境变量；
- 当前支持动作；
- 当前已知限制；
- 隐私说明；
- 开源依赖和 License。

---

# 20. 埋点与日志

## 20.1 关键事件

| Event | 说明 |
|---|---|
| `ai_strength_demo_view` | 进入 Demo |
| `ai_strength_equipment_confirm` | 确认 Dumbbells + Bench |
| `ai_strength_camera_permission_result` | 摄像头授权结果 |
| `ai_strength_camera_setup_start` | 开始摆放 |
| `ai_strength_camera_setup_result` | Setup 成功或失败 |
| `ai_strength_workout_start` | 开始训练 |
| `ai_strength_exercise_start` | 开始动作 |
| `ai_strength_rep_counted` | 计次 |
| `ai_strength_issue_detected` | 检测问题 |
| `ai_strength_feedback_triggered` | 实际触发反馈 |
| `ai_strength_set_complete` | 完成一组 |
| `ai_strength_exercise_complete` | 完成动作 |
| `ai_strength_workout_pause` | 暂停 |
| `ai_strength_workout_exit` | 中途退出 |
| `ai_strength_workout_complete` | 完成训练 |
| `ai_strength_rpe_submit` | 提交 RPE |
| `ai_strength_usefulness_submit` | 提交体验评价 |

## 20.2 公共属性

```text
session_id
device_model
os
browser
camera_profile_id
exercise_id
workout_id
pose_engine
avg_fps
avg_pose_confidence
feedback_latency_ms
setup_duration_seconds
exit_stage
```

## 20.3 调试日志

Developer Mode 需要输出：

- 原始 landmark confidence；
- 平滑后特征；
- 当前 state；
- rep transition；
- issue confidence；
- feedback cooldown；
- FPS；
- inference time。

默认用户模式不展示这些信息。

---

# 21. 异常与降级

## 21.1 Pose 丢失

短暂丢失：

- 暂停计次；
- 不立即打断；
- 1–2 秒后恢复。

持续丢失：

> I can’t see your movement clearly. Return to the marked area.

## 21.2 关键点被哑铃或 Bench 遮挡

- 不计次；
- 不输出动作错误；
- 提示用户轻微调整身体朝向；
- 不要求移动手机，除非 Camera Setup 从根本上失败。

## 21.3 多人进入画面

- 暂停识别；
- 提示保持训练区域只有一人。

## 21.4 TTS 失败

- UI 文案继续显示；
- 训练不中断。

## 21.5 LLM 总结失败

使用规则化 fallback：

> Great job completing your workout. Your reps were more controlled in the second round. Keep the same weight next time and focus on steady movement.

## 21.6 网络断开

如果 Pose 和规则在本地：

- 训练继续；
- 结果暂存在本地；
- LLM Summary 降级。

如果采用服务端 Pose：

- 明确提示连接异常；
- 提供无识别跟练模式，或允许结束训练；
- 不应静默继续错误计次。

## 21.7 用户提前退出

弹窗：

> End this workout?  
> Your completed reps will be saved for this session.

Demo 可仅本地保存。

---

# 22. 安全与隐私要求

## 22.1 产品声明

本 Demo 提供一般性健身指导，不提供医疗诊断。

用户出现疼痛、胸闷、头晕或明显不适时，应停止训练并寻求专业建议。

## 22.2 视频隐私

P0 推荐：

- 原始视频只在设备或当前实时会话中处理；
- 默认不保存；
- 默认不上传；
- 如技术路线需要上传帧，必须在 Demo 中明确说明；
- 测试录屏需要用户单独同意；
- 日志中不存储原始图像。

## 22.3 数据最小化

仅记录：

- 关键点；
- 次数；
- 动作阶段；
- Issue Code；
- 反馈事件；
- 训练结果；
- 性能日志。

---

# 23. 技术验收标准

## 23.1 Camera Setup

- 80% 以上测试用户可在 90 秒内完成 Setup；
- Setup 成功后，整个训练不需要移动手机；
- 90% 以上完整训练无需重新定位手机；
- 对太近、太远、关键点缺失有明确提示。

## 23.2 Pose 与性能

- 目标手机上画面可持续运行 10–15 分钟；
- 平均 FPS 和推理耗时必须记录；
- UI 不出现严重卡顿；
- 关键点短暂丢失不会误计次；
- 设备发热和耗电记录在测试报告中。

不强制统一 FPS 门槛，但建议目标：

- 中档设备有效处理帧率 ≥ 15 FPS；
- 高档设备 ≥ 20 FPS。

## 23.3 次数统计

整体目标：

- P0 每个动作测试集的 Rep Counting Accuracy ≥ 80%；
- Curl、Shoulder Press 目标 ≥ 85%；
- 不完整动作不应大量误计；
- 切换左右侧时计数正确分开。

## 23.4 反馈

- 反馈 UI 延迟目标 < 1 秒；
- TTS 开始播放目标 < 1.5 秒；
- 同一问题不会连续重复播报；
- 反馈只能基于已确认 Issue Code；
- 人工复核中，明显错误反馈比例目标 < 20%。

## 23.5 Workout Flow

- 可以完成热身、两轮主训练和结果页；
- 暂停和恢复可用；
- 动作切换清楚；
- 退出有明确处理；
- 结果页数据与训练过程一致。

---


# 26. 风险与待确认问题

## 26.1 Camera Profile 是否真的覆盖全部动作

需要真实测试确认：

- Supported Row 的髋、肘、腕是否同时可见；
- 坐姿动作是否仍能保持头部到膝部进入画面；
- 左右换侧是否会造成遮挡；
- Bench 位置是否影响关键点。

若一个 Camera Profile 无法稳定覆盖全部动作，应优先：

1. 调整动作变体；
2. 调整用户站位；
3. 拆成两个独立 Workout；

而不是要求同一训练中频繁移动手机。

## 26.2 Bench 是否需要物体检测

当前建议 P0 不做。

只有在以下条件成立时再增加：

- 对 Setup 成功率有明显帮助；
- 有稳定轻量模型；
- 不显著影响手机性能；
- 不增加过多调试成本。

## 26.3 侧平举耸肩识别

2D Pose 对肩部耸起的判断容易受镜头、体型和关键点误差影响。P0 可先不做，避免制造不可信反馈。

## 26.4 动作组合的训练完整性

P0 主要验证产品交互和技术能力，不应被描述为完整长期增肌计划。后续应增加胸部、肱三头肌和更完整的周计划编排。

## 26.5 LLM 是否必须

实时训练不需要 LLM。

训练结果页可以先使用规则化模板，待结构化数据稳定后再接入 LLM。

---

# 27. 里程碑建议

## Milestone 0：技术评估

- 完成仓库评估；
- 完成 License 检查；
- 完成手机运行 Spike；
- 确认技术路线。

## Milestone 1：单动作闭环

- Camera Setup；
- Pose；
- Seated Curl；
- Rep Counting；
- 单条纠正；
- 手机运行。

## Milestone 2：四动作 Workout

- 四个动作；
- 两轮训练；
- 休息和切换；
- 结果页；
- 无需移动手机。

## Milestone 3：Coach Experience

- Feedback Scheduler；
- TTS；
- 反馈冷却；
- RPE；
- Coach Summary；
- UI 优化。

## Milestone 4：用户验证

- 测试脚本；
- 埋点；
- 8–15 人测试；
- 结果分析；
- Go / No-Go 建议。

---

# 28. Go / No-Go 判断

## Go

满足大部分条件：

- Camera Setup 成功率高；
- 无需移动手机；
- 用户能完成训练；
- 次数统计基本可信；
- 纠正反馈明显有帮助；
- 用户认为比普通视频更有价值；
- 愿意再次使用；
- 手机性能可接受。

## Iterate

存在价值，但：

- 个别动作误差高；
- Camera Setup 较复杂；
- 反馈过多或过少；
- 需要替换动作变体；
- 需要拆分 Camera Profile。

## No-Go

出现以下情况之一：

- 绝大多数用户需要频繁移动手机；
- 关键点遮挡导致多数动作无法稳定识别；
- 错误反馈频繁且破坏信任；
- 手机性能无法支撑；
- 用户认为摆放成本高于指导价值；
- 完整训练体验明显不如普通视频。

---

# 29. 后续扩展方向

## 29.1 Landscape Floor Group

同一横屏低机位下：

- Push-up；
- Knee Push-up；
- Plank；
- Side Plank；
- Mountain Climber；
- Crunch Variations。

## 29.2 Portrait Full Body Dumbbell Group

- Goblet Squat；
- Reverse Lunge；
- Romanian Deadlift；
- Standing Shoulder Press。

## 29.3 Bench Chest Group

可能需要独立 Camera Profile：

- Incline Push-up on Bench；
- Dumbbell Bench Press；
- Incline Dumbbell Press；
- Bench-supported Triceps。

## 29.4 Resistance Band Group

- Band Row；
- Band Pull Apart；
- Band Squat；
- Seated Band Press。

## 29.5 SunnyFit 正式闭环

```text
AI Plan
→ 推荐 AI Guided Strength
→ Camera Setup
→ 完整训练
→ Workout Result
→ RPE
→ Progress
→ 下一次训练调整
```

---

# 30. 给 Qoder 的最终执行提醒

1. **必须先分析开源仓库，再开始改代码。**
2. **必须在真实手机上验证，不以桌面 Webcam Demo 作为完成标准。**
3. **当前动作由 Workout Flow 指定，不做任意动作自动识别。**
4. **实时反馈不调用 LLM。**
5. **所有阈值、动作规则和文案必须配置化。**
6. **Bench 物体检测不是 P0。**
7. **优先做完整训练闭环，不优先扩展动作数量。**
8. **任何动作问题都必须经过连续帧和冷却规则确认。**
9. **不输出医疗诊断或伤害风险结论。**
10. **最终必须输出技术限制和测试证据，不能只展示理想路径。**
11. **核心验收是：用户一次摆好手机，就能完成整组训练。**
12. **Demo 要验证的是 SunnyFit 的 AI Strength Coach 产品价值，而不是证明某个 Pose 模型能运行。**

---

# 31. 参考资料

## SunnyFit 内部背景

- SunnyFit 核心体验：帮助家庭健身用户更容易开始、坚持并看到进步；
- V3.0 新用户流程：当前器械收集包含 Dumbbells、Bands 等配件；
- V3.0 AI Chat：支持 Movement / Course / Free Mode 推荐；
- V3.0 Workout Result：已定义成就、RPE 和 AI Coach Insight；
- SunnyFit AI Engine：建议以结构化决策与 Action 驱动训练闭环。

## 外部开源参考

- RealTime-Voice-Video-AI-Gym-Coach  
  https://github.com/nakulcharak002/RealTime-Voice-Video-AI-Gym-Coach

- MediaPipe  
  https://github.com/google-ai-edge/mediapipe

- MediaPipe Pose documentation  
  https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/pose.md

- TensorFlow Lite Pose Estimation examples  
  https://github.com/tensorflow/examples/tree/master/lite/examples/pose_estimation

- TensorFlow.js Pose Detection  
  https://github.com/tensorflow/tfjs-models/tree/master/pose-detection

- MoveNet documentation  
  https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/src/movenet/README.md
