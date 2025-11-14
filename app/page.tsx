
import { Header } from "@/components/header";
import { WorkflowContainer } from "@/components/workflow-container";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Video News Creator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform breaking news into engaging videos with AI-powered research, script generation, and professional voice narration.
          </p>
        </div>
        
        {/* Recovery Panel - Shows saved work from previous sessions */}
        {/* Commented out for now - will work on it later */}
        {/* <div className="mb-8">
          <RecoveryPanel />
        </div> */}
        
        <WorkflowContainer />
      </div>
    </div>
  );
}
