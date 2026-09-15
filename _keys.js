const fs = require('fs');
const g = fs.readFileSync('游戏.html', 'utf8');
const want = ['ev_swarm_title','ev_swarm_desc','ev_swarm_a_btn','ev_swarm_a_win','ev_swarm_a_fail','ev_swarm_b_btn','ev_swarm_b_result',
'ev_richvein_title','ev_richvein_desc','ev_richvein_a_btn','ev_richvein_a_win','ev_richvein_a_fail','ev_richvein_b_btn','ev_richvein_b_result',
'ev_leech_a_btn','ev_leech_a_win','ev_leech_a_fail','ev_leech_b_btn','ev_leech_b_result',
'ev_breakdown_a_btn','ev_breakdown_a_result','ev_breakdown_b_btn','ev_breakdown_b_result',
'ev_elite_title','ev_elite_desc','ev_elite_a_btn','ev_elite_a_win','ev_elite_a_fail','ev_elite_b_btn','ev_elite_b_result',
'ui_settle_title','ui_settle_sub','ui_settle_sub_fail','ui_settle_btn','egg_settle_1','egg_settle_2','egg_settle_3','egg_settle_4','egg_settle_5',
'kpi_issue_1','kpi_issue_2','kpi_issue_3','kpi_success_1','kpi_success_2','kpi_success_3','kpi_fail_1','kpi_fail_2','kpi_fail_3',
'ui_roster_title','ui_roster_sub','ui_bar_title','ui_bar_sub','ui_med_title','ui_med_sub','ui_gear_title','ui_gear_sub','ui_gear_note','ui_rig_title','ui_rig_sub',
'ui_elite_title','ui_elite_sub','ui_elite_btn_hire','ui_elite_locked','ui_kpi_title','ui_kpi_sub','ui_deploy_title','ui_deploy_sub','ui_deploy_btn_cancel',
'ui_offline_title','ui_offline_sub','ui_offline_btn','ui_save_ok','ui_save_warn','ui_settings_sub','ui_settings_btn_reset',
'ui_recall_title','ui_recall_btn','ui_recall_confirm','ui_bar_btn_close','ui_med_btn','ui_gear_btn','ui_elite_btn','ui_market_buy10','ui_camp_fold',
'log_camp_empty','log_elite_all','tr_slot_full','tr_linktree_buy','tr_equip_msg','med_psa','med_pain','med_discharge','ui_mission_title','ui_mission_sub','ui_mission_btn_refresh','ui_mission_hazard',
'ui_main_title','ui_main_sub','ui_ticker_default','egg_rig_1','egg_rig_2','egg_bar_1','egg_bar_2','karl_bar_toast','karl_record','ui_morale_label','ui_morale_low','ui_morale_high'];
const vals = {};
for (const k of want) {
  const m = g.match(new RegExp('\\n\\s*' + k + ':\\s*"((?:[^"\\\\]|\\\\.)*)"'));
  vals[k] = m ? m[1] : '(NOT FOUND)';
  console.log(k, '=', JSON.stringify(vals[k]).slice(0, 150));
}
