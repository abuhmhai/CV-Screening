"""Route, responsive layout, and restored interaction checks for the local demo.

Imported by browser.py so the same Chrome session and error collection are used.
The React source is the design reference; this is not a pixel comparison.
"""
import json
from pathlib import Path
from playwright.sync_api import expect


def audit(page, context, base, artifacts):
    checked = []

    def api(path):
        response = context.request.get(base + '/api/v1' + path)
        assert response.ok, (path, response.status)
        return response.json()

    def login(role):
        context.clear_cookies()
        page.goto(base + '/auth/sign-in')
        page.locator('[name=email]').fill(role + '@demo.local')
        page.locator('[name=password]').fill('Demo@12345')
        page.locator('form[data-api] button').click()
        page.wait_for_url(base + '/')

    def screen(route, mobile=False, theme='dark'):
        page.evaluate("value => localStorage.setItem('cv_appearance_prefs', JSON.stringify({theme:value}))", theme)
        page.set_viewport_size({'width': 390 if mobile else 1440, 'height': 844 if mobile else 1000})
        response = page.goto(base + route)
        assert response.status == 200, (route, response.status)
        expect(page.locator('h1:visible, h2:visible').first).to_be_visible()
        body = page.locator('body').inner_text()
        assert 'Warning:' not in body and 'Fatal error:' not in body, route
        assert 'hbin' not in body and 'FirmwareModified' not in body, (route, 'binary template output')
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), (route, mobile, theme, 'horizontal overflow')
        broken = page.locator('img').evaluate_all('(images) => images.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src)')
        assert not broken, (route, broken)
        checked.append({'route': route, 'mobile': mobile, 'theme': theme})
        print('UI PASS:', route, 'mobile' if mobile else 'desktop', theme, flush=True)

    login('candidate')
    applications = api('/applications/me')
    app_id = applications[0]['id']
    jobs = api('/jobs/search')['items']
    job_id = jobs[0]['id']
    company_id = jobs[0]['company']['id']
    user_id = api('/auth/me')['id']
    recruiter_id = jobs[0]['createdBy']
    candidate_routes = [
        '/', '/u/' + user_id, '/profile', '/profile?edit=true', '/onboarding', '/feed', '/network',
        '/jobs', '/jobs/' + job_id, '/external-jobs', '/messages', '/applications',
        '/applications/' + app_id, '/ai-score/' + app_id,
        '/ai-score-detail?applicationId=' + app_id, '/saved-jobs', '/notifications',
        '/cv-builder', '/goals', '/search', '/search?query=PHP', '/company/' + company_id,
        '/settings', '/settings/account', '/settings/profile', '/settings/privacy',
        '/settings/security', '/settings/appearance', '/settings/notifications',
    ]
    for route in candidate_routes:
        for theme in ('dark', 'light'):
            for mobile in (False, True):
                screen(route, mobile, theme)
    page.goto(base + '/ai-score-detail?applicationId=' + app_id)
    assert page.url == base + '/applications'
    from social_audit import audit_social, audit_network
    audit_social(page, context, base, artifacts)
    audit_network(page, context, base, recruiter_id)
    from workflow_audit import audit_applications
    audit_applications(context, base)
    page.goto(base + '/u/' + recruiter_id)
    follow = page.locator('[data-user-follow]')
    initial = follow.get_attribute('aria-pressed')
    page.evaluate("window.__followMarker='active'")
    follow.click()
    expect(follow).to_have_attribute('aria-pressed', 'false' if initial == 'true' else 'true')
    follow.click()
    expect(follow).to_have_attribute('aria-pressed', initial)
    assert page.evaluate('window.__followMarker') == 'active'
    page.goto(base + '/notifications')
    page.evaluate("window.__notificationMarker='active'")
    unread = page.locator('[data-notification-item].unread').count()
    read_one = page.locator('[data-notification-item] [data-method=PATCH]').first
    if unread:
        read_one.click()
        expect(page.locator('[data-notification-item].unread')).to_have_count(unread - 1)
    page.locator('[data-action="/notifications/read-all"]').click()
    expect(page.locator('[data-notification-item].unread')).to_have_count(0)
    assert page.evaluate('window.__notificationMarker') == 'active'
    page.goto(base + '/applications/' + app_id)
    expect(page.locator('button[data-method=DELETE]')).to_contain_text('Rút hồ sơ')
    assert '01/01/1970' not in page.locator('body').inner_text()
    for route in ['/feed', '/network', '/messages', '/goals', '/applications/' + app_id, '/ai-score/' + app_id, '/company/' + company_id, '/settings/appearance']:
        screen(route, theme='light')
        page.screenshot(path=str(artifacts / ('audit-' + route.split('?')[0].replace('/', '-') + '-light.png')), full_page=True)

    # Theme cards edit the form, save persists, reset restores the saved value.
    page.goto(base + '/settings/appearance')
    page.locator('[data-theme-choice=dark]').click()
    expect(page.locator('[data-theme-choice=dark]')).to_have_attribute('aria-pressed', 'true')
    page.locator('form[data-preferences] button[type=submit]').click()
    expect(page.locator('html')).to_have_attribute('data-theme', 'dark')
    page.reload()
    expect(page.locator('[data-theme-choice=dark]')).to_have_attribute('aria-pressed', 'true')
    page.locator('[data-theme-choice=light]').click()
    page.locator('form[data-preferences] button[type=reset]').click()
    expect(page.locator('[data-theme-choice=dark]')).to_have_attribute('aria-pressed', 'true')
    # Saved-job tabs and keyboard navigation expose the alert form.
    page.goto(base + '/saved-jobs')
    tabs = page.locator('[role=tab]')
    tabs.first.focus()
    tabs.first.press('ArrowRight')
    expect(tabs.nth(1)).to_have_attribute('aria-selected', 'true')
    expect(page.locator('form[data-job-alert]')).to_be_visible()
    # Search inside chat uses the actual history API.
    page.goto(base + '/messages')
    page.wait_for_selector('.message')
    page.locator('#message-search').fill('No matching message 38279')
    expect(page.locator('.message')).to_have_count(0)
    page.locator('#message-search').fill('Chào')
    expect(page.locator('.message')).not_to_have_count(0)

    for role, routes in [('recruiter', ['/recruiter/dashboard', '/recruiter/analytics', '/recruiter/jobs/new', '/ai-score/' + app_id]), ('admin', ['/admin/moderation'])]:
        login(role)
        for route in routes:
            for theme in ('dark', 'light'):
                for mobile in (False, True):
                    screen(route, mobile, theme)
        if role == 'recruiter':
            page.goto(base + '/ai-score/' + app_id)
            expect(page.locator('form[data-api$="/schedule-interview"]')).to_be_visible()
            expect(page.locator('form[data-api$="/offer"]')).to_be_visible()

    context.clear_cookies()
    screen('/u/' + user_id)
    expect(page.locator('[data-profile-edit]')).to_have_count(0)
    expect(page.locator('[data-comment-form] button[type=submit]').first).to_be_disabled() if page.locator('[data-comment-form]').count() else None
    for route in ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password', '/auth/oauth-callback']:
        for theme in ('dark', 'light'):
            for mobile in (False, True):
                screen(route, mobile, theme)
    page.goto(base + '/auth/sign-up')
    page.locator('[name=fullName]').fill('UI validation')
    page.locator('[name=username]').fill('ui_validation_only')
    page.locator('[name=phone]').fill('0901234567')
    page.locator('[name=email]').fill('ui-validation@example.test')
    page.locator('[name=password]').fill('Testing-password-123')
    page.locator('[name=confirmPassword]').fill('Different-password-123')
    page.locator('form[data-register] button[type=submit]').click()
    expect(page.locator('.form-error')).to_contain_text('không khớp')
    assert page.url.endswith('/auth/sign-up')
    page.goto(base + '/auth/forgot-password')
    page.locator('form[data-api] button[type=submit]').click()
    expect(page.locator('.form-error')).to_contain_text('email hoặc số điện thoại')
    inventory = json.loads((Path(__file__).resolve().parents[1] / 'database/legacy-pages.json').read_text(encoding='utf-8'))
    def normalize(route):
        route = route.split('?')[0]
        for prefix, param in [('/jobs/', '[id]'), ('/company/', '[id]'), ('/applications/', '[id]'), ('/ai-score/', '[id]'), ('/u/', '[slug]')]:
            if route.startswith(prefix):
                return prefix + param
        return route
    covered = {normalize(item['route']) for item in checked}
    assert not (set(inventory) - covered), ('Uncovered legacy pages', set(inventory) - covered)
    (artifacts / 'ui-audit.json').write_text(json.dumps({'screens': checked, 'count': len(checked), 'legacyPageCount': len(inventory), 'coveredLegacyPages': sorted(set(inventory) & covered)}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'UI audit passed: {len(checked)} desktop/mobile/theme checks, three roles, restored interactions')
