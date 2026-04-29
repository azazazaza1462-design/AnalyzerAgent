import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";

function RootLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function PlaceholderJobsPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Jobs</h1>
      <p className="text-sm text-muted-foreground">
        The jobs list will live here once Phase 5 is in place.
      </p>
    </div>
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
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/jobs" replace /> },
      { path: "jobs", element: <PlaceholderJobsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
