import { headers, cookies } from 'next/headers'
import Link from 'next/link'

function buildBookmarklet(origin: string, sessionToken: string): string {
  const scriptUrl = `${origin}/api/bookmarklet-script`
  const tok = encodeURIComponent(sessionToken)
  const code = `(function(){var s=document.createElement('script');s.src='${scriptUrl}?t='+Date.now()+'&tok=${tok}';document.head.appendChild(s);})();`
  return `javascript:${encodeURIComponent(code)}`
}

export default async function BookmarkletPage() {
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3001'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const origin = `${proto}://${host}`

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('rc_vv_session')
  const sessionToken = sessionCookie?.value
    ? Buffer.from(sessionCookie.value).toString('base64')
    : ''

  const bookmarklet = buildBookmarklet(origin, sessionToken)

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Link
        href="/library"
        className="text-xs font-mono text-zinc-400 hover:text-zinc-600 mb-8 inline-block"
      >
        ← Library
      </Link>

      <h1 className="text-2xl font-bold font-mono mb-2">Safari Bookmarklet</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Save images from any webpage directly to your library with one click.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
            Step 1 — Add the bookmarklet
          </h2>
          <div className="bg-zinc-50 border border-zinc-200 rounded p-4 space-y-3">
            <p className="text-sm text-zinc-600">
              Drag this button to your Safari bookmarks bar:
            </p>
            <a
              href={bookmarklet}
              className="inline-block px-4 py-2 bg-zinc-800 text-white text-sm font-mono rounded cursor-move select-none"
            >
              Save to Library
            </a>
            <p className="text-xs text-zinc-400">
              (If drag-and-drop doesn&apos;t work: bookmark any page, then edit the bookmark&apos;s URL and paste the code below.)
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
            Step 2 — Use it
          </h2>
          <ol className="text-sm text-zinc-600 space-y-2 list-decimal list-inside">
            <li>Navigate to any page with images.</li>
            <li>Click <span className="font-semibold">Save to Library</span> in your bookmarks bar.</li>
            <li>A panel opens showing all images on the page — click one to select it.</li>
            <li>Optionally add a title, then click <span className="font-semibold">Save Image</span>.</li>
            <li>The image is saved to your library. Open it to add metadata and ratings.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
            Bookmarklet code
          </h2>
          <p className="text-xs text-zinc-400 mb-2">Copy this and paste it as a bookmark URL:</p>
          <textarea
            readOnly
            className="w-full h-28 px-3 py-2 border border-zinc-200 rounded text-xs font-mono bg-zinc-50 text-zinc-600 resize-none focus:outline-none"
            defaultValue={bookmarklet}
          />
        </section>
      </div>
    </div>
  )
}
