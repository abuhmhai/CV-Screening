"""Smoke checks against the running local demo using installed Chrome.
Run: python apps/php/tests/browser.py (requires playwright, not a production dependency).
"""
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
root = Path(__file__).resolve().parents[3]
artifacts = root / "apps/php/storage/reports"
artifacts.mkdir(parents=True, exist_ok=True)
base = os.getenv("BROWSER_APP_URL", "http://127.0.0.1:8080")
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="C:/Program Files/Google/Chrome/Application/chrome.exe", headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    page.on("pageerror", lambda error: errors.append(str(error)))
    if '--audit-only' in sys.argv:
        import importlib.util
        spec = importlib.util.spec_from_file_location('ui_audit', Path(__file__).with_name('ui_audit.py'))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        module.audit(page, context, base, artifacts)
        assert not errors, errors
        browser.close()
        sys.exit(0)
    page.goto(base, wait_until="networkidle")
    assert page.locator("h1").count()
    page.screenshot(path=str(artifacts / "home-desktop.png"), full_page=True)
    # Exercise GET actions through the shared request helper, including demo login.
    with page.expect_request("**/api/v1/auth/demo-login?email=*") as demo_request:
        page.locator('button[data-action^="/auth/demo-login"]').click()
    assert demo_request.value.method == 'GET'
    assert demo_request.value.post_data is None
    page.wait_for_url('**/profile')
    assert "Nguyễn Minh Anh" in page.locator('h1').inner_text()
    context.clear_cookies()
    page.goto(base + "/auth/sign-in")
    page.locator('[name="email"]').fill("candidate@demo.local")
    page.locator('[name="password"]').fill(os.getenv("DEMO_PASSWORD", "Demo@12345"))
    page.locator('form[data-api] button').click()
    page.wait_for_url(base + "/")
    page.goto(base + "/profile")
    assert "Nguyễn Minh Anh" in page.locator("h1").inner_text()
    page.screenshot(path=str(artifacts / "profile-desktop.png"), full_page=True)
    page.locator('[data-profile-edit]').click()
    assert page.locator('#profile-editor').is_visible()
    assert page.locator('#profile-editor [name="fullName"]').input_value() == "Nguyễn Minh Anh"
    with page.expect_navigation():
        page.locator('#editor-basic form[data-api] button').click()
    assert "Nguyễn Minh Anh" in page.locator('h1').inner_text()
    page.locator('[data-profile-edit]').click()
    page.locator('[data-profile-edit]').click()
    for route in ["/feed", "/network", "/applications", "/saved-jobs", "/notifications", "/settings", "/settings/account", "/settings/profile", "/settings/privacy", "/settings/security", "/settings/appearance", "/settings/notifications", "/cv-builder", "/search", "/external-jobs"]:
        response = page.goto(base + route)
        assert response.status == 200, (route, response.status)
        assert page.locator('h1').count(), route
        assert "Warning:" not in page.locator('body').inner_text(), route
    page.locator('[data-job-summary]').first.click()
    page.wait_for_function("document.querySelector('#job-summary .dialog-body h2') !== null")
    page.locator('#job-summary [data-close-dialog]').click()
    page.locator('[data-job-screen]').first.click()
    assert page.locator('#cv-screening').is_visible()
    page.locator('#cv-screening [name="cvFileId"]').select_option(index=1)
    page.locator('#cv-screening form button').click()
    page.wait_for_selector('#screen-result h3', timeout=45000)
    assert "/100" in page.locator('#screen-result h3').inner_text()
    page.locator('#cv-screening [data-close-dialog]').click()
    saved = page.locator('[data-job-save]').first.get_attribute('aria-pressed')
    page.locator('[data-job-save]').first.click()
    page.wait_for_function("document.querySelector('[data-job-save]').getAttribute('aria-pressed') !== " + repr(saved))
    page.locator('[data-job-save]').first.click()
    page.wait_for_function("document.querySelector('[data-job-save]').getAttribute('aria-pressed') === " + repr(saved))
    page.goto(base + "/cv-builder")
    page.locator('[name="title"]').fill('Browser UI CV')
    page.locator('[name="fullName"]').fill("Browser Preview")
    assert "Browser Preview" in page.locator('#cv-live-preview').inner_text()
    page.locator('[data-cv-add="experiences"]').click()
    page.locator('[data-cv-group="experiences"] [data-field="company"]').last.fill("Preview Company")
    assert "Preview Company" in page.locator('#cv-live-preview').inner_text()
    page.locator('[data-cv-group="experiences"] [data-cv-remove]').last.click()
    assert "Preview Company" not in page.locator('#cv-live-preview').inner_text()
    page.locator('[data-cv-add="skills"]').click()
    page.locator('[data-cv-group="skills"] [data-field="name"]').last.fill('PHP')
    page.locator('[data-rich-cv] button[type="submit"]').click()
    page.wait_for_url('**/cv-builder?cv=*')
    assert page.locator('[name="title"]').input_value() == 'Browser UI CV'
    assert page.locator('[data-cv-group="skills"] [data-field="name"]').last.input_value() == 'PHP'
    page.screenshot(path=str(artifacts / "cv-builder-desktop.png"), full_page=True)
    with page.expect_download() as download:
        page.locator('a[href$="/export"]').click()
    assert Path(download.value.path()).read_bytes().startswith(b'%PDF-')
    page.locator('button[data-method="DELETE"]').click()
    page.wait_for_url('**/cv-builder')
    page.goto(base + "/messages")
    page.wait_for_selector(".message")
    page.locator('#message-input').fill("Browser smoke test — tiếng Việt")
    page.locator('#message-form button').click()
    page.wait_for_function("Array.from(document.querySelectorAll('.message')).some(e => e.textContent.includes('Browser smoke test'))")
    page.goto(base + "/goals")
    page.wait_for_selector("#goal-list article")
    previous = page.locator("#goal-list article").count()
    page.locator('[data-dialog="create-goal"]').click()
    page.locator('#goal-form [name="title"]').fill("Browser test goal")
    page.locator('#goal-form [name="targetRole"]').fill("PHP Developer")
    page.locator('#goal-form [name="milestones"]').fill("Learn MySQL")
    page.locator('#goal-form button').click()
    assert page.locator("#goal-list article").count() == previous + 1
    page.locator('#goal-list article').first.locator('input[type="checkbox"]').check()
    assert "100%" in page.locator('#goal-list article').first.inner_text()
    page.locator('#goal-list article').first.locator('[data-goal-delete]').click()
    assert page.locator('#goal-list article').count() == previous
    page.locator('#theme-toggle').click()
    assert page.locator('html').get_attribute('data-theme') == 'light'
    page.reload()
    assert page.locator('html').get_attribute('data-theme') == 'light'
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(base + "/jobs")
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    page.screenshot(path=str(artifacts / "jobs-mobile.png"), full_page=True)
    page.locator('[data-mobile-filters]').click()
    assert page.locator('.filter-sidebar').is_visible()
    page.locator('[data-dialog="mobile-navigation"]').click()
    assert page.locator('#mobile-navigation').is_visible()
    page.locator('#mobile-navigation [data-close-dialog]').click()
    for route in ["/", "/profile", "/feed", "/settings/privacy", "/cv-builder", "/external-jobs"]:
        page.goto(base + route)
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), route
    page.goto(base + "/external-jobs")
    page.screenshot(path=str(artifacts / "external-jobs-mobile.png"), full_page=True)
    page.set_viewport_size({"width": 1440, "height": 1000})
    for role, routes in [("recruiter", ["/recruiter/dashboard", "/recruiter/analytics", "/recruiter/jobs/new"]), ("admin", ["/admin/moderation"])]:
        context.clear_cookies()
        page.goto(base + "/auth/sign-in")
        page.locator('[name="email"]').fill(role + "@demo.local")
        page.locator('[name="password"]').fill(os.getenv("DEMO_PASSWORD", "Demo@12345"))
        page.locator('form[data-api] button').click()
        page.wait_for_url(base + "/")
        for route in routes:
            response = page.goto(base + route)
            assert response.status == 200, (route, response.status)
            assert page.locator('h1').count()
            assert "Warning:" not in page.locator('body').inner_text(), route
            page.screenshot(path=str(artifacts / (route.replace('/', '-') + '-desktop.png')), full_page=True)
            if route == '/recruiter/dashboard':
                page.locator('#candidate-search').fill('No Such Candidate')
                assert page.locator('#candidate-table tbody tr:visible').count() == 0
                page.locator('#candidate-search').fill('Nguyễn Minh Anh')
                assert page.locator('#candidate-table tbody tr:visible').count() == 1
                page.locator('#candidate-status').select_option('INTERVIEW')
                assert page.locator('#candidate-table tbody tr:visible').count() == 0
    import importlib.util
    spec = importlib.util.spec_from_file_location('ui_audit', Path(__file__).with_name('ui_audit.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.audit(page, context, base, artifacts)
    assert not errors, errors
    browser.close()
print("Browser checks passed: three roles, profile, chat, goals, theme, mobile, no JavaScript exceptions")
