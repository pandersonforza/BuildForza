"use client";

import { useParams } from "next/navigation";
import { ProjectCloseout } from "@/components/projects/project-closeout";

export default function CloseoutPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Closeout Checklist</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track transaction closeout tasks, assign team members, and set due dates.
        </p>
      </div>
      <ProjectCloseout projectId={projectId} />
    </div>
  );
}
