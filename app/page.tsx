import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Steps from "@/components/landing/Steps";
import Tools from "@/components/landing/Tools";
import Connect from "@/components/landing/Connect";
import CallToAction from "@/components/landing/CallToAction";
import SiteFooter from "@/components/landing/SiteFooter";

export default function Page() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Problem />
        <Steps />
        <Tools />
        <Connect />
        <CallToAction />
      </main>
      <SiteFooter />
    </>
  );
}