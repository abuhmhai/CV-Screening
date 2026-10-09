"""Behavior checks for restored feed interactions; uses isolated, cleaned-up posts."""
from playwright.sync_api import expect


def audit_social(page, context, base, artifacts):
    page.goto(base + '/feed')
    token = context.request.get(base + '/api/v1/auth/csrf').json()['csrfToken']
    headers = {'X-CSRF-Token': token}
    created = []

    def create(content):
        response = context.request.post(base + '/api/v1/social/posts', data={'content': content, 'visibility': 'PUBLIC'}, headers=headers)
        assert response.ok, response.text()
        post = response.json()
        created.append(post['id'])
        return post

    try:
        post = create('UI parity: Vietnamese replies 🧑‍💻')
        comments = []
        for text in ['Root one', 'Root two', 'Root three <script>window.__unsafe=true</script>']:
            response = context.request.post(base + '/api/v1/social/posts/' + post['id'] + '/comments', data={'content': text}, headers=headers)
            assert response.ok
            comments.append(response.json())
        page.goto(base + '/feed?post=' + post['id'])
        page.evaluate("window.__refactorMarker='active'")
        article = page.locator('[data-post-id="' + post['id'] + '"]')
        article.locator('[data-show-comments]').click()
        thread = article.locator('[data-comment-thread]')
        expect(thread.locator('[data-comment-root]:visible')).to_have_count(2)
        thread.locator('[data-expand-comments]').click()
        expect(thread.locator('[data-comment-root]:visible')).to_have_count(3)
        assert not page.evaluate('Boolean(window.__unsafe)')
        root = thread.locator('[data-comment-id="' + comments[0]['id'] + '"]')
        root.locator('[data-reply-to]').click()
        expect(thread.locator('[data-reply-context]')).to_contain_text('Đang trả lời')
        draft = thread.locator('[name=content]')
        draft.fill('Draft stays after failure 🧑‍💻')
        endpoint = '**/api/v1/social/posts/' + post['id'] + '/comments'
        page.route(endpoint, lambda route: route.fulfill(status=500, content_type='application/json', body='{"message":"Simulated failure"}'))
        thread.locator('button[type=submit]').click()
        expect(thread.locator('.form-error')).to_contain_text('Simulated failure')
        expect(draft).to_have_value('Draft stays after failure 🧑‍💻')
        expect(thread.locator('[name=parentId]')).to_have_value(comments[0]['id'])
        page.unroute(endpoint)
        thread.locator('button[type=submit]').click()
        expect(draft).to_have_value('')
        reply = thread.locator('.comment-reply').filter(has_text='Draft stays after failure')
        expect(reply).to_have_count(1)
        expect(thread.locator('[data-reply-context]')).to_be_hidden()
        reply.locator('[data-reply-to]').click()
        draft.fill('Reply to reply')
        thread.locator('button[type=submit]').click()
        expect(thread.locator('.comment-reply .comment-reply')).to_contain_text('Reply to reply')
        assert page.evaluate('window.__refactorMarker') == 'active'
        control = thread.locator('[data-comment-id="' + comments[0]['id'] + '"] > .comment .reaction-control').first
        for reaction in ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY', 'CELEBRATE', 'SUPPORT', 'INSIGHTFUL']:
            control.locator('summary').click()
            control.locator('[data-reaction="' + reaction + '"]').click()
            expect(control.locator('[data-reaction="' + reaction + '"]')).to_have_attribute('aria-pressed', 'true')
        control.locator('summary').click()
        control.locator('[data-reaction=INSIGHTFUL]').click()
        expect(control.locator('[data-reaction=INSIGHTFUL]')).to_have_attribute('aria-pressed', 'false')
        thread.locator('[data-expand-comments]').click()
        expect(thread.locator('[data-comment-root]:visible')).to_have_count(2)
        assert page.evaluate('window.__refactorMarker') == 'active'
        page.set_viewport_size({'width': 390, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Nested thread overflows mobile'
        page.evaluate('document.activeElement.blur(); window.scrollTo(0, 0)')
        page.screenshot(path=str(artifacts / 'feed-nested-replies-mobile.png'), full_page=True)
        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.goto(base + '/feed')
        page.evaluate("window.__refactorMarker='composer'")
        composer = page.locator('[data-post-media]')
        composer.locator('[name=content]').fill('UI parity composer creates in place')
        with page.expect_response('**/api/v1/social/posts') as response:
            composer.locator('button[type=submit]').click()
        submitted = response.value.json()
        created.append(submitted['id'])
        expect(page.locator('[data-post-id="' + submitted['id'] + '"]')).to_be_visible()
        assert page.evaluate('window.__refactorMarker') == 'composer'
        created_article = page.locator('[data-post-id="' + submitted['id'] + '"]')
        created_article.locator('[data-action][data-method=DELETE]').click()
        expect(created_article).to_have_count(0)
        assert page.evaluate('window.__refactorMarker') == 'composer'
        for index in range(12):
            create('UI pagination post ' + str(index))
        page.goto(base + '/feed')
        page.evaluate("window.__refactorMarker='pagination'")
        page.locator('[data-feed-filter=MINE]').click()
        first_id = page.locator('[data-feed-post]:visible').first.get_attribute('data-post-id')
        first = page.locator('[data-post-id="' + first_id + '"]')
        first.locator('[data-show-comments]').click()
        first.locator('[name=content]').fill('Draft survives pagination')
        before = page.locator('[data-feed-post]').count()
        page.locator('[data-feed-more]').click()
        expect(page.locator('[data-feed-post]').nth(before)).to_be_attached()
        ids = page.locator('[data-feed-post]').evaluate_all('(posts) => posts.map(post => post.dataset.postId)')
        assert len(ids) == len(set(ids)), 'Pagination duplicated posts'
        expect(first.locator('[name=content]')).to_have_value('Draft survives pagination')
        expect(page.locator('[data-feed-filter=MINE]')).to_have_attribute('aria-pressed', 'true')
        assert page.evaluate('window.__refactorMarker') == 'pagination'
        print('UI PASS: nested replies, all reactions, failure/draft recovery, safe text, mobile threads, composer/delete without reload', flush=True)
    finally:
        page.unroute('**/api/v1/social/posts/*/comments')
        for post_id in created:
            context.request.delete(base + '/api/v1/social/posts/' + post_id, headers=headers)


def audit_network(page, context, base, recruiter_id):
    token = context.request.get(base + '/api/v1/auth/csrf').json()['csrfToken']
    headers = {'X-CSRF-Token': token}
    me = context.request.get(base + '/api/v1/auth/me').json()['id']
    existing = context.request.get(base + '/api/v1/social/connections').json()
    if any(recruiter_id in [item['requesterId'], item['addresseeId']] for item in existing):
        print('UI SKIP: network mutation preserves an existing demo connection', flush=True)
        return
    actor = context.browser.new_context()
    connection_id = None
    try:
        page.goto(base + '/network')
        page.evaluate("window.__networkMarker='sent'")
        buttons = page.locator('[data-action="/social/connections"]')
        target = next(button for button in buttons.all() if recruiter_id in button.get_attribute('data-body'))
        with page.expect_response('**/api/v1/social/connections') as response:
            target.click()
        connection_id = response.value.json()['id']
        card = page.locator('[data-network-person]').filter(has=page.locator('[data-action="/social/connections/' + connection_id + '"]'))
        expect(card).to_contain_text('Đã gửi lời mời')
        search = page.locator('#network-search')
        search.fill(card.locator('strong').first.inner_text())
        card.locator('[data-method=DELETE]').click()
        expect(page.locator('[data-action="/social/connections/' + connection_id + '"]')).to_have_count(0)
        assert page.evaluate('window.__networkMarker') == 'sent'
        connection_id = None
        actor_token = actor.request.get(base + '/api/v1/auth/csrf').json()['csrfToken']
        actor_headers = {'X-CSRF-Token': actor_token}
        response = actor.request.post(base + '/api/v1/auth/login', data={'email': 'recruiter@demo.local', 'password': 'Demo@12345'}, headers=actor_headers)
        assert response.ok
        actor_headers['X-CSRF-Token'] = actor.request.get(base + '/api/v1/auth/csrf').json()['csrfToken']
        response = actor.request.post(base + '/api/v1/social/connections', data={'addresseeId': me}, headers=actor_headers)
        assert response.ok
        connection_id = response.json()['id']
        page.goto(base + '/network')
        page.evaluate("window.__networkMarker='accepted'")
        accept = page.locator('[data-action="/social/connections/' + connection_id + '/status"]').filter(has_text='Chấp nhận')
        accept.click()
        expect(page.locator('[data-action="/social/connections/' + connection_id + '"]')).to_be_visible()
        search = page.locator('#network-search')
        name = page.locator('[data-network-person]').filter(has=page.locator('[data-action="/social/connections/' + connection_id + '"]')).locator('strong').first.inner_text()
        search.fill(name)
        page.locator('[data-action="/social/connections/' + connection_id + '"]').click()
        expect(page.locator('[data-action="/social/connections/' + connection_id + '"]')).to_have_count(0)
        assert page.evaluate('window.__networkMarker') == 'accepted'
        connection_id = None
        print('UI PASS: network invite, revoke, accept and remove without reload', flush=True)
    finally:
        if connection_id:
            context.request.delete(base + '/api/v1/social/connections/' + connection_id, headers=headers)
        actor.close()
