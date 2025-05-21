'use client';

import React, { useMemo, Suspense, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PersonalInfoForm } from "@/components/profile/personal-info-form";
import { EducationForm } from "@/components/profile/education-form";
import { ExperienceForm } from "@/components/profile/experience-form";
import { LanguageForm } from "@/components/profile/language-form";
import { ProfileNavigation } from "@/components/profile/profile-navigation";
import { SWRProvider } from "@/lib/swr-config";
import { createClient } from "@/lib/supabase/client";
import { useAllProfileData } from "@/hooks/use-profile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRProvider>
      <Suspense fallback={<LoadingState message="Cargando contenido..." />}>
        <InnerLayout>{children}</InnerLayout>
      </Suspense>
    </SWRProvider>
  );
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      // ... tu lógica de carga de usuario (idéntica)
    };
    loadUser();
    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const { data: allProfileData, isLoading: profileDataLoading } = useAllProfileData(user?.id);

  const activeSection = useMemo(() => {
    if (pathname.includes("/dashboard/profile")) return "profile";
    if (pathname.includes("/dashboard/documents")) return "documents";
    if (pathname.includes("/dashboard/cv")) return "cv";
    return "dashboard";
  }, [pathname]);

  const activeTab = useMemo(() => searchParams.get("tab") || "personal", [searchParams]);

  if (loading && !localStorage.getItem("currentUser")) {
    return <LoadingState message="Cargando usuario..." />;
  }

  const profile = allProfileData?.profile || JSON.parse(localStorage.getItem(`profile/${user?.id}`) || "{}");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 md:ml-64 w-full overflow-hidden">
        <Header
          user={{
            name: profile?.full_name || "",
            email: profile?.email || "",
            imageUrl: profile?.avatar_url,
          }}
        />
        <main className="flex-1 p-4 md:p-6 overflow-hidden">
          {user ? (
            <ProfileContent
              userId={user.id}
              allProfileData={allProfileData}
              isLoading={profileDataLoading}
              activeSection={activeSection}
              activeTab={activeTab}
            >
              {children}
            </ProfileContent>
          ) : (
            <LoadingState message="Cargando usuario..." />
          )}
        </main>
      </div>
    </div>
  );
}

function ProfileContent({
  userId,
  allProfileData,
  isLoading,
  activeSection,
  activeTab,
  children,
}: {
  userId: string;
  allProfileData: any;
  isLoading: boolean;
  activeSection: string;
  activeTab: string;
  children: React.ReactNode;
}) {
  const getData = (key: string) => {
    if (allProfileData && allProfileData[key]) return allProfileData[key];
    try {
      const stored = localStorage.getItem(`${key}/${userId}`);
      return stored ? JSON.parse(stored) : key === "profile" ? {} : [];
    } catch {
      return key === "profile" ? {} : [];
    }
  };
  const personalInfo = getData("personalInfo");
  const education = getData("education");
  const experience = getData("experience");
  const languages = getData("languages");

  const showLoading =
    isLoading &&
    !localStorage.getItem(`profile/${userId}`) &&
    !localStorage.getItem(`personal_info/${userId}`) &&
    !localStorage.getItem(`education/${userId}`) &&
    !localStorage.getItem(`experience/${userId}`) &&
    !localStorage.getItem(`languages/${userId}`);

  return (
    <div className="w-full overflow-hidden">
      <ProfileNavigation />

      {activeSection === "dashboard" && <>{children}</>}

      {activeSection === "profile" && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Perfil</h1>
          <Tabs value={activeTab} className="space-y-4">
            <TabsContent value="personal">
              {showLoading ? <LoadingState message="Cargando información personal..." /> : <PersonalInfoForm userId={userId} initialData={personalInfo} />}
            </TabsContent>
            <TabsContent value="education">
              {showLoading ? <LoadingState message="Cargando información educativa..." /> : <EducationForm userId={userId} educations={education} />}
            </TabsContent>
            <TabsContent value="experience">
              {showLoading ? <LoadingState message="Cargando experiencia laboral..." /> : <ExperienceForm userId={userId} experiences={experience} />}
            </TabsContent>
            <TabsContent value="languages">
              {showLoading ? <LoadingState message="Cargando idiomas..." /> : <LanguageForm userId={userId} languages={languages} />}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {(activeSection === "documents" || activeSection === "cv") && <>{children}</>}
    </div>
  );
}

function LoadingState({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';