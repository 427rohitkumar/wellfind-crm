import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { fetchUnreadCounts, markStudentEnquiryAsRead } from '@/services/studentEnquiryService';
import { getAuthUser } from '@/services/apiClient';
import { markTeacherEnquiryAsRead } from '@/services/teacherEnquiryService';

const EnquiryCountContext = createContext(null);

export function EnquiryCountProvider({ children }) {
  // null indicates initial loading state before server confirmation
  const [studentUnreadCount, setStudentUnreadCount] = useState(null);
  const [teacherUnreadCount, setTeacherUnreadCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readIds, setReadIds] = useState(() => new Set());

  // Combined unread total for the main sidebar badge
  const combinedUnreadTotal =
    studentUnreadCount === null && teacherUnreadCount === null
      ? null
      : Math.max(0, (studentUnreadCount ?? 0) + (teacherUnreadCount ?? 0));

  // Fetch unread counts from the persistent backend API
  const refreshCounts = useCallback(async () => {
    // Unread enquiry counts are admin-only; teachers have no access to them.
    if (getAuthUser()?.role !== 'super_admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchUnreadCounts();
      if (res && typeof res.studentUnread === 'number' && typeof res.teacherUnread === 'number') {
        setStudentUnreadCount(res.studentUnread);
        setTeacherUnreadCount(res.teacherUnread);
        setError(null);
      } else {
        throw new Error('Invalid unread counts response from server.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load unread enquiry counts.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark an enquiry as read persistently, updating unread state only on confirmation
  const markAsRead = useCallback(async (type, id) => {
    if (!id) return null;
    try {
      const res =
        type === 'student'
          ? await markStudentEnquiryAsRead(id)
          : await markTeacherEnquiryAsRead(id);

      // Track read ID immediately to synchronise UI indicators
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(`${type}-${id}`);
        return next;
      });

      // Only decrement count if it was not already marked as read
      if (res && res.wasAlreadyRead === false) {
        if (type === 'student') {
          setStudentUnreadCount((prev) => (prev !== null ? Math.max(0, prev - 1) : 0));
        } else if (type === 'teacher') {
          setTeacherUnreadCount((prev) => (prev !== null ? Math.max(0, prev - 1) : 0));
        }
      }
      return res;
    } catch (err) {
      console.error(`Failed to mark ${type} enquiry #${id} as read:`, err);
      throw err;
    }
  }, []);

  // Helper to determine unread status using persistent data and session confirmations
  const isEnquiryUnread = useCallback((type, enquiry) => {
    if (!enquiry || !enquiry.id) return false;
    if (readIds.has(`${type}-${enquiry.id}`)) return false;
    return enquiry.markAsRead === false;
  }, [readIds]);

  // Optimistic decrement for deletion
  const decrementCount = useCallback((type) => {
    if (type === 'student') {
      setStudentUnreadCount((prev) => (prev !== null ? Math.max(0, prev - 1) : 0));
    } else if (type === 'teacher') {
      setTeacherUnreadCount((prev) => (prev !== null ? Math.max(0, prev - 1) : 0));
    }
  }, []);

  // Optimistic increment when new enquiries arrive
  const incrementCount = useCallback((type) => {
    if (type === 'student') {
      setStudentUnreadCount((prev) => (prev !== null ? prev + 1 : 1));
    } else if (type === 'teacher') {
      setTeacherUnreadCount((prev) => (prev !== null ? prev + 1 : 1));
    }
  }, []);

  // Load persistent unread counts once when the application shell mounts
  useEffect(() => {
    let ignore = false;
    const init = async () => {
      await refreshCounts();
    };
    if (!ignore) {
      void init();
    }
    return () => {
      ignore = true;
    };
  }, [refreshCounts]);

  const value = {
    studentUnreadCount,
    teacherUnreadCount,
    combinedUnreadTotal,
    // Alias combinedTotal for components using that identifier
    combinedTotal: combinedUnreadTotal,
    studentCount: studentUnreadCount,
    teacherCount: teacherUnreadCount,
    loading,
    error,
    refreshCounts,
    markAsRead,
    isEnquiryUnread,
    decrementCount,
    incrementCount,
    setStudentUnreadCount,
    setTeacherUnreadCount,
  };

  return (
    <EnquiryCountContext.Provider value={value}>
      {children}
    </EnquiryCountContext.Provider>
  );
}

const defaultContext = {
  studentUnreadCount: null,
  teacherUnreadCount: null,
  combinedUnreadTotal: null,
  combinedTotal: null,
  studentCount: null,
  teacherCount: null,
  loading: false,
  error: null,
  refreshCounts: async () => {},
  markAsRead: async () => null,
  isEnquiryUnread: () => false,
  decrementCount: () => {},
  incrementCount: () => {},
};

// eslint-disable-next-line react-refresh/only-export-components
export function useEnquiryCounts() {
  const context = useContext(EnquiryCountContext);
  return context || defaultContext;
}
