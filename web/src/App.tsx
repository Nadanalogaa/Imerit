import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { useAuth, HOME_PATH } from "./store/auth";
import { useProfile } from "./store/profile";
import { usePlans } from "./store/subscriptions";
import { useJobs } from "./store/jobs";
import { useApplications } from "./store/applications";
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
import { EmployerJobManage } from "./pages/EmployerJobManage";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminCandidates } from "./pages/AdminCandidates";
import { AdminEmployers } from "./pages/AdminEmployers";
import { AdminSubscriptions } from "./pages/AdminSubscriptions";
import { AdminCandidateView } from "./pages/AdminCandidateView";
import { SuperAdminDashboard } from "./pages/SuperAdminDashboard";
import { SuperAdminAdmins } from "./pages/SuperAdminAdmins";
import { SuperAdminPlans } from "./pages/SuperAdminPlans";
import { SuperAdminStaff } from "./pages/SuperAdminStaff";
import { StaffLogin } from "./pages/StaffLogin";
import { StaffDashboard } from "./pages/StaffDashboard";
import { StaffEmployers } from "./pages/StaffEmployers";
import { StaffEmployerForm } from "./pages/StaffEmployerForm";
import { StaffPostJob } from "./pages/StaffPostJob";
import { StaffJobs } from "./pages/StaffJobs";
import { RequireAuth, RedirectIfAuthed } from "./components/RequireAuth";
import { ToastHost } from "./components/ToastHost";

export default function App() {
  // Restore the session on first paint when VITE_API_URL is set — pings
  // /auth/me, swaps any stale localStorage user for the canonical record.
  const init = useAuth((s) => s.init);
  const currentUser = useAuth((s) => s.currentUser);
  const fetchMyProfile = useProfile((s) => s.fetchMine);
  const fetchPlans = usePlans((s) => s.fetchPlans);
  const fetchJobs = useJobs((s) => s.fetchJobs);
  const fetchMyApplications = useApplications((s) => s.fetchMyApplications);
  const fetchMySavedJobs = useApplications((s) => s.fetchMySavedJobs);

  useEffect(() => {
    void init();
    // Cheap, no auth needed — keeps subscribe pages on the latest pricing.
    void fetchPlans();
    // Prime the local jobs cache so candidates see the live list immediately.
    void fetchJobs();
  }, [init, fetchPlans, fetchJobs]);

  // Once we know who's logged in (after init resolves), pull the candidate's
  // canonical profile + applications + saved jobs from the API. No-op for
  // employer/admin roles or when the API isn't configured.
  useEffect(() => {
    if (currentUser?.role === "candidate") {
      void fetchMyProfile();
      void fetchMyApplications(currentUser.id);
      void fetchMySavedJobs(currentUser.id);
    }
  }, [currentUser?.id, currentUser?.role, fetchMyProfile, fetchMyApplications, fetchMySavedJobs]);

  return (
    <BrowserRouter>
      <ToastHost />
      <Routes>
        <Route path="/" element={<LandingOrDashboard />} />

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
        {/* Owner-facing manage view — full job detail + Edit / Repost /
            Delete / Applicants actions. Same component gates on
            role="employer" for the employer path and role="staff" for
            the staff path; the component itself branches its chrome
            based on the `role` prop. */}
        <Route
          path="/employer/jobs/:id"
          element={
            <RequireAuth role="employer">
              <EmployerJobManage role="employer" />
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
        <Route path="/super-admin/admins" element={<RequireAuth role="super_admin"><SuperAdminAdmins /></RequireAuth>} />
        <Route path="/super-admin/plans" element={<RequireAuth role="super_admin"><SuperAdminPlans /></RequireAuth>} />
        <Route path="/super-admin/staff" element={<RequireAuth role="super_admin"><SuperAdminStaff /></RequireAuth>} />

        {/* --------------------- Staff (internal ops) --------------------- */}
        <Route path="/staff" element={<Navigate to="/staff/login" replace />} />
        <Route
          path="/staff/login"
          element={
            <RedirectIfAuthed to="/staff/dashboard" forRole="staff">
              <StaffLogin />
            </RedirectIfAuthed>
          }
        />
        <Route path="/staff/dashboard" element={<RequireAuth role="staff"><StaffDashboard /></RequireAuth>} />
        <Route path="/staff/employers" element={<RequireAuth role="staff"><StaffEmployers /></RequireAuth>} />
        <Route path="/staff/employers/new" element={<RequireAuth role="staff"><StaffEmployerForm /></RequireAuth>} />
        <Route path="/staff/employers/:id" element={<RequireAuth role="staff"><StaffEmployerForm /></RequireAuth>} />
        <Route path="/staff/jobs/new" element={<RequireAuth role="staff"><StaffPostJob /></RequireAuth>} />
        <Route path="/staff/jobs" element={<RequireAuth role="staff"><StaffJobs /></RequireAuth>} />
        <Route path="/staff/jobs/:id" element={<RequireAuth role="staff"><EmployerJobManage role="staff" /></RequireAuth>} />
        {/* /super-admin/{candidates,employers,subscriptions} are aliases for
            the equivalent /admin/* pages — super-admin shares the admin's
            management UI for these, only the dashboards differ. */}
        <Route path="/super-admin/candidates" element={<Navigate to="/admin/candidates" replace />} />
        <Route path="/super-admin/candidates/:id" element={<NavigateWithParams to="/admin/candidates/:id" />} />
        <Route path="/super-admin/employers" element={<Navigate to="/admin/employers" replace />} />
        <Route path="/super-admin/subscriptions" element={<Navigate to="/admin/subscriptions" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function NavigateWithParams({ to }: { to: string }) {
  const params = useParams();
  const resolved = to.replace(/:([a-zA-Z_]+)/g, (_, key) => params[key] ?? "");
  return <Navigate to={resolved} replace />;
}

/**
 * Root route handler — signed-in users land on their dashboard, visitors see
 * the marketing landing. Prevents the disorienting "I'm signed in but the
 * landing keeps pitching me to register" loop when a logged-in user clicks
 * the logo or accidentally types the site root.
 */
function LandingOrDashboard() {
  const user = useAuth((s) => s.currentUser);
  if (user) return <Navigate to={HOME_PATH[user.role]} replace />;
  return <Landing />;
}
