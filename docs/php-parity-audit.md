# PHP parity refactor — 9 October 2026

The preserved Next.js pages/components and NestJS services in this checkout are the reference. The runtime remains PHP 7.4, HTML/CSS/plain JavaScript, PDO/MySQL, and the existing Python AI service. Legacy source, identifiers, browser preference keys, and existing database records are retained. No schema migration is required by this refactor.

## Changes checked against the reference

| Area | Restored behavior |
| --- | --- |
| Feed and comments | Nested replies through depth 10, two initial root comments with expand/collapse, author links and timestamps, reply selection/cancellation, nine reaction types with switching/removal. Posting, commenting, deleting, and loading another page preserve the page and unrelated drafts. Pagination deduplicates IDs and keeps its cursor independent of display sorting. |
| Public profiles | Both slug and UUID links resolve. Public views exclude owner email/CV metadata and editing controls. Posts, replies, reactions, follow controls, and follower counts use the same shared components as the feed. Private and blocked profiles stay protected. |
| Network and notifications | Invitations, acceptance, withdrawal, and removal update the network panel in place. Read actions update notification styling and counts in place. Connection and screening notification types and navigation payloads match the preserved source. |
| Applications | Shared status labels distinguish an unscored application from a scored APPLIED application, including a valid zero score. Summary counts, pipeline stages, withdrawal confirmation, reapplication, and pending-score polling follow the reference. List actions retain the page after success or failure. |
| AI report | Weighted criteria and benchmarks, actual CV skill matching, extracted contact/sections, expandable raw text, declared skill levels, experience, education, and detailed evaluation are displayed. HR suggestions use the reference thresholds and require an explicit status submission. Candidate data remains behind application access checks. |
| Search | Empty queries return empty groups. People match name/email/headline, jobs match title/description/location, and companies match name/industry/description. Results include the relations/counts used by the old UI. Private, blocked, deleted, and inaccessible records remain protected. |
| Routes | /ai-score-detail redirects to /applications. Recruiters/admins visiting /jobs, /external-jobs, or /search redirect to their dashboard. The application list remains candidate-only. |
| Shared implementation | Separate feed/social/application interaction modules share the request and HTML-fragment helpers. Post/comment markup and application presentation rules are reused. Comment styles are scoped to the shared thread instead of the old flat-comment rule. |

Post composition retains the reference's 1,000-character and four-attachment UI limits; the post API accepts up to 5,000 characters, matching its DTO. Comments accept up to 1,200 Unicode characters, validate their parent, and return author/profile data for immediate rendering. Existing stronger duplicate-application, CSRF, ownership, role, and file-access protections remain in force.

## Verification

- PHP 7.4.33 syntax checks and 25 unit/MySQL integration checks passed. The route inventory still covers all 125 preserved API paths; route presence alone is not a response-contract proof.
- 147 HTTP checks passed against a dedicated MySQL 8.4.11 test database, covering candidate/recruiter workflows, PDF generation, visibility, storage, search, reactions, replies, follows, and redirects.
- Eight Python AI tests passed. Existing dependency deprecation warnings do not affect these results.
- Chrome passed 161 desktop/mobile/theme screen checks across all 35 preserved page routes and three roles. The audit checks overflow, broken images, PHP errors, and JavaScript exceptions.
- Interaction checks passed for nested replies, every reaction, failed comment draft recovery, escaped text, feed pagination without duplicates, preserved filters/drafts, network actions, following, and notification reads without page reloads.
- A disposable candidate account verified withdrawal, reapplication, confirmation, and failed-action recovery without reloading the application list. The account, queue tasks, CV metadata, and uploaded file are cleaned up afterward.

Screenshots and the machine-readable coverage report are written to apps/php/storage/reports. The checked route inventories are database/legacy-pages.json and database/legacy-routes.json under apps/php.

Run the existing test server and PHP suite as documented in apps/php/README.md. For the full browser audit, set BROWSER_APP_URL to the test server and TEST_DB_DSN to the same dedicated test database, then run:

~~~powershell
$env:BROWSER_APP_URL = 'http://127.0.0.1:8081'
$env:TEST_DB_DSN = 'mysql:host=127.0.0.1;port=33306;dbname=cvscreening_test;charset=utf8mb4'
python apps/php/tests/browser.py --audit-only
~~~

Set PHP_BINARY, TEST_DB_USER, and TEST_DB_PASSWORD when the test toolchain or database credentials differ. The disposable application mutation check is skipped unless TEST_DB_DSN names a test database. Browser demo credentials remain those documented in the PHP README.

## Verification limits

Layouts and interactions were compared against the preserved source, with PHP screenshots inspected. A live React/PHP pixel comparison has not been performed, and these checks do not establish equivalence for every API branch. Real OAuth credentials, SMTP delivery, live third-party crawlers, advanced NLP credentials/dependencies, PostgreSQL import data, and Docker deployment still require their corresponding external environment. The existing migration document describes those checks and rollback handling.
