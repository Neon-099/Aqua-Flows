import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  CalendarClock,
  Droplet,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react';
import Header from '../../components/Header';
import EditProfile from '../../components/customer/EditProfile';
import { Skeleton, SkeletonGroup } from '../../components/WireframeSkeleton';
import useProfile from '../../hooks/customer/useProfile';


const Profile = () => {
  
  const {
    user,
    loading,
    profileName,
    profileEmail,
    profilePhone,
    profileAddress,
    memberSince,
    initials,
    handleLogout,
    isEditOpen,
    setIsEditOpen,
  } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
        <Header name="Customer" />
        <main className="flex-1 w-full relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100" />
          <div className="relative z-10 max-w-6xl mx-auto px-12 py-8 grid gap-8 lg:grid-cols-[1.2fr,1fr]">
            <section className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <SkeletonGroup className="space-y-6">
                  <Skeleton className="h-6 w-40 rounded-full" />
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <Skeleton className="h-20 w-20 rounded-[1.6rem]" />
                      <SkeletonGroup>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-40" />
                        <div className="flex gap-2 mt-4">
                          <Skeleton className="h-6 w-32 rounded-full" />
                          <Skeleton className="h-6 w-28 rounded-full" />
                        </div>
                      </SkeletonGroup>
                    </div>
                    <Skeleton className="h-12 w-40 rounded-xl" />
                  </div>
                </SkeletonGroup>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <SkeletonGroup className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <SkeletonGroup>
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-6 w-48" />
                      </SkeletonGroup>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center gap-3 mt-6">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </SkeletonGroup>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                  <SkeletonGroup className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <SkeletonGroup>
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-6 w-44" />
                      </SkeletonGroup>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-6 w-32 rounded-full" />
                  </SkeletonGroup>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="bg-blue-600 text-blue-50 rounded-[2.5rem] p-10 shadow-md shadow-blue-200">
                <SkeletonGroup className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-4 w-48" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </SkeletonGroup>
              </div>
            </aside>

            <div>
              <Skeleton className="h-12 w-40 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-800 flex flex-col overflow-x-hidden">
      <Header 
        name={profileName} 
        />

      <main className="flex-1 w-full relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100" />
        <div className="relative z-10 max-w-6xl mx-auto px-12 py-8 grid gap-8 lg:grid-cols-[1.2fr,1fr]">
          <section className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4">
                <BadgeCheck size={14} />
                Verified household
              </p>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-[1.6rem] bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-200">
                    {initials}
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                      {profileName}
                    </h1>
                    <p className="text-slate-500 text-sm font-semibold mt-2">
                      Household Account · Active customer
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 text-slate-600 px-3 py-1 text-xs font-semibold border border-slate-100">
                        <Star size={14} className="text-amber-500" />
                        Preferred schedule
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 text-slate-600 px-3 py-1 text-xs font-semibold border border-slate-100">
                        <Truck size={14} className="text-blue-600" />
                        Same-day eligible
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-md"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-600/90 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.18em]">
                      Email address
                    </p>
                    <p className="font-black text-lg text-slate-900">{profileEmail}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Delivery updates and receipts are sent to this email.
                </p>
                <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
                  <Phone size={16} className="text-blue-600" />
                  <span className="font-semibold text-slate-700">{profilePhone}</span>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-600/90 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.18em]">
                      Default delivery address
                    </p>
                    <p className="font-black text-lg text-slate-900">Primary location</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {profileAddress}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  <Droplet size={14} />
                  Active delivery zone
                </div>
              </div>
            </div>
         
          </section>

          <aside className="space-y-6">
            <div className="bg-blue-600 text-blue-50 rounded-[2.5rem] p-10 shadow-md shadow-blue-200">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100 mb-2">
                Account status
              </p>
              <p className="text-2xl font-black">Good standing</p>
              <p className="text-sm text-blue-100 mt-2">
                Membership since <span className="font-semibold">{memberSince}</span>
              </p>
              <div className="mt-6 flex items-center justify-between text-xs text-blue-100">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={14} /> Verified contact details
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarClock size={14} /> Auto-renew
                </span>
              </div>
            </div>
          </aside>

          <div>
            <button className='px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-slate-800' 
              type='button'
              onClick={handleLogout}>
              Logout
            </button>
          </div>

        </div>
      </main>
      <EditProfile isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </div>
  );
};

export default Profile;
