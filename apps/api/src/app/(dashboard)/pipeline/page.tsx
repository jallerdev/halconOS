import { KanbanBoard } from './_components/KanbanBoard';
import { PipelineHeader } from './_components/PipelineHeader';

export default function PipelinePage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <PipelineHeader />
      <KanbanBoard />
    </div>
  );
}
