"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileSystemProvider } from "@/lib/contexts/file-system-context";
import { ChatProvider } from "@/lib/contexts/chat-context";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FileTree } from "@/components/editor/FileTree";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { HeaderActions } from "@/components/HeaderActions";

interface MainContentProps {
  user?: {
    id: string;
    email: string;
  } | null;
  project?: {
    id: string;
    name: string;
    messages: any[];
    data: any;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function MainContent({ user, project }: MainContentProps) {
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");

  return (
    <FileSystemProvider initialData={project?.data}>
      <ChatProvider projectId={project?.id} initialMessages={project?.messages}>
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-white">
          {/* Top bar */}
          <header className="h-12 flex-shrink-0 flex items-center justify-between px-5 border-b border-neutral-200">
            <span className="font-semibold text-neutral-900 text-sm">UIGen</span>

            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView("preview")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeView === "preview"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveView("code")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeView === "code"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Code
              </button>
            </div>

            <HeaderActions user={user} projectId={project?.id} />
          </header>

          {/* Main content */}
          <div className="flex-1 overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Left — Chat */}
              <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                <ChatInterface />
              </ResizablePanel>

              <ResizableHandle className="w-px bg-neutral-200 hover:bg-neutral-300 transition-colors" />

              {/* Right — Preview or Code */}
              <ResizablePanel defaultSize={65}>
                {activeView === "preview" ? (
                  <PreviewFrame />
                ) : (
                  <ResizablePanelGroup direction="horizontal" className="h-full">
                    <ResizablePanel defaultSize={28} minSize={20} maxSize={50}>
                      <div className="h-full border-r border-neutral-200">
                        <FileTree />
                      </div>
                    </ResizablePanel>
                    <ResizableHandle className="w-px bg-neutral-200 hover:bg-neutral-300 transition-colors" />
                    <ResizablePanel defaultSize={72}>
                      <CodeEditor />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </ChatProvider>
    </FileSystemProvider>
  );
}
