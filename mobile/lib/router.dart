import 'dart:convert';
import 'package:go_router/go_router.dart';
import 'pages/landing_page.dart';
import 'pages/placeholder_page.dart';
import 'pages/candidate_register_page.dart';
import 'pages/candidate_otp_page.dart';
import 'pages/candidate_dashboard_page.dart';
import 'pages/candidate_login_page.dart';
import 'pages/candidate_profile_form_page.dart';
import 'pages/candidate_profile_preview_page.dart';
import 'pages/job_browse_page.dart';
import 'pages/job_detail_page.dart';
import 'pages/subscription_plans_page.dart';
import 'pages/payment_page.dart';
import 'pages/my_applications_page.dart';
import 'pages/saved_jobs_page.dart';
import 'pages/employer_register_page.dart';
import 'pages/employer_otp_page.dart';
import 'pages/employer_login_page.dart';
import 'pages/employer_dashboard_page.dart';
import 'pages/employer_candidates_page.dart';
import 'pages/employer_candidate_detail_page.dart';
import 'pages/employer_subscribe_page.dart';
import 'pages/employer_post_job_page.dart';
import 'pages/employer_my_jobs_page.dart';
import 'pages/employer_job_applicants_page.dart';
import 'pages/admin_login_page.dart';
import 'pages/admin_dashboard_page.dart';
import 'storage/storage.dart';

bool _isLoggedInAs(String role) {
  final raw = Storage.instance.getString(StorageKeys.currentUser);
  if (raw == null) return false;
  try {
    final m = jsonDecode(raw) as Map<String, dynamic>;
    return m['role'] == role;
  } catch (_) {
    return false;
  }
}

bool _isCandidateLoggedIn() {
  final raw = Storage.instance.getString(StorageKeys.currentUser);
  if (raw == null) return false;
  try {
    final m = jsonDecode(raw) as Map<String, dynamic>;
    return m['role'] == 'candidate';
  } catch (_) {
    return false;
  }
}

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, _) => const LandingPage()),

    GoRoute(
      path: '/candidate',
      redirect: (_, _) => '/candidate/register',
    ),
    GoRoute(
      path: '/candidate/register',
      redirect: (_, _) =>
          _isCandidateLoggedIn() ? '/candidate/dashboard' : null,
      builder: (_, _) => const CandidateRegisterPage(),
    ),
    GoRoute(
      path: '/candidate/verify',
      builder: (_, state) {
        final email = state.uri.queryParameters['email'] ?? '';
        final mode = state.uri.queryParameters['mode'] ?? 'register';
        return CandidateOtpPage(email: email, mode: mode);
      },
    ),
    GoRoute(
      path: '/candidate/dashboard',
      redirect: (_, _) =>
          _isCandidateLoggedIn() ? null : '/candidate/login',
      builder: (_, _) => const CandidateDashboardPage(),
    ),
    GoRoute(
      path: '/candidate/profile/build',
      redirect: (_, _) =>
          _isCandidateLoggedIn() ? null : '/candidate/login',
      builder: (_, _) => const CandidateProfileFormPage(),
    ),
    GoRoute(
      path: '/candidate/profile/preview',
      redirect: (_, _) =>
          _isCandidateLoggedIn() ? null : '/candidate/login',
      builder: (_, _) => const CandidateProfilePreviewPage(),
    ),
    GoRoute(
      path: '/candidate/jobs',
      redirect: (_, _) =>
          _isCandidateLoggedIn() ? null : '/candidate/login',
      builder: (_, _) => const JobBrowsePage(),
    ),
    GoRoute(
      path: '/candidate/jobs/:id',
      redirect: (_, _) =>
          _isCandidateLoggedIn() ? null : '/candidate/login',
      builder: (_, state) =>
          JobDetailPage(jobId: state.pathParameters['id'] ?? ''),
    ),
    GoRoute(
      path: '/candidate/subscribe',
      redirect: (_, _) =>
          _isCandidateLoggedIn() ? null : '/candidate/login',
      builder: (_, state) {
        final returnTo = state.uri.queryParameters['return'] ?? '/candidate/dashboard';
        final apply = state.uri.queryParameters['apply'];
        return SubscriptionPlansPage(returnTo: returnTo, applyJob: apply);
      },
    ),
    GoRoute(
      path: '/candidate/payment',
      redirect: (_, _) =>
          _isCandidateLoggedIn() ? null : '/candidate/login',
      builder: (_, state) {
        final planId = state.uri.queryParameters['plan'] ?? 'plan_cand_45';
        final returnTo = state.uri.queryParameters['return'] ?? '/candidate/dashboard';
        final apply = state.uri.queryParameters['apply'];
        return PaymentPage(planId: planId, returnTo: returnTo, applyJob: apply);
      },
    ),
    GoRoute(
      path: '/candidate/applications',
      redirect: (_, _) =>
          _isCandidateLoggedIn() ? null : '/candidate/login',
      builder: (_, _) => const MyApplicationsPage(),
    ),
    GoRoute(
      path: '/candidate/saved',
      redirect: (_, _) =>
          _isCandidateLoggedIn() ? null : '/candidate/login',
      builder: (_, _) => const SavedJobsPage(),
    ),
    GoRoute(
      path: '/candidate/login',
      redirect: (_, _) =>
          _isCandidateLoggedIn() ? '/candidate/dashboard' : null,
      builder: (_, _) => const CandidateLoginPage(),
    ),

    GoRoute(
      path: '/employer',
      redirect: (_, _) => '/employer/register',
    ),
    GoRoute(
      path: '/employer/register',
      redirect: (_, _) => _isLoggedInAs('employer') ? '/employer/dashboard' : null,
      builder: (_, _) => const EmployerRegisterPage(),
    ),
    GoRoute(
      path: '/employer/verify',
      builder: (_, state) {
        final email = state.uri.queryParameters['email'] ?? '';
        final mode = state.uri.queryParameters['mode'] ?? 'register';
        return EmployerOtpPage(email: email, mode: mode);
      },
    ),
    GoRoute(
      path: '/employer/login',
      redirect: (_, _) => _isLoggedInAs('employer') ? '/employer/dashboard' : null,
      builder: (_, _) => const EmployerLoginPage(),
    ),
    GoRoute(
      path: '/employer/dashboard',
      redirect: (_, _) => _isLoggedInAs('employer') ? null : '/employer/login',
      builder: (_, _) => const EmployerDashboardPage(),
    ),
    GoRoute(
      path: '/employer/candidates',
      redirect: (_, _) => _isLoggedInAs('employer') ? null : '/employer/login',
      builder: (_, _) => const EmployerCandidatesPage(),
    ),
    GoRoute(
      path: '/employer/candidates/:id',
      redirect: (_, _) => _isLoggedInAs('employer') ? null : '/employer/login',
      builder: (_, state) =>
          EmployerCandidateDetailPage(candidateId: state.pathParameters['id'] ?? ''),
    ),
    GoRoute(
      path: '/employer/subscribe',
      redirect: (_, _) => _isLoggedInAs('employer') ? null : '/employer/login',
      builder: (_, state) {
        final returnTo = state.uri.queryParameters['return'] ?? '/employer/dashboard';
        return EmployerSubscribePage(returnTo: returnTo);
      },
    ),
    GoRoute(
      path: '/employer/payment',
      redirect: (_, _) => _isLoggedInAs('employer') ? null : '/employer/login',
      builder: (_, state) {
        final planId = state.uri.queryParameters['plan'] ?? 'plan_sme_9';
        final returnTo = state.uri.queryParameters['return'] ?? '/employer/dashboard';
        return PaymentPage(planId: planId, returnTo: returnTo);
      },
    ),
    GoRoute(
      path: '/employer/jobs/new',
      redirect: (_, _) => _isLoggedInAs('employer') ? null : '/employer/login',
      builder: (_, _) => const EmployerPostJobPage(),
    ),
    GoRoute(
      path: '/employer/my-jobs',
      redirect: (_, _) => _isLoggedInAs('employer') ? null : '/employer/login',
      builder: (_, _) => const EmployerMyJobsPage(),
    ),
    GoRoute(
      path: '/employer/jobs/:id/applicants',
      redirect: (_, _) => _isLoggedInAs('employer') ? null : '/employer/login',
      builder: (_, state) => EmployerJobApplicantsPage(jobId: state.pathParameters['id'] ?? ''),
    ),
    GoRoute(path: '/admin', builder: (_, _) => const AdminLoginPage()),
    GoRoute(
      path: '/admin/dashboard',
      redirect: (_, _) => _isLoggedInAs('admin') ? null : '/admin',
      builder: (_, _) => const AdminDashboardPage(isSuperAdmin: false),
    ),
    GoRoute(path: '/super-admin', builder: (_, _) => const AdminLoginPage()),
    GoRoute(
      path: '/super-admin/dashboard',
      redirect: (_, _) => _isLoggedInAs('super_admin') ? null : '/super-admin',
      builder: (_, _) => const AdminDashboardPage(isSuperAdmin: true),
    ),
  ],
);
