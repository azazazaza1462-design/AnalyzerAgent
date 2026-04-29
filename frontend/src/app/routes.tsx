import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import LoginPage from "@/features/auth/LoginPage";
import JobsPage from "@/features/jobs/JobsPage";
import JobDetailPage from "@/features/jobs/JobDetailPage";

function RootLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function NotFoundPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Not Found</h1>
      <p className="text-sm text-muted-foreground">The page you requested doesn't exist.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <Navigate to="/jobs" replace /> },
          { path: "jobs", element: <JobsPage /> },
          { path: "jobs/:id", element: <JobDetailPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
