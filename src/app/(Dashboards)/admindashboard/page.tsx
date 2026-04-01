import { auth } from "@/auth"

export default async function AdminDashboardPage() {
  const session = await auth()
  
  if (!session || session.user.role !== 'ADMIN') {
    return <div>Access denied. Admins only.</div>
  }

  return (
    <div>
      <h1>Admin Dashboard - Welcome {session.user.name || session.user.email}</h1>
      <p>Role: ADMIN</p>
      <div>admin dashboard content here</div>
    </div>
  )
}
