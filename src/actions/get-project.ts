"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getProject(projectId: string) {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      userId: session.userId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  let messages, data;
  try {
    messages = JSON.parse(project.messages);
    data = JSON.parse(project.data);
  } catch (error) {
    throw new Error(`Failed to parse project data: ${error}`);
  }

  return {
    id: project.id,
    name: project.name,
    messages,
    data,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}