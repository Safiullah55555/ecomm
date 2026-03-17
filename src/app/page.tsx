import Banner from "@/components/Banner";
import Products from "@/components/Products";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { auth,signOut} from "@/auth";


export default async function Home() {
  const session = await auth();
  return (
  <div>
      {/* Auth Status Bar */}
      <div className="bg-gray-100 border-b px-4 py-2 flex justify-between items-center">
        <div>
          {session?.user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user.name || session.user.email}
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Signed In
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-600">Not signed in</span>
          )}
        </div>

        {session?.user && (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Sign Out
            </Button>
          </form>
        )}
      </div>

      <Banner/>
      <Products/>
    </div>
  );
}
