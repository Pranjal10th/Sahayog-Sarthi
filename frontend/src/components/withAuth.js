import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function withAuth(Component, allowedRoles = []) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const [verified, setVerified] = useState(false);

    useEffect(() => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const user = localStorage.getItem('user');

      if (!token) {
        router.replace('/auth/login');
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // Mismatch role redirection logic
        if (role === 'worker') {
          try {
            router.replace('/workers/dashboard');
          } catch (e) {
            router.replace('/');
          }
        } else if (role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/');
        }
      } else {
        setVerified(true);
      }
    }, [router]);

    if (!verified) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider animate-pulse">Verifying Access...</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
