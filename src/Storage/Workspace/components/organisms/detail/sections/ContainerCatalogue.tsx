import { useState } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
} from '@/Global/components/atoms'
import { Muted, Section } from '@/Global/components/molecules'
import { ContainerCard } from '@/Container/components/atoms/card'
import { Container } from '@/Container/types'

interface ContainerCatalogueProps {
  containers: Container[]
  emptyStateComponent?: React.ReactNode
}

export function ContainerCatalogue({ containers, emptyStateComponent }: ContainerCatalogueProps) {
  const [openSections, setOpenSections] = useState<string[]>(['workspace-containers'])

  if (!containers?.length) {
    return emptyStateComponent || null
  }

  return (
    <div className="transition-all duration-200">
      <Section className="h-full overflow-hidden">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="h-full"
        >
          <AccordionItem value="workspace-containers" className="border-none h-full">
            <Card className="h-full">
              <CardHeader className="py-6">
                <AccordionTrigger className="hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>Workspace Containers</CardTitle>
                      <Muted>({containers.length} containers)</Muted>
                    </div>
                    <CardDescription className="text-muted-foreground m-0">
                      Containers assigned to this workspace
                    </CardDescription>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="p-0">
                  <ScrollArea>
                    <div className="space-y-6 p-6">
                      <div className="flex flex-wrap gap-4">
                        {containers.map((container) => (
                          <div key={container.id} className="w-[280px] shrink-0">
                            <ContainerCard container={container} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      </Section>
    </div>
  )
}
