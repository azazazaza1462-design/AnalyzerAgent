import { createBrowserRouter, Outlet } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import LoginPage from "@/features/auth/LoginPage";
import DashboardPage from "@/features/workspace/DashboardPage";
import ReportsPage from "@/features/workspace/ReportsPage";
import FilesPage from "@/features/workspace/FilesPage";
import QueuePage from "@/features/eligibility/QueuePage";
import AssessmentDetailPage from "@/features/eligibility/AssessmentDetailPage";
import ProvenancePage from "@/features/eligibility/ProvenancePage";
import DivergencePage from "@/features/eligibility/DivergencePage";
import ModelGovernancePage from "@/features/eligibility/ModelGovernancePage";

function RootLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-2 py-12">
      <h1 className="text-[22px] font-medium tracking-tight">Not found</h1>
      <p className="text-[14px] text-muted-foreground">The page you requested doesn't exist.</p>
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
          { index: true, element: <DashboardPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "files", element: <FilesPage /> },
          {
            path: "underwriting",
            children: [
              { path: "queue", element: <QueuePage /> },
              { path: "app/:id/eligibility", element: <AssessmentDetailPage /> },
              {
                path: "app/:id/finding/:fid/provenance",
                element: <ProvenancePage />,
              },
              { path: "app/:id/divergence/:dim", element: <DivergencePage /> },
              { path: "model/eligibility", element: <ModelGovernancePage /> },
            ],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
