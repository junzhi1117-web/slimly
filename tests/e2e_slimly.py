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


def test_maintenance_toggle_profile(page: Page):
    """Navigate to ProfilePage and find the 停藥狀態 toggle."""
    nav_buttons = page.locator("nav button").all()
    nav_buttons[-1].click()   # Last tab = 我 (profile)
    page.wait_for_timeout(500)
    assert page.locator("text=停藥狀態").is_visible(), "停藥狀態 section not found in ProfilePage"
    assert page.locator("text=用藥中").is_visible(), "Toggle default state (用藥中) not visible"


def test_maintenance_homepage(page: Page):
    """Enable maintenance mode; HomePage should show 維持期."""
    # Click the toggle button inside the 停藥狀態 card
    toggle = page.locator("text=停藥狀態").locator("..").locator("button").first
    toggle.click()
    page.wait_for_timeout(500)
    # .first — "維持期模式" may appear in both the label and a badge
    assert page.locator("text=維持期模式").first.is_visible(), "維持期模式 label not shown after toggle"
    # Go home
    nav_buttons = page.locator("nav button").all()
    nav_buttons[0].click()
    page.wait_for_timeout(500)
    assert page.locator("text=維持期第").is_visible(), "維持期 greeting not on HomePage"
    assert page.locator("text=維持中").is_visible(), "維持中 badge not visible"


def test_maintenance_nav(page: Page):
    """In maintenance mode, nav should have no 注射 tab."""
    nav_buttons = page.locator("nav button").all()
    nav_labels = [b.inner_text() for b in nav_buttons]
    assert "注射" not in nav_labels, f"注射 tab should be hidden in maintenance mode, got: {nav_labels}"
    # 飲食 should be second tab (index 1)
    assert "飲食" in nav_labels, "飲食 tab missing"
    assert nav_labels.index("飲食") < nav_labels.index("體重"), "飲食 should come before 體重"


def test_maintenance_message(page: Page):
    """Maintenance contextual message should be visible."""
    # Ensure we're on HomePage (previous test may have navigated away)
    nav_buttons = page.locator("nav button").all()
    nav_buttons[0].click()
    page.wait_for_timeout(500)
    assert page.locator("text=記錄今日體重").is_visible(), "Single CTA (記錄今日體重) not visible"
    # Message card (emoji + title, depends on start date — may or may not show)
    page.screenshot(path="/tmp/slimly_maintenance.png", full_page=True)
    # At minimum, no 記錄注射 CTA
    assert page.locator("text=記錄注射").count() == 0, "記錄注射 should be hidden in maintenance mode"


def test_maintenance_disable(page: Page):
    """Disable maintenance mode → back to normal UI."""
    nav_buttons = page.locator("nav button").all()
    nav_buttons[-1].click()   # Profile tab
    page.wait_for_timeout(500)
    # Toggle again to disable
    toggle_area = page.locator("text=維持期模式").locator("../..").locator("button").first
    toggle_area.click()
    page.wait_for_timeout(500)
    assert page.locator("text=用藥中").is_visible(), "Should return to 用藥中 state"
    # Back to home — should show normal view
    nav_buttons = page.locator("nav button").all()
    nav_buttons[0].click()
    page.wait_for_timeout(500)
    assert page.locator("text=記錄注射").is_visible(), "記錄注射 should be back in normal mode"


pass  # food noise tests removed (feature deleted in P2)


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

        print("\n📋 Maintenance Mode (P2 feature)")
        run("Maintenance toggle in ProfilePage", test_maintenance_toggle_profile, page)
        run("Maintenance mode: homepage shows 維持期", test_maintenance_homepage, page)
        run("Maintenance mode: nav hides 注射 tab", test_maintenance_nav, page)
        run("Maintenance mode: message card visible", test_maintenance_message, page)
        run("Disable maintenance mode", test_maintenance_disable, page)

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
