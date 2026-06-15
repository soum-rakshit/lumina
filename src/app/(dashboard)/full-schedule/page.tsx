"use client";

import React from "react";
import TimelineClient from "./TimelineClient";
import { useDataStore } from "@/lib/dataStore";

export default function FullSchedulePage() {
  const { planners } = useDataStore();

  if (!planners) return null;

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">📊 Timeline & Stats</h2>
        <p className="text-sm text-muted-foreground">Track your progress and consistency over time.</p>
      </div>

      <TimelineClient planners={planners} />
    </div>
  );
}
