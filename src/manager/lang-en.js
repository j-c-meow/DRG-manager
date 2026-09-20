/* =========================================================
 * lang-en.js — 由 _i18n_p1/p2/p3 拼接生成（临时脚本已删）
 * ========================================================= */
'use strict';
/* =========================================================
 * 深岩银河 · 17号钻台管理终端 — 英文文案包（i18n 第一批）
 * 载入顺序：game-data.js 之后、state.js 之前（经典 script，全局可见）
 * 设计：
 *   1) TEXT_ZH 快照中文原文；TEXT_EN 覆盖 TEXT 全部键（{xxx} 占位符原样保留）
 *   2) I18N_EN：中文短语/数据名 → 英文（供渲染模板里的 L() 取词）
 *   3) applyLang()：整体切换 + localStorage('drg_lang') + 全量重渲染
 *   4) L(x)：x=对象取 name_en（name_zh 兜底）；x=字符串查 I18N_EN 词表（原文兜底）
 * 官方术语以 locres 语料为准（墨菱石=Morkite、玉石=Jadiz、掠夺虫=Lootbug 等）
 * ========================================================= */

const TEXT_ZH = {};
Object.keys(TEXT).forEach(k => { TEXT_ZH[k] = TEXT[k]; });

const TEXT_EN = {

  /* ================= 1. ui_* 界面文案 ================= */
  ui_main_title: "Space Rig 17",
  ui_main_sub: "DEEP ROCK GALACTIC CORP. /// Management Terminal // Clearance: LEMON",
  ui_main_welcome: "Dig deep, get rich! Another safe day filling up the M.U.L.E.",
  ui_ticker_default: "Corporate directive: stop dancing. Get back to work!",

  ui_mission_title: "Mission Terminal",
  ui_mission_sub: "All prices final — this is not a gift shop.",
  ui_mission_btn_refresh: "Refresh List",
  ui_mission_hazard: "Hazard Level",
  ui_mission_empty: "No contracts on the board. Mission Control says even bugs clock in on schedule — try again shortly.",

  ui_deploy_title: "Dispatch Confirmation",
  ui_deploy_sub: "Please demonstrate judgment worthy of your salary in this very click.",
  ui_deploy_btn: "Dispatch",
  ui_deploy_btn_cancel: "Let Me Think",

  ui_recruit_title: "Recruit Miner",
  ui_recruit_sub: "Attention! New miner incoming via drop pod!",
  ui_recruit_btn: "Recruit",

  ui_recall_title: "Recall Squad",
  ui_recall_btn: "Recall",
  ui_recall_confirm: "Confirm recall? Partial progress is prorated. Management respects your decision — and has already calculated its cost.",

  ui_settle_title: "Settlement Report",
  ui_settle_sub: "Well done, team! Management is very pleased with your performance!",
  ui_settle_sub_fail: "Mission Control reminds you: Management is watching my back right now... Next time, bring the ore home.",
  ui_settle_btn: "Sign Off",

  ui_roster_title: "Staff Terminal",
  ui_roster_sub: "Miners! The humblest and the most noble! — and the most expensive line on HR's spreadsheet.",

  ui_morale_label: "Morale",
  ui_morale_low: "Morale low: output discounted, and requests for voluntary overtime are being declined. Management suggests: buy a round.",
  ui_morale_high: "Morale high: the Employee Satisfaction Report has gone public three years running — and this quarter's numbers look great too.",

  ui_bar_title: "The Abyss Bar",
  ui_bar_sub: "Lloyd is on duty. Open until everyone is happy — minus drunk mining.",
  ui_bar_btn_treat: "Buy a Round",
  ui_bar_btn_close: "Last Call",

  ui_med_title: "Medical Bay",
  ui_med_sub: "Rescue first, charge later; the fee schedule does not accept rescues.",
  ui_med_btn: "Process Discharge",

  ui_gear_title: "Equipment Terminal",
  ui_gear_sub: "Corporate resources must not be squandered — please squander them cost-effectively.",
  ui_gear_btn: "Upgrade License",

  ui_rig_title: "Rig Upgrade",
  ui_rig_sub: "Every level down makes the quarterly report look better — and you contributed a whole point to it.",
  ui_rig_btn: "Upgrade",

  ui_elite_title: "Elite Support Slot",
  ui_elite_sub: "Reclaimers: first into the fray, first out of the fire.",
  ui_elite_btn: "Deploy",
  ui_elite_locked: "Locked: requires Merit points AND campaign progress. Dual authentication.",

  ui_kpi_title: "Key Performance Indicator Terminal",
  ui_kpi_sub: "The quota will not disappear just because you stop looking at it.",

  ui_offline_title: "Return Briefing",
  ui_offline_sub: "Welcome back. While you were away the M.U.L.E. ran the rig. She ran it, technically.",
  ui_offline_btn: "Report In",

  ui_save_ok: "Progress saved into Molly's cargo hold. She is more reliable than you think.",
  ui_save_warn: "Saving. Do not power off — Molly dislikes being unplugged.",

  ui_settings_title: "Settings",
  ui_settings_sub: "All parameters were pre-optimized by Management. Modifications at your own risk.",
  ui_settings_btn_reset: "Reset Save",
  ui_settings_reset_confirm: "Resetting wipes all progress. Sure you want to go again? The miners just got used to your management style.",

  /* ================= 2. med_* ================= */
  med_notice: "Heavy injury notice: {miner} received an overly affectionate hug from a Cave Leech on the job and has been moved to the Medical Bay. Rest assured: at Deep Rock Galactic, no employee is beyond rescue — only bills beyond approval.",
  med_bill: "Hospital bill: {cost} credits, billed over {days} days. Friendly reminder: Red Sugar is corporate property, the sickbed is a paid service, and pain is free of charge.",
  med_discharge: "Discharge summary: diagnosis, full-body bug bites and mild crushing — neither qualifies for sick leave. Doctor's orders: rest {days} days, drink plenty of Red Sugar, avoid bug-heavy contracts.",
  med_psa: "Medical Bay broadcast: every employee on this station is resuscitable. No exceptions. It is one of our core competencies.",
  med_pain: "Ward message board: the bug hurts for a second; the bill hurts until payday. Medical bills hurt more than bugs — this message was unanimously upvoted by all patients.",

  /* ================= 3. ev_* events ================= */
  ev_swarm_title: "Swarm incoming!",
  ev_swarm_desc: "We've got a swarm! Kill them, miners! — Mission Control's exact words. Management adds: whichever option you pick, the ammunition will be billed in full.",
  ev_swarm_a_btn: "Fight Head-On",
  ev_swarm_a_win: "Give them a taste of dwarf! {miner} led the charge, the swarm is cleared, and all yield made it home intact. Management is most pleased.",
  ev_swarm_a_fail: "The head-on fight went badly; someone got slapped into a wall by a Praetorian. Everyone transferred to the Medical Bay — not one dwarf missing, and not one bill missing either.",
  ev_swarm_b_btn: "Hold at the M.U.L.E.",
  ev_swarm_b_result: "The squad collapsed to the Molly line: load, crouch, chant the slogan. Yield settled at the contractual floor; the scratches on Molly's armor are booked as this quarter's depreciation.",

  ev_richvein_title: "Rich vein detected!",
  ev_richvein_desc: "The vein's reserves far exceed the declared amount. Mission Control: fine, fine, we get it, you struck it rich — now get to work! Management is watching my back!",
  ev_richvein_a_btn: "Extended Extraction",
  ev_richvein_a_win: "Extended extraction a roaring success; output far exceeded the filing. Your overtime has been recorded as 'voluntary' — the bonus, however, is real money.",
  ev_richvein_a_fail: "The extra digging disturbed the ceiling; partial cave-in. Equipment and bones were injured together. The wounded are in the Medical Bay; the ore still loads and the shift still runs.",
  ev_richvein_b_btn: "Abandon Vein",
  ev_richvein_b_result: "Wrapped up per the contract. Safety first. Management understands — and has already written this vein into someone else's schedule.",

  ev_leech_title: "Cave Leech in the ceiling!!",
  ev_leech_desc: "{miner} is caught by a Cave Leech and being hauled toward the ceiling. Fun fact: the reason the Cave Leech does not fear you is that you fear it more. Decide quickly.",
  ev_leech_a_btn: "Rescue Now",
  ev_leech_a_win: "Rescue successful! {miner} is back on solid ground, having lost half a mustache and a bit of dignity. Rope and powder are booked as consumables.",
  ev_leech_a_fail: "The rescue was half a beat too slow. {miner} landed knees-first and has been moved to the Medical Bay. Relax: the dwarf will be returned; the bill arrives first.",
  ev_leech_b_btn: "Defer",
  ev_leech_b_result: "Registered and scheduled per procedure. While awaiting scheduling, {miner} received the leech's full service and is now in the Medical Bay, heavily injured — everyone is resuscitable; no bill is exempt.",

  ev_breakdown_title: "Caution! Equipment malfunction!",
  ev_breakdown_desc: "Drill bits overheating, Molly acting up. Page one of the official repair manual: if the Drop Pod will not start — give the drill a good, solid kick.",
  ev_breakdown_a_btn: "Emergency Repair",
  ev_breakdown_a_result: "Emergency repair complete; parts and downtime are booked to this mission's cost. The mechanic's note: what you can fix is a malfunction; what you cannot afford to fix is a budget.",
  ev_breakdown_b_btn: "Run It Broken",
  ev_breakdown_b_result: "The equipment keeps producing through the groans: output discounted, noise over limit, depreciation accelerated. Management has recorded this operation as 'optimistic maintenance.'",

  ev_elite_title: "Careful! Elite bug incoming!",
  ev_elite_desc: "High-value large target detected: the kill bounty is generous, and so is the chance of getting hit. Management makes no decisions — only expectations.",
  ev_elite_a_btn: "Hunt It",
  ev_elite_a_win: "Hunt successful! We're rich! A fat pile of gold is in the bag; Molly's overload alarm sang the whole way home.",
  ev_elite_a_fail: "The hunt failed and the squad regrouped after being scattered. The wounded are in the Medical Bay; the remaining yield is still coming home. Suggestion: bring a different class next time.",
  ev_elite_b_btn: "Go Around",
  ev_elite_b_result: "The squad silently detoured: nobody hurt, nobody distinguished, slightly less yield. Management's comment: caution is also performance — it just pays no bonus.",

  /* ================= 4. kpi_* ================= */
  kpi_issue_1: "Attention all miners: this quarter's Morkite quota has been issued — {quota}. Meet it and earn a bonus of {reward}. You know the procedure: collect Morkite, deposit it in the M.U.L.E., come back together. Easy money. Get moving.",
  kpi_issue_2: "Public service announcement: this quarter's quota is {quota}, bonus {reward}. This is not a request. This is a schedule.",
  kpi_issue_3: "Deep Rock Galactic: together we build the future. Specifically: first we co-build {quota} units of Morkite, then we discuss the future.",

  kpi_success_1: "Quarterly quota met! Management has just approved your performance bonus of {reward} — the original plan was double, but Finance voted no.",
  kpi_success_2: "Quota {quota} met; bonus {reward} deposited. You have contributed to the wealth of Deep Rock Galactic. Management salutes you.",
  kpi_success_3: "Notice of achievement: this quarter's target is complete. All staff receive a {reward} bonus, plus one belated but sincere 'well done.'",

  kpi_fail_1: "Quarterly quota not met. Management expresses regret and notes: next quarter's quota will not be reduced — only increased.",
  kpi_fail_2: "Public service announcement: this quarter's shortfall has been entered into the ledger. Deep Rock Galactic is not a charity, but it never abandons an employee — the Medical Bay and the next quota are both waiting for you.",
  kpi_fail_3: "Mission Control reminds you: Management is watching my back right now. This quarter's {quota} went unmet and the performance score has been docked. Recommended procedure: drink, debrief, dig it back next quarter.",

  /* ================= 5. karl_* ================= */
  karl_bar_toast: "In the late-night Abyss Bar, someone raised a glass to the air: 'To Karl.' Lloyd silently poured one more. Nobody asked why.",
  karl_record: "At the very bottom of the personnel files lies an old page: Karl. Legendary miner. No ID number, no photo, no attendance record. Management's note: no such person. Back to digging.",

  /* ================= 6. egg_* ================= */
  egg_load_1: "You know the procedure: collect the Morkite, deposit it in the M.U.L.E., and come back together. Easy money. Get moving.",
  egg_load_2: "Loading. Molly is crossing a cavern; do not rush her. She does not respond to that.",
  egg_load_3: "Tip: Red Sugar extends your life, but not your deadline.",
  egg_load_4: "For Cave Leeches, remember the three 'always': always watch the ceiling, always light the way, always shoot it down immediately.",

  egg_insurance_1: "Disclaimer: this rig's insurance does not cover rock crush, bug bites, falls, or 'emotional distress caused by a M.U.L.E. blocking the path.'",
  egg_insurance_2: "Public service announcement: rumors of hidden rooms inside the launch bay are unfounded. Please stop looking.",

  egg_psa_1: "Public service announcement: Management wishes to reiterate that drunk mining violates corporate policy! — enjoy your drinks tonight.",
  egg_psa_2: "Public service announcement: personal hygiene matters. Bathe at least once every 30 days. This is a hard KPI.",

  egg_rig_1: "Rig upgrade complete. Deep Rock Galactic: together toward a brighter future.",
  egg_rig_2: "The rig has reached a new stratum. Management salutes you, and extends sincere apologies to the stratum.",

  egg_bar_1: "Today's feature at the Abyss Bar: Dark Morkite Ale — the beer dwarfs can't quit!",
  egg_bar_2: "(whispering) Can I have a Leaf Lover's Special? — said employee has been enrolled in next week's 'Corporate Culture Re-education.'",

  egg_slogan: "Shout the slogan and every dwarf is your brother. Dig deep, get rich!",
  egg_molly: "A miner's heart: normally Molly gives me a headache. Now that she's gone — I actually miss her! Corporate reminder: Molly is company property. Do not form attachments.",
  egg_career: "Anonymous suggestion box: does anyone else feel this job is mostly suffering? — Your feedback has been forwarded to the Psychology Assessment Department. Thank you for writing in.",


  /* ================= 7. ev_*(梗) 社区梗事件扩展包 ================= */
  ev_mushroom_title: "Giant luminous mushroom detected!",
  ev_mushroom_desc: "Laser pointer beams cross into a man-made aurora. Mission Control pauses, then asks: 'Does this affect the schedule?' — It does. In a joyful way.",
  ev_mushroom_a_btn: "Everyone Admires It",
  ev_mushroom_a_result: "The whole squad surrounded the mushroom chanting 'MUSHROOM!' — the sound wave knocked three hard hats off. Schedule extended, morale soaring. Finance notes: joy is also output. Sadly, it does not book.",
  ev_mushroom_b_btn: "Designate a Scenic Spot",
  ev_mushroom_b_result: "Announcement: the mushroom is now listed as a 'Natural Wonder of Space Rig 17.' Visits by reservation; photos cost extra. Credits received, morale slightly down — the miners just missed the opening-day tickets.",

  ev_wererich_title: "Compressed gold detected!",
  ev_wererich_desc: "The squad has formed ranks before the gold, laser pointers primed. Finance reminds you: shouting 'WE'RE RICH!' at the same chunk of gold does not change its book value.",
  ev_wererich_a_btn: "Allow the Ritual",
  ev_wererich_a_result: "The chanting lasted ten minutes, growing more impassioned, until Mission Control personally closed it out: 'Alright, alright, that's enough.' Morale greatly up.",
  ev_wererich_b_btn: "Work Hours First",
  ev_wererich_b_result: "Broadcast: 'Are you rich, or am I rich after docking your bonus? Back to work.' The gold is deposited in full; morale dips. The miners have concealed the location of the next chunk.",

  ev_barrel_title: "Foreign object found in the launch bay!",
  ev_barrel_desc: "Three empty beer kegs are being quietly kicked toward the Drop Pod about to launch. Mission Control sounds wearier than ever: 'The barrels are there to support mining operations. Not... whatever this is.'",
  ev_barrel_a_btn: "Turn a Blind Eye",
  ev_barrel_a_result: "As the Drop Pod launched, a drum-roll echo rang out. Mission Control stayed silent for ten full seconds, then said: 'I won't change the cargo manifest.' Morale greatly up.",
  ev_barrel_b_btn: "Assist Enforcement",
  ev_barrel_b_result: "Confiscation list: empty kegs ×25. Mission Control expressed rare gratitude, and asked everyone not to ask why there is also one in his office. Morale slightly down; order slightly up.",

  ev_tipc_title: "TIP-C Tip Jar Budget Request",
  ev_tipc_desc: "The Abyss Bar's tip machine, TIP-C, has filed a budget request: 5 credits per cycle to trigger one line of thanks for Lloyd. Notes: no actual benefit whatsoever. Accounting has fainted.",
  ev_tipc_a_btn: "Approve Fund",
  ev_tipc_a_result: "Accounting demanded to know the purpose of this 5-credit expense. You replied: 'employee relations.' Morale up; Lloyd's display flickered in a way that looked almost like a smile.",
  ev_tipc_b_btn: "Reject On the Spot",
  ev_tipc_b_result: "Request denied. Lloyd's display printed two words: 'Understood.' You suspect mockery. Bar service runs cold this week; morale slightly down.",

  ev_leaflover_title: "Sobering Agent Procurement Proposal",
  ev_leaflover_desc: "Logistics proposes purchasing a batch of Leaf Lover's Special — the only fast-acting sobering agent. Setting notes: reportedly added to appease Management. The union has pre-written its protest letters.",
  ev_leaflover_a_btn: "Buy As Filed",
  ev_leaflover_a_result: "Procurement note: 'green, and healthy.' Union reply: 'green, and traitorous.' Hangover attendance soared, morale down; the protest letters were archived as usual under 'Employee Enthusiasm.'",
  ev_leaflover_b_btn: "Refuse Shipment",
  ev_leaflover_b_result: "You poured the sample into a flowerpot. The next day it grew a union flag. Morale greatly up; the entire crew arrived two hours late, citing 'hungover, but innocent' in the reason field.",

  ev_doretta_title: "Escort Duty: Doretta down",
  ev_doretta_desc: "The drilldozer Doretta exploded mid-core-stone, her head detaching intact. No regulation requires carrying it back to the Drop Pod. And no regulation can stop them.",
  ev_doretta_a_btn: "Halt Work, Carry Head",
  ev_doretta_a_result: "The squad carried Doretta's head for four kilometers. Schedule extended, morale soaring; the keepsake 'Doretta's Head' has entered the rig's collection. Management's note: book loss, morale profit.",
  ev_doretta_b_btn: "Core Stone First",
  ev_doretta_b_result: "Delivered on time; Finance praised this quarter's escort efficiency. The bar corner now hosts an unclaimed drill head that someone wipes daily. Morale down.",

  ev_karlstory_title: "Late-Night Pub Request: Karl Special",
  ev_karlstory_desc: "Veteran miners request an all-night session of Karl legends. Note: in version 41, he tore a Dreadnought apart with his bare hands. Nobody corrects the teller, because nobody dares.",
  ev_karlstory_a_btn: "Approve All-Nighter",
  ev_karlstory_a_result: "The story session ran all night; morale soaring. Next morning everyone arrived late with the same line in the attendance log: 'For Karl.' Legal advises: this reason cannot be refuted.",
  ev_karlstory_b_btn: "Turn Into Training Material",
  ev_karlstory_b_result: "Karl stories were adapted into new-hire safety material, page 3 titled: 'Karl is what happens when you skip the safety manual.' Training efficiency up; the veterans are furious — nobody clinked glasses with you that night.",

  ev_slogan_title: "Employee Handbook Amendment: Slogan Clause",
  ev_slogan_desc: "Background: 'shouted slogan, no response' incidents ×17 in the tunnels; morale data plummeted. Two amendment routes await Management's decision.",
  ev_slogan_a_btn: "Mandate Response",
  ev_slogan_a_result: "Handbook clause 7 amended: any employee hearing the slogan must respond within 1.5 seconds; violators are heretics (Legal insists: not in the legal sense). Morale up; work pace slows.",
  ev_slogan_b_btn: "Silent Pilot",
  ev_slogan_b_result: "Silent operation ran one shift; only pickaxe sounds remained in the tunnel, and a deeper sadness. Efficiency up, morale sharply down; 17 joint complaints received — numbered individually, none duplicated.",

  ev_molly_title: "M.U.L.E. 'Molly' out of contact",
  ev_molly_desc: "Molly chose the 'shortest path.' Beneath the path: three bug tunnels. The status light overhead shows no remorse. Official manual: the M.U.L.E. has no feelings and is not a pet.",
  ev_molly_a_btn: "Wait It Out",
  ev_molly_a_result: "Molly took two hours through the bug tunnels and returned with minerals 100% intact and squad composure 60% intact. Schedule extended; morale flat — nobody has the heart to scold her.",
  ev_molly_b_btn: "Everyone Chase Molly",
  ev_molly_b_result: "The squad shortcut-chased Molly and hauled ore by hand, finishing early. Someone twisted an ankle: one small medical bill. Molly watched from the cliff like an old washing machine.",

  ev_goldbug_title: "Golden Lootbug spotted!",
  ev_goldbug_desc: "Glittering gold all over, worth a fortune; the whole squad's pupils dilated in unison. Mission Control reminds: the objective of this mission is not it. The squad replies in unison: the objective of this mission is exactly it.",
  ev_goldbug_a_btn: "Everyone Chase",
  ev_goldbug_a_result: "The chase lasted 11 minutes; it ran faster than this quarter's KPI the entire way. Finally caught: a fat gold payout, schedule extended. It was sparkling until its very last second.",
  ev_goldbug_b_btn: "Mine Per Regulation",
  ev_goldbug_b_result: "Nobody moved. The tunnel went terrifyingly quiet as everyone pretended not to hear that golden 'chirp.' Progress normal, morale slightly down; the shift log is full of eloquent ellipses.",

  egg_settle_1: "This mission featured 47 mushroom markers; actual output unaffected, but joy output went off the charts.",
  egg_settle_2: "'FOR KARL!' was shouted 63 times this mission. The licensing-fee question for Mr. Karl (if he exists) remains under Legal review.",
  egg_settle_3: "This mission's debrief ended with an improvised dance. The safety advisor chose not to watch.",
  egg_settle_4: "The 'FIX ME' sign by the equipment terminal has been replaced with the 8th copy. Procurement asked who keeps replacing it. Nobody answered.",
  egg_settle_5: "This month's laser-pointer markers: 4,102 — gold 39% (with slogan), mushrooms 41% (with louder slogan), mission objectives 20% (ignored).",

  /* ================= 8. anim_* ================= */
  anim_roster_idle: "On standby at the bar. The tab is on the company.",
  anim_roster_mission: "Down below, working. Dig deep, get rich.",
  anim_roster_med: "Everyone is resuscitable: the dwarf is fine. The bill is very real.",
  anim_swarm_banner_alt: "Swarm alert: the cavern floor is shaking",
  anim_lloyd_alt: "Lloyd is on duty; the draft beer never runs dry",
  anim_doretta_alt: "Doretta's head — she's alive, just a little tilted",
  anim_karl_alt: "Someone is standing in that warm light. Management: no comment.",

  /* ================= 9. ui_* v1.3 缺口键 ================= */
  ui_kpi_progress: "Morkite this quarter: {done}/{quota2}",
  ui_kpi_claimable: "Bonus earned and ready to claim! The Corporation never owes — except wages, reimbursements, and this one.",
  ui_rares_label: "Rare Minerals",
  ui_rares_tip: "Random mission drops, used for licenses and miner growth.",
  ui_deps_empty: "No active dispatches. The miners are at the bar; the money is on the corporate account.",
  ui_deps_event: "⚡ Awaiting management decision",
  ui_deps_event_btn: "Handle Event",
  ui_roster_cap: "{cur}/4 on staff. One mission can take multiple miners: solo the easy contracts, squad up for the hard ones.",
  ui_bar_locked: "🔒 Unlocks at Bar Lv.{lv}. The first investment beyond the quota is always beer.",
  ui_med_empty: "No injured on file. Medbay robot Lloyd② is dozing.",
  ui_med_resting: "Resting, {days} game minutes remaining. The bill has arrived; the dwarf is still en route.",
  ui_med_express: "Express Treatment (-{days} min)",
  ui_gear_note: "Weapon licenses upgrade with official minerals: boosts combat power and rare mineral drops. 3 levels per class. Each weapon carries 1 mod (mods come from Tritilyte mission gacha).",
  ui_elite_btn_hire: "Transfer Order",
  ui_rig_effect: "Current effect: Morkite yield ×{mul}｜depth tiers {depth}/5｜parallel dispatch {slots} squads｜squad cap {cap}",
  ui_save_btn_folder: "Bind Save Folder",
  ui_save_btn_write: "Write to Folder Now",
  ui_save_btn_restore: "Restore from Folder",
  ui_save_btn_export: "Export Save File",
  ui_save_btn_import: "Import Save File",
  ui_offline_msg: "Welcome back, Management. You were away {hours} hours; the rig ran at 10% efficiency.",

  /* ================= 10. v1.4 二期接线键 ================= */
  ui_market_note: "5% fee · daily ±10% price limit",
  ui_market_today: "Today: {ups} up / {downs} down",
  ui_market_hold: "Holding {n}　value {v} credits",
  ui_market_buy10: "Buy 10 ({cost})",
  ui_market_buy50: "Buy 50 ({cost})",
  ui_market_sell10: "Sell 10 ({gain})",
  ui_market_sellall: "Sell All",
  log_market_sell: "Exchange sold {k}×{qty}, received {gain} credits. Markets have risks; the Corporation disclaims all liability.",

  ui_camp_next: "📋 Next campaign【{name}】　unlocks on game day {day} (today: day {today}). The Corporation is cooking something big.",
  ui_camp_now: "📋 Campaign【{name}】",
  ui_camp_prog: "{txt} ({prog}/{need})　Reward: {reward}",
  ui_camp_empty: "📋 Campaign terminal　queue empty. The Corporation is drafting a new big contract.",
  ui_camp_fold: "Campaigns & Events (click to fold/unfold)",
  ui_camp_hol_now: "🎄 Holiday campaign【{name}】",
  ui_camp_hol_open: "Dispatch one mission to open it automatically.",
  log_camp_done: "✔ Campaign objective complete: {goal}",
  log_camp_clear: "🏆 Campaign【{name}】cleared! Rewards issued.",
  log_camp_new: "New campaign issued:【{name}】",
  log_camp_empty: "Campaign queue empty. The Corporation is drafting a new big contract.",

  ui_board_clause_wrap: "Clause【{name}】{desc}",

  log_daily: "[Daily Brief D{day}] Yesterday: {missions} dispatches · {credits} credits earned · Morkite +{morkite} · {injured} heavily injured. Market: {market}",
  log_care: "[Corporate Care Program] Rig supplies running short. Emergency advance of 200 credits + 40 Nitra (to be docked from next quarter's performance).",

  log_welcome: "Welcome to the job, Management. The Corporation has exactly one requirement for Space Rig 17: output.",
  log_tip_first: "Tip: take a low-hazard contract first. More dwarfs means safer digs — but more mouths splitting the pay.",
  log_recruit: "New hire: {name} ({cls}, greenbeard). He didn't read the contract terms; we didn't elaborate.",
  log_manager_new: "New Management has onboarded. The whereabouts of the previous Management is a sensitive topic.",

  log_save_export: "Save exported to file.",
  log_save_import_ok: "Save imported successfully.",
  log_save_import_ver: "Import failed: wrong save version.",
  log_save_import_bad: "Import failed: file corrupted.",
  log_bind_unsupported: "This browser does not support binding a save folder (try Chrome / Edge).",
  log_bind_ok: "Save folder bound【{path}】",
  log_bind_fail: "Failed to write save folder: {err}",
  log_bind_none: "No save folder bound yet.",
  log_restore_ok: "Progress restored from save folder.",
  log_restore_ver: "The save in the folder has the wrong version.",
  log_restore_fail: "Failed to read folder save (possibly never saved).",

  log_nitra: "Nitra critical; the Corporation has air-dropped emergency supplies — it's on the tab, don't be shy.",
  log_blanks: "✦ Tritilyte mission complete: Blank Core +{n}",
  log_merit: "Merit +{n}. The performance system is running unusually enthusiastically today.",
  log_rig_lv: "Rig upgraded to Lv.{lv}. Depth tiers and the dispatch queue expanded in sync.",
  log_bar_lv: "The Abyss Bar expanded to Lv.{lv}. Lloyd wiped down a glass.",
  log_med_lv: "Medical Bay upgraded to Lv.{lv}. Bills discounted; friendship is not.",
  log_bar_round: "Management bought the whole bar a round of【{drink}】.",
  log_time_speed: "Time speed switched to ×{n}.",
  log_board_refresh: "Board manually refreshed. The Corporation sent a new batch of contracts.",

  log_trinket_off: "Trinket removed and returned to the display case.",
  log_trinket_on: "Equipped trinket【{name}】.",
  log_trinket_on2: "Second trinket slot equipped【{name}】.",
  log_mod_off: "Mod unequipped (kept in the warehouse).",
  log_mod_in: "Mod stored:【{name}】",
  log_mod_dup: "Duplicate【{name}】drawn; one free reroll applied per corporate policy.",
  log_elite_hire: "Transfer order effective:【{name}】joins Space Rig 17.",
  log_elite_all: "All five Reclaimers assembled. Management's comment: this is no longer dispatch — this is orbital superiority.",

  /* ================= 11. dd_* 深潜 ================= */
  dd_ui_title: "Deep Dive Terminal",
  dd_ui_sub: "Refreshes weekly. The Corporation marked the deepest shaft red — red means priority, and priority means the budget was approved.",
  dd_ui_btn_launch: "Launch Stage",
  dd_ui_btn_retry: "Retry Stage",
  dd_ui_locked: "Deep Dive Terminal locked: requires at least 1 miner with promotion seniority ★. The shaft is deep; the seniority must be deep too — one of the few logical rules the Corporation keeps.",
  dd_ui_lockdone: "This week's Deep Dive is complete; results locked in. A fresh one rotates in Monday 00:00. Until then, the mission board awaits — regular contract bugs do not take leave just because you went deep.",
  dd_ui_brief_mod: "This week's modifiers loaded: {mods}. The Corporation wishes you luck — and has quietly topped up the Medical Bay budget.",

  dd_stage1_start_a: "Deep Dive stage 1/3 open. This dive exceeds the standard contract; overtime pay is processed as 'voluntary.' Enjoy the dive.",
  dd_stage1_start_b: "Stage 1/3: the probe has touched bottom. Mission Control reminds: a Deep Dive has no mid-way Drop Pod — only dive, return, and bills. The first two are yours; the third goes to Finance.",
  dd_stage2_start_a: "Stage 2/3 open: depth has exceeded the charted range. Geology says the map ends here; good luck in 'here.'",
  dd_stage2_start_b: "Stage 2/3 open. The bugs' welcome ceremony exceeds projections — the official file says 'moderately above average.'",
  dd_stage3_start_a: "Final stage 3/3: all weekly modifiers active. The Corporation's confidence is directly proportional to your depth. Dig deep, get rich!",
  dd_stage3_start_b: "Final stage open. Mission Control's exact words: 'Dig up what must be dug; bring back who must live.' Management adds: the order of the two is negotiable.",

  dd_stage1_clear_a: "Stage 1/3 complete; yield banked. The Deep Dive report was CC'd to Management; the approval field reads one word: 'Continue.'",
  dd_stage1_clear_b: "Stage 1/3 cleared; Blank Cores issued with the yield. Two segments remain to the true abyss — literally.",
  dd_stage2_clear_a: "Stage 2/3 complete. The yield set a new weekly record; the previous record holder has requested a recount.",
  dd_stage2_clear_b: "Stage 2/3 cleared. The bugs on the last floor can already hear the drills. They hate that sound. We love it.",
  dd_stage3_clear_a: "Segment three complete! Deep Dive fully cleared; yield banked in full. All divers entered the honor roll; medical filing speed also hit a record high.",
  dd_stage3_clear_b: "Segment three cleared. This week's Deep Dive officially wrapped: three segments cleared, bills paid, mods issued — that is the Corporation's fairness, roughly.",

  dd_clear_a: "Deep Dive cleared! A fat reward is in; the Corporation's congratulatory letter adds: 'the rewards of digging deep deserve to be loaded into every mod.' Blank Cores have arrived — see the Forge.",
  dd_clear_b: "This week's Deep Dive cleared! The Medical Bay's pre-booked beds for next week are all cancelled — that is the highest praise Management can imagine. Dig deep, get rich!",
  dd_fail_a: "Stage aborted; squad withdrawn in full (wounded via the medical channel; bills generated). Completed stage rewards stand — the Corporation admits no failure, only 'staged retries.'",
  dd_fail_b: "Stage aborted. All personnel recovered, no exceptions — that is a core corporate competency. Retrying costs no bonus. Only face.",
  dd_expire_a: "Last week's Deep Dive file is sealed: unfinished progress voided per corporate policy. Cheer up — this week is deeper, longer, and more worth it.",
  dd_expire_b: "Deep Dive cycle reset: cross-week progress is not retained — that's the rule of the dive and of the balance sheet. New weekly modifiers loaded.",

  dd_egg_1: "Deep Dive tip: the 'deep' in Deep Dive means depth, not salary. The 'deep' for salary is on another page of the financial report.",
  dd_egg_2: "Public service announcement: during a Deep Dive, watch the ceiling. When you can't, trust your teammates to — that's what 'team' means.",
  dd_egg_3: "Deep Dive briefing closing segment: We're rich! — Officially, repeating it three times counts as a successful mobilization.",
  dd_elite_locked: "Elite Deep Dive locked: requires any miner at seniority ★3. You've dug through the ordinary shafts; the deeper one is reserved for dwarfs wearing three stars.",
  dd_elite_clear: "Elite Deep Dive cleared! This week's deepest shaft has been filled with three stars. A fat reward and Blank Cores are in — add your hard hat to the honor roll.",
  dd_squad_full: "The Deep Dive squad requires all four classes — four dwarfs, four pickaxes, no exceptions. The missing one? The Medical Bay is processing the discharge.",
  dd_mod_banner: "This week's modifiers: ",

  /* ================= 12. el_* 精英支援位 ================= */
  el_ui_title: "Elite Support Slot",
  el_ui_sub: "Reclaimers: first into the fray. Hiring them costs more than hiring you. Do the math yourself.",
  el_ui_btn_hire: "Transfer Order",
  el_ui_btn_carry: "Take Along",
  el_ui_locked: "Elite Support locked: requires Rig Lv10. Reclaimers only accept transfer orders from a maxed-out rig — level the four classes first.",
  el_ui_need_merit: "Not enough Merit. Deep Dives, KPI and hazard-5 missions all top up Merit — the Corporation does no charity, but it does points.",
  el_carry_msg: "{elite} has joined the squad and will dive with the next dispatch. The HR sheet gained a line; the bugs' extinction rate gained a gear.",
  el_guardian: "Guardian on duty: all medical bills discounted. The first injury won't hurt — you'll get used to it by the second.",
  el_rewind_used: "Retcon anchored: this failure has been struck from the timeline. Rewinds remaining: {left}.",
  el_all_owned: "All five Reclaimers assembled. Management's comment: this is no longer dispatch — this is orbital superiority.",
  el_relic_use: "This mission carries the relic: {relic}. A Reclaimer's private stash; one less with each use. Spend wisely.",
  el_rescue_msg: "Wipe averted: {elite} pulled everyone out of a coffin-priced bill. Yield saved at half; bill cut at half — that is what 'elite' means.",

  /* ================= 13. ch_* 编年史 ================= */
  ch_ui_title: "Chronicle",
  ch_ui_sub: "Day {day} · {date}",
  ch_node_season: "[Chronicle] {name} is live. Season weapons and campaigns synced to the corporate database.",
  ch_node_anniv: "[Chronicle] Deep Rock Galactic turns {years}. Anniversary campaign open — trophies are numbered by year; collecting them all is a form of obsession.",
  ch_jump_brief: "Quarterly brief: this quarter passed without incident, to Management's satisfaction. Time fast-forwarded {days} days; wages paid as usual.",
  ch_finale_open: "The Chronicle's final page: Operation Ledger-Clearing has begun. Six years of accounts, settled in one go.",
  ch_finale_endless: "Chronicle: the end. No more script from today, Management — dig until the stars burn out. Dig deep, get rich!",
  ch_lock_hint: "The Chronicle advances by real release dates: the early ones get dug now; the later ones are still queueing in the corporate database.",

  /* ================= 14. tr_* 饰品终端 ================= */
  tr_ui_title: "Trinket Terminal",
  tr_ui_sub: "Facial trinket slot: the only place the Corporation allows employees to hang property off their faces.",
  tr_ui_btn_equip: "Equip",
  tr_ui_btn_unequip: "Remove",
  tr_slot_full: "This miner already wears a trinket. New in, old out — the Corporation respects your choice, and has logged your hesitation.",
  tr_drop_relic: "Deep Dive final stage payout: {name}! Stored in the Trinket Terminal — officially, this moment deserves three seconds of silence.",
  tr_drop_festival: "Holiday campaign settlement: {name} deposited. Limited edition; gone when it's gone — one of the Corporation's rare moments of tenderness.",
  tr_box_open: "Trinket box opened! Contains one random cosmetic item — the performance reward system thanks you for your high performance.",
  tr_linktree_buy: "Data node redeemed. Trinket tree progress advanced — the shopping stream is also the progress stream.",
  tr_equip_msg: "{miner} equipped {name}. On the performance sheet it's a row of data; in the bar it's a story.",
  tr_season_banner: "Current holiday campaign: {festival} — limited trinkets; miss it and wait a year (or for a corporate rollback; don't count on it).",
  tr_lock_hint: "Trinkets drop from Deep Dive finales, holiday campaigns and trinket boxes. The good stuff never enters the store — that's the Corporation's romance, top-tier.",
  tr_slot2_locked: "Second trinket slot 🔒: unlocks when any miner reaches promotion ★3 (current highest promotion: ★{n}).",
  tr_slot2_empty: "Second trinket slot unlocked and empty — the promoted elite's second slot. Don't waste it.",
  tr_ui_btn_equip2: "Equip · Slot 2",
  tr_slot2_dup: "The same trinket cannot be worn in both slots — Corporation rules; mind your face.",
  tr_slot2_locked_log: "Second trinket slot is locked: requires any miner promoted to ★3.",

  /* ================= 15. ev_lcyf / ev_cat 社区彩蛋 ================= */
  ev_lcyf_title: "Mining Consultant Visit",
  ev_lcyf_desc: "A dwarf in yellow rain boots rolled out of the Drop Pod. 'Hi everyone, I'm lcyf166!' — Management note: this person claims to be a corporation-certified third-party mining efficiency consultant. HR files: no such person.",
  ev_lcyf_a_btn: "Listen to Him",
  ev_lcyf_a_result: "lcyf166 tapped his terminal twice and cut the mission duration in half. 'Cheating saves time; not cheating wastes time.' Then he left. Management decided not to ask how it works.",
  ev_lcyf_b_btn: "v Him 50",
  ev_lcyf_b_result: "You v'd lcyf166 50 credits. He nodded, satisfied, and whispered a secret about chain nukes. From now on, any swarm with an Engineer on the team is a free XP pack.",
  ev_lcyf_unlock_hint: "Unlocks only while owning both the 'Explosive Chemical' + 'Fat Boy' mods.",
  ev_lcyf_avatar_alt: "A mining consultant in yellow rain boots. He says his name is lcyf166.",

  ev_cat_title: "Stony-Faced Kitty Arrives",
  ev_cat_desc: "An oversized, stone-faced black cat sits at the tunnel bend, watching through slitted eyes. It speaks: 'Sadistic, scheming, oversized stony-faced kitty, at your service ♪ I do love streaming — actually it's cooldown reduction.' From beneath its tail it draws an absurdly thick notebook, opens a fresh page, and sharpens its claws. 'Now then, let's see... who came here, what they did, what they owe. It's all in the book~'",
  ev_cat_a_btn: "Offer Red Sugar",
  ev_cat_a_result: "The cat licked the Red Sugar, narrowed its eyes, and purred. Squad morale surged — if even the Grim Reaper's accountant is pampered, what bug is left to fear?",
  ev_cat_b_btn: "Take the Detour",
  ev_cat_b_result: "You pretended not to see it. The cat slowly wrote a line in the notebook. Nobody dared to look back twice.",
  ev_cat_grudge: "The cat drew a circle in the notebook with its tail. 'Noted.'",
  ev_cat_grudge_max: "The stony-faced cat wrote something in the notebook... the next Deep Dive feels unwise.",
  ev_cat_avatar_alt: "An oversized stony-faced black cat, writing in a notebook.",

  /* ================= 16. st_* 序章 / karl_* 线 / un_* 解锁 ================= */
  st_note_title: "A Note in the Locker",
  st_note_body: "To the one taking over: second shelf of the bar, my private Leaf Lover's. Don't tell Lloyd. Tier-5 contracts pay what they pay for a reason — wait for me and we'll drink.\n— Karl, former staff",
  st_brief_title: "Corporate HR Brief · No. 4471",
  st_brief_body: "The execution squad of the tier-5 risk contract [Hollow Bough · Deep] lost contact within the mission window. Per corporate practice, temporarily filed as missing; salary continues to next quarter. The Corporation welcomes the new Management aboard Space Rig 17 and wishes smooth work.",
  st_takeover_title: "New Management Onboards",
  st_takeover_body: "Space Rig 17's current assets: one drill rig, one tier-5 orphan contract nobody dares take, and a stack of contracts waiting to be fed. Rebuild output — and along the way, find out what happened to Karl. Order at your discretion.",
  st_start_btn: "Restart the Rig",
  st_skip: "Skip Prologue ≫",
  st_mission_name: "Karl's Orphan Contract",
  st_mission_tag: "Hazard 5 · Hollow Bough · Story contract (Karl only)",
  st_comms_title: "Final Transmission",
  st_comms_body: "Hollow Bough, 620m level; the signal is breaking up. Karl's voice stays steady: 'Management, the vein readings are anomalous — tell me, does the Corporation issue pensions for squads like ours?'",
  st_comms_a: "'Karl, pull back now!'",
  st_comms_b: "'Stay silent. Save your oxygen.'",
  st_lost_title: "Signal Lost",
  st_lost_body: "[Mission window closed] Karl's orphan contract (Hazard 5 · Hollow Bough): no return signal. The Corporation has updated his status to: missing (provisional). Salary account frozen; his private booze is held in custody by Lloyd.",
  st_prologue_done_log: "Prologue complete. Objective: rebuild output — and, incidentally, find out what happened to Karl.",

  karl_bar_clue: "Carved into the underside of the bar: 'K drank his last here. Lloyd, put it on Karl's tab.' — He intends to come back.",
  karl_gear_clue: "Pressed into the deepest corner of the locker: an old Blank Core, labeled in Karl's handwriting: 'For the new Management stuck with the bill. Don't waste it on a PGL.' (Blank Core ×1 added to your inventory)",
  karl_dive_clue: "A new entry in the Deep Dive sonar archive: periodic knocking from the deep rock walls, translating in Morse as — 'ROCK AND STONE'.",
  karl_help_title: "Finding Karl (clues {n}/3)",
  karl_finale_title: "Operation Ledger-Clearing · Epilogue",
  karl_finale_body: "In the deepest reaches of Hollow Bough you find a terminal still recording. The last log: 'There's deeper below the deep. The veins here sing, and the bugs can somehow queue. I'm going further down. Don't look for me — you won't find me. Rock and Stone, finish my drink for me.' Signed: Karl",
  karl_endless_signal: "On anniversary midnight, the sonar recorded that knocking again. This time with a second half: '...the beer is good.'",

  un_locked_toast: "{name} is not unlocked yet. Requirements: {cond}",
  un_need_campaign: "Complete campaign【{name}】",
  un_need_rig: "Rig Lv.{n}",
  un_need_credits: "Not enough credits (short by {n})",
  un_buy_btn: "Rebuild · {cost} credits",
  un_lic_btn: "Issue License · {cost} credits",
  un_done_toast: "【{name}】unlocked: {gift}",
  un_market_gift: "License active — the Corporation has prepared a starter stock of ×10 per mineral for its new client",
  un_kpi_toast: "Corporate Finance: given the rig's rebuild progress, quarterly KPI reviews take effect this quarter. Quotas don't grow on their own — but spreadsheets do.",
  un_karl_count_log: "[Finding Karl] Clue {n}/3 recorded.",

  /* ================= 17. dm_* 双模式 ================= */
  dm_mode_idle: "Idle",
  dm_mode_rush: "Rush",
  dm_toast_rush: "⚡ Rush mode: mission duration ÷30 (seconds-scale), output ×0.35, Nitra ×4, paid time-extension options, Deep Dive and time controls disabled.",
  dm_toast_idle: "🛌 Idle mode: normal flow, full mission rewards, Nitra refunded on time-extension options.",
  dm_rush_dive_lock: "⚠ Deep Dive is unavailable in Rush mode. Switch back to Idle mode to dive normally.",
  dm_nitra_tag: "Nitra +{n}",
  dm_nitra_short: " (Rush: extra {n} Nitra)",
  dm_idle_refund: " (Idle: {n} dispatch Nitra refunded)",
  dm_auto_on: "🤖 Idle Voucher active: 3 hours of auto dispatch and decisions. Sleep pods still stack on top.",
  dm_auto_off: "Idle mode cancelled manually.",
  dm_auto_rush_lock: "The Idle Voucher only works in Idle mode — Rush has no autopilot; decisions come in person.",
  dm_report_title: "📊 Autopilot Earnings Panel",
  dm_report_empty: "No autopilot earnings yet — missions completed while the Idle Voucher is active accumulate here automatically.",
  dm_report_scope: "Scope: auto dispatches and decisions made while the Idle Voucher was active.",
  dm_report_sign: "Sign Off",
  dm_report_missions: "Missions Completed",
  dm_report_credits: "Net Credits",
  dm_report_morkite: "Morkite",
  dm_report_moil: "Liquid Morkite",
  dm_report_nitra: "Nitra",
  dm_report_med: "Medical Costs",
  dm_report_events: "Auto-Resolved Events",
  dm_report_expire: "🤖 Idle Voucher expired — earnings panel generated. Click 📊 to review anytime.",

  /* ================= 16. 社区梗事件扩容包（v1.2，30 事件 × 6 键） ================= */

  ev_lootpet_title: "Lootbug Mascot Program",
  ev_lootpet_desc: "A round lootbug sits at the tunnel mouth, eating minerals with the same focus Finance brings to eating the budget. The squad has already named it; it's one job posting short of a title.",
  ev_lootpet_a_btn: "Keep It as Rig Mascot",
  ev_lootpet_a_result: "It has been designated 'Acting Director of Space Rig 17.' Primary duty: eating minerals — much like every previous director. Morale greatly up; output slightly down: even bugs draw rations.",
  ev_lootpet_b_btn: "Remand to Minerals Dept.",
  ev_lootpet_b_result: "The lootbug has been processed; credits received. The union received a eulogy that same evening, two lines long: 'It was round. It was good.' Morale slightly down.",

  ev_lookupleech_title: "'Look Up' Safety Campaign Budget",
  ev_lookupleech_desc: "The safety advisor requests funding: 'LOOK UP' posters in every tunnel, headlamps for all new hires. Justification — the most frequent line in missing-miner reports: 'He was right here a second ago.'",
  ev_lookupleech_a_btn: "Posters and Lamps for All",
  ev_lookupleech_a_result: "Ranger Galfaux glares from every poster. Even clerks who never go underground now check the ceiling on reflex. Schedule extended; sense of safety greatly up.",
  ev_lookupleech_b_btn: "Verbal Reminders Only",
  ev_lookupleech_b_result: "The veterans' verbal briefing is four words long: three are 'look up,' and the fourth is a sigh. Budget saved — roughly the price of one medical bill.",

  ev_huuli_title: "Huuli Hoarder in Transit",
  ev_huuli_desc: "A huuli hoarder crosses the tunnel, back loaded with rare minerals, walking with the composure of an executive who has just finished auditing every branch. The squad's breathing stopped for half a second.",
  ev_huuli_a_btn: "Full Squad Purse Hunt",
  ev_huuli_a_result: "The hunt took nine minutes; its surrendered stock is more presentable than this quarter's filings. A fat rare-mineral payout, schedule extended.",
  ev_huuli_b_btn: "Wave It Goodbye",
  ev_huuli_b_result: "The squad watched it vanish down the tunnel. Nobody spoke. Progress normal, morale slightly down — the shift log is filled with 'respect, but heartbreak.'",

  ev_crisp_title: "Tritilyte Logistics Problem",
  ev_crisp_desc: "A giant tritilyte crystal is stuck dead center in the tunnel. Detour: two extra kilometers. Haul: everyone. Mission Control reminds you: the Corporation accepts signed receipts, not group photos.",
  ev_crisp_a_btn: "Everyone Hauls",
  ev_crisp_a_result: "The squad heaved the crystal onto the Molly chanting work songs. Rare minerals banked, schedule extended. Nobody complained about being tired — no breath left for it.",
  ev_crisp_b_btn: "Blast and Sample",
  ev_crisp_b_result: "Clean detonation, complete sample, credits received. Morale slightly down: after the muffled boom, the tunnel fell silent, as if mourning the shattered bonus.",

  ev_frogbelly_title: "Bellyfrog Swallows the Ore Bag",
  ev_frogbelly_desc: "A round, frog-shaped cave creature — the miners call it a 'bellyfrog' — swallowed an entire bag of Morkite and is now digesting it in the open, ore veins clearly visible through the belly.",
  ev_frogbelly_a_btn: "Cut It Out",
  ev_frogbelly_a_result: "Extraction went smoothly; a fat credit payout. As it was released, the bellyfrog looked back once — the squad unanimously translated that look as 'I'll remember this.' Morale slightly down.",
  ev_frogbelly_b_btn: "Let It Digest",
  ev_frogbelly_b_result: "The squad waited two hours with the bellyfrog. It stood, shook its skin, produced nothing, and waddled off. Morale greatly up: no one regrets the wait.",

  ev_supplydrop_title: "Supply Pod Landing Deviation",
  ev_supplydrop_desc: "The supply pod's navigation is off by thirty meters — directly above a miner who is waving up at it. Mission Control's either-or channel has gone rarely silent.",
  ev_supplydrop_a_btn: "Squad Guides It Down",
  ev_supplydrop_a_result: "The pod brushed past the hard hat and landed, guided by everyone's laser pointers. Schedule extended, morale slightly up — the target of it all bought the squad a round, to celebrate.",
  ev_supplydrop_b_btn: "Original Coordinates",
  ev_supplydrop_b_result: "The pod landed on time, not a minute lost. The miner beside the drop zone has been named 'Dodger of the Month'; the prize is a self-funded medical briefing.",

  ev_grebeard_title: "Greenbeard's First Shift",
  ev_grebeard_desc: "For the greenbeard's first dispatch, two greybeards are fighting over who teaches: one insists on hands-on guidance, the other insists 'the tunnel is the best teacher.'",
  ev_grebeard_a_btn: "Greybeard Mentorship",
  ev_grebeard_a_result: "Mentorship works: the rookie learned three things — mining, bug-hunting, and why detonators don't share a bag with lunch. Schedule extended, morale slightly up.",
  ev_grebeard_b_btn: "Self-Taught On the Job",
  ev_grebeard_b_result: "The rookie finished early and improved fast — mostly by being chased by bugs. Chance of minor injury; the medbay bills it as 'tuition.'",

  ev_trapfun_title: "The Engineers' 'Defensive Works'",
  ev_trapfun_desc: "The squad is blocked by a sensor minefield the engineering department built on its own initiative. Engineering's defense: 'It's art. Also defense.' There's a small sign: viewing fee.",
  ev_trapfun_a_btn: "Order It Dismantled",
  ev_trapfun_a_result: "Disarming took an hour; zero casualties. On the way out, engineering left a memorial plaque: 'Here stood a great minefield.' Morale slightly up, schedule extended.",
  ev_trapfun_b_btn: "Charge Admission",
  ev_trapfun_b_result: "Viewing tickets sold well; credits received. Morale slightly down: the first visitor tripped the 'Easter egg' engineering had left for itself.",

  ev_bosco_title: "Bosco's Job Application",
  ev_bosco_desc: "The single-miner support drone Bosco parked itself before the dispatch terminal, screen scrolling a résumé: mining, bug-hunting, coffee. Special skills column: 'does not require rest.'",
  ev_bosco_a_btn: "Hire It for the Shift",
  ev_bosco_a_result: "Bosco performed with the efficiency of a machine — it is one. Mission finished early, morale slightly up: finally a coworker who doesn't fight over beer.",
  ev_bosco_b_btn: "Rent It to Rig 18",
  ev_bosco_b_result: "Bosco was short-leased to Space Rig 18; rental credits received. It gave everyone a look on the way out — sensor readings perfectly normal, no emotional activity. Probably.",

  ev_redsugar_title: "Red Sugar Rationing Proposal",
  ev_redsugar_desc: "Finance proposes registering all Red Sugar harvested in tunnels into central inventory, with healing dispensed by requisition. The medbay's reply: 'Ask the bugs if they'll countersign first.'",
  ev_redsugar_a_btn: "Take As Needed",
  ev_redsugar_a_result: "The tunnel tradition of 'who's hurt, eats' stands; losses are logged as usual. Morale slightly up — a dwarf who trusts his sugar is a good dwarf.",
  ev_redsugar_b_btn: "Register Everything",
  ev_redsugar_b_result: "Sugar booked in full; the ledger looks respectable and credits tick up. Morale slightly down: every cube now requires a form, and the form's serial number outnumbers the crystals.",

  ev_surf_title: "Slope Surfing Legalization Pilot",
  ev_surf_desc: "Video evidence shows miners riding slag slopes pickaxe-first, in a variety of postures, shouting nothing that resembles a safety slogan. Management's characterization requested.",
  ev_surf_a_btn: "Approve the Pilot",
  ev_surf_a_result: "Slope surfing is now an official after-shift pastime. Morale greatly up, with a chance of minor injury — the safety advisor files this under 'the cost of joy.'",
  ev_surf_b_btn: "File a Safety Notice",
  ev_surf_b_result: "Notice published: 'On the Prohibition of Using Tunnels as Slides.' Safety points convert to a small credit payout; morale slightly down. The slopes did not stop squeaking that night.",

  ev_lastcall_title: "Drop Pod Boarding Rules Amendment",
  ev_lastcall_desc: "Mission Control reiterates Rule One: 'The Drop Pod leaves with or without you.' The squad petitions to amend Rule One: wait for the last dwarf.",
  ev_lastcall_a_btn: "Launch On Time",
  ev_lastcall_a_result: "The pod launched on schedule; the rule stands; the mission wrapped early. Morale slightly down — the ride home was quiet enough to hear someone counting heads.",
  ev_lastcall_b_btn: "Wait for the Last Dwarf",
  ev_lastcall_b_result: "The pod waited an extra two minutes, and everyone boarded. Morale greatly up, schedule extended. Mission Control's memo gained a line: 'They actually wait.'",

  ev_jukebox_title: "Jukebox Weekly Pass Request",
  ev_jukebox_desc: "The Abyss Bar jukebox has filed a request: a week of free song picks, rotation by popular vote. Finance's inquiry: 'Does dancing count as work hours?'",
  ev_jukebox_a_btn: "Free Jukebox for a Week",
  ev_jukebox_a_result: "The pass was granted; the bar became a rehearsal hall overnight. Morale greatly up, schedule extended — a dance partner is harder to find than a digging partner.",
  ev_jukebox_b_btn: "Make It Paid Requests",
  ev_jukebox_b_result: "The jukebox was wired for billing; credits received. Morale slightly down: the free playlist is now one song, 'The Corporation Is My Home,' with a 100% request rate — it's the only one.",

  ev_dance_title: "Pre-Extraction Pod Dance Review",
  ev_dance_desc: "A spontaneous group dance has formed at the Drop Pod, 100% participation, the safety advisor standing by with a stopwatch. Decide between 'approve' and 'board per procedure.'",
  ev_dance_a_btn: "Approve the Dance",
  ev_dance_a_result: "Dance approved. Ten minutes, technical score failing, atmosphere perfect; morale greatly up. The safety advisor's stopwatch turned out to have been in camera mode the whole time.",
  ev_dance_b_btn: "Board Per Procedure",
  ev_dance_b_result: "Everyone boarded by the book and came home early. Morale slightly down: on the ride up, every hard hat's reflection looked a little wistful.",

  ev_incinerator_title: "Incinerator Dunk Contest Application",
  ev_incinerator_desc: "Staff request to host a keg-dunk contest over the incinerator, citing the official achievement as precedent. Safety clause: only one of dwarf and keg may enter the iron ring.",
  ev_incinerator_a_btn: "Host the Contest",
  ev_incinerator_a_result: "The contest was a success; the top dunker took home the 'Golden Keg.' Morale greatly up, minor fuel costs — the incinerator holds no grudge. It even felt warm about it.",
  ev_incinerator_b_btn: "Shut It Down",
  ev_incinerator_b_result: "Event cancelled; rogue kegs confiscated and sold for a small credit gain; morale slightly down. That night, a ring of eloquent dwarves stood around the incinerator's iron rim.",

  ev_jetboot_title: "Arcade Tournament Sponsorship",
  ev_jetboot_desc: "The Jetty Boot tournament filing carries one note: the defending champion appears to be Lloyd himself. The organizers request corporate sponsorship.",
  ev_jetboot_a_btn: "Sponsor the Tournament",
  ev_jetboot_a_result: "Tournament approved: prize is credits, trophy a gilded beer mug. Morale greatly up. Lloyd's display flickered three times — read industry-wide as a title defense.",
  ev_jetboot_b_btn: "Make It a KPI",
  ev_jetboot_b_result: "Arcade high scores are now a performance bonus line; entry fees credited. Morale slightly down. Lloyd has filed for verification of 'contestant eligibility.'",

  ev_mask_title: "Terrifying Rubber Mask Merchandising",
  ev_mask_desc: "Logistics received a shipment of Mission-Control-face 'terrifying rubber masks.' Slogan: 'Wear it, and everyone is Management.' Awaiting your approval.",
  ev_mask_a_btn: "Award to Employee of the Month",
  ev_mask_a_result: "The mask went to the Employee of the Month. The night he walked into the bar wearing it, Mission Control, for once, did not quote Management. Morale greatly up, schedule slightly extended.",
  ev_mask_b_btn: "Confiscate and Resell",
  ev_mask_b_result: "Confiscation list: masks ×17, dignity ×several. Resale credits received; morale slightly down. Rumor says Mission Control bought one himself, quietly.",

  ev_pointer_title: "Laser Pointer Replacement Procurement",
  ev_pointer_desc: "Equipment report: the current laser pointers have reached end of life — gold markers flicker, mushroom markers ghost. A replacement proposal is drafted; budget pending.",
  ev_pointer_a_btn: "New Pointers for All",
  ev_pointer_a_result: "New pointers arrived; whatever you mark, shines. Morale greatly up, credits spent. This month's marking stats: gold 39%, mushrooms 41%, mission objectives 20% — tradition intact.",
  ev_pointer_b_btn: "Repair the Old Ones",
  ev_pointer_b_result: "The old pointers were salvaged; they occasionally mark objectives as mushrooms. Schedule slightly extended, morale slightly down. Finance praised the 'savings.'",

  ev_karlfund_title: "Karl Memorial Fund",
  ev_karlfund_desc: "The union proposes a 'Karl Memorial Day' fund: one toast, one provision, purpose confidential — reportedly related to 'he's coming back for a drink.'",
  ev_karlfund_a_btn: "Establish the Fund",
  ev_karlfund_a_result: "The fund is live, first round booked. The whole squad raised their glasses that night; morale greatly up. Nobody asked where the money goes — asking is like asking whether Karl is coming back.",
  ev_karlfund_b_btn: "One Minute of Silence",
  ev_karlfund_b_result: "The silence plan ran as a trial: budget saved, schedule slightly shortened, morale slightly down. In that minute of quiet, someone heard, from the bar's direction, a soft '...good beer.'",

  ev_appeal_title: "Employee Appeals Channel Proposal",
  ev_appeal_desc: "HR proposes a formal appeals channel titled 'A Word with Management,' projected paperwork: 214 documents monthly. Footnote: the talking itself is free.",
  ev_appeal_a_btn: "Open the Channel",
  ev_appeal_a_result: "Channel open: 217 filings on day one, 214 of them titled 'Request for More Words with Management.' Morale greatly up; paperwork extends the schedule.",
  ev_appeal_b_btn: "Keep the Status Quo",
  ev_appeal_b_result: "Proposal politely declined; appeals continue via the suggestion box; small credits saved; morale slightly down. The box filled up a third time this week — this time with a hard hat in it.",

  ev_friday_title: "Friday Drinks Budget Request",
  ev_friday_desc: "The bar filed the Friday drinks budget under a neat 'team building' justification, with 217 attached photos, 200 of them blurry toasts.",
  ev_friday_a_btn: "Reimburse Round One",
  ev_friday_a_result: "First round fully reimbursed. Morale greatly up, credits spent. The next day's briefing was one line: 'Yesterday we didn't mine ore. We mined feelings.'",
  ev_friday_b_btn: "Non-Alcoholic Only",
  ev_friday_b_result: "The non-alcoholic batch arrived, saving 60% of budget. Within two minutes, the entire batch was poured into the same potted plant — the plant now sways standing up. Morale slightly down.",

  ev_audit_title: "Mothership Audit Team Arrives",
  ev_audit_desc: "The mothership audit team has landed on Space Rig 17 for a full-ledger review. The auditor's opening line: 'We were just passing through the galaxy. Carrying spreadsheets.'",
  ev_audit_a_btn: "All-Night Reconciliation",
  ev_audit_a_result: "Books reconciled overnight; audit rated excellent; reward credits received; morale greatly down — the morale report was also very easy to audit: one cell.",
  ev_audit_b_btn: "Take Them to the Bar",
  ev_audit_b_result: "The auditors stayed for a third round; closing remarks: 'Numbers flex. Dwarves don't.' The audit passed smoothly; morale slightly up; hospitality expenses duly filed.",

  ev_tax_title: "Mining Tax Audit Notice",
  ev_tax_desc: "A tax office notice has arrived: this quarter's Morkite sales show 'disputable declaration interpretations.' Accounting's complexion is now darker than the deepest stratum.",
  ev_tax_a_btn: "Pay in Full",
  ev_tax_a_result: "Taxes paid in full; credits flowed out heavily; morale slightly down. Finance framed the receipt under the title: 'Cost Is Also Contribution.'",
  ev_tax_b_btn: "Invoke the Old Loophole",
  ev_tax_b_result: "Accounting invoked Clause 41 of the 1987 Mining Tax Code; the bill shrank sharply; morale slightly up. Clause 41 opens with: 'This clause should no longer be used.'",

  ev_overtime_title: "'Voluntary' Overtime Initiative",
  ev_overtime_desc: "To recover this contract's schedule, Management has drafted the Voluntary Overtime Initiative. Legal's note: 'The quotation marks around voluntary are mandatory. Not one may be removed.'",
  ev_overtime_a_btn: "Pay Overtime to Speed Up",
  ev_overtime_a_result: "Overtime pay issued in full; the mission finished early; morale slightly up — the paid dwarves confirmed their volunteering was entirely heartfelt.",
  ev_overtime_b_btn: "Moral Encouragement Only",
  ev_overtime_b_result: "The initiative was read aloud in full; the key incentive is a virtual medal. The mission finished equally early; morale greatly down: the medal is large enough to cover a payslip.",

  ev_teambuild_title: "Team-Building Package Comparison",
  ev_teambuild_desc: "HR presents two team-building options: A, 'tunnel march'; B, 'cancel and save the budget.' Note: both options once recorded 100% approval.",
  ev_teambuild_a_btn: "Tunnel March",
  ev_teambuild_a_result: "The march went ahead — three tunnel floors with ore bags on. Morale greatly up, schedule extended. HR's summary: 'Tiring. But tiring together.'",
  ev_teambuild_b_btn: "Cancel, Save Budget",
  ev_teambuild_b_result: "Team building cancelled; the budget credited; morale slightly down. A handwritten patch appeared on the notice board: 'Today's activity: watching yourself give up team building.'",

  ev_coffee_title: "Coffee Machine Procurement",
  ev_coffee_desc: "Engineering requests an industrial coffee machine. Justification: 'Caffeine is fuel too — the only kind that doesn't explode.' Alternative: keep drinking Dark Morkite Ale on shift.",
  ev_coffee_a_btn: "Buy the Machine",
  ev_coffee_a_result: "The machine arrived and the mission sped up; morale slightly up. Eighteen hours of per-capita wakefulness — every bug on the new schematics grew two extra legs.",
  ev_coffee_b_btn: "Keep the Ale Flowing",
  ev_coffee_b_result: "Dark Morkite Ale on tap; morale greatly up, schedule extended. The ledger trading alcohol percentage for progress will not be published — Finance refuses to run the numbers.",

  ev_printer_title: "Report Printer Goes on Strike",
  ev_printer_desc: "The settlement-report printers have gone on strike, displaying the error code: 'NO.' Administration confirms this is the first true statement they have ever printed.",
  ev_printer_a_btn: "Call Engineering",
  ev_printer_a_result: "Engineering repaired them overnight and all backlogs printed; morale slightly up. The displays now read: 'Beer. Then work.' Budget approved.",
  ev_printer_b_btn: "Everyone Copies by Hand",
  ev_printer_b_result: "Handwritten reports, handwriting devolving from neat to cursive to pictographic. Schedule extended, morale slightly down. For the first time in history, the whole squad missed a machine.",

  ev_memorial_title: "Memorial Hall Upgrade Proposal",
  ev_memorial_desc: "The Memorial Hall's name plaques are worn. Two options: A, gild the plaques; B, replace with a digital screen — the vendor promises 'rotation, with ad slots.'",
  ev_memorial_a_btn: "Gild the Plaques",
  ev_memorial_a_result: "The plaques are gilded; the engraved names gleam with dignity; morale greatly up. Management's note: this is the most mining-like money this company ever spent.",
  ev_memorial_b_btn: "Digital Screen",
  ev_memorial_b_result: "The screen is live: names rotate, interspersed with 'Lean Mining' ads. Small credits received; morale greatly down: heroes' names should not carry banner ads.",

  ev_dock_title: "Rockdock Damage Report",
  ev_dock_desc: "Three fresh scratches have appeared on the Rockdock's gate. The responsible party is unknown; witness statements are unanimous: 'The gate came at us.' The damage report has reached Management's desk.",
  ev_dock_a_btn: "Self-Inspect, Self-Repair",
  ev_dock_a_result: "The squad sanded and repainted it on their own initiative; schedule extended, minor materials cost, morale slightly up — the three scratches are now painted as a small union flag.",
  ev_dock_b_btn: "File an Insurance Claim",
  ev_dock_b_result: "Insurance denied the claim for 'unverified scratch origin'; credits paid as billed; morale slightly down. Policy clause 7 holds again: insurance covers nothing, including itself.",

  ev_steelbear_title: "'Steel Bear' Merchandise Listing",
  ev_steelbear_desc: "The company store proposes a 'Steel Bear' merchandising line: toy bears in power armor, slogan 'Hard as steel, ursine as you.' The sample has already floored three gunners.",
  ev_steelbear_a_btn: "Stock a Batch",
  ev_steelbear_a_result: "One Steel Bear per miner; morale greatly up, credits spent. Workplace injuries fell this month — everyone was too busy posing their bears to arm-wrestle.",
  ev_steelbear_b_btn: "Limited Auction",
  ev_steelbear_b_result: "Seventeen units auctioned; a fat credit payout; morale slightly down. The underbidders have queued themselves for 'Steel Bear Gen 2' — the price-hike quote came from Finance."

};


/* =========================================================
 * L() 取词系统：en 时查词表，zh 时原文兜底
 * ========================================================= */
const I18N_EN = {
  /* —— 标点/符号（拼接日志用，zh 原样返回）—— */
  '【':'[', '】':']', '。':'.', '，':', ', '、':', ', '：':': ', '！':'!', '？':'? ',
  '（':' (', '）':')', '「':'"', '」':'"', '｜':' | ', '　':' ',

  /* —— 资源/矿物（官方 locres 术语）—— */
  '代币':'credits', ' 代币':' credits', ' 代币 ':' credits ', ' 代币）':' credits)',
  '墨菱石':'Morkite', '墨菱油':'Liquid Morkite', '硝石':'Nitra', '黄金':'Gold', '红糖':'Red Sugar',
  '玉石':'Jadiz', '乌玛石':'Umanite', '铜矿':'Croppa', '妙绝珠':'Enor Pearl',
  '吸铁石':'Magnite', '蜂母石':'Bismor', '容和石':'Hollomite',
  '稀有矿物':'Rare Minerals', '稀有矿物全族':'all rare minerals',
  '空白模组':'Blank Core', '空白模组 ':'Blank Core ', '功绩点':'Merit', ' 功绩点':' Merit', '（功绩点 ':' (Merit ',
  ' 代币 + ':' credits + ',

  /* —— 职业/单位 —— */
  '侦察兵':'Scout', '工程师':'Engineer', '枪手':'Gunner', '钻机手':'Driller',
  '侦察':'Scout', '工程':'Engi', '钻机':'Driller', '神秘矮人':'a mystery dwarf',
  '复拓者 · 精英支援位':'Reclaimers · Elite Support',
  '矿工':'miner',

  /* —— 任务类型（官方）—— */
  '采矿探险':'Mining Expedition', '定点提取':'Point Extraction', '就地精炼':'On-Site Refining',
  '执勤护送':'Escort Duty', '搜救行动':'Salvage Operation', '消灭任务':'Elimination',

  /* —— 实时小游戏（二期：point/salv 接线）—— */
  '实时进入':'Enter Live Mission', '实时护送':'Live Escort', '实时下矿':'Live Mining',
  '实时定点提取':'Live Point Extraction', '实时搜救':'Live Salvage Operation',
  '实时精炼':'Live On-Site Refining', '实时消灭':'Live Elimination',
  '实时介入 · 亲自下场':'Live intervention · take the wheel',
  '直接操控 1 名矿工定点提取：跟随信标按住左键钻采矿结，把矿块搬回莫莉入库（每入库 1 块引来一小波虫潮）；携带矿块时移速降低且只能用副手武器。配额完成后撤离即胜。':
    'Directly control one miner in Point Extraction: follow the beacons and hold attack to drill the rich nodules, haul chunks back to Molly and deposit (each deposit draws a small swarm); while carrying a chunk you move slower and can only fire your secondary. Extract after quota to win.',
  '直接操控 1 名矿工搜救：找回 4 条矿骡腿装上残骸（每装 1 条刷防御虫），再长按互动键修复矿骡 3 秒；运腿与修复期间压力十足。修好后撤离即胜。':
    'Directly control one miner in Salvage Operation: recover 4 M.U.L.E. legs and mount them on the wreck (each mount spawns defenders), then hold the interact key to repair the M.U.L.E. for 3 seconds; hauling legs and repairing draw constant pressure. Extract after repairs to win.',
  '直接操控 1 名矿工就地精炼：从精炼单元领取管道段（一次一段，携带时移速 -20% 且只能用副手武器），到远处油井按 E 铺设管线并安装泵；泵自动抽油汇入精炼单元，但虫子会专门啃泵——停摆后长按互动键修理。集齐原油配额即胜。':
    'Directly control one miner in On-Site Refining: grab pipe segments at the refinery unit (one at a time, -20% speed and secondary-only while carrying), then press interact at a distant oil well to lay the pipeline and install the pump; pumps feed crude oil back automatically but bugs chew on them — hold interact to repair a wrecked pump. Win by meeting the crude quota.',
  '直接操控 1 名矿工消灭任务：直捣竞技场中心长按破茧，唤醒无畏机甲。装甲态只有腹部发光弱点吃伤害（×3），弱点随时间换位，它还会召唤小虫；血量过半进入狂暴（移速/攻速 +30%，新增酸弹三连）。击杀即胜。':
    'Directly control one miner in Elimination: push to the arena center and crack the cocoon to wake the Dreadnought. While armored only its glowing abdomen weak point takes real damage (×3) and it relocates over time; past half health it enrages (+30% speed/attack, triple acid spit). Kill it to win.',

  /* —— 终局强制实时（危5）—— */
  '终局任务 · 必须亲自下场':'Finale contract · you must take the field',
  '终局 · 亲自下场':'Finale · take the wheel',
  '清账行动的终局任务不接受挂机派遣：管理层必须亲自进入洞穴。系统将自动编入最多 4 名最适矿工，胜利后按实战表现结算并推进战役；失败后任务回到任务板，可重新编队再战。':
    'Finale contracts of the Cleanup Operation refuse idle dispatch: management must enter the cave in person. Up to 4 best-fit miners are auto-squadded; a win settles on live performance and advances the campaign; on a loss the mission returns to the board for another attempt.',
  '进入洞穴':'Enter the Cave',
  '终局编队已就绪':'Finale squad ready',
  '没有可出勤的矿工（需空闲且士气 ≥25）。':'No miners available for duty (idle with morale ≥25 required).',

  /* —— 生物群系（官方）—— */
  '水晶洞穴':'Crystalline Caverns', '盐坑':'Salt Pits', '霉菌沼泽':'Fungus Bogs',
  '飞沙走廊':'Sandblasted Corridors', '放射性禁区':'Radioactive Exclusion Zone',
  '密林丛原':'Dense Biozone', '冰封岩层':'Glacial Strata', '藤络树洞':'Hollow Bough',
  '熔岩之心':'Magma Core', '蔚蓝花甸':'Azure Weald', '栖骨深渊':'Ossuary Depths',

  /* —— 主手武器全名（名册 CLASSES.w 用）—— */
  '深核 GK2 突击步枪':'DeepCore GK2', 'M1000 经典型指令步枪':'M1000 Classic', 'M1000 经典型步枪':'M1000 Classic',
  'DRAK-25 电浆卡宾枪':'DRAK-25 Plasma Carbine', '"疣猪" 210 自动霰弹枪':'"Warthog" Auto 210',
  'LOK-1 智能步枪':'LOK-1 Smart Rifle', '「百万」伏特微型冲锋枪':'"Stubby" Voltaic SMG',
  '"铅暴" 转管机枪':'"Lead Storm" Powered Minigun', '"雷暴云砧" 重型双管机炮':'"Thunderhead" Heavy Autocannon',
  '"飓风" 制导火箭系统':'"Hurricane" Guided Rocket System', 'CRSPR 火焰喷射器':'CRSPR Flamethrower',
  '急冻喷射炮':'Cryo Cannon', '蚀泥喷射泵':'Corrosive Sludge Pump',

  /* —— 酒名（官方 U27 名）与效果 —— */
  '油头精酿':'Oily Oaf Brew', '叶子情人特调':"Leaf Lover's Special", '黑墨菱酒':'Dark Morkite Ale',
  '隧道老鼠':'Tunnel Rat', '亚肯黑啤':'Arken Blackout', '红岩爆破手':'Red Rock Blaster',
  '昏迷黑啤':'Blackout Stout', '虫洞特酿':'Wormhole Special', '氧气助推':'Oxygen Boost',
  '碎颅者麦酒':'Skull Crusher Ale', '杀手黑啤':'Slayer Stout', '仲裁者黑啤':'Arbitrator',
  '岩石甜心':'Rocky Mountain', '麦芽星果特调':'Malt Star', '昏迷黑啤·特浓':'Blackout Stout ×',
  '🎰 神秘特调':'Mystery Special',
  '全队产出 +10%':'Squad yield +10%', '轻伤全愈 + 账单 -30%':'Light injuries healed + bills -30%',
  '主矿物产出 +25%':'Primary mineral yield +25%', '任务时长 -10%':'Mission duration -10%',
  '士气 -5%（喝多了）':'Morale -5% (had one too many)', '重伤判定免除 1 例':'1 heavy-injury check waived',
  '本次派遣无法手动操作（喝倒了，自动接管）':'This dispatch cannot be operated manually (passed out; autopilot takes over)',
  '事件成功率 +10%':'Event success +10%', '稀有掉落 +8%':'Rare drops +8%',
  '事件检定 +15%':'Event checks +15%', '全队产出 +20%':'Squad yield +20%',
  '医疗账单 -40%':'Medical bills -40%', '全队 XP +20/任务':'Squad XP +20/mission',
  '全队 XP +30/任务':'Squad XP +30/mission',
  '无法操作 + 时长 +20%（彻底喝倒了）':'Cannot operate + duration +20% (completely passed out)',
  '随机复制本池任一效果':'Randomly copies one effect from this pool',
  '常见':'Common', '少见':'Uncommon', '精英':'Elite', '传说':'Legendary',

  /* —— 饰品描述 —— */
  '小精灵很能干，一个人干了三个人的活——包括喝酒。':"The elf works hard: one elf doing three dwarfs' jobs — drinking included.",
  '龙年舞龙，财源滚滚。财务部难得没有反对。':'Dragon dance for the lunar year; wealth rolls in. For once, Finance did not object.',
  '小马跑得快，全队跟着快。':'The pony runs fast; the squad follows fast.',
  '兔子繁殖率高，矿苗也跟着涨。':'Rabbits breed fast; ore yields follow.',
  '蛇的直觉，专挑软土下铲。':"A snake's instinct: always digs where the soil is soft.",
  '夏日限定。漂在矿骡水壶里，莫名解压。':"Summer limited. Floating in the M.U.L.E.'s canteen — oddly soothing.",
  '上发条的兔子，刨地比镐子还快。':'A wind-up bunny that digs faster than a pickaxe.',
  '戴上它，加班都像联欢会。':'Wear it and overtime feels like a party.',
  '遮阳、透气、离岗理由排行第一。':'Shade, ventilation, and the #1 excuse to leave your post.',
  '复活节限定。eggsquisite：官方拼的，我们不敢改。':'Easter limited. eggsquisite: official spelling; we dare not fix it.',
  '酒量 +0，运量 +10。巴伐利亚皮裤不包退。':'Drinking capacity +0, hauling +10. Bavarian lederhosen non-refundable.',
  '官方全名。虫子看了都愣半秒——足够开一枪了。':'Official full name. Bugs freeze for half a second at the sight — enough time to fire a shot.',
  '毛绒绒的，专为季节性生产力波动提供官方理由。':'Fluffy, and an official excuse for seasonal productivity fluctuations.',
  '五周年限定。前四年都在填这个坑。':'5th anniversary limited. The previous four years were spent filling this hole.',
  '六周年限定。坑还在挖，但灯装好了。':'6th anniversary limited. Still digging the hole, but the lights are in.',
  "七周年限定。财务部说这叫'长期主义'。":"7th anniversary limited. Finance calls this long-termism.",
  '八周年限定。奖杯比原来的钻台模型还重。':'8th anniversary limited. The trophy outweighs the original rig model.',
  '洞穴里没太阳，但态度要有。':'No sun in the caves. Attitude still required.',
  '省下的布料都换成了工期。':'The saved fabric was converted into schedule.',
  '把祖传镐头挂在胸前——迷信？这叫企业文化。':'An ancestral pickaxe head worn on the chest — superstition? This is corporate culture.',

  /* —— 精英单位描述 —— */
  '排斥力场一开，虫子的牙签扎不透护盾。':"Repulsion field on; the bugs' toothpicks cannot pierce the shield.",
  '揭敌镖弹先飞一步，选项成功率明码标价。':'The spotter dart flies a step ahead; option success rates come with a price tag.',
  '无人机盘旋一圈，连矿脉私房钱都报出来。':"One drone orbit reports even the veins' secret savings.",
  '等离子剑开路。战斗失败？剑和腰带了谁，账单找谁——找一半。':'Plasma blade leads the way. Lost the fight? Whoever kept the blade and the belt gets the bill — half of it.',
  '锚点回溯：把一次失败从时间线上划掉。':'Anchor rewind: strikes one failure from the timeline.',

  /* —— 深潜修正器描述 —— */
  '任务区域内黄金矿脉异常富饶。我们发财了！——财务部对这句话的翻译是：深潜订单加价 100%。':"Gold veins in the mission area are unusually rich. We're rich! — Finance's translation: Deep Dive contracts pay +100%.",
  '本层墨菱石储量远超申报单。勘测部表示报告没写错，是矿脉太敬业。（名称待核）':'Morkite reserves on this layer far exceed the filing. Survey says the report is accurate; the vein is just overcommitted. (name pending)',
  '引力紊乱：所有人蹦得又高又远——包括虫。工期缩短 15%，精英虫更难缠。':'Gravity disturbed: everyone bounces high and far — bugs included. Duration -15%; elite bugs meaner.',
  '本周下潜经历按双倍计入培训档案。人事部：这也是一种绩效。':"This week's dive experience logs double into training files. HR: it is also a form of performance.",
  '打弱点格外疼——对所有事件检定 +10%。打哪儿哪疼，这是天赋。（名称待核）':'Weakspots hurt extra — all event checks +10%. Hitting where it hurts is a talent. (name pending)',
  '空气格外提神：工期 -10%，士气 +2/任务。副作用是嗓音变得格外搞笑。':'The air is extra stimulating: duration -10%, morale +2/mission. Side effect: voices become extra funny.',
  '杀虫如赚钱，死虫子早该爆金币——官方原话，本次合同照办：产出 +30%，士气 +3/任务。（名称待核）':'Killing bugs pays; dead bugs should drop gold — official words, honored in this contract: yield +30%, morale +3/mission. (name pending)',
  '收手吧矿工，洞里全是洞穴水蛭——官方原话。水蛭事件权重 ×3，请总是抬头观察。':'Give it up, miners; the cave is full of Cave Leeches — official words. Leech event weight ×3; always watch the ceiling.',
  '准备迎接海啸般的蜂拥异虫吧！虫潮权重 ×2 且更难硬刚（T+0.5）。':'Brace for a tsunami of Swarmers! Swarm weight ×2 and harder to face head-on (T+0.5).',
  '源源不断的自爆异虫群。医疗站已按账单 +25% 预订了额外的纱布。':'Endless waves of Exploders. The Medical Bay has pre-ordered extra gauze at bills +25%.',
  '主要威胁来自空中。精英虫权重 ×2、T+0.3——请把照明弹的预算花在刀刃上。':'The main threat comes from the air. Elite bug weight ×2, T+0.3 — spend the flare budget wisely.',
  '几秒不打，虫血回满。所有事件检定 -10%：别停手，也别手抖。':"Stop shooting for a few seconds and the bugs fully heal. All event checks -10%: don't stop, and don't tremble.",
  '虫的近手伤害大幅上涨。医疗账单 +50%、住院时间 +25%——账单比虫子更疼，本周双倍兑现。':'Bug melee damage sharply up. Medical bills +50%, hospital stays +25% — the bill hurts more than the bug; this week it pays double.',
  '检测到无法归档的声源。士气 -5/任务：不是怕，是"高度警觉"，人事部坚持用后者。':"Unarchivable sound source detected. Morale -5/mission: not fear — 'heightened vigilance,' per HR's insistence.",
  '呼吸要靠矿骡的氧气瓶。补给硝石 +25%（60→75/人）：频繁回补给点，运费照涨。（名称待核）':"You breathe from the M.U.L.E.'s oxygen bottles. Supply Nitra +25% (60→75/head): frequent resupply runs, freight rates as usual. (name pending)",
  '传感器侦测到强敌机器人出没。精英虫 T+0.5，但猎杀成功额外 +1 武器凭证——风险与绩效成正比。':'Sensors detect rival robots. Elite bugs T+0.5, but successful hunts grant +1 weapon license — risk proportional to performance.',

  /* —— 每日提示（TIPS）—— */
  '硝石是派遣的命脉。任务会带回硝石，但满编队永远嫌不够。':'Nitra is the lifeline of dispatch. Missions bring it back, but a full squad never has enough.',
  '危险等级越高报酬系数越高——前提是，活着回来。':'Higher hazard pays a higher multiplier — provided you come back alive.',
  '完成三提石任务可得空白模组，锻造台 3 选 1 抽卡。10 抽内必出 T1 毕业档。':'Tritilyte missions grant Blank Cores for 3-pick gacha at the Forge. A T1 graduation mod is guaranteed within 10 draws.',
  '抽到重复模组会触发免费重抽。集团管这叫"用户关怀"。':'Duplicate mods trigger a free reroll. The Corporation calls this "customer care."',
  '士气低于 25 的矮人会拒绝下矿。深渊酒吧一轮就管用——但要花钱。':'Dwarfs below 25 morale refuse to mine. One round at the Abyss Bar fixes it — for a price.',
  '红糖可以在医疗站抵扣账单。集团：先抢救，后收费。':'Red Sugar can offset Medical Bay bills. Corporate policy: rescue first, charge later.',
  '市场有涨有跌。追涨杀跌之前，先想想你的 KPI。':'Markets rise and fall. Before chasing the trend, think of your KPI.',
  '墨菱石既是钻井平台的升级材料，也是 KPI 指标。抛售之前想清楚。':'Morkite is both rig upgrade material and the KPI metric. Think twice before selling.',
  '本终端对烧伤不予理赔。谢谢配合。':'This terminal does not cover burn injuries. Thank you for your cooperation.',
  '晋升会重置等级，但晋升框加成永久生效。集团鼓励长期奋斗。':'Promotion resets level, but frame bonuses are permanent. The Corporation encourages long-term striving.',
  '精英异虫掉好东西——但也真的会还手。':'Elite bugs drop good loot — and they really do hit back.',
  '离线期间钻台以 10% 效率运转。集团认为这已经很慷慨了。':'The rig runs at 10% efficiency while offline. The Corporation considers this generous.',
  '任务指挥的每句"祝你好运"都是字面意思：剩下的看运气。':'Every "good luck" from Mission Control is literal: the rest is up to luck.',
  '挖到手软，赚到盆满。今天也要安全地把矿骡装满。':'Dig deep, get rich. Another day of safely filling up the M.U.L.E.',

  /* —— 彩蛋语 —— */
  '📍 洞穴深处传来一声悠长的号角。有老矿工发誓，那是卡尔在吹。管理层表示：无可奉告。':'📍 A long horn call echoed from deep in the cave. Veteran miners swear it was Karl playing. Management: no comment.',
  '📍 本次任务的洞穴岩壁上发现一行刻字："卡尔到此一挖"。考古价值：无。纪念意义：满级。':'📍 A carving was found on this mission\'s cave wall: "Karl wuz here." Archaeological value: none. Sentimental value: max level.',

  /* —— 编年史节点 —— */
  '正式发售':'1.0 Launch', '一周年':'1st Anniversary', '第一赛季':'Season 1', '第二赛季':'Season 2',
  '第三赛季':'Season 3', '第四赛季':'Season 4', '第五赛季':'Season 5', '第六赛季':'Season 6',
  '春节（终场）':'Lunar New Year (Finale)', '清账行动':'Operation Ledger-Clearing',

  /* —— 战役（CAMPAIGNS）—— */
  '管理层入职培训':'Management Onboarding', '完成 2 次采矿探险':'Complete 2 Mining Expeditions',
  '上缴 80 墨菱石':'Deliver 80 Morkite', '300 代币 + 硝石×60':'300 credits + Nitra ×60',
  '深渊酒吧开业':'Grand Opening of the Abyss Bar', '完成 2 次就地精炼':'Complete 2 On-Site Refinings',
  '掉落稀有矿物 10 块':'Collect 10 rare mineral drops', '免费招募工程师 + 蜂母石×10':'Free Engineer + Bismor ×10',
  '挖更深一点':'Dig a Little Deeper', '完成 3 次危险 ≥2 的任务':'Complete 3 missions at hazard ≥2',
  '500 代币 + 黄金×5':'500 credits + Gold ×5', '枪手上岗':'Gunner On Duty',
  '完成 1 次消灭任务':'Complete 1 Elimination', '免费招募枪手 + 400 代币':'Free Gunner + 400 credits',
  '装备热身':'Equipment Warm-Up', '升级 1 次任意武器凭证':'Upgrade any weapon license once',
  '300 代币 + 吸铁石×10':'300 credits + Magnite ×10', '猎虫执照':'Bug-Hunting License',
  '猎杀 1 只精英异虫':'Kill 1 elite bug', '600 代币 + 玉石×10':'600 credits + Jadiz ×10',
  '深处有动静':'Something Stirs Below', '完成 1 次搜救行动':'Complete 1 Salvage Operation',
  '掉落稀有矿物 20 块':'Collect 20 rare mineral drops', '免费招募钻机手 + 乌玛石×20':'Free Driller + Umanite ×20',
  '矿物大单':'The Big Mineral Order', '上缴 400 墨菱石':'Deliver 400 Morkite',
  '800 代币 + 妙绝珠×10':'800 credits + Enor Pearl ×10', '猎虫老手':'Veteran Bug Hunter',
  '猎杀精英异虫 3 只':'Kill 3 elite bugs', '完成 2 次危险 ≥3 的任务':'Complete 2 missions at hazard ≥3',
  '黄金×20 + 容和石×30':'Gold ×20 + Hollomite ×30', '集团大单':'The Corporate Mega-Order',
  '达成 1 次季度 KPI':'Hit a quarterly KPI', '完成 3 次危险 ≥4 的任务':'Complete 3 missions at hazard ≥4',
  '2,000 代币 + 玉石×20':'2,000 credits + Jadiz ×20',
  '完成 5 次消灭任务':'Complete 5 Eliminations', '完成 3 次危险 5 任务':'Complete 3 hazard-5 missions',
  '上缴 3000 墨菱石':'Deliver 3000 Morkite', '退还保证金 ×3 + 编年史收官':'Deposit refunded ×3 + Chronicle epilogue',
  '完成 2 次危险 5 任务':'Complete 2 hazard-5 missions', '完成 4 次':'Complete 4 ',
  '无尽委托 · 第 ':'Endless Contract · Round ', ' 轮':'',

  /* —— 节日（HOLIDAYS）—— */
  '农历新年':'Lunar New Year', '集团周年庆':'Corporate Anniversary', '春日猎蛋':'Spring Egg Hunt',
  '夏日沙滩派对':'Summer Beach Party', '啤酒节':'Oktoberfest', '万圣惊魂夜':'Halloween Spooktacular',
  '圣诞尤节':'Yuletide',
  '800 代币 + 容和石×30':'800 credits + Hollomite ×30', '1,000 代币 + 黄金×15':'1,000 credits + Gold ×15',
  '700 代币 + 玉石×15':'700 credits + Jadiz ×15', '700 代币 + 铜矿×15':'700 credits + Croppa ×15',
  '800 代币 + 蜂母石×15':'800 credits + Bismor ×15', '900 代币 + 妙绝珠×15':'900 credits + Enor Pearl ×15',
  '900 代币 + 乌玛石×15':'900 credits + Umanite ×15',
  '节日期间完成 5 次派遣':'Complete 5 dispatches during the festival',
  '节日期间完成 6 次派遣':'Complete 6 dispatches during the festival',
  '节日期间完成 4 次派遣':'Complete 4 dispatches during the festival',

  /* —— 任务条款 —— */
  '富金矿脉':'Rich Gold Vein', '黄金产出 ×2':'Gold output ×2',
  '夜班赶工':'Night Shift Crunch', '代币 +20%，时长 +10%':'Credits +20%, duration +10%',
  '轻装上阵':'Travel Light', '硝石消耗 ×1.5，全部产出 +20%':'Nitra cost ×1.5, all output +20%',

  /* —— 任务描述（任务卡）—— */
  '探索水晶洞穴，开采矿脉资源。':'Explore the crystalline caverns and mine the vein resources.',
  '在指定区域建立临时开采点。':'Establish a temporary extraction site in the designated area.',
  '铺设管线并提炼地下墨菱油。':'Lay pipelines and refine underground Liquid Morkite.',
  '护送钻探设备深入岩层核心。':'Escort the drilling equipment into the rock core.',
  '回收失联小队与遗留设备。':'Recover the lost squad and their abandoned equipment.',
  '定位巢穴并清除高危目标。':'Locate the nest and eliminate the high-risk target.',
  '执行集团指派的深层采掘任务。':'Execute a corporate deep-extraction contract.',

  /* —— 钻井阶梯/矿骡/设施 —— */
  '解锁：工程师 + 就地精炼 + 深渊酒吧':'Unlocks: Engineer + On-Site Refining + The Abyss Bar',
  '解锁：危险等级 2':'Unlocks: Hazard Level 2',
  '解锁：枪手 + 搜救行动/消灭任务 + 装备终端':'Unlocks: Gunner + Salvage/Elimination + Equipment Terminal',
  '解锁：危险等级 3':'Unlocks: Hazard Level 3',
  '解锁：钻机手 + 黑墨菱酒上架':'Unlocks: Driller + Dark Morkite Ale on tap',
  '解锁：危险等级 4 + 执勤护送':'Unlocks: Hazard Level 4 + Escort Duty',
  '解锁：危险等级 5':'Unlocks: Hazard Level 5',
  '解锁：精英支援位购买资格':'Unlocks: Elite Support Slot purchase eligibility',
  '自动收集':'Auto-Collect', '任务结算时矿骡自动拾取遗漏——墨菱石产出 +20%':'Molly auto-collects missed minerals on settlement — Morkite yield +20%',
  '超载运输':'Overloaded Hauling', '矿骡多背了一倍——硝石返还 +50%':'Molly carries double — Nitra refund +50%',
  '季度 KPI 考核':'Quarterly KPI Review', '深渊酒吧':'The Abyss Bar', '交易站':'Mineral Exchange',
  '医疗站':'Medical Bay', '装备终端':'Equipment Terminal',

  /* —— 成就（40 项 + 分组）—— */
  '入门':'Rookie', '进阶':'Advanced', '精通':'Adept', '大师':'Master', '隐藏':'Hidden',
  '初次派遣':'First Dispatch', '侦察兵入门':'Scout 101', '第一杯酒':'First Pint', '第一颗星':'First Star',
  '第一件模组':'First Mod', '第一颗饰品':'First Trinket', '编年史开篇':'Chronicle Begins', '团灭初体验':'First Wipe',
  '满编作战':'Full Squad', '危5首通':'Hazard 5 Cleared', '深潜首通':'Deep Dive Cleared', '精英首通':'Elite Dive Cleared',
  '十连派遣':'Ten Dispatches', '模组收藏家':'Mod Collector', '饰品鉴赏家':'Trinket Connoisseur',
  '酒保常客':'Bar Regular', '编年史百日':'Chronicle: Day 100', "猫的好朋友":"The Cat's Best Friend",
  '武器大师':'Weapon Master', '模组毕业':'Mod Graduation', '平台全满':'Rig Maxed', '编年史双百':'Chronicle: Day 200',
  '节日全制霸':'Festival Grand Slam', '交易大亨':'Trade Tycoon', "猫的知己":"The Cat's Confidant",
  '零伤亡十连':'Ten Streak, Zero Casualties', '富甲一方':'Filthy Rich', '满级矿工':'Max-Level Miner',
  '编年史·完':'Chronicle: The End', '武器全满':'All Weapons Maxed', '模组全图鉴':'Full Mod Dex',
  '饰品全图鉴':'Full Trinket Dex', '精英全员':'All Elites', '深潜双通':'Both Dives Cleared',
  '无伤五十连':'Fifty Streak Unscathed', '挂机大师':'Idle Master', "卡尔的遗产":"Karl's Legacy",
  'v他50':'v Him 50', '断片初体验':'First Blackout', '神秘莫测':'Mysterious Ways',

  /* —— 顶栏/任务板 —— */
  '稀有矿物</span><small>RESOURCE</small>':'',
  '这些珍贵的资源，是人类迈向深空的基石。':"These precious resources are the cornerstone of humanity's march into deep space.",
  '继续':'Resume', '暂停':'Pause', '分':'m', '折叠':'Fold', '展开':'Unfold', '详细':'Detailed', '简洁':'Compact',
  '派遣卡尔':'Dispatch Karl', '战役需要「':'The campaign requires ', '」，请先将钻井平台升级至 Lv.':' — upgrade the rig to Lv. first. ',
  '派遣小队':'Dispatch Squad', '危险等级 ':'Hazard ', '预计产出：':'Est. yield: ',
  '详情 ›':'Details ›', '收起 ⌃':'Collapse ⌃', '深度档 ':'Depth tier ', ' · 建议职业：':' · Best class: ', '任意':'Any',
  '卡尔背起行囊：「帮我把遗单清了，管理层。」——他一个人走进了电梯。':'Karl shouldered his pack: "Clear my last contract for me, Management." — and he stepped into the elevator alone.',

  /* —— 派遣通道 —— */
  '实时任务 · ':'Live Mission · ', ' 正在等待你的直接指挥':' is awaiting your direct command',
  '继续任务':'Resume Mission', '召回':'Recall',
  '当前没有进行中的派遣任务':'No dispatches in progress',
  '派遣矿工前往未知的深处，挖掘属于集团的财富。':"Send miners into the unknown deep to dig up the Corporation's wealth.",
  '选择任务并派遣':'Pick a Mission', '待管理层决策':'awaiting management decision', '　剩余 ':' left ',
  '选择派遣任务':'Select a Mission', '选择任务后继续配置矿工与补给。':'Pick a mission, then configure squad and supplies.',
  ' · 危险等级 ':' · Hazard ',

  /* —— 名册 —— */
  '未解锁':'Locked', '建议先升级钻井平台以招募该职业。':'Upgrade the rig to unlock recruitment for this class.',
  '招募 · ':'Recruit · ', '空闲':'Idle', '任务中':'On Mission', '医疗中':'In Medbay', '晋升':'Promote',
  ' · 任务 ':' · Missions ', ' · 士气 ':' · Morale ',
  '士气低于 25 时矿工会拒绝下矿；25 级可申请晋升。':'Miners refuse to dig below 25 morale; promotion unlocks at level 25.',

  /* —— 装备终端 —— */
  '📦 仓库':'📦 Warehouse', '模组、饰品与空白模组的总仓库。':'The master warehouse for mods, trinkets and Blank Cores.',
  '▸ 携带规则与升级详情':'▸ Carry rules & upgrade details', '▾ 携带规则与升级详情':'▾ Carry rules & upgrade details',
  '每职业 3 级，每把武器 1 个模组槽。抽到重复模组自动折算 30% 造价的代币。':'3 levels per class; 1 mod slot per weapon. Duplicates auto-refund 30% of cost in credits.',
  '功绩点来源：深潜（每周最多 10）+ 季度 KPI +5 + 危5 任务 +1 + 精英虫 +1。空闲精英每游戏日收集 1 个匠器（下阶段开放）。':'Merit sources: Deep Dives (max 10/week) + quarterly KPI +5 + hazard-5 missions +1 + elite bugs +1. Idle elites collect 1 relic per game day (next phase).',
  '已佩戴：':'Equipped: ', '已佩戴·第二槽：':'Equipped (slot 2): ', '来源见帮助页。':'See the Help tab for sources.',
  '锻造台 · 模组抽卡':'Forge · Mod Gacha', ' 个':'×', '3 选 1':'3-pick',
  '✦ 三提石任务获取 · 重复自动折 30%':'✦ From Tritilyte missions · duplicates refund 30%', '抽卡':'Draw',
  '凭证':'License', '（两池前 ':' (first ', ' 把已解锁）':' of both pools unlocked)',
  '主手池':'Primary pool', '副手池':'Secondary pool', '（代币不足）':' (not enough credits)',
  '携带中':'Carried', '副手携带中':'Off-hand carried', '凭证 Lv.':'License Lv.', ' 解锁':' to unlock',
  '满级':'MAX', '携带':'Carry', '升级':'Upgrade', '缺料':'Need mats', '已装配：':'Equipped: ', '卸下':'Unequip',
  '模组：暂未抽到该武器的模组——锻造台全池抽卡随机产出。':'Mods: none drawn for this weapon yet — random output from the Forge all-pool gacha.',
  '无瑕':'Clean', '均衡':'Balanced', '不稳定':'Unstable', '装备':'Equip',
  '凭证升级至 ':'License upgrade to Lv. ', '两池各解锁下一把':'next weapon in both pools', '已达最高凭证。':'License already maxed.',
  '主手槽已换装：':' primary slot equipped: ', '副手槽已换装：':' secondary slot equipped: ',
  '主手':'Primary', '副手':'Secondary', '武器装配模组【':' weapon equipped: ', '】。':']. ',
  '的':' ', ' 装配了模组【':' equipped mod: ',
  '保底机制：本次必含 T1 毕业档。':'Pity system: this draw guarantees a T1 graduation mod.',
  '锻造台 · 模组抽取':'Forge · Mod Draw',
  '空白模组已插入锻造台。全池 3 选 1，选定后不可反悔——集团合同精神。':"Blank Core inserted into the Forge. Pick 1 of 3 from the whole pool; no take-backs — that's the corporate way.",
  '选这个（':'Pick this (',
  '】已编入随队名单，下次派遣一同下潜。':'] joined the carry roster and dives with the next dispatch.',
  '】已召回休整，转为收集匠器。':'] recalled to rest; now collecting relics.',
  ' 升级至 Lv.':' upgraded to Lv.', '/5！':'/5!',

  /* —— 酒吧 —— */
  '酒吧 Lv.':'Bar Lv.', '待生效酒 buff：':'Pending drink buff: ', '（下一次派遣消耗）':'(consumed by the next dispatch)',
  '无——请客喝酒后自动挂上。':'none — buy a round and it applies automatically.',
  '待生效酒：':'Pending drink: ', ' —— 下一次派遣消耗':' — consumed by the next dispatch',
  '下一次派遣出发时自动白送一轮':'one free round auto-granted when the next dispatch departs',
  '🎲 再抽一轮（':'🎲 Reroll (', '酒池 ':'Drink pool: ', ' 款：':' items: ',
  '扩建酒吧至 Lv.':'Expand bar to Lv. ', '扩建':'Expand',
  '稀有度':'Rarity', '效果':'Effect', '来源':'Source', '酒吧抽酒':'Bar gacha',
  '再抽一轮要 ':'A reroll costs ', ' 代币，财务部拒绝预支。':' credits. Finance declines to advance it.',
  '🍻 再抽一轮：「':'🍻 Reroll: "', '」（':'" (',
  '干杯':'Cheers', '🎲 再抽一轮':'🎲 Reroll',
  '」的效果！':'" effect!', '🎰 神秘特调开出了「':'🎰 The Mystery Special rolled the effect of "',
  '叶子情人特调下肚，':"One Leaf Lover's Special down; ", ' 名伤员当场满血归队。':' wounded returned to duty at full health.',

  /* —— 医疗站 —— */
  '医疗站 Lv.':'Medbay Lv.', '（-':' (-', '升级医疗站至 Lv.':'Upgrade Medbay to Lv. ',

  /* —— 钻井平台 —— */
  '钻井平台 Lv.':'Rig Lv. ', '镇台之宝：朵蕾妲头雕——第一次护送任务后，工程部坚持把它焊在了钻台顶上。没人舍得拆。':"The rig's crown jewel: Doretta's head — after the first escort, Engineering insisted on welding it to the rig top. Nobody has the heart to remove it.",
  '（已满级）':' (max)', 'Pack骡升级完成：Lv.':'M.U.L.E. upgraded: Lv. ', '——':' — ',
  '。矿骡表示车斗里终于像样了。':". Molly says the cargo bed is finally respectable.",
  '矿骡升级缺料：':'M.U.L.E. upgrade missing materials: ',
  '升级至 Lv.':'Upgrade to Lv. ', '：墨菱石×':': Morkite ×', ' + 墨菱油×':' + Liquid Morkite ×',
  '下一级：墨菱石产量再 +15%':'Next level: Morkite yield +15% again', '，解锁新深度档':', unlocks a new depth tier',
  '钻井平台已满级。集团发来贺电："终于把本钱挖回来了。"':'The rig is maxed. Corporate congratulation: "We finally dug our investment back."',
  '生物群系解锁进度':'Biome Unlock Progress', '（深度档 ':' (depth tier ', '｜稀有矿物：':' | rare minerals: ',
  '解锁阶梯':'Unlock Ladder',
  '稀有矿物是任务的额外掉落，矿工等级与凭证越高掉得越多。':"Rare minerals are bonus mission drops; the higher the miners' level and licenses, the more they drop.",

  /* —— 深潜 —— */
  ' 当前最高资历 ★':'. Current max seniority ★', '本周 ':'This week ',
  '⛏ 普通深潜（危4→5→5+）':'⛏ Normal Deep Dive (H4→5→5+)', '⚔ 精英深潜（危5→5+→5++）':'⚔ Elite Deep Dive (H5→5+→5++)',
  '✅ 已通关':'✅ Cleared', '第 ':'Stage ', '/3 段':'/3', ' 段：':' : ', '（危':' (H', '｜契合 ':' | best: ',
  '已通关':'Cleared', '奖励：空白模组×':'Reward: Blank Core ×', ' + ':' + ', ' 代币 + 功绩点×':' credits + Merit ×',
  '每周一 0 点刷新。':'Refreshes Mondays at 00:00.', '查看本周修正器':"View This Week's Modifiers",
  '普通 · ':'Normal · ', '精英 · ':'Elite · ', '本周修正器':"This Week's Modifiers", '本周无修正器记录':'No modifiers this week',
  '深潜开潜失败：':'Deep Dive launch failed: ', '需任一矿工晋升 ★':'Requires any miner promoted to ★',
  '需四职业满编且全员空闲':'Requires all four classes, everyone idle',
  '深潜第 ':'Deep Dive segment ', ' 段中止。':' aborted.', ' 段结算驳回：全队平均士气 ':' rejected at settlement: squad average morale ',
  ' 低于 ':' below ',

  /* —— 交易站 —— */
  ' 代币 <span':' credits <span', '买 max（':'Buy max (',
  '当前价':'Current price', '基准价':'Base price', '相对基准':'vs. base', '持有量':'Held', '持仓净值':'Position value',
  '确认清仓 ':'Confirm sell-all of ', '？再点一次':'? Click again', '持有 <b>':'Held <b>', '　市价 <b>':' market <b>',

  /* —— 战役栏 —— */
  '等待新的主线任务':'Awaiting the next campaign', '集团任务队列正在同步。':'The corporate campaign queue is syncing.',
  '战役【':'Campaign [', '将在 D':'Unlocks on day ', ' 解锁。':'. ',
  '奖励：':'Reward: ', '需钻井平台 Lv.':'Requires rig Lv.', '终局突入':'Final Assault', '当期节日：':'Current festival: ',
  '主线任务':'Main Campaign',

  /* —— 帮助页 —— */
  "管理层速查手册。所有规则详情都在这里，面板里不再重复解释。":"Management's quick reference. All the rules live here; panels no longer repeat them.",
  '核心循环':'Core Loop',
  '任务板接单 → 选职业派 1~4 人 → 途中处理事件 → 结算收益 → 升级钻井平台/装备/矿工 → 接更贵的单。':'Take contracts on the board → send 1–4 miners by class → handle events en route → settle earnings → upgrade rig/gear/miners → take pricier contracts.',
  '双层经济':'Two-Layer Economy', '墨菱石/墨菱油':'Morkite / Liquid Morkite',
  '（任务主产物）只喂钻井平台升级线，提升产量/深度/派遣位。<br>':' (primary mission products) feed only the rig upgrade line: yield / depth / dispatch slots.<br>',
  '（玉石/乌玛石/铜矿/妙绝珠/吸铁石/蜂母石/容和石）任务概率掉落，喂矿工成长与武器凭证。矿工越强掉落越多。</div>':' (Jadiz/Umanite/Croppa/Enor Pearl/Magnite/Bismor/Hollomite) drop by chance from missions, feeding miner growth and weapon licenses. Stronger miners drop more.</div>',
  '士气与深渊酒吧':'Morale & The Abyss Bar',
  '士气 0-100。低于 25 拒绝下矿。空闲每小时恢复（酒吧等级加速）。<b>深渊酒吧请一轮酒</b>：全员士气 +40，四款酒价格不同副作用不同。重伤入院全队 -15。':'Morale 0-100. Below 25 miners refuse to dig. Recovers hourly while idle (bar level speeds it up). <b>Buy a round at the Abyss Bar</b>: squad morale +40; different drinks, different prices, different side effects. Heavy injury: whole squad -15.',
  '晋升系统':'Promotions',
  '矿工 25 级满级 → 付费晋升：等级回到 1，晋升框与加成（+8%/★ 战斗力和掉落）永久保留。<br>晋升阶梯（每档 3 级）：铜→银→金→铂→祖母绿→蓝宝石→钻石→红，红 3 之后显示"额外晋升 ×N"。<br>晋升费：800 × 1.9^资历 代币。':'Miners cap at 25 → paid promotion: level returns to 1; frame and bonus (+8%/★ power and drops) are permanent.<br>Frame ladder (3 levels each): Bronze→Silver→Gold→Platinum→Emerald→Sapphire→Diamond→Red; after Red 3, shows "Extra Promotion ×N".<br>Cost: 800 × 1.9^seniority credits.',
  '武器与模组':'Weapons & Mods',
  '新武器通过战役任务解锁。每把武器可升级 5 次，只能装 1 个模组。<br>模组获取：任务板偶尔刷出<b>三提石任务</b>（✦ 标记）→ 完成得空白模组 → 锻造台 3 选 1 抽卡。重复免费重抽 1 次，10 抽保底 T1。':'New weapons unlock via campaigns. Each weapon upgrades 5 times and carries 1 mod.<br>Getting mods: the board occasionally offers a <b>Tritilyte mission</b> (✦ marker) → complete it for Blank Cores → 3-pick gacha at the Forge. Duplicates reroll free once; T1 guaranteed within 10 draws.',
  '每周刷新（周一 0 点），三段连续任务。解锁：任一矿工 ≥1★。精英深潜：≥3★。<br>强制四职业满编（缺员含住院不可开潜）。失败可重打当前段（重伤 ≥2 或士气 <25 → 阶段中止）。<br>通关奖励含空白模组和功绩点。':'Weekly refresh (Monday 00:00), three consecutive stages. Unlock: any miner ≥1★. Elite: ≥3★.<br>Forces a full four-class squad (no launching with anyone absent, medbay included). A failed stage can be retried (≥2 heavy injuries or morale <25 → stage aborts).<br>Completion pays Blank Cores and Merit.',
  '精英支援位':'Elite Support',
  '钻井平台 Lv10 解锁。用功绩点购买五名异动核心复拓者：<br>守护者（账单-30%）/ 歼察员（检定+10%）/ 驭鹰者（掉落+15%）/ 切割者（战斗+25%）/ 回溯者（每周回滚一次）。<br>每次派遣最多带 1 名，不占四职业名额。功绩点来源：深潜 / KPI / 危5 / 精英虫。':'Unlocks at Rig Lv10. Spend Merit on the five Rogue Core Reclaimers:<br>Guardian (bills -30%) / Spotter (checks +10%) / Falconer (drops +15%) / Slicer (combat +25%) / Retcon (one rewind per week).<br>Carry at most 1 per dispatch; does not take a four-class slot. Merit sources: Deep Dives / KPI / hazard-5 / elite bugs.',
  '矿物每日 ±10% 涨跌停，手续费 5%。低买高卖。墨菱石既是升级材料也是 KPI 指标也是商品——抛售前想清楚。':'Minerals move ±10% daily with a 5% fee. Buy low, sell high. Morkite is upgrade material, KPI metric, and commodity at once — think before you sell.',
  '稀有矿物对照':'Rare Mineral Cheat Sheet',
  '玉石=侦察主矿｜乌玛石=钻机主矿｜铜矿=枪手副矿｜妙绝珠=侦察副矿｜吸铁石=工程主矿｜蜂母石=枪手副矿｜容和石=低价值常见料。':'Jadiz = Scout primary | Umanite = Driller primary | Croppa = Gunner secondary | Enor Pearl = Scout secondary | Magnite = Engineer primary | Bismor = Gunner secondary | Hollomite = common low-value ore.',
  '隐藏内容':'Hidden Content', '据说有个叫卡尔的矮人。集团档案查无此人。':"They say there's a dwarf named Karl. The corporate files list no such person.",

  /* —— 系统页 —— */
  '重置存档（重新开局）':'Reset Save (fresh start)', '休眠舱':'Hibernation',
  '睡一天（+1 日，当日无任务收益）':'Sleep 1 day (+1 day, no mission income that day)', '睡一周（':'Sleep 1 week (',
  '自动存档保存在浏览器里；绑定文件夹后（Chrome/Edge），每次存档同步写入 drg_save.json，方便备份和传给朋友。':'Autosaves live in the browser; after binding a folder (Chrome/Edge), every save also writes drg_save.json for backups or sharing with friends.',
  '成就 ':'Achievements ', '🏛 纪念堂':'🏛 Memorial Hall', '⚙ 难度终端':'⚙ Difficulty Terminal', '统计':'Statistics',
  '完成任务 ':'Missions ', ' 次｜重伤 ':' | Heavy injuries ', ' 人次｜游戏时间 ':' | Game time ',
  '隐藏彩蛋：已发现 ':'Hidden eggs found: ',
  '"...敬卡尔。"——没有人问为什么。':'"...To Karl." — Nobody asked why.',
  '"开挂节约时间，不开浪费时间。"——某位矿业顾问的祝福还在生效。':'"Cheating saves time; not cheating wastes time." — a certain consultant\'s blessing is still active.',
  '黑脸小猫的本本上，记着这个钻台的名字。（当前记仇值 ':("The stony-faced cat's notebook has this rig's name in it. (Grudge: "), '/3）':'/3)',
  '测试协议':'Test Protocol', '输入测试码':'enter test code', '执行':'Run',
  '输入测试码并点击执行。效果：全模组解锁、资源注满、四职业满编、精英全员、深潜刷新。':'Type a test code and hit Run. Effects: all mods, full resources, full four-class roster, all elites, Deep Dive reset.',
  '无效测试码：':'Invalid test code: ', '。集团不认识这个暗号。':". The Corporation does not know this passphrase.",
  '确认重置？':'Confirm reset?', '确认重开':'Reset', '我再想想':'Let Me Think',
  '代币不足，集团休假申请被驳回。休眠舱也是要收费的。':'Not enough credits; the corporate leave request was denied. Hibernation costs money too.',
  '……例行 ':'… and ',' 条（点击展开）':' more entries (click to expand)',
  '任务板已折叠 · ':'Board folded · ', ' 个任务，点击展开':' missions; click to expand',

  /* —— 纪念堂/难度/详情 —— */
  '编年史档案':'Chronicle', '武器图鉴':'Weapon Dex', '饰品陈列柜':'Trinket Case', '成就墙':'Achievements',
  '已到达':'reached', '今日：D':'Today: D', '（终点 D2316，之后转无尽）':' (endpoint D2316; endless after)',
  '陈列柜空空如也——深潜与节日战役会掉落饰品。':'The display case is empty — Deep Dives and holiday campaigns drop trinkets.',
  '已达成':'Done', '关闭':'Close', '危1':'H1', '危2':'H2', '危3':'H3', '危4':'H4', '危5':'H5',
  '危险系数':'Hazard', '硝石消耗':'Nitra cost', '事件频率':'Event rate', '士气衰减':'Morale drain',
  '产出倍率':'Yield', '市场波动':'Market swing',
  '产出':'Yield', '时长':'Duration', '事件成功率':'Event success', '稀有掉落':'Rare drops', '医疗账单':'Medical bills', '⚙ 自定义难度终端':'⚙ Custom Difficulty Terminal',
  '难度越高产出越高（产出滑条自我平衡）。改动即时生效并入档。':'Higher difficulty pays more (the yield slider self-balances). Changes apply immediately and are saved.',
  '完成':'Done', '等级':'Level', '职业 / 凭证':'Class / License', '任务次数':'Missions', ' 次':' runs',
  '（产出加成 +':' (yield bonus +', '状态':'Status', '当前派遣':'Current Dispatch',
  '医疗站（剩余 ':'Medbay (', ' 游戏分钟）':' game min left)', '】剩余 ':'] — ', ' 游戏分':' game min',
  '下一页':'Next', '下一页 ▶':'Next ▶', '◀ 上一页':'◀ Prev',

  /* —— 事件选项后缀 —— */
  '（成功概率 ':' (success chance ',
  '%：奖励 +20%，士气 +10；失败：1 人重伤入院，任务继续）':'%: reward +20%, morale +10; fail: 1 heavy injury, mission continues)',
  '（无风险，任务时长 +25%）':' (no risk, mission duration +25%)',
  '（主矿物 ×1.6，稀有掉落 +50%，时长 +30%）':' (primary mineral ×1.6, rare drops +50%, duration +30%)',
  '（额外 +30 代币勘测报偿）':' (bonus +30 credits survey fee)',
  '（任务时长 +20%，无伤归队，全队士气 +5）':' (duration +20%, everyone returns unharmed, squad morale +5)',
  '（重伤入院：账单 ':' (heavy injury: bill ', ' 代币 + 休养 ':' credits + ',
  ' 游戏小时；全队士气 -15；任务继续）':' game hours; squad morale -15; mission continues)',
  ' 代币，时长 +5%）':' credits, duration +5%)',
  '（免费，时长 +20%，':' (free, duration +20%, ', '% 概率 1 人轻伤）':'% chance of 1 light injury)',
  '%：黄金 ×2 + 大量稀有矿物；失败：1 人轻伤，时长 +10%）':'%: gold ×2 + lots of rare minerals; fail: 1 light injury, duration +10%)',
  '（无事发生）':' (nothing happens)',
  '（全队士气 +15，下次派遣时长 -10%，记仇 -1）':' (squad morale +15, next dispatch duration -10%, grudge -1)',
  '（无事发生，记仇 +1）':' (nothing happens, grudge +1)',
  '（记仇值 ':' (grudge ', '——小猫已经在深潜简报上动笔了':" — the cat has started writing in the Deep Dive brief)",
  '（他的祝福已生效：工程师在队的虫潮，报酬 ×2）':' (his blessing is active: swarms with an Engineer on the team pay ×2)',
  '（本次任务时长 -50%）':' (this mission duration -50%)',
  '（-50 代币，永久：工程师在队时虫潮报酬 ×2、任务多耗 80 硝石）':' (-50 credits, permanent: swarms with an Engineer pay ×2, missions burn 80 extra Nitra)',
  '——已 v 过':" — already v'd", '——代币不足':' — not enough credits',
  '【首次提示】社区怪谈事件没有失败判定——两个选项都只是口味问题，放心选。':'[First-time note] Community rumor events have no fail state — both options are a matter of taste. Pick freely.',
  '奇怪的事件':'A Strange Event', '选项 A':'Option A', '选项 B':'Option B', '社区彩蛋':'Community Egg',
  '【警报】':'[ALERT] ', '派遣事件':'Dispatch Event', '⚡ 派遣事件 · ':'⚡ Dispatch Event · ',
  ' 突进虫群却毫发无伤——红岩爆破手的酒劲还在。':' charged into the swarm without a scratch — the Red Rock Blaster is still working.',
  '守护者折扣 -30%，':'Guardian discount -30%, ', '预计休养 ':'est. rest ', ' 现实分钟）':' real minutes)',
  '虫潮被顶回去了——lcyf166 的连锁核弹洗了地，报酬 ×2！代价：补给多烧掉 80 硝石。':'The swarm was pushed back — lcyf166\'s chain nukes scrubbed the field, rewards ×2! Cost: 80 extra Nitra burned.',
  '⟲ 回溯者发动锚点：本次团灭已从时间线上划除，账单全免。本周回溯已用 1/1。':"⟲ Retcon anchored: this wipe has been struck from the timeline, bills fully refunded. This week's rewind used 1/1.",
  '🛡 团灭救援：【':'🛡 Wipe rescue: [', '】把所有人从棺材价账单里捞了出来。产出保住 50%（+':'] pulled everyone out of a coffin-priced bill. 50% of yield saved (+',
  ' 代币），账单退还 ':' credits), bills refunded ', '，治疗提速 25%。':', treatment +25% faster.',
  '【离线结算】':'[Offline settlement] ', '任务中止：':'Mission aborted: ',
  '】全员退出战斗序列，无人机只抢回了 ':'] — the whole squad left the combat roster; the drone salvaged only ',
  ' 代币的矿袋。':' credits of ore.',
  ' 到装备终端的锻造台抽模组！':' — draw mods at the Equipment Terminal forge!',
  '🏆 清账行动全部完成。编年史收官。':'🏆 Operation Ledger-Clearing complete. The Chronicle is wrapped.',
  '🏆 清账行动 · 完成':'🏆 Operation Ledger-Clearing · Complete',
  'Rock and Stone，管理层。17 号钻台的账本，从今天起是干净的。':"Rock and Stone, Management. As of today, Space Rig 17's ledger is clean.",
  '🏆 清账行动完成。编年史收官——Day 2316 之后，无尽模式开启。':'🏆 Operation Ledger-Clearing complete. Chronicle wrapped — endless mode opens after Day 2316.',
  '（奖励：':' (rewards: ', '任务完成：':'Mission complete: ', '，墨菱石+':', Morkite +',
  '，墨菱油+':', Liquid Morkite +', '，黄金+':', Gold +', '，稀有矿物：':', rare minerals: ', '，':', ',
  '📦 战利品入库':'📦 Loot banked',
  '⚠ 结算异常（已保底处理，矿工已归队，不影响存档）：':'⚠ Settlement error (fallback applied, miners returned, save unaffected): ',
  '任务板已刷新：集团发来了新一批任务单。':'Board refreshed: the Corporation sent a new batch of contracts.',
  '节日活动开启：【':'Festival opened: [', '】！节日战役同步开放，完成派遣推进活动进度。':']! The holiday campaign opens with it; complete dispatches to progress.',
  '领涨，':' leads gains; ', '领跌。':' leads losses.', '今日提示：':"Today's tip: ",
  '🎄 节日战役【':'🎄 Holiday campaign [', '】通关！奖励：':'] cleared! Rewards: ',
  '季度分红稀有矿物：':'Quarterly rare mineral dividend: ',
  ' 超额完成！追加 500 代币 + 空白模组×1。':' Overful! Bonus 500 credits + 1 Blank Core.',
  '为 ':'Paid express treatment for ', ' 名伤员支付加急治疗费 ':' wounded: ',
  ' 代币，恢复时间减半。':' credits; recovery time halved.',
  '季度 KPI 达成':'quarterly KPI met', '）。当前：':'). Total: ',
  '钻井平台等级不足，尚未解锁':'Rig level too low — not unlocked yet: ',
  '红3 · 额外晋升 ×':'Red3 · Extra Promotion ×',

  /* —— 晋升框 —— */
  '铜1':'Bronze 1','铜2':'Bronze 2','铜3':'Bronze 3','银1':'Silver 1','银2':'Silver 2','银3':'Silver 3',
  '金1':'Gold 1','金2':'Gold 2','金3':'Gold 3','铂1':'Platinum 1','铂2':'Platinum 2','铂3':'Platinum 3',
  '祖母绿1':'Emerald 1','祖母绿2':'Emerald 2','祖母绿3':'Emerald 3','蓝宝石1':'Sapphire 1','蓝宝石2':'Sapphire 2','蓝宝石3':'Sapphire 3',
  '钻石1':'Diamond 1','钻石2':'Diamond 2','钻石3':'Diamond 3','红1':'Red 1','红2':'Red 2','红3':'Red 3',

  /* —— main.js 弹窗/按钮 —— */
  '时间暂停。钻台进入待机。':'Time paused. The rig is on standby.', '时间继续流动。开始采掘。':'Time flows again. Start digging.',
  '当前存量':'Current balance', '下季 KPI 奖金':'Next-quarter KPI bonus', '重复招募折算':'Duplicate-recruit conversion',
  '每日产出':'Daily production', '派遣消耗':'Dispatch cost', '集团关怀':'Corporate Care', '生效中':'active', '未触发':'not triggered',
  '重建 · ':'Rebuild · ', '稍后再说':'Maybe Later',
  '创意及开发':'Creative & Development', '部署和技术指导':'Deployment & Tech Guidance', '技术指导':'Tech Guidance',
  '测试':'Testing', '素材支持':'Asset Support', '参考项目':'Reference Project', '制作与鸣谢':'About & Credits',
  '非商业粉丝作品，与 Ghost Ship Games 无隶属关系。游戏名称、美术、音频及商标归原权利人所有。':'A non-commercial fan work, unaffiliated with Ghost Ship Games. Game name, art, audio and trademarks belong to their original owners.',
  '资源总览':'Resource Overview', '稀有矿物（含市场价）':'Rare Minerals (with market price)',
  '管理终端日志（近 60 条）':'Operations Log (last 60)',
  '模组柜空空如也。接三提石任务（✦ 标记）赚空白模组，来锻造台抽卡。':'The mod cabinet is empty. Take Tritilyte missions (✦ marker) to earn Blank Cores, then draw at the Forge.',
  '还没有饰品。深潜末关、节日战役与饰品箱会掉。':'No trinkets yet. Deep Dive finales, holiday campaigns and trinket boxes drop them.',
  ' 页（共 ':' of ', ' 个模组）':' mods)', '饰品格（全队佩戴）':'Trinket Shelf (squad-wide)',
  ' → 装备终端锻造台可抽卡。':' — draw at the Equipment Terminal forge.', '模组柜（第 ':'Mod Cabinet (page ', ' 页）':')',
  '✕ 关闭':'✕ Close', '← 返回仓库':'← Back to Warehouse', '（点击看详情）':' (click for details)',
  '全部日志':'Full Log', '点击展开日志':'Click to expand log', '刷新任务':'Refresh',
  '任务板 <small>MISSION</small>':'Mission Board <small>MISSION</small>',
  '派遣通道 <small>DISPATCH</small>':'Dispatch Channel <small>DISPATCH</small>',
  '管理终端日志 <small>OPERATION LOG</small><span class="arrow">▼</span>':'Operations Log <small>OPERATION LOG</small><span class="arrow">▼</span>',
  '稀有矿物</span>':'Rare Minerals</span>',
  '洞穴在震动：有队伍正悬挂虫潮事件，等待管理层决策。':'The cave is shaking: a squad has a swarm event pending, awaiting a management decision.',

  /* —— 补充（第二批渲染接线用）—— */
  ' 游戏分钟':' game min', ' 游戏小时':' game hours',
  '星期日':'Sun', '星期一':'Mon', '星期二':'Tue', '星期三':'Wed', '星期四':'Thu', '星期五':'Fri', '星期六':'Sat',
  '任务 ':'Missions ',
  '🏆 成就达成【':'🏆 Achievement unlocked [',
  'Pack骡 M.U.L.E. Lv.':'M.U.L.E. Lv.',
  '：墨菱石×':': Morkite ×', ' + 墨菱油×':' + Liquid Morkite ×',
  '主手槽已换装：':' primary slot equipped: ', '副手槽已换装：':' secondary slot equipped: ',
  '武器装配模组【':' weapon equipped: ',
  ' 装配了模组【':' equipped mod: ',
  '）。到装备终端装配。':'). Equip it at the Equipment Terminal.',
  '】解锁！':'] unlocked! ',
  '（XP ':' (XP ', '（产出加成 +':' (yield bonus +', '%）':'%)',
  '人数×时长系数':'miners × duration factor', '（急行 ×4）':' (Rush ×4)',
  '递上小红糖':'Offer Red Sugar',
  '】 代币+':'] credits+',
  '黄金×':'Gold ×', '墨菱石×':'Morkite ×', '墨菱油×':'Liquid Morkite ×',
  '空白模组×':'Blank Core ×', '功绩点×':'Merit ×', '硝石×':'Nitra ×',
  ' 凭证升级：主手解锁 ':' license upgraded: primary unlocks ', '，副手解锁 ':', secondary unlocks ',
  ' 晋升完成！授予晋升框【':' promoted! Frame granted: ',
  '】，战斗力与寻矿直觉永久提升。集团贺词：欢迎回到第 1 级——挖到手软，赚到盆满！':'. Power and ore-sense permanently improved. Corporate congratulation: welcome back to level 1 — dig deep, get rich!',
  '【清账行动】保证金 ':'[Operation Ledger-Clearing] Deposit of ',
  ' 代币已冻结。六年旧账，今日清算——完成返还 ×3。':' credits frozen. Six years of accounts, settled today — repay ×3 on completion.',
  '【战役】奖励反查失败：rare_':'[Campaign] Reward lookup failed: rare_',
  ' 不在 MKEY 表，该笔奖励未发放——请核对战役表键名。':' not in the MKEY table; reward not issued — check the campaign table key.',
  '【编年史】账清了。Rock and Stone——17号钻台的账本，从今天起是干净的。':"Chronicle: the books are clear. Rock and Stone — Space Rig 17's ledger is clean as of today.",
  ' 集团永不满足。':' The Corporation is never satisfied.',
  '战役队列已空。集团正在起草新的大单。':'Campaign queue empty. The Corporation is drafting a new big contract.',
  '　报酬系数 ×':' · pay ×',

  /* —— 起名登记（showNameRegistration，main.js）—— */
  '入职登记 · 代号核验':'Onboarding · Callsign Verification',
  '集团规定：每位管理层须登记专属代号。此后董事会与全钻台将以「管理层·代号」称呼您。（留空则只称"管理层"）':'Corporate policy: every member of Management registers a personal callsign. From then on the board and the whole rig will address you as "Management · Callsign". (Leave blank to stay plain "Management".)',
  '例如：铁心、老矿灯':'e.g. Ironheart, Old Lamp',
  '登记完成':'Complete Registration',
  '【人事系统】代号核验失败：「':'[HR system] Callsign verification failed: "',
  '」已列入永不录用黑名单（案底：剽窃游戏攻略、攻击 Mod 作者与难度代码作者）。':'" is on the never-hire blacklist (record: plagiarized game guides, attacked mod authors and difficulty-code authors).',
  '⛔ 代号核验未通过':'⛔ Callsign Verification Failed',
  '人事档案提示：「<b style="color:var(--red)">':'HR file note: "<b style="color:var(--red)">',
  '</b>」已被集团列入【永不录用】黑名单。<br>案底：剽窃游戏攻略、攻击 Mod 作者与难度代码作者。':"</b>\" has been placed on the Corporation's [NEVER HIRE] blacklist.<br>Record: plagiarized game guides, attacked mod authors and difficulty-code authors.",
  '请更换一个体面的代号重新登记。':'Please pick a more respectable callsign and register again.',
  '重新登记':'Register Again',
  '代号登记完成：从今天起，您就是 ':'Callsign registered: as of today you are ',
  '。欢迎加入 17 号钻台。':'. Welcome aboard Space Rig 17.',
  '跳过代号登记。集团将继续称呼您为管理层。':'Callsign skipped. The Corporation will keep addressing you as Management.',
  '返回管理终端':'Back to Management Terminal',
  '微信内仅能试玩：无法"添加到主屏幕"，后台运行易被回收。建议点右上角菜单选"在浏览器打开"。':'In WeChat you can only try the game: "Add to Home Screen" is unavailable and background play gets reclaimed. Use the top-right menu and choose "Open in browser".',
  '知道了':'Got it',
  '构建 ':'build ',
  '　　在更深处，遇见更大的明天。':'　　Deeper down, a bigger tomorrow.',
  '【测试协议 ':'[Test protocol ',
  '】权限溢出确认：全模组解锁、资源注满、精英全员到齐、深潜刷新。请勿告诉财务部。':'] clearance overflow confirmed: all mods, full resources, all elites, Deep Dive reset. Do not tell Finance.',
  '离线报告：你离开了 ':'Offline report: you were away ',
  ' 小时，钻台以 10% 效率运转。':' hours; the rig ran at 10% efficiency.',

  /* —— 实时模式：游戏内通用 —— */
  '莫尔凯特':'Morkite', '晶石':'Gems', '莫尔凯特 ':'Morkite ', ' 莫尔凯特':' Morkite',
  '镐':'Pickaxe', '照明弹':'Flare', '矿块':'chunk',
  '携带物':'cargo', '矿骡腿':'M.U.L.E. leg', '矿骡腿 ':'M.U.L.E. legs ', '管道段':'pipe segment',
  'C4 炸药包':'Satchel Charge', '平台发射器':'Platform Gun', '护盾发生器':'Shield Generator',
  '抓钩':'Grapple Gun', '哨戒炮':'Sentry Gun',
  '钻机 · DRILLER':'DRILLER', '工程师 · ENGINEER':'ENGINEER', '枪手 · GUNNER':'GUNNER', '侦察兵 · SCOUT':'SCOUT',
  '双持钻机开路，火焰清场。挖掘速度最快。':'Twin drills blaze the trail, flamethrower clears the room. Fastest digger in the corps.',
  '平台开路、哨戒炮压制，近战火力凶猛。':'Platforms to climb, sentries to suppress — brutal close-range firepower.',
  '转管机枪压制虫潮，护盾罩住阵地。血最厚。':'Minigun mows down swarms, shield holds the line. Toughest of the four.',
  '抓钩飞索、照明弹开路，跑得最快也最脆。':'Grapple and flares light the way. Fastest on his feet, thinnest skin.',
  '危险等级 1':'Hazard 1', '危险等级 2':'Hazard 2', '危险等级 3':'Hazard 3', '危险等级 4':'Hazard 4', '危险等级 5':'Hazard 5',
  '晶洞秘境':'Crystalline Caverns', '盐晶矿坑':'Salt Pits', '真菌沼泽':'Fungus Bogs',
  '辐射禁区':'Radioactive Exclusion Zone', '茂密生态区':'Dense Biozone', '冰川地层':'Glacial Strata',
  '岩浆核心':'Magma Core', '蔚蓝荒原':'Azure Weald', '空心枝丫':'Hollow Bough', '风蚀走廊':'Sandblasted Corridors',
  '正在装载矮人与虫子…':'Loading dwarfs and bugs...', '正在校准照明弹…':'Calibrating flares...',
  '正在连接任务控制中心…':'Connecting to Mission Control...', '准备就绪':'Ready',
  '注意：':'Warning: ',
  ' 个素材未能加载。请刷新重试；若问题持续，请检查 CDN 或浏览器是否拦截了图片资源。':' assets failed to load. Refresh and retry; if it persists, check the CDN or whether the browser blocked the images.',
  '洞穴生成失败：':'Cave generation failed: ',
  '主动放弃任务':'Mission abandoned',
  '护盾 SHIELD':'SHIELD',
  '执勤护送 · DRILLDOZER ESCORT':'DRILLDOZER ESCORT',
  '定点提取 · POINT EXTRACTION':'POINT EXTRACTION',
  '搜救行动 · SALVAGE OPERATION':'SALVAGE OPERATION',
  '就地精炼 · ON-SITE REFINING':'ON-SITE REFINING',
  '消灭任务 · ELIMINATION':'ELIMINATION',
  '采矿远征 · MINING EXPEDITION':'MINING EXPEDITION',
  '倒地 · BLEEDING OUT ':'DOWN · BLEEDING OUT ',
  'BOSCO 充能中 ':'BOSCO recharging ',
  'BOSCO 正在赶来救援':'BOSCO is coming to save you',
  '禁用':'Locked', '装填中 RELOADING':'RELOADING',
  '目标完成 · 撤离飞船已呼叫':'Objective complete · Drop Pod called',
  '把矿块搬回莫莉处按 E 入库':'Haul the chunk back to Molly and press E to deposit',
  '跟随蓝色光柱 · 按住左键钻采矿结':'Follow the blue beam · hold LMB to drill the nodule',
  '矿骡已修复':'M.U.L.E. repaired', '修复中 ':'Repairing ', '修复进度 ':'Repair progress ',
  '修复完成 · 撤离飞船已呼叫':'Repairs complete · Drop Pod called',
  '对准矿骡长按 E 修复（松开保留进度）':'Aim at the M.U.L.E. and hold E to repair (release keeps progress)',
  '把矿骡腿搬到残骸处按 E 安装':'Carry the leg to the wreck and press E to install',
  '最近的矿骡腿 ':'Nearest M.U.L.E. leg ', 'm · 跟随信标':'m · follow the beacon',
  '已消灭':'TARGET ELIMINATED', '目标休眠中':'Target dormant',
  '无畏虫茧 · 走近长按 E 破茧（2 秒）':'Dreadnought cocoon · get close and hold E to crack it (2s)',
  'DREADNOUGHT DOWN · 任务完成':'DREADNOUGHT DOWN · mission complete',
  '它正在破土而出……':'It is bursting out of the ground...',
  '狂暴态 · 弱点换位更快 · 小心酸弹':'Enraged · weak point relocates faster · beware acid spit',
  '装甲态 · 打腹部发光弱点（×3 伤害）':'Armored · hit the glowing abdomen weak point (×3 damage)',
  '目标完成 · 按 R 呼叫飞船':'Objective complete · press R to call the Drop Pod',
  '把矿石存入 M.U.L.E.（靠近按 E）':'Deposit ore into the M.U.L.E. (press E when close)',
  '撤离倒计时 EXTRACTION':'EXTRACTION', '任务时间 ':'Mission time ',
  '心石防守 ':'Heart stone defense ', '心石防守：坚持 ':'Heart stone defense: hold on ', ' 秒！':'s!', ' 秒':'s',
  '朵蕾妲 ':'Doretta ', '朵蕾妲':'Doretta', '朵蕾妲已损毁……':'Doretta is down...',
  '加油中……':'Refueling...', '停车加油：把燃料罐送到油箱口':'Pit stop: haul the fuel canister to the intake port',
  '推进中 ':'Advancing ',
  ' 矿块':' chunks', ' 原油':' crude oil',
  '泵停摆 ×':'Pumps down ×', ' · 长按 E 修理！':' · hold E to repair!',
  '未装泵油井 ×':'Wells without a pump ×', ' · 领管道段去铺设':' · grab a pipe segment and lay it',
  '把管道段送到油井按 E 安装':'Carry the pipe segment to a well and press E to install',
  '运转中的泵 ×':'Pumps running ×', ' · 小心虫子啃泵':' · guard the pumps from bugs',
  '背包 BACKPACK':'BACKPACK', '硝石 ':'Nitra ',
  '按 V 呼叫补给':'Press V to call a resupply', '存入硝石可换补给':'Deposit Nitra to trade for a resupply',
  '地形扫描仪 SCANNER':'SCANNER', 'TAB 全图':'TAB: full map',
  '地形扫描仪 · 按 TAB 关闭':'Terrain scanner · press TAB to close',
  '撤离飞船':'Drop Pod', '补给':'Resupply', '富矿点':'Rich vein', '矿骡残骸':'M.U.L.E. wreck',
  '油井':'Oil well', '泵停摆':'Pump down', '油井 ✓':'Oil well ✓', '精炼单元':'Refinery',
  '虫茧':'Cocoon', '无畏机甲':'Dreadnought', '你':'You', '油箱口':'Fuel port', '弱点':'Weak point', '撤离':'Extract',
  '任务控制中心 MISSION CONTROL':'MISSION CONTROL',
  '按 E 加入燃料罐':'Press E to load the fuel canister',
  '把燃料罐送到朵蕾妲油箱口（黄色箭头）':"Haul the canister to Doretta's intake port (yellow arrow)",
  '按 E 使用补给舱 (':'Press E to use the Resupply Pod (',
  '按 E 拾起燃料罐':'Press E to pick up the fuel canister',
  '守住朵蕾妲！还剩 ':'Hold Doretta! ',
  '朵蕾妲在等待燃料——找到她放下的燃料罐':'Doretta is waiting for fuel — find the canister she dropped',
  '按 E 登船撤离':'Press E to board the Drop Pod',
  '按 E 矿块入库（':'Press E to deposit the chunk (',
  '按 E 存放 ':'Press E to deposit ', ' 单位矿石':' units of ore',
  '按 R 呼叫撤离飞船':'Press R to call the Drop Pod',
  '按 E 安装矿骡腿':'Press E to mount the M.U.L.E. leg',
  '长按 E 修复矿骡（松开保留进度）':'Hold E to repair the M.U.L.E. (release keeps progress)',
  '按 E 扛起矿骡腿':'Press E to pick up the M.U.L.E. leg',
  '按 E 铺设管线并安装泵':'Press E to lay the pipeline and install the pump',
  '把管道段送到未装泵的油井（跟随光柱）':'Carry the pipe segment to a pumpless well (follow the beam)',
  '按 E 领取管道段':'Press E to grab a pipe segment',
  '长按 E 修理泵（松开保留进度）':'Hold E to repair the pump (release keeps progress)',
  '长按 E 破茧（惊动无畏机甲！）':'Hold E to crack the cocoon (this wakes the Dreadnought!)',
  '它要扑过来了——躲开！':'It is about to lunge — dodge!',
  'M.U.L.E. 就绪':'M.U.L.E. ready',
  ' · 用时 ':' · time ',

  /* —— 实时模式：任务流程播报 / 提示 —— */
  '欢迎来到 ':'Welcome to ',
  '。朵蕾妲开路！保持警惕，就像她是你们的亲妈一样保护好她！':". Doretta leads the way! Stay sharp and protect her like she was your own mother!",
  '。定点提取：开采 ':'. Point Extraction: mine ',
  ' 块矿块并送回莫莉入库。信标已经点亮，动手吧矮人！':' chunks and deposit them at Molly. The beacons are lit — get to work, dwarfs!',
  '。搜救行动：找回 4 条矿骡腿，修好她，然后一起回家。':'. Salvage Operation: recover the four M.U.L.E. legs, repair her, and bring everyone home.',
  '。就地精炼：把管线拉到油井上，装泵抽油——集齐 ':'. On-Site Refining: run pipelines to the oil wells and install pumps — bank ',
  ' 单位原油，管线就是你的命根子。':' units of crude oil, and keep those pipelines alive.',
  '。消灭任务：竞技场中心有个虫茧——准备好就破茧，无畏机甲在里面睡觉。':'. Elimination: a cocoon sits at the arena center — crack it when ready. A Dreadnought is sleeping inside.',
  '，矮人。开采 ':', dwarfs. Mine ',
  ' 单位莫尔凯特并存入 M.U.L.E.。':' units of Morkite and deposit it in the M.U.L.E.',
  '按住鼠标右键对着岩壁挖掘 · 绿色晶体是莫尔凯特':'Hold RMB to dig into rock · the green crystals are Morkite',
  '洞穴很黑 — 按 F 扔出照明弹':'Caves are dark — press F to throw flares',
  '矿石会自动进背包 · 走到莫莉 M.U.L.E. 旁按 E 存放（按 T 呼叫她）':'Ore goes straight to your backpack · walk to the M.U.L.E. (Molly) and press E to deposit (press T to call her)',
  '存够 80 硝石后按 V 呼叫补给舱 · 左键开火，Q 使用职业装备':'Bank 80 Nitra then press V to call a Resupply Pod · LMB fires, Q uses your class tool',
  '贴着墙按空格可以蹬墙跳，爬出自己挖的竖井':'Jump against a wall with Space to wall-kick out of your own shafts',
  '朵蕾妲会自动掘进——跟紧她，别让她孤军奋战':'Doretta drills on her own — stay close and never leave her fighting alone',
  '虫子会优先啃咬朵蕾妲——听到「遭受攻击」警报立刻回防':'Bugs bite Doretta first — when you hear the "under attack" alarm, turn back and defend',
  '她停车时会放下燃料罐：走近按 E 拾起，再对油箱口按 E 加入':'At pit stops she drops a fuel canister: press E to pick it up, then press E at the intake port',
  '定点提取：跟着蓝色光柱找到富矿信标（共 3 处）':'Point Extraction: follow the blue beams to the rich veins (3 sites)',
  '走近信标按住左键钻采大矿结，采出的矿块顶在头上':'Get close and hold LMB to drill the big nodules; extracted chunks ride on your head',
  '携带矿块时移速 -10%、只能用副手武器——把它搬回莫莉旁按 E 入库':'Carrying a chunk slows you 10% and locks you to your secondary — haul it back to Molly and press E to deposit',
  '每入库 1 块会引来一小波虫潮；集齐 ':'Each deposit draws a small swarm; bank all ',
  ' 块即可撤离':' chunks to call extraction',
  '搜救行动：信号信标指向失联的矿骡腿——跟着 HUD 箭头走':'Salvage Operation: signal beacons mark the lost M.U.L.E. legs — follow the HUD arrows',
  '走近矿骡腿按 E 扛起来：移速 -30%，只能用副手武器':'Get close and press E to hoist a leg: -30% speed, secondary weapon only',
  '把腿搬到矿骡残骸处按 E 安装；每装一条会刷出防御虫':'Carry the leg to the wreck and press E to mount it; each mount spawns defenders',
  '四条腿装齐后，对准矿骡长按 E 修复 3 秒（松开保留进度）':'With all four legs on, aim at the M.U.L.E. and hold E to repair for 3 seconds (release keeps progress)',
  '就地精炼：在精炼单元旁按 E 领取管道段（移速 -20%，只能用副手武器）':'On-Site Refining: press E at the refinery unit to grab a pipe segment (-20% speed, secondary only)',
  '跟着蓝色光柱找到墨菱油井——对准油井按 E 铺设管线并安装泵':'Follow the blue beams to the Liquid Morkite wells — press E at a well to lay pipe and install the pump',
  '泵会自动抽油汇进精炼单元；虫子会专门啃泵——听到警报就回防':'Pumps feed crude back to the refinery on their own; bugs chew on pumps — turn back when you hear the alarm',
  '泵停摆后长按 E 修理（松开保留进度）；集齐 ':'Hold E to repair a wrecked pump (release keeps progress); bank all ',
  ' 单位原油即可撤离':' units of crude oil to call extraction',
  '消灭任务：直捣竞技场中心——对无畏虫茧长按 E 破茧（2 秒）':'Elimination: push to the arena center — hold E to crack the Dreadnought cocoon (2s)',
  '无畏机甲处于装甲态：只有腹部发光弱点吃伤害（×3），打装甲基本刮痧':'The Dreadnought is armored: only the glowing abdomen weak point takes real damage (×3); shooting the armor barely scratches it',
  '弱点会随时间换位——听到低吼就找橙色的光；它还会召唤小虫':'The weak point relocates over time — when you hear the growl, look for the orange glow; it also calls in swarmers',
  '血量过半它会狂暴：移速/攻速 +30%，还会吐酸弹三连——保持走位':'Past half health it enrages: +30% speed/attack and triple acid spit — keep moving',
  'BOSCO 复活模块充能中（':'BOSCO revive module recharging (', 's）— 撑住！':'s) — hold on!',
  '你被击倒了！BOSCO 正在赶来…':'You are down! BOSCO is coming for you...',
  '矮人失去意识 · DWARF DOWN':'DWARF DOWN',
  'BOSCO 把你从鬼门关拉了回来 — 继续挖!':'BOSCO pulled you back from the brink — keep digging!',
  'BOSCO 完成救援 · REVIVED':'BOSCO rescue complete · REVIVED',
  '拾起燃料罐 · 送到朵蕾妲油箱口按 E 加入':"Canister picked up · bring it to Doretta's intake port and press E",
  '完成！奥魔兰心石，我们来了！':'Done! Ommoran heart stone, here we come!',
  '心石防守：守住朵蕾妲 20 秒！':'Heart stone defense: hold Doretta for 20 seconds!',
  '朵蕾妲被摧毁 · DRILLDOZER LOST':'DRILLDOZER LOST',
  '朵蕾妲被摧毁了……任务失败':'Doretta is destroyed... mission failed',
  '朵蕾妲这样撑不下去的！':"Doretta can't keep this up!",
  '警告：朵蕾妲血量危急！':'Warning: Doretta is critically damaged!',
  'Canister ready for re-fueling! 燃料罐已准备好重新供油！':'Canister ready for re-fueling!',
  '朵蕾妲停车加油 · 走近燃料罐按 E 拾起，再靠近油箱口按 E 加入':'Doretta pit stop · press E to pick up the canister, then press E at the intake port to load it',
  '补充燃料罐已投放':'Replacement canister deployed',
  'Canister placed! 燃料罐已放置！':'Canister placed!',
  '+ 燃料罐':'+ Fuel canister',
  '所有燃料罐已装满！掘进机已准备好继续执行任务！':'All canisters loaded! The drilldozer is ready to resume the operation!',
  '加油完成 · 朵蕾妲恢复推进':'Refueled · Doretta is advancing again',
  'Doretta is under attack! 朵蕾妲在遭受攻击！':'Doretta is under attack!',
  '采出矿块！按 E 扛起来（只能用副手武器）':'Chunk extracted! Press E to carry it (secondary weapon only)',
  '扛起矿块 · 搬回莫莉处按 E 入库':'Chunk on your head · haul it back to Molly and press E to deposit',
  '入库 ':'Deposited ', '存入 ':'Deposited ', ' 单位':' units',
  '定点提取完成！矿块全部入库，撤离飞船正在赶来。':'Point Extraction complete! All chunks banked — the Drop Pod is on its way.',
  '配额达成 · 撤离飞船已呼叫':'Quota met · Drop Pod called',
  '这处富矿点采完了':'This rich vein is tapped out',
  '矿结里还有矿块：剩余 ':'More chunks in the nodule: ', ' 剩余 ':' remaining ',
  '矿块掉落了——回来按 E 重新拾起':'Chunk dropped — come back and press E to pick it up',
  '矿骡腿掉落了——回来按 E 重新扛起':'M.U.L.E. leg dropped — come back and press E to hoist it again',
  '管道段掉落了——回来按 E 重新扛起':'Pipe segment dropped — come back and press E to hoist it again',
  '按住左键 钻采矿结':'Hold LMB to drill the nodule',
  '扛起矿骡腿 · 送到矿骡残骸处按 E 安装':'Leg hoisted · carry it to the M.U.L.E. wreck and press E to install',
  '防御虫涌向矿骡——顶住！':'Defenders swarming the M.U.L.E. — hold the line!',
  '所有矿骡腿都已装上！现在修复她——长按互动键，我们会送她回家的！':'All four legs are on! Now repair her — hold the interact key and we will bring her home!',
  '四条腿装齐 · 对准矿骡长按 E 修复（松开保留进度）':'All legs mounted · aim at the M.U.L.E. and hold E to repair (release keeps progress)',
  '矿骡腿已安装（':'M.U.L.E. leg mounted (', '/4）· 防御虫来袭！':'/4) · defenders incoming!',
  '矿骡修好了！她能自己走回降落区——我们撤！':"The M.U.L.E. is fixed! She can walk back to the landing zone herself — let's move!",
  '矿骡已修复 · 撤离飞船已呼叫':'M.U.L.E. repaired · Drop Pod called',
  '矿骡残骸 · 还差 ':'M.U.L.E. wreck · ', ' 条腿':' more legs',
  '（长按 E 继续）':' (hold E to continue)',
  '长按 E 修复矿骡':'Hold E to repair the M.U.L.E.',
  '领到管道段 · 送到油井处按 E 铺设并安装泵':'Pipe segment in hand · take it to a well and press E to lay pipe and install the pump',
  '泵已启动':'Pump online', '泵修复':'Pump repaired',
  '管线接通 · 泵开始抽油！小心虫子啃泵':'Pipeline connected · the pump is drawing crude! Guard it from bugs',
  '泵被虫子打坏了！长按 E 修理':'The pump is wrecked! Hold E to repair',
  '警报：虫群扑向油井的泵！':'Alarm: the swarm is rushing the well pumps!',
  '精炼配额达成！原油全部入罐，撤离飞船正在赶来。':'Refining quota met! All crude banked — the Drop Pod is on its way.',
  '油井 · 未装泵':'Oil well · no pump', '长按 E 修理':'Hold E to repair',
  '修理中 ':'Repairing ', '修理进度 ':'Repair progress ',
  '破茧中 ':'Cracking ', '无畏虫茧 · 长按 E 破茧':'Dreadnought cocoon · hold E to crack it',
  '壳裂开了——无畏机甲！打它的腹部弱点，那是唯一的破口！':'The shell is cracking — a Dreadnought! Hit the glowing abdomen — it is the only opening!',
  '无畏机甲出场 · 装甲态：找橙色的弱点核':'Dreadnought emerging · armored: find the orange weak point core',
  '干得漂亮！无畏机甲倒下了——任务完成，矮人！':'Outstanding! The Dreadnought is down — mission complete, dwarfs!',
  '消灭确认 · DREADNOUGHT DOWN':'Kill confirmed · DREADNOUGHT DOWN',
  '弱点!':'WEAK POINT!',
  '它狂暴了！小心酸弹——盯着它的弱点打！':'It is enraged! Watch the acid spit — stay on that weak point!',
  '无畏机甲进入狂暴：移速/攻速 +30%，新增酸弹三连':'The Dreadnought is enraged: +30% speed/attack, triple acid spit added',
  '无畏机甲召唤了虫群！':'The Dreadnought called in a swarm!',
  '孵化虫释放了虫群！':'The Breeder released a swarm!',
  '狂暴':'ENRAGED', '装甲态':'ARMORED',
  '背包是空的':'Backpack is empty',
  '主要目标完成！莫尔凯特配额已达成，按 R 呼叫撤离飞船。':'Primary objective complete! The Morkite quota is met — press R to call the Drop Pod.',
  '主要目标完成 · 按 R 呼叫飞船':'Primary objective complete · press R for the Drop Pod',
  '硝石不足：需要 80（当前 ':'Not enough Nitra: need 80 (have ',
  '这里没有空间投放补给舱':'No room to drop a Resupply Pod here',
  '补给舱已发射，注意上方。':'Resupply Pod away — watch your head.',
  '补给舱已抵达 · RESUPPLY POD LANDED':'RESUPPLY POD LANDED',
  'M.U.L.E. 已重新定位到你身边':'The M.U.L.E. rerouted to your position',
  '撤离飞船正在下降！全速返回，虫子已经闻到你了！':'The Drop Pod is descending! Run full tilt — the bugs can smell you already!',
  '撤离倒计时开始 · 快跑！':'Extraction countdown started · run!',
  '警报：虫潮来袭！(第 ':'Alarm: swarm incoming! (wave ', ' 波)':')',
  '检测到大量生物信号 — 一大波虫子正在靠近！':'Massive biosignatures detected — a huge swarm is closing in!',
  '错过撤离窗口 · LEFT BEHIND':'LEFT BEHIND',
  '岩层塌方 — 你被推到了一处空腔':'Rock collapse — you were pushed into a cavity',
  '已补给：弹药 / 装备 / 生命':'Resupplied: ammo / gear / health',
  '已呼叫 M.U.L.E.（莫莉）过来':'Called the M.U.L.E. (Molly) over',
  'BOSCO：正在开采标记的矿石':'BOSCO: mining the marked ore',
  '用准星指向矿石后再按 Shift+Q':'Point the crosshair at ore first, then press Shift+Q',
  '背包已满，去 M.U.L.E. 处存放！':'Backpack full — deposit at the M.U.L.E.!',
  '这是无法挖掘的硬岩！':'That is unbreakable hard rock!',
  ' · 左键使用':' · LMB to use', '装填中…':'Reloading...',
  '照明弹用完了':'Out of flares', '手雷用完了':'Out of grenades',
  '装备充能耗尽 · 用补给舱补充':'Tool charges empty · restock from a Resupply Pod',
  '这里放不下平台':'No room for a platform here', '护盾发生器展开':'Shield generator deployed',
  'C4 已布置 · 再按 Q 引爆':'Satchel placed · press Q again to detonate',
  '哨戒炮充能耗尽':'Sentry charges empty', '需要平整地面':'Needs flat ground', '哨戒炮已部署':'Sentry deployed',
  '倒地! ':'DOWN! ',
  '怀里抱着':'Carrying ', '——只能用副手武器':' — secondary weapon only',
  '自动演示中 · AUTOPILOT':'AUTOPILOT',

  /* —— 实时模式：任务终端 / 简报（realtime ui.js）—— */
  '左右移动':'Move left/right', '跳跃':'Jump', '瞄准':'Aim',
  '开火（当前武器）':'Fire (current weapon)', '挖掘（镐 / 钻机）':'Dig (pickaxe / drills)',
  '切换主副武器':'Swap primary/secondary', '装填 · 配额完成后呼叫飞船':'Reload · call the Drop Pod once quota is met',
  '扔照明弹（照亮洞穴）':'Throw flare (lights the cave)', '手雷':'Grenade',
  '职业装备（抓钩/平台/护盾/C4）':'Class tool (grapple/platform/shield/C4)',
  '工程师：部署哨戒炮':'Engineer: deploy sentry', '命令 BOSCO 开采准星处矿石':'Order BOSCO to mine the ore under the crosshair',
  '交互：存矿 / 补给 / 登船':'Interact: deposit / resupply / board', '呼叫补给舱（需 80 硝石）':'Call Resupply Pod (costs 80 Nitra)',
  '呼叫 M.U.L.E. 莫莉过来':'Call the M.U.L.E. (Molly) over', '蹬墙跳（爬出自己挖的竖井）':'Wall jump (climb out of your own shafts)',
  '地形扫描仪全图':'Terrain scanner full map', '暂停菜单':'Pause menu',
  '总音量':'Master volume', '音效音量':'SFX volume', '语音音量':'Voice volume', '环境音':'Ambience',
  '黑暗程度':'Darkness', '镜头抖动':'Screen shake', '粒子密度':'Particle density', '渲染精度':'Render quality',
  '显示 FPS':'Show FPS',
  '主要目标':'Primary objective', '虫潮强度':'Swarm intensity', '敌人伤害':'Enemy damage',
  '信用点奖励':'Credit reward', '撤离时限':'Extraction time limit',
  '主武器 ':'Primary ', ' / 副武器 ':' / secondary ', ' · 装备 ':' · tool ',
  '信用点 CREDITS':'CREDITS', '矮人等级':'Dwarf level', '完成任务':'Missions', '击杀虫子':'Bugs killed', '累计莫尔凯特':'Total Morkite',
  '下降舱脱离中…':'Drop Pod detaching...', ' — 正在穿过地壳':' — breaching the crust',
  '接近洞穴层':'Approaching the cave layer', '准备着陆 · ROCK AND STONE!':'Brace for landing · ROCK AND STONE!',
  '任务完成 · MISSION COMPLETE':'MISSION COMPLETE', '任务失败 · MISSION FAILED':'MISSION FAILED',
  '干得漂亮，矮人！':'Well done, dwarfs!', '再来一次。':'Try again.',
  '朵蕾妲推进进度':'Doretta progress', '入库矿块 AQUARQ':'AQUARQ deposited', '矿骡修复 SALVAGE':'SALVAGE repairs',
  '存入莫尔凯特 MORKITE':'MORKITE deposited', ' · 已修复':' · repaired',
  '存入硝石 NITRA':'NITRA deposited', '存入黄金 GOLD':'GOLD deposited', '存入晶石 GEMS':'GEMS deposited',
  '开采矿石总量':'Total ore mined', '击杀虫子 KILLS':'KILLS', '挖穿方块 TILES DUG':'TILES DUG',
  '遭遇虫潮 SWARMS':'SWARMS', '被击倒次数':'Times downed',
  '获得信用点 CREDITS':'CREDITS earned', '获得经验 XP':'XP earned', '矮人等级 Lv.':'Dwarf level Lv.',
  '确定要清空本地存档（信用点 / 等级 / 统计）吗？':'Wipe the local save (credits / levels / stats)?',

  /* —— 实时派遣 / 终局 / 介入（realtime-controller.js）—— */
  '直接操控 1 名矿工护送朵蕾妲掘进机：护车、两处停车加油与终点心石防守。胜利按任务基础报酬和实战表现结算；朵蕾妲被摧毁或矿工倒地不起则失败。':
    'Directly control one miner escorting the drilldozer Doretta: guard the rig, handle two pit stops and the final heart-stone defense. A win pays base rewards plus live performance; Doretta destroyed or a dwarf down for good is a loss.',
  '直接操控 1 名矿工完成采矿、虫潮与撤离。胜利按任务基础报酬和实战表现结算；失败无任务报酬。':
    'Directly control one miner through mining, swarms and extraction. A win pays base rewards plus live performance; a loss pays no mission rewards.',
  '选择主控矿工':'Choose the Lead Miner', '没有士气 ≥25 的空闲矿工。':'No idle miners with morale ≥25.',
  '✔ 任务适配':'✔ best fit',
  '　出舱补给 -':' · resupply -', ' 硝石（持有 ':' Nitra (have ',
  '终局任务启动失败：':'Finale mission failed to launch: ',
  '实时任务启动失败：':'Live mission failed to launch: ',
  '▶ 终局任务：':'▶ Finale: ', ' 领队（':' leading (', '）亲自进入 ':') took the squad into ',
  '。胜则全队即刻结算，败则任务回板再战。':'. A win settles the whole squad on the spot; a loss returns the mission to the board.',
  '该派遣当前无法介入（事件待处理或已暂停）。':'This dispatch cannot be joined right now (event pending or paused).',
  '实时介入失败：':'Live intervention failed: ',
  ' 亲自介入【':' personally joined dispatch [', '】派遣：洞穴内见真章，胜则全队即刻结算归队。':']: the cave decides — a win settles the whole squad and sends everyone home at once.',
  ' 已进入实时任务：':' entered a live mission: ', '，危险 ':', hazard ',
  '实时任务仍在进行':'A Live Mission Is Still Running',
  '未知矿区':'unknown biome',
  '。继续会回到当前洞穴进度；刷新后会以同一种子重新开始。召回按失败处理且不退补给。':'. Continuing returns you to the current cave; after a refresh it restarts with the same seed. Recall counts as a failure and the resupply is not refunded.',
  '继续实时任务':'Resume Live Mission', '召回矿工':'Recall Miner',
  '实时介入已召回：':'Live intervention recalled: ',
  ' 归队，士气 -15。派遣恢复自动推进。':' is back, morale -15. The dispatch resumes autopilot.',
  '终局任务已召回：全队归队（士气 -15），任务回到任务板——整理装备后再战。':'Finale mission recalled: the squad is back (morale -15) and the mission is back on the board — regear and retry.',
  '实时任务已中止：矿工被紧急召回，士气 -15，出舱补给不退。':'Live mission aborted: the miner was recalled, morale -15, resupply not refunded.',
  '终局任务失败：':'Finale mission failed: ',
  ' 人小队已归队（士气 -15）。任务回到任务板——可重新编队再战。':'-dwarf squad is back (morale -15). The mission returns to the board — regroup and retry.',
  '实时任务失败：':'Live mission failed: ', ' 已归队，士气 -15。':' is back, morale -15.',
  '离线报告：实时下矿期间，钻台以 10% 效率运转了 ':'Offline report: while you were live in the caves, the rig ran at 10% efficiency for ',
  ' 小时。':' hours.',
  '介入成功 · 派遣完成':'Intervention won · dispatch settled', '任务完成':'Mission complete',
  '介入失败 · 派遣继续':'Intervention lost · dispatch continues',
  '终局失败 · 任务回板可重试':'Finale lost · mission back on the board for retry', '任务失败':'Mission failed',
  '本次没有管理终端报酬。':'No Management Terminal payouts this time.',
  '结算倍率 ×':'Settlement multiplier ×',
  '▶ 实时任务 · ':'▶ Live mission · ', '｜用时 ':' | time ', '｜击杀 ':' | kills ', '｜倒地 ':' | downs ',
  '入库结果':'Deposits', '确认入库':'Confirm Deposits',
  ' · 任务完成':' · Mission Complete',
  '矿镐':'pickaxe',
  '代币不足，买不起最小单位。':'Not enough credits to buy the smallest unit.',
  '交易站买入 ':'Exchange bought ', '，花费 ':', cost ', ' 代币（含 5% 手续费）。集团感谢你的信任。':' credits (5% fee included). The Corporation thanks you for your trust.',
  '（当前 Lv.':' (current Lv.',
  '深潜':'Deep Dive', '精英深潜':'Elite Deep Dive', '通关':' cleared',

  /* —— 一批内联残留补齐（renderAll 链路）—— */
  '）：':'）:', '士气':'Morale', ' · ':' · ',
  '五名复拓者全部到齐。管理层点评：这不再是派遣，这是降维打击。':"All five Reclaimers assembled. Management's comment: this is no longer dispatch — this is orbital superiority.",
  ' —— 下一次派遣消耗</span>':' — consumed by the next dispatch</span>',
  '士气 0-100。低于 25 拒绝下矿。空闲每小时恢复（酒吧等级加速）。<b>深渊酒吧请一轮酒</b>：从 16 款酒池随机抽取一款，全员士气 +40（个别酒有副作用，可付费再抽一轮换口味）。重伤入院全队 -15。':
    'Morale 0-100. Below 25 miners refuse to dig. Recovers hourly while idle (bar level speeds it up). <b>Buy a round at the Abyss Bar</b>: one random drink from the 16-drink pool, squad morale +40 (some drinks have side effects; paid rerolls change the pick). Heavy injury: whole squad -15.',
  '（日志异常，已捕获）':'(log anomaly, captured)',

  /* —— 实时模式静态 HTML（shell.html 注入 #realtime-shell，文本节点级切换）—— */
  '深岩银河':'Deep Rock Galactic',
  '直接指挥':'Direct Command',
  '正在装载装备…':'Loading equipment...',
  '非官方粉丝作品 · 素材来自官方 Wiki（见制作说明）':'Unofficial fan work · assets from the official Wiki (see Credits)',
  '“矮人不后退，矮人只挖得更深。”':'"Dwarfs never retreat — they only dig deeper."',
  '开始任务':'Start Mission', '选择星区、危险等级与职业':'Pick a region, hazard level and class',
  '操作说明':'Controls', '键鼠操作与任务流程':'Keyboard/mouse and mission flow',
  '音量、黑暗度、画质':'Volume, darkness, quality',
  '制作说明 / 素材来源':'Credits & Asset Sources', '致谢与版权声明':'Acknowledgements & copyright',
  '◀ 返回':'◀ Back', '任务终端 · MISSION TERMINAL':'MISSION TERMINAL',
  '种子 SEED':'SEED', '随机':'Random',
  '星区 REGION':'REGION', '危险等级 HAZARD':'HAZARD', '职业 CLASS':'CLASS',
  '采矿远征 MINING EXPEDITION':'MINING EXPEDITION',
  '开采莫尔凯特并存入 M.U.L.E.，达成配额后呼叫撤离飞船。':'Mine Morkite, deposit it in the M.U.L.E., then call the Drop Pod once the quota is met.',
  '启动下降舱':'Launch the Drop Pod',
  '再来一次':'Play Again', '任务终端':'Mission Terminal', '返回主菜单':'Back to Main Menu',
  '返回 17 号钻台并结算':'Return to Space Rig 17 & Settle',
  '任务暂停':'Mission Paused',
  '自动演示（自动驾驶一局）':'Auto demo (self-playing round)', '放弃任务':'Abandon Mission',
  '操作说明 · CONTROLS':'CONTROLS', '手机：':'Mobile:', '任务流程':'Mission Flow',
  '左摇杆移动（上推也可跳跃），右摇杆拖动瞄准并持续射击；右侧圆键负责跳跃、挖掘、互动和照明，其余指令在底部“装备”面板。':
    'Left stick moves (push up to jump), right stick aims and fires continuously; the right-side round buttons handle jump, dig, interact and flare — the rest live in the bottom "Gear" panel.',
  '用 ':'Use ', ' 对着岩壁挖掘，绿色的 ':' to dig into rock — the green ',
  '右键 / 按住“挖掘”':'RMB / hold "Dig"',
  ' 是主目标矿物。':' is the primary objective mineral.',
  '矿石会自动吸入背包，走到 ':'Ore is vacuumed into your backpack; walk up to the ',
  'M.U.L.E.（莫莉）':'M.U.L.E. (Molly)',
  ' 旁按 ':' and press ', 'E / 互动':'E / Interact', ' 存放。':' to deposit.',
  '存够 ':'Bank ', '80 硝石':'80 Nitra', ' 后按 ':' then press ',
  'V / 装备→补给':'V / Gear→Resupply', ' 呼叫补给舱，补充弹药与生命。':' to call a Resupply Pod for ammo and health.',
  '配额达成后按 ':'Once the quota is met press ', 'R / 装备→撤离':'R / Gear→Extract',
  ' 呼叫撤离飞船，然后在倒计时内跑到飞船按 ':' to call the Drop Pod, then run to the pod before the countdown runs out and press ',
  ' 登船。':' to board.',
  '洞穴很黑：按 ':'The cave is dark: press ', 'F / 照明':'F / Flare',
  ' 扔照明弹。被击倒后 ':' to throw flares. If you go down, ', ' 会来救你。':' will come to the rescue.',
  '明白了':'Got it', '设置 · SETTINGS':'SETTINGS', '重置存档':'Reset Save',
  '制作说明 · CREDITS':'CREDITS',
  '这是一个 ':'This is ', '非官方粉丝作品':'an unofficial fan work',
  '，用原生 HTML5 + Canvas 2D + WebAudio 手写实现，没有使用任何游戏引擎或第三方库。':', hand-written in vanilla HTML5 + Canvas 2D + WebAudio — no game engine, no third-party libraries.',
  '图像素材':'Art assets', '：来自官方 ':': from the official ',
  ' — 职业渲染图、虫子模型图、矿物与 HUD 图标、星区宣传图。':' — class renders, bug models, mineral & HUD icons, biome promo art.',
  '语音 / 音效':'Voice / SFX',
  '：同样来自官方 Wiki 的游戏音频文件（任务控制中心播报、“Rock and Stone!”、虫子叫声、照明弹枪声）。':
    ': audio files from the official Wiki as well (Mission Control broadcasts, "Rock and Stone!", bug sounds, flare gun shots).',
  '合成音效':'Synthesized SFX', '：镐击、枪声、爆炸、脚步等由 WebAudio 实时合成。':
    ': pickaxe hits, gunfire, explosions and footsteps are synthesized in real time with WebAudio.',
  '字体':'Fonts', '：Google Fonts 的 Saira Condensed / Chakra Petch（OFL 授权，已本地化）。':
    ': Saira Condensed / Chakra Petch from Google Fonts (OFL licensed, localized).',
  ' 及其全部美术、音频、角色版权归 ':' and all its art, audio and character copyrights belong to ',
  ' 所有。本项目仅用于学习与技术演示，不作商业用途。':'. This project is for learning and tech demo only, non-commercial.',
  '移动 · 上推跳跃':'Move · push up to jump', '挖掘':'Dig', '互动':'Interact', '照明':'Flare',
  '拖动瞄准 · 按住射击':'Drag to aim · hold to fire', '换枪':'Swap', '装填':'Reload',
  '工具':'Tool', '特殊':'Special', '莫莉':'Molly',
  '手机触控操作':'mobile touch controls', '移动摇杆，上推跳跃':'move stick, push up to jump',
  '按住挖掘':'hold to dig', '互动或存矿':'interact or deposit ore', '投掷照明弹':'throw flare',
  '瞄准射击摇杆':'aim & fire stick', '装备与任务操作':'gear & mission actions', '切换武器':'switch weapon',
  '装填或呼叫撤离':'reload or call extraction', '投掷手雷':'throw grenade', '使用职业工具':'use class tool',
  '使用特殊装备':'use support tool', '呼叫补给':'call resupply', '呼叫莫莉':'call Molly', '指挥博斯科':'command Bosco'
};

/* —— 武器官方英文名（weaponZh 在 en 语言下查此表）—— */
const WEAPON_EN = {
  gk2:'DeepCore GK2', m1000:'M1000 Classic', drak:'DRAK-25 Plasma Carbine',
  jury:'Jury-Rigged Boomstick', zhukov:'Zhukov NUK17', nishanka:'Nishanka Boltshark X-80',
  warthog:'"Warthog" Auto 210', lok1:'LOK-1 Smart Rifle', voltar:'"Stubby" Voltaic SMG',
  pgl:'DeepCore 40mm PGL', breachcutter:'Breach Cutter', sharddif:'Shard Diffractor',
  crspr:'CRSPR Flamethrower', cryo:'Cryo Cannon', sludge:'Corrosive Sludge Pump',
  subata:'Subata 120', plasmacharger:'Experimental Plasma Charger', colette:'Colette Wave Cooker',
  leadstorm:'"Lead Storm" Powered Minigun', thunderhead:'"Thunderhead" Heavy Autocannon',
  hurricane:'"Hurricane" Guided Rocket System', bulldog:'"Bulldog" Heavy Revolver',
  brt7:'BRT7 Burst Fire Gun', armskore:'ArmsKore Coil Gun'
};

/* =========================================================
 * 语言状态与应用
 * ========================================================= */
function currentLang(){
  try{ return localStorage.getItem('drg_lang') === 'en' ? 'en' : 'zh'; }catch(e){ return 'zh'; }
}
/* L(x)：对象 → 官方 name_en / en 字段（缺则查词表兜底）；字符串 → 词表直查 */
function L(x){
  if(x !== null && typeof x === 'object'){
    if(currentLang() !== 'en') return x.name_zh || x.name || '';
    return x.name_en || x.en || x.enName || (x.name && I18N_EN[x.name]) || (x.name_zh && I18N_EN[x.name_zh]) || x.name_zh || x.name || '';
  }
  const s = String(x);
  if(currentLang() !== 'en') return s;
  return I18N_EN[s] || s;
}
function setTextLang(){
  try{ document.documentElement.lang = (currentLang() === 'en') ? 'en' : 'zh-CN'; }catch(e){}
}

/* —— 静态 HTML 文案切换（载入时快照中文，切回零丢失）—— */
const I18N_STATIC_TEXT = [
  ['.brand-copy strong', 'Deep Rock Galactic Corp.'],
  ['.terminal-name strong', 'Space Rig 17 Management Terminal'],
  ['.terminal-name span', 'Mine Resources · Build the Future'],
  ['.mode-console span', 'Mode'],
  ['#chip-credits span', 'Credits'],
  ['#chip-nitra span', 'Nitra'],
  ['#btn-idle-report span:last-child', 'Idle Earnings'],
  ['#btn-auto span:nth-child(2)', 'Idle Voucher'],
  ['#auto-chip span:nth-child(2)', 'Auto Running'],
  ['.objective-kicker span', "This Quarter's Target"],
  ['.hero-message strong', 'Onward to the Core'],
  ['.hero-message b', "Mining humanity's second home"],
  ['#swarmalert > span:last-child', 'The cave is shaking: a squad has a swarm event pending, awaiting a management decision.'],
  ['.mission-panel .panel-title', 'Mission Board <small>MISSION</small>'],
  ['.dispatch-panel .panel-title', 'Dispatch Channel <small>DISPATCH</small>'],
  ['[data-fold="log"].panel-title', 'Operations Log <small>OPERATION LOG</small><span class="arrow">▼</span>'],
  ['#logMini', 'Click to expand log'],
  ['.tab[data-tab="roster"]', 'Roster'],
  ['.tab[data-tab="gear"]', 'Gear'],
  ['.tab[data-tab="bar"]', 'Bar'],
  ['.tab[data-tab="med"]', 'Medbay'],
  ['.tab[data-tab="market"]', 'Exchange'],
  ['.tab[data-tab="dive"]', 'Deep Dive'],
  ['.tab[data-tab="rig"]', 'Rig'],
  ['.tab[data-tab="help"]', 'Help'],
  ['.tab[data-tab="sys"]', 'System'],
  ['#btn-credits', 'About & Credits'],
  ['#btn-rename', '✏️ Callsign'],
  ['#btn-kpi', 'Claim'],
  ['.footer-credits a', 'Reference project FLORA233333'],
  ['.footer-status', '<span class="status-light"></span>All systems nominal'],
  ['.footer-version', 'v1.0.0　　Deeper down, a bigger tomorrow.']
];
const I18N_STATIC_TITLE = [
  ['#btn-pause', 'Pause / resume time'],
  ['#mode-chip', 'Toggle idle/rush mode'],
  ['#chip-credits', 'Credits'],
  ['#chip-nitra', 'Nitra'],
  ['#btn-idle-report', 'Earnings summary while on autopilot'],
  ['#btn-auto', 'Toggle 3-hour auto dispatch'],
  ['#auto-chip', 'Autopilot running; click to cancel'],
  ['#btn-res-overview', 'Resource Overview'],
  ['#btn-bgm', 'Music on/off'],
  ['#btn-settings', 'System settings']
];
const I18N_STATIC_SNAP = {};
(function snapshotStaticLang(){
  try{
    I18N_STATIC_TEXT.forEach(([sel]) => {
      const el = document.querySelector(sel);
      if(el) I18N_STATIC_SNAP['T:'+sel] = el.innerHTML;
    });
    I18N_STATIC_TITLE.forEach(([sel]) => {
      const el = document.querySelector(sel);
      if(el) I18N_STATIC_SNAP['A:'+sel] = el.getAttribute('title') || '';
    });
  }catch(e){}
})();
function applyStaticLang(){
  const en = currentLang() === 'en';
  try{
    I18N_STATIC_TEXT.forEach(([sel, enText]) => {
      const el = document.querySelector(sel);
      if(!el) return;
      const want = en ? enText : (I18N_STATIC_SNAP['T:'+sel] || el.innerHTML);
      if(el.innerHTML !== want) el.innerHTML = want;
    });
    I18N_STATIC_TITLE.forEach(([sel, enText]) => {
      const el = document.querySelector(sel);
      if(!el) return;
      const want = en ? enText : (I18N_STATIC_SNAP['A:'+sel] || el.getAttribute('title') || '');
      if(el.getAttribute('title') !== want) el.setAttribute('title', want);
    });
    const ro = document.getElementById('btn-res-overview');
    if(ro && ro.childNodes.length > 1){
      const want = en ? 'Resource Overview' : (I18N_STATIC_SNAP['N:#btn-res-overview'] || '');
      if(!I18N_STATIC_SNAP['N:#btn-res-overview']) I18N_STATIC_SNAP['N:#btn-res-overview'] = ro.childNodes[1].textContent;
      else if(ro.childNodes[1].textContent !== want) ro.childNodes[1].textContent = want;
    }
    const rc = document.getElementById('btn-refresh');
    if(rc && rc.childNodes.length > 1){
      if(!I18N_STATIC_SNAP['N:#btn-refresh']) I18N_STATIC_SNAP['N:#btn-refresh'] = rc.childNodes[1].textContent;
      else{
        const want = en ? 'Refresh' : I18N_STATIC_SNAP['N:#btn-refresh'];
        if(rc.childNodes[1].textContent !== want) rc.childNodes[1].textContent = want;
      }
    }
    const bc = document.getElementById('btn-board-compact');
    if(bc && !bc.dataset.i18nDyn){
      const want = en ? 'Compact' : (I18N_STATIC_SNAP['N:#btn-board-compact'] || bc.textContent);
      if(!I18N_STATIC_SNAP['N:#btn-board-compact']) I18N_STATIC_SNAP['N:#btn-board-compact'] = bc.textContent;
      else if(bc.textContent !== want) bc.textContent = want;
    }
    document.title = en ? 'Deep Rock Galactic · Space Rig 17 Management Terminal'
                        : (I18N_STATIC_SNAP['T:doc'] || document.title);
    if(!I18N_STATIC_SNAP['T:doc']) I18N_STATIC_SNAP['T:doc'] = document.title === 'Deep Rock Galactic · Space Rig 17 Management Terminal' ? '深岩银河 · 17号钻台管理终端' : document.title;
  }catch(e){}
  applyShellStaticLang();
  setTextLang();
}

/* —— 实时模式静态 HTML 文案切换（shell.html 注入的 #realtime-shell，文本节点级，切回零丢失）—— */
function applyShellStaticLang(){
  const en = currentLang() === 'en';
  try{
    const root = document.getElementById('realtime-shell');
    if(!root) return;
    const els = [root].concat([].slice.call(root.querySelectorAll('*')));
    const attrs = ['aria-label', 'placeholder', 'title'];
    els.forEach(el => {
      attrs.forEach(attr => {
        let v = null;
        try{ v = el.getAttribute && el.getAttribute(attr); }catch(e){ v = null; }
        if(!v) return;
        const t = String(v).trim();
        if(!t) return;
        if(!el.__i18nZhA) el.__i18nZhA = {};
        if(!(attr in el.__i18nZhA)) el.__i18nZhA[attr] = v;
        const want = en ? (I18N_EN[t] != null ? I18N_EN[t] : null) : el.__i18nZhA[attr];
        if(want != null && el.getAttribute(attr) !== want) el.setAttribute(attr, want);
      });
      const kids = el.childNodes;
      for(let j = 0; j < kids.length; j++){
        const n = kids[j];
        if(n.nodeType !== 3) continue;
        const raw = n.nodeValue || '';
        const t2 = raw.trim();
        if(!t2) continue;
        if(n.__i18nZh == null) n.__i18nZh = raw;
        const want2 = en ? (I18N_EN[t2] != null ? I18N_EN[t2] : null) : n.__i18nZh;
        if(want2 != null && n.nodeValue !== want2) n.nodeValue = want2;
      }
    });
  }catch(e){}
}

/* —— 语言切换主入口 —— */
function applyLang(lang, silent){
  const target = (lang === 'en') ? 'en' : 'zh';
  if(target === 'en'){
    Object.keys(TEXT).forEach(k => { TEXT[k] = TEXT_EN[k] || TEXT_ZH[k]; });
  }else{
    Object.keys(TEXT_ZH).forEach(k => { TEXT[k] = TEXT_ZH[k]; });
  }
  try{ localStorage.setItem('drg_lang', target); }catch(e){}
  applyStaticLang();
  /* 实时模式动态网格（帮助/设置/选单列表）按当前语言重建（内容均走 L()） */
  try{
    if(typeof DRG !== 'undefined' && DRG && DRG.ui){
      if(typeof DRG.ui.buildHelp === 'function') DRG.ui.buildHelp();
      if(typeof DRG.ui.buildSettings === 'function') DRG.ui.buildSettings();
      if(DRG.ui.selectionBuilt && typeof DRG.ui.buildBiomes === 'function'){
        DRG.ui.buildBiomes(); DRG.ui.buildHazards(); DRG.ui.buildClasses(); DRG.ui.refreshSummary();
      }
    }
  }catch(e){}
  if(silent) return;
  let sReady = false;
  try{ sReady = (typeof S !== 'undefined' && !!S); }catch(e){ sReady = false; }
  if(sReady && typeof renderAll === 'function'){
    if(typeof lastSig !== 'undefined'){ try{ lastSig = ''; }catch(e){} }
    renderAll();
    log(target === 'en'
      ? 'Language switched to English. Management apologizes for any translation irregularities — the quota remains the same.'
      : '语言已切换回中文。配额不变，谢谢配合。', 'sys');
  }
}

/* —— 首次进入：语言选择弹窗（锁定模式，双语标签防鸡生蛋）—— */
function showLangChooser(onPick){
  try{ localStorage.setItem('drg_dbg', 'chooser-entry'); }catch(e){}
  if(typeof showModal !== 'function') return;
  showModal(
    '<div style="text-align:center;padding:6px 4px 2px;">' +
      '<h3 style="color:var(--amber);margin:4px 0 2px;">选择语言 / Language</h3>' +
      '<p class="note" style="margin:2px 0 12px;">深岩银河集团尊重你的舌头。请选择终端语言。<br>The Corporation respects your tongue. Pick the terminal language.</p>' +
      '<button class="btn pri" id="btn-lang-zh" style="width:100%;height:48px;font-size:15px;margin-bottom:8px;">中文 <span class="note">Chinese</span></button>' +
      '<button class="btn" id="btn-lang-en" style="width:100%;height:48px;font-size:15px;">English <span class="note">英语</span></button>' +
    '</div>', true);
  const pick = (lang) => {
    try{ localStorage.setItem('drg_dbg', 'pick:'+lang); }catch(e){}
    applyLang(lang);
    try{ closeModal(true); }catch(e){}
    let sReady = false;
    try{ sReady = (typeof S !== 'undefined' && !!S && typeof renderAll === 'function'); }catch(e){}
    if(sReady) renderAll();
    /* 新档兜底：若选择器顶掉了序章弹窗（boot 时序与本选择器并发触发），选完语言后补开序章 */
    try{
      if(typeof playPrologue === 'function' && S && !S.flags.prologueDone && !S.flags.nameChosen && !S.deps.some(x=>x.kind==='prologue') && !S.board.some(x=>x.kind==='prologue')){
        playPrologue();
      }
    }catch(e){}
    if(typeof onPick === 'function') onPick();
  };
  const bz = document.getElementById('btn-lang-zh');
  const be = document.getElementById('btn-lang-en');
  if(bz) bz.onclick = () => pick('zh');
  if(be) be.onclick = () => pick('en');
}

/* —— 载入即应用（此时 S 未初始化，不渲染）—— */
if(currentLang() === 'en'){ applyLang('en', true); }
