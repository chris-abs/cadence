import { Card, CardContent } from '@/Global/components/atoms'
import { Family } from '@/Family/types'

interface FamilyInformationSectionProps {
  family: Family
}

export function FamilyInformationSection({ family }: FamilyInformationSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Family Name</h4>
            <p>{family.familyName}</p>
          </div>

          <div>
            <h4 className="font-medium mb-1">Email</h4>
            <p>{family.email}</p>
          </div>

          <div>
            <h4 className="font-medium mb-1">Family ID</h4>
            <p className="font-mono">{family.id}</p>
          </div>

          <div>
            <h4 className="font-medium mb-1">Account Status</h4>
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                family.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
              }`}
            >
              {family.status}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-1">Created</h4>
            <p>{new Date(family.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
