# Notifications setup checklist (P2-C7)

The code for real push delivery is complete, but push cannot reach a device
until the owner completes the provider setup below. **No keys, secrets, or
values belong in this file, in chat, or in the repository — only environment
variables on the server and the provider consoles.**

Until this checklist is done, the in-app inbox still works fully (mobile
SSE + fetch, web fetch + polling) and push registration fails safely
without crashing the app. Push attempts before setup report
`NOT_CONFIGURED` in the delivery report instead of fake success.

## 1. Web push (browser notifications while the web app is closed)

1. Generate a VAPID key pair with the `web-push` command-line tool
   (or any VAPID generator you trust). Keep the private key private.
2. On the server, set these environment variables (never commit them):
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (a contact URL or mailto address for your project)
3. In the web app build, set `VITE_VAPID_PUBLIC_KEY` to the same public key.
4. Deploy, open the client app, and tap "تفعيل إشعارات المتصفح".
   A success message means the browser subscription registered.
5. Send a test note from the review dashboard and confirm the browser
   notification appears while the web app tab is closed.

## 2. Mobile push (Android + iOS, Firebase Cloud Messaging)

1. Create a Firebase project and register the Android and iOS apps
   (matching the app package/bundle identifiers).
2. Download the Android config file and place it in the Android app
   directory; download the iOS config file and place it in the iOS
   Runner directory. (These files are app configuration, not server
   secrets, but do not paste their contents into chat.)
3. For iOS: upload an APNs key to Firebase Cloud Messaging (Apple
   developer account required) so Apple devices can receive pushes.
4. Run `flutter pub get` (picks up `firebase_core` and
   `firebase_messaging` declared in `pubspec.yaml`), then build and
   install the app on a real device.
5. Open the app and sign in as a client. The app registers its FCM token
   on launch (guarded: nothing breaks if setup is incomplete).
6. Send a test note from the review dashboard and confirm the push
   arrives on the real device while the app is closed.

## 3. Verify end-to-end (after 1 and 2)

- Coach sends a note from the review dashboard: the delivery report must
  show `push attempted`, `push delivered`, and `push failed` counts —
  never a blanket success.
- A client who is offline (app closed) receives the push; opening the
  app shows the same notification in the inbox, marked unread until tapped.
- A device token that the provider reports as expired is pruned
  automatically on the next send (the app re-registers on next launch).

## What deliberately does NOT exist

- No automatic scheduled sender: there is no scheduler in this codebase,
  so reminders are coach-triggered (overdue card button, review
  dashboard). Do not invent a cron/scheduler here without a separate
  package that owns it.
- No push credentials in code, docs, or chat — environment only.
