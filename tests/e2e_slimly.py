"""
Slimly E2E Tests (v2 — fixed selectors)
Flow: Onboarding (4 steps) → HomePage → LogPage → WeightPage → FoodNoise → Nav
"""
from playwright.sync_api import sync_playwright, Page, expect
import sys

BASE_URL = "http://localhost:5173"
PASS = "✅"
FAIL = "❌"
results: list[tuple[str, bool, str]] = []


# ── Helpers ────────────────────────────────────────────────────────────────────

def run(name: str, fn, page: Page):
    try:
        fn(page)
        results.append((name, True, ""))
        print(f"  {PASS} {name}")
    except Exception as e:
        results.append((name, False, str(e)[:200]))
        print(f"  {FAIL} {name}: {str(e)[:200]}")


def reset(page: Page):
    """Clear all localStorage → force onboarding."""
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
    page.reload()
    page.wait_for_load_state("networkidle")


def goto_home(page: Page):
    """Navigate home by clicking first bottom-nav button."""
    btns = page.locator("nav button").all()
    if btns:
        btns[0].click()
        page.wait_for_timeout(400)


def complete_onboarding(page: Page):
    """
    Onboarding steps:
      0 → Choose medication (猛健樂 pre-selected)
      1 → Dose + injection day + start date
      2 → Body weight (current required, target/height optional)
      3 → Account (click '先試用，稍後再登入' to skip)
    """
    reset(page)

    # Step 0: medication — 猛健樂 pre-selected; click 繼續
    expect(page.locator("text=你使用哪種藥物")).to_be_visible(timeout=8000)
    page.locator("text=繼續").click()
    page.wait_for_timeout(600)

    # Step 1: dose is pre-selected; pick injection day (Mon=index 1) → 繼續
    expect(page.locator("text=設定你的劑量與時間")).to_be_visible(timeout=5000)
    page.locator("text=2.5mg").first.click()
    page.locator("text=繼續").click()
    page.wait_for_timeout(600)

    # Step 2: current weight required
    expect(page.locator("text=設定你的體重目標")).to_be_visible(timeout=5000)
    page.locator("input[placeholder*='75']").or_(
        page.locator("input[type='number']").first
    ).first.fill("75")
    page.locator("text=繼續").click()
    page.wait_for_timeout(600)

    # Step 3: skip auth
    expect(page.locator("text=建立帳號，安全保存")).to_be_visible(timeout=5000)
    page.locator("text=先試用，稍後再登入").click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)


# ── Tests ──────────────────────────────────────────────────────────────────────

def test_onboarding_step0_renders(page: Page):
    reset(page)
    expect(page.locator("text=你使用哪種藥物")).to_be_visible(timeout=8000)
    assert page.locator("text=猛健樂").is_visible()
    assert page.locator("text=週纖達").is_visible()
    assert page.locator("text=善纖達").is_visible()
    assert page.locator("text=繼續").is_visible()


def test_onboarding_step1_dose(page: Page):
    # Already at step 1 from previous test; advance
    page.locator("text=繼續").click()
    page.wait_for_timeout(600)
    expect(page.locator("text=設定你的劑量與時間")).to_be_visible(timeout=5000)
    assert page.locator("text=2.5mg").first.is_visible()   # .first — may appear in multiple steps
    assert page.locator("text=繼續").is_visible()


def test_onboarding_step2_weight(page: Page):
    page.locator("text=繼續").click()
    page.wait_for_timeout(600)
    expect(page.locator("text=設定你的體重目標")).to_be_visible(timeout=5000)
    assert page.locator("text=目前體重").is_visible()


def test_onboarding_completes_to_homepage(page: Page):
    # Fill weight and finish
    page.locator("input[type='number']").first.fill("75")
    page.locator("text=繼續").click()
    page.wait_for_timeout(600)
    # Step 4: skip
    expect(page.locator("text=先試用，稍後再登入")).to_be_visible(timeout=5000)
    page.locator("text=先試用，稍後再登入").click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    # Should be on HomePage — greeting OR status card
    greeting = page.locator("text=早安").or_(
        page.locator("text=午安")).or_(page.locator("text=晚安"))
    assert greeting.count() > 0, "Greeting not found — onboarding did not complete"


def test_homepage_quick_actions(page: Page):
    assert page.locator("text=記錄注射").is_visible(), "記錄注射 not visible"
    assert page.locator("text=記錄體重").is_visible(), "記錄體重 not visible"


def test_homepage_status_card(page: Page):
    assert page.locator("text=猛健樂").is_visible(), "Medication name not on status card"
    assert page.locator("text=目前進度").is_visible(), "Status card not visible"


def test_homepage_weight_section(page: Page):
    assert page.locator("text=體重趨勢").is_visible(), "Weight section missing"


def test_navigate_to_log_via_cta(page: Page):
    page.locator("text=記錄注射").click()
    page.wait_for_timeout(600)
    # LogPage should be visible (日誌 / 注射記錄 / 新增)
    visible = (page.locator("text=注射").count() > 0 or
               page.locator("text=記錄").count() > 0)
    assert visible, "LogPage did not render"
    page.screenshot(path="/tmp/slimly_log.png", full_page=True)


def test_navigate_to_weight_via_cta(page: Page):
    goto_home(page)
    page.locator("text=記錄體重").click()
    page.wait_for_timeout(600)
    visible = (page.locator("text=體重").count() > 0)
    assert visible, "WeightPage did not render"
    page.screenshot(path="/tmp/slimly_weight_page.png", full_page=True)


def test_weight_log_entry(page: Page):
    """Find the weight input on WeightPage and submit a value."""
    # WeightPage might have an input or a button to open modal
    inputs = page.locator("input[type='number']").all()
    if inputs:
        inputs[0].fill("74.5")
        # Try to find save/confirm button
        save_btn = (
            page.locator("button[type='submit']").first
            if page.locator("button[type='submit']").count() > 0
            else page.locator("text=儲存").or_(page.locator("text=新增")).or_(
                page.locator("text=確認")).first
        )
        if save_btn.is_visible():
            save_btn.click()
            page.wait_for_timeout(600)
    page.screenshot(path="/tmp/slimly_weight_entry.png", full_page=True)
    assert page.locator("text=體重").count() > 0, "WeightPage disappeared after entry"


def test_bottom_nav_all_tabs(page: Page):
    """Click every bottom nav tab; confirm no error page."""
    nav_buttons = page.locator("nav button").all()
    assert len(nav_buttons) >= 4, f"Expected ≥4 nav buttons, got {len(nav_buttons)}"
    for i, btn in enumerate(nav_buttons):
        btn.click()
        page.wait_for_timeout(400)
        err = page.locator("text=Uncaught").or_(page.locator("text=TypeError")).count()
        assert err == 0, f"JS error after nav tab {i}"


def test_food_noise_appears_on_homepage(page: Page):
    """Food noise slider should appear when startDate ≥3 days ago."""
    goto_home(page)
    # Inject: set startDate to 10 days ago in localStorage profile
    page.evaluate("""() => {
        const raw = localStorage.getItem('slimly_profile');
        if (!raw) return;
        const p = JSON.parse(raw);
        const d = new Date();
        d.setDate(d.getDate() - 10);
        p.startDate = d.toISOString().split('T')[0];
        localStorage.setItem('slimly_profile', JSON.stringify(p));
    }""")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)
    assert page.locator("text=食慾雜音").is_visible(), "食慾雜音 not visible after day 3"


def test_food_noise_slider_records(page: Page):
    """Move slider and tap 記錄今天; confirm saved state after hint disappears."""
    slider = page.locator("input[type='range']").first
    assert slider.is_visible(), "Range slider not found"
    # Set to level 3
    slider.fill("3")
    page.wait_for_timeout(200)
    # Should show 記錄今天 button (unsaved)
    save_btn = page.locator("text=記錄今天").first
    assert save_btn.is_visible(), "記錄今天 button not visible after slider move"
    save_btn.click()
    # showSaveHint shows "已記錄 ✓" for 2s, then disappears → 修改 appears
    # Wait for hint then for 修改 (up to 4s)
    page.wait_for_timeout(300)
    hint = page.locator("text=已記錄")
    if hint.is_visible():
        # Wait for hint to fade
        page.wait_for_timeout(2200)
    expect(page.locator("text=修改")).to_be_visible(timeout=3000)


def test_food_noise_trend_needs_2entries(page: Page):
    """Trend chart appears only with ≥2 entries."""
    # Inject second entry for yesterday
    page.evaluate("""() => {
        const raw = localStorage.getItem('slimly_food_noise_logs') || '[]';
        const logs = JSON.parse(raw);
        const yest = new Date(); yest.setDate(yest.getDate() - 1);
        logs.push({ id: 'test-yest', date: yest.toISOString().split('T')[0], level: 7 });
        localStorage.setItem('slimly_food_noise_logs', JSON.stringify(logs));
    }""")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(600)
    # Trend chart area (text)
    assert page.locator("text=食慾雜音趨勢").is_visible(), "Trend chart section not visible with ≥2 entries"


# ── Runner ─────────────────────────────────────────────────────────────────────

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")

        print("\n=== Slimly E2E Tests ===\n")

        print("📋 Onboarding（4 steps）")
        run("Step 0 renders (medication)", test_onboarding_step0_renders, page)
        run("Step 1 renders (dose)", test_onboarding_step1_dose, page)
        run("Step 2 renders (weight)", test_onboarding_step2_weight, page)
        run("Complete onboarding → HomePage", test_onboarding_completes_to_homepage, page)

        print("\n📋 HomePage")
        run("Quick action CTAs visible", test_homepage_quick_actions, page)
        run("Status card visible", test_homepage_status_card, page)
        run("Weight trend section visible", test_homepage_weight_section, page)

        print("\n📋 Navigation")
        run("記錄注射 CTA → LogPage", test_navigate_to_log_via_cta, page)
        run("記錄體重 CTA → WeightPage", test_navigate_to_weight_via_cta, page)
        run("Weight log entry submission", test_weight_log_entry, page)
        run("All bottom nav tabs reachable", test_bottom_nav_all_tabs, page)

        print("\n📋 Food Noise (P1 feature)")
        run("Slider appears after day 3", test_food_noise_appears_on_homepage, page)
        run("Slider records and shows saved state", test_food_noise_slider_records, page)
        run("Trend chart shows with ≥2 entries", test_food_noise_trend_needs_2entries, page)

        browser.close()

        passed = sum(1 for _, ok, _ in results if ok)
        total = len(results)
        print(f"\n{'='*44}")
        print(f"結果：{passed}/{total} 通過")
        if passed < total:
            print("\n失敗：")
            for name, ok, err in results:
                if not ok:
                    print(f"  ❌ {name}\n     → {err}")
        print('='*44)
        sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
