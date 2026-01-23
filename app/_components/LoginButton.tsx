export default function LoginButton() {
  return (
    <a
      href="/api/auth/login"
      className="rounded-md bg-green-300 py-1.5 px-3 font-medium hover:bg-green-400 transition-colors"
    >
      Login with Recurse Center
    </a>
  )
}
