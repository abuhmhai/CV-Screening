"""Candidate application UI checks with a disposable identity on a test database."""
import base64
import json
import os
from pathlib import Path
import subprocess
import uuid
from playwright.sync_api import expect


def audit_applications(context, base):
    dsn = os.getenv('TEST_DB_DSN', '')
    if 'dbname=' not in dsn or 'test' not in dsn.split('dbname=')[1].split(';')[0]:
        print('UI SKIP: application mutations require TEST_DB_DSN', flush=True)
        return
    root = Path(__file__).resolve().parents[3]
    php = os.getenv('PHP_BINARY', str(root / '.tools/php74/php.exe'))
    actor = context.browser.new_context()
    user_id = None
    try:
        csrf = actor.request.get(base + '/api/v1/auth/csrf').json()['csrfToken']
        identity = 'ui_parity_' + uuid.uuid4().hex[:12]
        response = actor.request.post(base + '/api/v1/auth/register', headers={'X-CSRF-Token': csrf}, data={'email': identity + '@example.test', 'username': identity, 'password': 'Testing-password-123', 'fullName': 'UI workflow audit', 'role': 'CANDIDATE'})
        assert response.ok, response.text()
        user_id = actor.request.get(base + '/api/v1/auth/me').json()['id']
        headers = {'X-CSRF-Token': actor.request.get(base + '/api/v1/auth/csrf').json()['csrfToken']}
        code = "require 'apps/php/bootstrap.php'; $pdf=new Dompdf\\Dompdf(); $pdf->loadHtml('<h1>PHP MySQL developer</h1>'); $pdf->render(); echo base64_encode($pdf->output());"
        pdf = base64.b64decode(subprocess.check_output([php, '-r', code], cwd=root))
        response = actor.request.post(base + '/api/v1/users/me/cv', headers=headers, multipart={'file': {'name': 'workflow.pdf', 'mimeType': 'application/pdf', 'buffer': pdf}})
        assert response.ok, response.text()
        cv_id = response.json()['id']
        job = actor.request.get(base + '/api/v1/jobs/search').json()['items'][0]
        response = actor.request.post(base + '/api/v1/applications', headers=headers, data={'jobId': job['id'], 'cvFileId': cv_id})
        assert response.ok, response.text()
        application_id = response.json()['id']
        page = actor.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('dialog', lambda dialog: dialog.accept())
        page.goto(base + '/applications')
        page.evaluate("window.__applicationMarker='active'")
        card = page.locator('[data-application-card="' + application_id + '"]')
        card.locator('[data-method=DELETE]').click()
        expect(card).to_have_attribute('data-status', 'WITHDRAWN')
        card.locator('[data-action$="/reapply"]').click()
        expect(card).to_have_attribute('data-status', 'APPLIED')
        page.route('**/api/v1/applications/' + application_id, lambda route: route.fulfill(status=500, content_type='application/json', body='{"message":"Workflow failure"}'))
        card.locator('[data-method=DELETE]').click()
        expect(page.locator('#feedback')).to_contain_text('Workflow failure')
        expect(card).to_have_attribute('data-status', 'APPLIED')
        assert page.evaluate('window.__applicationMarker') == 'active'
        assert not errors, errors
        print('UI PASS: withdraw/reapply in place, confirmed withdrawal, failed action retains application', flush=True)
    finally:
        actor.close()
        if user_id:
            cleanup = """
require 'apps/php/bootstrap.php';
putenv('DB_DSN='.getenv('TEST_DB_DSN'));$db=new Platform\\Database();$id=json_decode(stream_get_contents(STDIN),true)['id'];
$user=$db->record('users',['id'=>$id]);if(!$user||strpos($user['username'],'ui_parity_')!==0)throw new RuntimeException('Unexpected fixture owner');
$files=$db->all('SELECT storage_key FROM stored_files WHERE owner_id=?',[$id]);
$db->run("DELETE FROM task_queue WHERE kind='SCREEN' AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.applicationId')) IN (SELECT id FROM applications WHERE candidate_id=?)",[$id]);
$db->run('DELETE FROM application_status_history WHERE changed_by=?',[$id]);$db->delete('users',['id'=>$id]);
$root=realpath(Platform\\Services\Storage::root());foreach($files as $file){$path=realpath($root.'/'.$file['storage_key']);if($path&&strpos($path,$root.DIRECTORY_SEPARATOR)===0&&is_file($path))unlink($path);$db->run('DELETE FROM stored_files WHERE storage_key=?',[$file['storage_key']]);}
"""
            env = dict(os.environ, DB_USER=os.getenv('TEST_DB_USER', 'root'), DB_PASSWORD=os.getenv('TEST_DB_PASSWORD', ''))
            subprocess.run([php, '-r', cleanup], input=json.dumps({'id': user_id}).encode(), cwd=root, env=env, check=True)
