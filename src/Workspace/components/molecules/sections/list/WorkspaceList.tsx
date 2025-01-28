import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  ScrollArea,
  Accordion,
} from '@/Global/components/atoms'
import { Workspace } from '@/Workspace/types'
import { Container } from '@/Container/types'
import { WorkspaceRow } from './WorkspaceRow'

interface WorkspaceListSectionProps {
  workspaces: Workspace[]
  containers: Container[]
  visibleWorkspaceIds: Set<number>
  setVisibleWorkspaceIds: (ids: Set<number>) => void
}

export function WorkspaceListSection({
  workspaces,
  containers,
  visibleWorkspaceIds,
}: WorkspaceListSectionProps) {
  const [openWorkspaces, setOpenWorkspaces] = useState<string[]>([])

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-shrink-0">
            <div className="flex flex-col gap-2">
              <CardTitle className="gap-2 text-xl">Workspaces</CardTitle>
              <CardDescription>Expand your workspaces to organize your containers!</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-col pt-4 h-full">
        <ScrollArea className="flex-1">
          <Accordion
            type="multiple"
            value={openWorkspaces}
            onValueChange={setOpenWorkspaces}
            className="space-y-4 pr-4"
          >
            {workspaces
              .filter((workspace) => visibleWorkspaceIds.has(workspace.id))
              .map((workspace) => (
                <WorkspaceRow
                  key={workspace.id}
                  workspace={workspace}
                  containers={containers.filter((c) => c.workspaceId === workspace.id)}
                />
              ))}
          </Accordion>
        </ScrollArea>
      </div>
    </>
  )
}
