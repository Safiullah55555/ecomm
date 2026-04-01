import { auth } from "@/auth"

export default async function UserDashboardPage() {
  const session = await auth()
  
  if (!session) {
    return <div>Please log in to access user dashboard.</div>
  }

  return (
    <div>
      <h1>User Dashboard - Welcome {session.user.name || session.user.email}</h1>
      <p>Role: {session.user.role}</p>
      <div>user dashboard content here</div>
    </div>
  )
}
