pub const MILESTONE_THRESHOLDS: [f64; 5] = [0.01, 0.1, 1.0, 10.0, 100.0];

pub fn send_challenge_notification(amount_hbd: f64) {
    tracing::info!("[Notification] PoA Challenge Passed! +{:.4} HBD earned", amount_hbd);
}

pub fn send_milestone_notification(total_earned: f64, milestone: f64) {
    tracing::info!("[Notification] Milestone Reached! Total earned: {:.2} HBD", milestone.max(total_earned));
}

#[allow(dead_code)]
pub fn send_daily_summary_notification(daily_earnings: f64, challenge_count: u64) {
    tracing::info!(
        "[Notification] Daily Earnings Summary: {:.4} HBD from {} challenges",
        daily_earnings, challenge_count
    );
}

pub fn check_milestone_crossed(old_total: f64, new_total: f64) -> Option<f64> {
    for threshold in MILESTONE_THRESHOLDS {
        if old_total < threshold && new_total >= threshold {
            return Some(threshold);
        }
    }
    None
}
