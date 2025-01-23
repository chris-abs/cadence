// import {
//   ScrollArea,
//   Button,
//   Popover,
//   PopoverTrigger,
//   PopoverContent,
//   ToggleGroup,
//   ToggleGroupItem,
// } from '@/Global/components/atoms'
// import { H2 } from '@/Global/components/molecules/Typography'
// import { Workspace } from '@/Workspace/types'
// import { Container } from '@/Container/types'
// import { WorkspaceListSection } from './WorkspaceList'

// interface WorkspaceDropzoneListProps {
//   workspaces: Workspace[]
//   containers: Container[]
//   visibleWorkspaceIds: Set<number>
//   setVisibleWorkspaceIds: (ids: Set<number>) => void
// }

// export function WorkspaceDropzoneList({
//   workspaces,
//   containers,
//   visibleWorkspaceIds,
//   setVisibleWorkspaceIds,
// }: WorkspaceDropzoneListProps) {
//   return (
//     <div className="flex flex-col h-full overflow-hidden">
//       <div className="flex justify-between items-center mb-4 flex-shrink-0">
//         <H2>Workspaces</H2>
//         <Popover>
//           <PopoverTrigger asChild>
//             <Button variant="outline" size="sm">
//               Filter Workspaces
//             </Button>
//           </PopoverTrigger>
//           <PopoverContent className="w-56">
//             <ScrollArea className="h-[300px]">
//               <ToggleGroup
//                 type="multiple"
//                 value={Array.from(visibleWorkspaceIds).map(String)}
//                 onValueChange={(values) => {
//                   setVisibleWorkspaceIds(new Set(values.map(Number)))
//                 }}
//                 className="flex flex-col space-y-2"
//               >
//                 {workspaces.map((workspace) => (
//                   <ToggleGroupItem
//                     key={workspace.id}
//                     value={String(workspace.id)}
//                     className="w-full justify-start"
//                   >
//                     {workspace.name}
//                   </ToggleGroupItem>
//                 ))}
//               </ToggleGroup>
//             </ScrollArea>
//           </PopoverContent>
//         </Popover>
//       </div>

//       <ScrollArea className="flex-1">
//         <div className="space-y-4 pr-4">
//           {workspaces
//             .filter((workspace) => visibleWorkspaceIds.has(workspace.id))
//             .map((workspace) => (
//               <WorkspaceListSection
//                 key={workspace.id}
//                 workspace={workspace}
//                 containers={containers.filter((c) => c.workspaceId === workspace.id)}
//               />
//             ))}
//         </div>
//       </ScrollArea>
//     </div>
//   )
// }
