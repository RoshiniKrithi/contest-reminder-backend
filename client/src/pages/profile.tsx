import PlatformProfiles from "@/components/profile/platform-profiles";
import ParticlesBackground from "@/components/layout/particles-background";
import PageTransition from "@/components/layout/page-transition";

export default function Profile() {
  return (
    <PageTransition>
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Particle Background */}
        <ParticlesBackground />
        <PlatformProfiles />
      </div>
    </PageTransition>
  );
}