import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { useAuth } from "./store/auth";
import { useProfile } from "./store/profile";
import { CandidateRegister } from "./pages/CandidateRegister";
import { CandidateOtp } from "./pages/CandidateOtp";
import { CandidateDashboard } from "./pages/CandidateDashboard";
import { CandidateLogin } from "./pages/CandidateLogin";
import { CandidateProfileForm } from "./pages/CandidateProfileForm";
import { CandidateProfilePreview } from "./pages/CandidateProfilePreview";
import { JobBrowse } from "./pages/JobBrowse";
import { JobDetail } from "./pages/JobDetail";
import { SubscriptionPlans } from "./pages/SubscriptionPlans";
import { PaymentScreen } from "./pages/PaymentScreen";
import { MyApplications } from "./pages/MyApplications";
import { SavedJobs } from "./pages/SavedJobs";
import { EmployerRegister } from "./pages/EmployerRegister";
import { EmployerOtp } from "./pages/EmployerOtp";
import { EmployerLogin } from "./pages/EmployerLogin";
import { EmployerDashboard } from "./pages/EmployerDashboard";
import { EmployerCandidates } from "./pages/EmployerCandidates";
import { EmployerCandidateDetail } from "./pages/EmployerCandidateDetail";
import { EmployerSubscribe } from "./pages/EmployerSubscribe";
import { EmployerPayment } from "./pages/EmployerPayment";
import { EmployerPostJob } from "./pages/EmployerPostJob";
import { EmployerMyJobs } from "./pages/EmployerMyJobs";
import { EmployerJobApplicants } from "./pages/EmployerJobApplicants";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminCandidates } from "./pages/AdminCandidates";
import { AdminEmployers } from "./pages/AdminEmployers";
import { AdminSubscriptions } from "./pages/AdminSubscriptions";
import { AdminCandidateView } from "./pages/AdminCandidateView";
import { SuperAdminDashboard } from "./pages/SuperAdminDashboard";
import { RequireAuth, RedirectIfAuthed } from "./components/RequireAuth";

export default function App() {
  // Restore the session on first paint when VITE_API_URL is set — pings
  // /auth/me, swaps any stale localStorage user for the canonical record.
  const init = useAuth((s) => s.init);
  const currentUser = useAuth((s) => s.currentUser);
  const fetchMyProfile = useProfile((s) => s.fetchMine);
  useEffect(() => {
    void init();
  }, [init]);

  // Once we know who's logged in (after init resolves), pull the candidate's
  // canonical profile from the API. No-op for employer/admin roles or when
  // the API isn't configured.
  useEffect(() => {
    if (currentUser?.role === "candidate") {
      void fetchMyProfile();
    }
  }, [currentUser?.id, currentUser?.role, fetchMyProfile]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/candidate" element={<Navigate to="/candidate/register" replace />} />
        <Route
          path="/candidate/register"
          element={
            <RedirectIfAuthed to="/candidate/dashboard">
              <CandidateRegister />
            </RedirectIfAuthed>
          }
        />
        <Route path="/candidate/verify" element={<CandidateOtp />} />
        <Route
          path="/candidate/dashboard"
          element={
            <RequireAuth role="candidate">
              <CandidateDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/candidate/profile/build"
          element={
            <RequireAuth role="candidate">
              <CandidateProfileForm />
            </RequireAuth>
          }
        />
        <Route
          path="/candidate/profile/preview"
          element={
            <RequireAuth role="candidate">
              <CandidateProfilePreview />
            </RequireAuth>
          }
        />
        <Route
          path="/candidate/jobs"
          element={
            <RequireAuth role="candidate">
              <JobBrowse />
            </RequireAuth>
          }
        />
        <Route
          path="/candidate/jobs/:id"
          element={
            <RequireAuth role="candidate">
              <JobDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/candidate/subscribe"
          element={
            <RequireAuth role="candidate">
              <SubscriptionPlans />
            </RequireAuth>
          }
        />
        <Route
          path="/candidate/payment"
          element={
            <RequireAuth role="candidate">
              <PaymentScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/candidate/applications"
          element={
            <RequireAuth role="candidate">
              <MyApplications />
            </RequireAuth>
          }
        />
        <Route
          path="/candidate/saved"
          element={
            <RequireAuth role="candidate">
              <SavedJobs />
            </RequireAuth>
          }
        />
        <Route
          path="/candidate/login"
          element={
            <RedirectIfAuthed to="/candidate/dashboard">
              <CandidateLogin />
            </RedirectIfAuthed>
          }
        />

        <Route path="/employer" element={<Navigate to="/employer/register" replace />} />
        <Route
          path="/employer/register"
          element={
            <RedirectIfAuthed to="/employer/dashboard" forRole="employer">
              <EmployerRegister />
            </RedirectIfAuthed>
          }
        />
        <Route path="/employer/verify" element={<EmployerOtp />} />
        <Route
          path="/employer/login"
          element={
            <RedirectIfAuthed to="/employer/dashboard" forRole="employer">
              <EmployerLogin />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/employer/dashboard"
          element={
            <RequireAuth role="employer">
              <EmployerDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/candidates"
          element={
            <RequireAuth role="employer">
              <EmployerCandidates />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/candidates/:id"
          element={
            <RequireAuth role="employer">
              <EmployerCandidateDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/subscribe"
          element={
            <RequireAuth role="employer">
              <EmployerSubscribe />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/payment"
          element={
            <RequireAuth role="employer">
              <EmployerPayment />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/jobs/new"
          element={
            <RequireAuth role="employer">
              <EmployerPostJob />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/my-jobs"
          element={
            <RequireAuth role="employer">
              <EmployerMyJobs />
            </RequireAuth>
          }
        />
        <Route
          path="/employer/jobs/:id/applicants"
          element={
            <RequireAuth role="employer">
              <EmployerJobApplicants />
            </RequireAuth>
          }
        />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/candidates" element={<RequireAuth role="admin"><AdminCandidates /></RequireAuth>} />
        <Route path="/admin/candidates/:id" element={<RequireAuth role="admin"><AdminCandidateView /></RequireAuth>} />
        <Route path="/admin/employers" element={<RequireAuth role="admin"><AdminEmployers /></RequireAuth>} />
        <Route path="/admin/subscriptions" element={<RequireAuth role="admin"><AdminSubscriptions /></RequireAuth>} />
        <Route path="/super-admin" element={<AdminLogin />} />
        <Route path="/super-admin/dashboard" element={<RequireAuth role="super_admin"><SuperAdminDashboard /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}
