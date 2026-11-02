'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HeartPulse,
  ShoppingCart,
  Bell,
  User as UserIcon,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Calendar,
  Package,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth.context';
import { useCart } from '@/features/cart/cart.context';
import { NotificationService } from '@/features/notifications/notification.service';
import { Notification } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (currentUser) {
      setNotifications(NotificationService.getNotificationsByUser(currentUser.id));
    } else {
      setNotifications([]);
    }
  }, [currentUser, pathname]);

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notif: Notification) => {
    NotificationService.markAsRead(notif.id);
    if (currentUser) {
      setNotifications(NotificationService.getNotificationsByUser(currentUser.id));
    }
    setNotificationsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getDashboardLink = () => {
    if (!currentUser) return '/login';
    switch (currentUser.role) {
      case 'DOCTOR':
        return '/dashboard/doctor';
      case 'ADMIN':
        return '/dashboard/admin';
      case 'PATIENT':
      default:
        return '/dashboard/patient';
    }
  };

  const navLinks = [
    { label: 'Find Doctors', href: '/doctors' },
    { label: 'Healthcare Store', href: '/products' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-tealbrand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-brand-700 transition">
                  Medi<span className="text-tealbrand-600">Care</span>
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider -mt-1">
                  Health & Wellness
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-brand-600 hover:bg-slate-100 transition"
              aria-label="View shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-tealbrand-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Notifications (if authenticated) */}
            {isAuthenticated && currentUser && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 rounded-xl text-slate-600 hover:text-brand-600 hover:bg-slate-100 transition"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-800">Notifications</h4>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={() => {
                            NotificationService.markAllAsRead(currentUser.id);
                            setNotifications(NotificationService.getNotificationsByUser(currentUser.id));
                          }}
                          className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">No notifications yet.</div>
                      ) : (
                        notifications.slice(0, 6).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition text-left ${
                              !notif.isRead ? 'bg-brand-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-900">{notif.title}</span>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons / Profile Menu */}
            {isAuthenticated && currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold text-slate-900 leading-tight">
                      {currentUser.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">{currentUser.role.toLowerCase()}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-semibold text-sm text-slate-900">{currentUser.name}</div>
                      <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                      <div className="mt-1">
                        <Badge
                          variant={
                            currentUser.role === 'ADMIN'
                              ? 'purple'
                              : currentUser.role === 'DOCTOR'
                              ? 'teal'
                              : 'info'
                          }
                          size="sm"
                        >
                          {currentUser.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href={getDashboardLink()}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <LayoutDashboard className="w-4 h-4 text-brand-600" />
                        Dashboard
                      </Link>

                      {currentUser.role === 'PATIENT' && (
                        <>
                          <Link
                            href="/dashboard/patient?tab=appointments"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Calendar className="w-4 h-4 text-slate-400" />
                            My Appointments
                          </Link>
                          <Link
                            href="/dashboard/patient?tab=orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Package className="w-4 h-4 text-slate-400" />
                            My Orders
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          router.push('/');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              href={getDashboardLink()}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-brand-600 bg-brand-50"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
