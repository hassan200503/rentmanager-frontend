"use client";

import { useRef } from "react";
import { TrendingUp, Shield, DollarSign, Users, Building2, Wallet, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionHeader } from "./SectionHeader";
import { Button } from "@/shared/components/ui/Button";
import { useInView } from "@/features/landing/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/features/landing/hooks/use-prefers-reduced-motion";
import { AnimatedGradient, FloatingCard, MetricCard } from "@/shared/components/premium-3d";

gsap.registerPlugin(ScrollTrigger);

const DASHBOARD_METRICS = [
  {
    icon: Shield,
    label: "Portfolio Health",
    value: "94%",
    trend: { value: 12, label: "this month", direction: "up" as const },
    color: "cyan",
  },
  {
    icon: DollarSign,
    label: "Monthly Revenue",
    value: "KES 1.2M",
    trend: { value: 23, label: "this month", direction: "up" as const },
    color: "brand",
  },
  {
    icon: Users,
    label: "Active Tenants",
    value: "847",
    trend: { value: 8, label: "this month", direction: "up" as const },
    color: "purple",
  },
  {
    icon: Building2,
    label: "Properties",
    value: "124",
    trend: { value: 5, label: "this month", direction: "up" as const },
    color: "gold",
  },
];

const REVENUE_DATA = [40, 60, 35, 80, 55, 70, 90, 65, 75, 85, 95, 70];
const WEEK_LABELS = ["W1", "W2", "", "W4", "", "W6", "", "", "", "W10", "", "W12"];

const RECENT_ACTIVITIES = [
  { type: "payment", text: "M-Pesa receipt issued", detail: "Rent collected · KES 18,500", time: "2m ago" },
  { type: "tenant", text: "New tenant onboarded", detail: "Unit 4B · Westlands Plaza", time: "1h ago" },
  { type: "maintenance", text: "Maintenance completed", detail: "Plumbing issue resolved", time: "3h ago" },
];

export function Premium3DDashboardSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Parallax scroll animation for dashboard container
  useGSAP(
    () => {
      if (!dashboardRef.current || prefersReducedMotion) return;

      gsap.fromTo(
        dashboardRef.current,
        { y: 60, rotateX: 8, scale: 0.95 },
        {
          y: 0,
          rotateX: 0,
          scale: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: dashboardRef.current,
            start: "top 85%",
            end: "center 60%",
            scrub: 1,
          },
        }
      );
    },
    { scope: ref, dependencies: [prefersReducedMotion] }
  );

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-jade-500/[0.04] to-transparent" aria-hidden="true">
        <AnimatedGradient variant="orbs" className="absolute inset-0" />
        <div className="absolute inset-0 bg-grid-white opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <SectionHeader
          eyebrow="Dashboard"
          title="Powerful tools for landlords"
          description="Track revenue, occupancy, and payments in real time. Manage your entire portfolio from one place."
        />

        {/* Dashboard Container */}
        <div
          ref={ref}
          className={`transition-all duration-1000 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <div className="perspective-container">
            <div
              ref={dashboardRef}
              className="relative max-w-6xl mx-auto transform-3d"
            >
              {/* Glow effect behind dashboard */}
              <div
                className="absolute -inset-8 bg-gradient-to-b from-jade-500/20 via-jade-600/10 to-transparent rounded-[3rem] blur-3xl opacity-60"
                aria-hidden="true"
              />

              {/* Main Dashboard Glass Container */}
              <div className="relative glass-premium rounded-3xl overflow-hidden border border-white/10 shadow-3d-hard">
                {/* Window Chrome */}
                <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/70 shadow-inner" aria-hidden="true" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/70 shadow-inner" aria-hidden="true" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/70 shadow-inner" aria-hidden="true" />
                  </div>
                  <span className="ml-4 text-xs text-white/50 font-semibold tracking-wide">
                    RentManager Executive Dashboard
                  </span>
                </div>

                {/* Dashboard Content */}
                <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                  {/* Metric Cards Grid - responsive */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {DASHBOARD_METRICS.map((metric, index) => (
                      <FloatingCard key={metric.label} delay={0.1 + index * 0.1} floatDistance={6} className="min-h-0">
                        <MetricCard
                          icon={metric.icon}
                          label={metric.label}
                          value={metric.value}
                          trend={metric.trend}
                          iconColor={metric.color}
                          delay={0.2 + index * 0.1}
                        />
                      </FloatingCard>
                    ))}
                  </div>

                  {/* Revenue Chart Container */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="chart-container-3d"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                          Revenue
                        </h3>
                        <p className="text-xs text-white/40 mt-1">Last 12 weeks</p>
                      </div>
                      <div className="metric-trend-3d">
                        <TrendingUp className="w-4 h-4" />
                        <span>+23% this month</span>
                      </div>
                    </div>

                    {/* 3D Bar Chart */}
                    <div className="flex items-end gap-2 h-32 px-2" role="img" aria-label="Revenue trending up">
                      {REVENUE_DATA.map((height, i) => (
                        <motion.div
                          key={i}
                          initial={{ scaleY: 0, opacity: 0 }}
                          animate={inView ? { scaleY: 1, opacity: 0.4 + height / 200 } : {}}
                          transition={{
                            delay: 0.8 + i * 0.05,
                            duration: 0.6,
                            type: "spring",
                            stiffness: 100,
                          }}
                          whileHover={{
                            scaleY: 1.1,
                            opacity: 1,
                            transition: { type: "spring", stiffness: 400, damping: 15 },
                          }}
                          className="flex-1 rounded-t-lg origin-bottom cursor-pointer relative group"
                          style={{
                            height: `${height}%`,
                            background: `linear-gradient(to top, #10B981 0%, #059669 50%, #34D399 100%)`,
                            boxShadow: "0 -4px 16px rgba(0, 217, 255, 0.3)",
                          }}
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="glass-premium px-2 py-1 rounded-lg text-[10px] text-white whitespace-nowrap">
                              KES {(height * 10000).toLocaleString()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Week Labels */}
                    <div className="flex justify-between mt-3 px-2">
                      {WEEK_LABELS.map((label, i) => (
                        <span key={i} className="text-[10px] text-white/30 font-medium">
                          {label}
                        </span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Activity Feed (Hidden on mobile) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="hidden lg:block activity-feed-3d"
                  >
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                      Recent Activity
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {RECENT_ACTIVITIES.map((activity, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={inView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 1.4 + i * 0.1 }}
                          className="activity-item-3d"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{activity.text}</p>
                              <p className="text-[10px] text-white/50 mt-0.5">{activity.detail}</p>
                            </div>
                            <span className="text-[10px] text-white/40 ml-3">{activity.time}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Floating Notification Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ delay: 1.6, type: "spring", stiffness: 200, damping: 20 }}
                className="absolute -bottom-6 right-8 hidden md:flex items-center gap-3 glass-premium rounded-2xl px-4 py-3 shadow-3d-medium border border-white/10"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-jade-500/20 to-jade-600/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-jade-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">M-Pesa receipt issued</p>
                  <p className="text-[10px] text-white/50">Rent collected · KES 18,500</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button href="/public/sign-up?intent=landlord" variant="primary" size="lg" className="btn-3d">
              Create a free landlord account
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </Button>
            <p className="text-xs text-white/50 mt-4 font-medium">
              No credit card · Free to list · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
